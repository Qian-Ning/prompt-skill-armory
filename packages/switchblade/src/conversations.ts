/**
 * Conversation import/export for Armory.
 *
 * DSH persists each conversation as `~/.dsh/sessions/<projectKey>/<sessionId>/session.jsonl.zstd`
 * (the projectKey is a path-encoded form like `--C-Users-17526--`), with media
 * attachments under `~/.dsh/attachments/v1` and workspace context under
 * `~/.dsh/storages/workspace.json`. Export bundles those files verbatim (no
 * zstd re-compression — the bytes are already portable), and import restores
 * them so the conversation looks identical on another machine.
 *
 * Archive format: a ZIP containing:
 *   manifest.json         { format:1, exportedAt, projectKeys[] }
 *   sessions/<key>/<id>/session.jsonl.zstd
 *   attachments/…         (optional)
 *   storages/workspace.json (optional)
 *
 * Uses Windows PowerShell Compress-Archive / Expand-Archive (no heavy npm deps;
 * the host already runs on Windows here).
 */

import { readdir, readFile, writeFile, mkdir, rm, stat, cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { join, basename } from 'node:path'
import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'

const exec = promisify(execFile)

const HOME = join(homedir(), '.dsh')
const SESSIONS_ROOT = join(HOME, 'sessions')
const ATTACHMENTS_ROOT = join(HOME, 'attachments')
const STORAGES_ROOT = join(HOME, 'storages')
const EXPORT_ROOT = join(HOME, 'armory-exports')

const PREFIX = '/api/armory'

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])
function sameOrigin(req: IncomingMessage): boolean {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const host = req.headers.host ?? ''
  let bare = host
  if (bare.startsWith('[')) { const e = bare.indexOf(']'); if (e !== -1) bare = bare.slice(0, e + 1) } else { const c = bare.indexOf(':'); if (c !== -1) bare = bare.slice(0, c) }
  return LOOPBACK.has(bare) || LOOPBACK.has(host)
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []; let size = 0
    req.on('data', (c: Buffer) => { size += c.length; if (size > limit) { req.pause(); reject(new Error('body-too-large')); return } chunks.push(c) })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return readBody(req, 1024 * 1024).then((b) => JSON.parse(b.toString('utf8') || '{}'))
}

async function ps(cmd: string): Promise<void> {
  await exec('powershell.exe', ['-NoProfile', '-Command', cmd])
}

/** One conversation, identified by its project key + session id. */
export interface ConversationRow {
  projectKey: string
  sessionId: string
  title: string
  cwd: string
  mtime: number
  size: number
}

/** Read the session title / project map from the DSH session project cache. */
async function readTitleIndex(): Promise<Map<string, { title: string; cwd: string }>> {
  const out = new Map<string, { title: string; cwd: string }>()
  try {
    const raw = JSON.parse(await readFile(join(STORAGES_ROOT, 'session_projcache.json'), 'utf8')) as {
      tables?: { sessions?: Record<string, { identity?: { cwd?: string }; rows?: { title?: { val?: string | null } } }> }
    }
    const sessions = raw.tables?.sessions ?? {}
    for (const [id, v] of Object.entries(sessions)) {
      const title = typeof v.rows?.title?.val === 'string' ? v.rows.title.val : ''
      const cwd = typeof v.identity?.cwd === 'string' ? v.identity.cwd : ''
      out.set(id, { title, cwd })
    }
  } catch { /* no cache yet */ }
  return out
}

const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd]

/** Decompress the first few zstd frames of a session log (the title lives early). */
async function readSessionHead(sdir: string, maxFrames: number): Promise<string> {
  try {
    const buf = await readFile(join(sdir, 'session.jsonl.zstd'))
    const starts: number[] = []
    for (let i = 0; i + 4 <= buf.length && starts.length < maxFrames; i++) {
      if (buf[i] === ZSTD_MAGIC[0] && buf[i + 1] === ZSTD_MAGIC[1] && buf[i + 2] === ZSTD_MAGIC[2] && buf[i + 3] === ZSTD_MAGIC[3]) starts.push(i)
    }
    let text = ''
    for (let f = 0; f < starts.length; f++) {
      const from = starts[f]
      const to = f + 1 < starts.length ? starts[f + 1] : buf.length
      try { text += zstdDecompressSync(buf.subarray(from, to)).toString('utf8') } catch { /* bad frame */ }
      if (text.length > 65536) break
    }
    return text
  } catch { return '' }
}

function firstUserText(head: string): string {
  const lines = head.split('\n')
  for (const line of lines) {
    let o: { type?: string; data?: { source?: { kind?: string }; text?: unknown; content?: unknown; title?: unknown } } | undefined
    try { o = JSON.parse(line) } catch { continue }
    if (o === undefined || o.type === undefined) continue
    // A persisted session/title event is the most faithful title.
    if (o.type === 'session/title' && typeof o.data?.title === 'string' && o.data.title.trim() !== '') {
      return o.data.title.trim().slice(0, 60)
    }
    // DSH's default title = the first user message.
    if (o.type === 'user/message' && o.data?.source?.kind === 'user') {
      let txt = ''
      if (typeof o.data.text === 'string') txt = o.data.text
      else if (typeof o.data.content === 'string') txt = o.data.content
      else if (Array.isArray(o.data.content)) txt = o.data.content.map((c) => (c && typeof c === 'object' && 'text' in c ? String((c as { text?: unknown }).text ?? '') : '')).join(' ')
      const clean = txt.replace(/\s+/g, ' ').trim()
      if (clean !== '') return clean.slice(0, 60)
    }
  }
  return ''
}

async function listConversations(): Promise<ConversationRow[]> {
  const titles = await readTitleIndex()
  const out: ConversationRow[] = []
  const projects = await readdir(SESSIONS_ROOT).catch(() => [] as string[])
  for (const projectKey of projects) {
    const pdir = join(SESSIONS_ROOT, projectKey)
    const ps = await stat(pdir).catch(() => undefined)
    if (ps === undefined || !ps.isDirectory()) continue
    const sessions = await readdir(pdir).catch(() => [] as string[])
    for (const sessionId of sessions) {
      const sdir = join(pdir, sessionId)
      const ss = await stat(sdir).catch(() => undefined)
      if (ss === undefined || !ss.isDirectory() || !sessionId.startsWith('session-')) continue
      const file = join(sdir, 'session.jsonl.zstd')
      const fs = await stat(file).catch(() => undefined)
      const meta = titles.get(sessionId)
      let title = meta?.title ?? ''
      if (title === '') title = firstUserText(await readSessionHead(sdir, 80))
      out.push({
        projectKey,
        sessionId,
        title,
        cwd: meta?.cwd ?? '',
        mtime: ss.mtimeMs,
        size: fs?.size ?? 0,
      })
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime)
}

function validName(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name)
}

/** Per-session token breakdown (mirrors DSH tokenUsage.totals). */
export interface TokenUsage {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/** One request-log row (cc-switch style: time / provider / model / in / out / cache / cost / latency / status / source). */
export interface UsageLogRow {
  time: number
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  cacheHitRate: number
  costUsd: number
  latencyMs: number
  firstTokenMs: number
  status: string
  source: string
}

/** Aggregated usage stats across the whole harness. */
export interface UsageStats {
  range: string
  totals: {
    sessions: number; turns: number; steps: number; llmMs: number; toolMs: number
    inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number
    ttftMs: number; ttftSteps: number; decodeMs: number; costUsd: number
    avgTtftMs: number; tokPerSec: number; perSessionSteps: number; activeDays: number; cacheHitRate: number
  }
  byDay: { date: string; sessions: number; turns: number; steps: number; llmMs: number; toolMs: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }[]
  byHour: { hour: number; steps: number; outputTokens: number; inputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }[]
  byProject: { project: string; sessions: number; steps: number; llmMs: number; toolMs: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; costUsd: number; successRate: number; avgLatencyMs: number; cacheHitRate: number }[]
  byModel: { model: string; sessions: number; steps: number; inputTokens: number; outputTokens: number; costUsd: number; cacheHitRate: number }[]
  recent: UsageLogRow[]
}

interface ProjCacheRow {
  identity?: { createdAt?: number; cwd?: string }
  rows?: {
    sessionStats?: { val?: { turns?: number; steps?: number; llmMs?: number; toolMs?: number; ttftMs?: number; ttftSteps?: number; decodeMs?: number; decodeTokens?: number } }
    tokenUsage?: { val?: { totals?: TokenUsage } }
    title?: { val?: string | null }
  }
}

/** Simple default pricing (USD per 1M tokens); mirrors common API pricing. */
const PRICING = { inputPerM: 0.3, outputPerM: 1.2, cacheReadPerM: 0.03, cacheWritePerM: 0.6 }

function costOf(t: TokenUsage): number {
  return (t.uncachedInputTokens / 1e6 * PRICING.inputPerM)
    + (t.outputTokens / 1e6 * PRICING.outputPerM)
    + (t.cacheReadTokens / 1e6 * PRICING.cacheReadPerM)
    + (t.cacheWriteTokens / 1e6 * PRICING.cacheWritePerM)
}

function hitRateOf(t: TokenUsage): number {
  const total = t.uncachedInputTokens + t.cacheReadTokens + t.cacheWriteTokens
  return total > 0 ? t.cacheReadTokens / total : 0
}

/** Resolve a time-range cutoff (ms epoch) for the `range` query param. */
function rangeCutoff(range: string): number {
  const now = Date.now()
  switch (range) {
    case 'today': { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() }
    case '7d': return now - 7 * 86400000
    case '30d': return now - 30 * 86400000
    default: return 0
  }
}

const zeroTokens = (): TokenUsage => ({ uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 })

async function collectStats(range = 'all'): Promise<UsageStats> {
  const cutoff = rangeCutoff(range)
  const byDay = new Map<string, { date: string; sessions: number; turns: number; steps: number; llmMs: number; toolMs: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }>()
  const byProject = new Map<string, { project: string; sessions: number; steps: number; llmMs: number; toolMs: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number; costUsd: number }>()
  const byModel = new Map<string, { model: string; sessions: number; steps: number; inputTokens: number; outputTokens: number; costUsd: number; cacheReadTokens: number; cacheWriteTokens: number }>()
  const recent: UsageLogRow[] = []
  const byHour = new Map<number, { hour: number; steps: number; outputTokens: number; inputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }>()
  const totals = {
    sessions: 0, turns: 0, steps: 0, llmMs: 0, toolMs: 0,
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
    ttftMs: 0, ttftSteps: 0, decodeMs: 0, costUsd: 0,
  }
  try {
    const raw = JSON.parse(await readFile(join(STORAGES_ROOT, 'session_projcache.json'), 'utf8')) as {
      tables?: { sessions?: Record<string, ProjCacheRow> }
    }
    const rows = raw.tables?.sessions ?? {}
    for (const [id, v] of Object.entries(rows)) {
      const sv = v.rows?.sessionStats?.val
      if (sv === undefined || (sv.steps ?? 0) === 0) continue
      const created = v.identity?.createdAt ?? 0
      if (created < cutoff) continue
      const t = v.rows?.tokenUsage?.val?.totals ?? zeroTokens()
      const turns = sv.turns ?? 0
      const steps = sv.steps ?? 0
      const llmMs = sv.llmMs ?? 0
      const toolMs = sv.toolMs ?? 0
      const ttftMs = sv.ttftMs ?? 0
      const ttftSteps = sv.ttftSteps ?? 0
      const decodeMs = sv.decodeMs ?? 0
      const cost = costOf(t)
      totals.sessions++
      totals.turns += turns; totals.steps += steps; totals.llmMs += llmMs; totals.toolMs += toolMs
      totals.inputTokens += t.uncachedInputTokens; totals.outputTokens += t.outputTokens
      totals.cacheReadTokens += t.cacheReadTokens; totals.cacheWriteTokens += t.cacheWriteTokens
      totals.ttftMs += ttftMs; totals.ttftSteps += ttftSteps; totals.decodeMs += decodeMs
      totals.costUsd += cost

      const date = created > 0 ? new Date(created).toISOString().slice(0, 10) : '未知'
      const d = byDay.get(date) ?? { date, sessions: 0, turns: 0, steps: 0, llmMs: 0, toolMs: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
      d.sessions++; d.turns += turns; d.steps += steps; d.llmMs += llmMs; d.toolMs += toolMs
      d.inputTokens += t.uncachedInputTokens; d.outputTokens += t.outputTokens; d.cacheReadTokens += t.cacheReadTokens; d.cacheWriteTokens += t.cacheWriteTokens
      byDay.set(date, d)

      // Hour bucket (local time) — used for the "today" 24h view.
      const hour = created > 0 ? new Date(created).getHours() : 0
      const hb = byHour.get(hour) ?? { hour, steps: 0, outputTokens: 0, inputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
      hb.steps += steps; hb.outputTokens += t.outputTokens; hb.inputTokens += t.uncachedInputTokens
      hb.cacheReadTokens += t.cacheReadTokens; hb.cacheWriteTokens += t.cacheWriteTokens
      byHour.set(hour, hb)

      const cwd = v.identity?.cwd ?? ''
      const project = cwd.split(/[\\/]/).filter(Boolean).pop() || cwd || '未知'
      const pr = byProject.get(project) ?? { project, sessions: 0, steps: 0, llmMs: 0, toolMs: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, costUsd: 0 }
      pr.sessions++; pr.steps += steps; pr.llmMs += llmMs; pr.toolMs += toolMs
      pr.inputTokens += t.uncachedInputTokens; pr.outputTokens += t.outputTokens; pr.cacheReadTokens += t.cacheReadTokens; pr.cacheWriteTokens += t.cacheWriteTokens; pr.costUsd += cost
      byProject.set(project, pr)

      const model = v.rows?.title?.val && v.rows.title.val.startsWith('model:') ? v.rows.title.val.slice(6) : 'default'
      const mo = byModel.get(model) ?? { model, sessions: 0, steps: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
      mo.sessions++; mo.steps += steps; mo.inputTokens += t.uncachedInputTokens; mo.outputTokens += t.outputTokens; mo.costUsd += cost; mo.cacheReadTokens += t.cacheReadTokens; mo.cacheWriteTokens += t.cacheWriteTokens
      byModel.set(model, mo)

      recent.push({
        time: created, provider: project, model,
        inputTokens: t.uncachedInputTokens, outputTokens: t.outputTokens,
        cacheReadTokens: t.cacheReadTokens, cacheWriteTokens: t.cacheWriteTokens,
        cacheHitRate: hitRateOf(t), costUsd: cost,
        latencyMs: llmMs, firstTokenMs: ttftSteps > 0 ? ttftMs / ttftSteps : 0,
        status: sv.openStep === null ? 'done' : 'running', source: 'dsh',
      })
    }
  } catch { /* no cache yet */ }
  const totalTokensAll = totals.inputTokens + totals.outputTokens + totals.cacheReadTokens + totals.cacheWriteTokens
  const cacheHitRate = totalTokensAll > 0 ? totals.cacheReadTokens / totalTokensAll : 0
  const avgTtftMs = totals.ttftSteps > 0 ? totals.ttftMs / totals.ttftSteps : 0
  const tokPerSec = totals.decodeMs > 0 ? totals.outputTokens / (totals.decodeMs / 1000) : 0
  const perSessionSteps = totals.sessions > 0 ? totals.steps / totals.sessions : 0
  return {
    range,
    totals: {
      ...totals, avgTtftMs, tokPerSec, perSessionSteps, activeDays: byDay.size, cacheHitRate,
    },
    byDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    byHour: range === 'today'
      ? Array.from({ length: 24 }, (_, h) => byHour.get(h) ?? { hour: h, steps: 0, outputTokens: 0, inputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 })
      : [],
    byProject: [...byProject.values()]
      .map((p) => ({
        ...p,
        successRate: 100,
        avgLatencyMs: p.steps > 0 ? p.llmMs / p.steps : 0,
        cacheHitRate: (p.inputTokens + p.cacheReadTokens + p.cacheWriteTokens) > 0 ? p.cacheReadTokens / (p.inputTokens + p.cacheReadTokens + p.cacheWriteTokens) : 0,
      }))
      .sort((a, b) => b.steps - a.steps),
    byModel: [...byModel.values()]
      .map((m) => ({
        ...m,
        cacheHitRate: (m.inputTokens + m.cacheReadTokens + m.cacheWriteTokens) > 0 ? m.cacheReadTokens / (m.inputTokens + m.cacheReadTokens + m.cacheWriteTokens) : 0,
      }))
      .sort((a, b) => b.steps - a.steps),
    recent: recent.sort((a, b) => b.time - a.time).slice(0, 30),
  }
}

/** Resolve a conversation id of the form `<projectKey>/<sessionId>`. */
function resolveSession(key: string, id: string): string | undefined {
  if (!/^[a-zA-Z0-9._-]+$/.test(key) || !/^session-[a-f0-9-]+$/.test(id)) return undefined
  const dir = join(SESSIONS_ROOT, key, id)
  return existsSync(join(dir, 'session.jsonl.zstd')) ? dir : undefined
}

/** Delete one or more conversations: remove the session dir + the index entry. */
async function deleteConversations(ids: string[]): Promise<number> {
  let count = 0
  // 1) Remove session directories on disk.
  for (const full of ids) {
    const slash = full.indexOf('/')
    if (slash <= 0) continue
    const key = full.slice(0, slash); const id = full.slice(slash + 1)
    const dir = resolveSession(key, id)
    if (dir === undefined) continue
    await rm(dir, { recursive: true, force: true })
    count++
  }
  // 2) Drop the matching entries from the session project cache.
  try {
    const indexPath = join(STORAGES_ROOT, 'session_projcache.json')
    const raw = JSON.parse(await readFile(indexPath, 'utf8')) as {
      tables?: { sessions?: Record<string, unknown> }
    }
    const sessions = raw.tables?.sessions
    if (sessions !== undefined) {
      let changed = false
      for (const full of ids) {
        const id = full.slice(full.indexOf('/') + 1)
        if (id in sessions) { delete sessions[id]; changed = true }
      }
      if (changed) await writeFile(indexPath, JSON.stringify(raw, null, 2))
    }
  } catch { /* cache update is best-effort */ }
  return count
}

async function buildExport(ids: string[], includeAttachments: boolean, includeWorkspace: boolean): Promise<{ zipPath: string; name: string }> {
  await mkdir(EXPORT_ROOT, { recursive: true })
  const tmp = join(EXPORT_ROOT, 'staging-' + randomBytes(6).toString('hex'))
  const zip = join(EXPORT_ROOT, `armory-chat-${Date.now()}.zip`)
  await mkdir(tmp, { recursive: true })

  const projectKeys = new Set<string>()
  for (const full of ids) {
    const slash = full.indexOf('/')
    if (slash <= 0) continue
    const key = full.slice(0, slash); const id = full.slice(slash + 1)
    const src = resolveSession(key, id)
    if (src === undefined) continue
    const dst = join(tmp, 'sessions', key, id)
    await mkdir(dst, { recursive: true })
    await cp(src, dst, { recursive: true })
    projectKeys.add(key)
  }

  if (includeAttachments && existsSync(ATTACHMENTS_ROOT)) {
    await cp(ATTACHMENTS_ROOT, join(tmp, 'attachments'), { recursive: true })
  }
  if (includeWorkspace) {
    const ws = join(STORAGES_ROOT, 'workspace.json')
    if (existsSync(ws)) { await mkdir(join(tmp, 'storages'), { recursive: true }); await cp(ws, join(tmp, 'storages', 'workspace.json')) }
  }
  await writeFile(join(tmp, 'manifest.json'), JSON.stringify({ format: 1, exportedAt: Date.now(), projectKeys: [...projectKeys] }))

  await ps(`Compress-Archive -Path "${join(tmp, '*')}" -DestinationPath "${zip}" -Force`)
  await rm(tmp, { recursive: true, force: true })
  return { zipPath: zip, name: basename(zip) }
}

async function importArchive(zipPath: string, targetProjectKey: string | undefined): Promise<number> {
  const tmp = join(EXPORT_ROOT, 'import-' + randomBytes(6).toString('hex'))
  await mkdir(tmp, { recursive: true })
  await ps(`Expand-Archive -Path "${zipPath}" -DestinationPath "${tmp}" -Force`)

  // Merge sessions, remapping the project key when the user supplied a target.
  const sessionsDir = join(tmp, 'sessions')
  let count = 0
  if (existsSync(sessionsDir)) {
    const keys = await readdir(sessionsDir)
    for (const key of keys) {
      const destKey = targetProjectKey !== undefined && targetProjectKey !== '' ? targetProjectKey : key
      if (!/^[a-zA-Z0-9._-]+$/.test(destKey)) continue
      const srcDir = join(sessionsDir, key)
      const dstDir = join(SESSIONS_ROOT, destKey)
      await mkdir(dstDir, { recursive: true })
      const sessions = await readdir(srcDir)
      for (const id of sessions) {
        const s = await stat(join(srcDir, id)).catch(() => undefined)
        if (s === undefined || !s.isDirectory()) continue
        await cp(join(srcDir, id), join(dstDir, id), { recursive: true })
        count++
      }
    }
  }

  // Merge attachments.
  const att = join(tmp, 'attachments')
  if (existsSync(att)) { await mkdir(ATTACHMENTS_ROOT, { recursive: true }); await cp(att, ATTACHMENTS_ROOT, { recursive: true }) }

  // Merge workspace.
  const ws = join(tmp, 'storages', 'workspace.json')
  if (existsSync(ws)) { await mkdir(STORAGES_ROOT, { recursive: true }); await cp(ws, join(STORAGES_ROOT, 'workspace.json'), { force: true }) }

  await rm(tmp, { recursive: true, force: true })
  return count
}

export function makeConversationRoutes(): WebRoute[] {
  return [
    {
      kind: 'exact',
      path: `${PREFIX}/stats`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'GET') { json(res, 405, { ok: false }); return }
        const range = new URL(req.url ?? '/', 'http://localhost').searchParams.get('range') ?? 'all'
        json(res, 200, { ok: true, ...(await collectStats(range)) })
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/sessions`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'GET') { json(res, 405, { ok: false }); return }
        json(res, 200, { ok: true, sessions: await listConversations() })
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/export`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'POST') { json(res, 405, { ok: false }); return }
        try {
          const body = await readJson(req)
          const ids = Array.isArray(body.sessionIds) ? body.sessionIds.filter((x): x is string => typeof x === 'string') : []
          const includeAttachments = body.includeAttachments !== false
          const includeWorkspace = body.includeWorkspace !== false
          const r = await buildExport(ids, includeAttachments, includeWorkspace)
          json(res, 200, { ok: true, name: r.name })
        } catch (e) { json(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) }) }
      },
    },
    {
      kind: 'prefix',
      path: `${PREFIX}/export`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'GET') { json(res, 405, { ok: false }); return }
        const name = (req.url ?? '').slice(`${PREFIX}/export`.length + 1)
        if (!validName(name)) { json(res, 404, { ok: false }); return }
        const file = join(EXPORT_ROOT, name)
        if (!existsSync(file)) { json(res, 404, { ok: false }); return }
        res.writeHead(200, { 'content-type': 'application/zip', 'content-disposition': `attachment; filename="${name}"` })
        res.end(await readFile(file))
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/version`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'GET') { json(res, 405, { ok: false }); return }
        try {
          const r = await fetch('https://registry.npmjs.org/prompt-skill-armory/latest')
          const b = (await r.json()) as { version?: string }
          json(res, 200, { ok: true, latest: b.version ?? '' })
        } catch { json(res, 200, { ok: true, latest: '' }) }
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/update`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'POST') { json(res, 405, { ok: false }); return }
        try {
          // Run the installer's own bin. Use the explicit `armory` bin so it
          // works even before a `prompt-skill-armory` bin alias ships; capture
          // output so failures surface a readable reason instead of a bare
          // "更新失败".
          const { stdout, stderr } = await exec('npm.cmd', ['exec', '--yes', '--package=prompt-skill-armory', '--', 'armory'], { timeout: 300000, windowsHide: true, maxBuffer: 16 * 1024 * 1024, shell: true })
          json(res, 200, { ok: true, log: (stdout || '').slice(-4000) + (stderr || '').slice(-2000) })
        } catch (e) {
          const detail = e instanceof Error ? `${e.message}\n${(e as { stderr?: string }).stderr ?? ''}`.slice(0, 3000) : String(e)
          json(res, 400, { ok: false, error: detail })
        }
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/delete`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'POST') { json(res, 405, { ok: false }); return }
        try {
          const body = await readJson(req)
          const ids = Array.isArray(body.sessionIds) ? body.sessionIds.filter((x): x is string => typeof x === 'string') : []
          const n = await deleteConversations(ids)
          json(res, 200, { ok: true, deleted: n })
        } catch (e) { json(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) }) }
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/import`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) { json(res, 403, { ok: false, error: 'rejected' }); return }
        if (req.method !== 'POST') { json(res, 405, { ok: false }); return }
        try {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const target = url.searchParams.get('project') ?? undefined
          const body = await readBody(req, 512 * 1024 * 1024)
          await mkdir(EXPORT_ROOT, { recursive: true })
          const zipPath = join(EXPORT_ROOT, 'upload-' + randomBytes(6).toString('hex') + '.zip')
          await writeFile(zipPath, body)
          const count = await importArchive(zipPath, target)
          await rm(zipPath, { force: true })
          json(res, 200, { ok: true, imported: count })
        } catch (e) { json(res, 400, { ok: false, error: e instanceof Error ? e.message : String(e) }) }
      },
    },
  ]
}
