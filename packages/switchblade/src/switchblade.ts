/**
 * `Switchblade` — the Host-side core of the management surface.
 *
 * One service reasons about the three CCswitch-style targets through the real
 * DSH seams:
 *
 *  - `ctx.skill` — owner skills are registered as *runtime* skills via
 *    `ctx.skills.register()` (each returns a disposer = uninstall), and
 *    provider-discovered skills are listed for visibility.
 *  - `ctx.agentPresets` — prompt profiles map onto the preset roster
 *    (`copy`/`remove`), and the session default lives in the `agent-presets`
 *    settings namespace.
 *  - `ctx.commands` — custom slash commands register via `ctx.commands.register()`.
 *
 * State persists through a `switchblade` settings namespace. Public methods are
 * `@Remote` so the Web UI projection calls the same Host service over the
 * generated Typert RPC.
 *
 * @module @deepseek-ai/dsh-switchblade
 */

import { Context, Service } from '@deepseek-ai/cordis'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { basename, extname, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { CommandDescriptor, CommandDefinition, CommandResult } from '@deepseek-ai/dsh-commands'
import { settingsNamespace, type SettingsScope, type default as SettingsService } from '@deepseek-ai/dsh-settings'
import { type SkillDefinition, type SkillSummary } from '@deepseek-ai/dsh-skill'
import z from '@deepseek-ai/schemastery'
import {
  ID_PREFIX, isCommandName, isInstallSkillName,
} from './invariant.ts'
import type {
  CommandEntry, InstallSkillInput, McpServerConfig, McpServerStatus, McpToolInfo,
  ProfileEntry, SkillEntry,
  SwitchbladeActionResult, SwitchbladeCatalog, SwitchbladeEntry, SwitchbladeSnapshot,
} from './types.ts'
import { parsePatch, renderPatch } from './patch.ts'

/** Promise-wrapped execFile for the zip extraction helper. */
const execFileAsync = promisify(execFile)

/** Switchblade settings namespace name. */
export const SETTINGS_NAMESPACE = 'switchblade'

/** Same-origin background API prefix the browser half fetches on startup. */
export const BACKGROUND_API_PREFIX = '/api/switchblade-wallpaper'

/** Durable user background section (wallpaper + effect knobs). */
export interface BackgroundSettings {
  enabled: boolean
  /** Media kind of the wallpaper source. */
  kind: 'image' | 'video'
  /** Id of an uploaded file stored on disk ('' = none). Never stores bytes here. */
  uploadId: string
  /** External image URL ('' = none, used when no uploadId). */
  url: string
  /** Wallpaper media opacity (0..1). */
  opacity: number
  /** Readability scrim strength (0..1), black in dark / white in light. */
  scrim: number
  /** Panel transparency (0..1); 1 keeps official opaque surfaces. */
  panelOpacity: number
  /** Frosted-glass blur radius on glassed surfaces (px). */
  blur: number
  /** Blur of the wallpaper itself (px). */
  wallpaperBlur: number
  /** Fit: cover (fill/crop) or contain (letterbox). */
  fit: 'cover' | 'contain'
}

/** Defaults merged over the stored user section when reading. */
const DEFAULT_BACKGROUND: Readonly<BackgroundSettings> = {
  enabled: false, kind: 'image', uploadId: '', url: '', opacity: 1, scrim: 0.25, panelOpacity: 1, blur: 16, wallpaperBlur: 0, fit: 'cover',
}

const BACKGROUND_FIELDS = ['enabled', 'kind', 'uploadId', 'url', 'opacity', 'scrim', 'panelOpacity', 'blur', 'wallpaperBlur', 'fit'] as const

/** Plugin-owned media dir under the harness home (bytes live on disk, never in settings). */
function wallpaperDir(): string {
  const dir = join(homedir(), '.dsh', 'wallpapers')
  mkdir(dir, { recursive: true }).catch(() => {})
  return dir
}
const ACCEPTED_MEDIA: Record<string, { ext: string; kind: 'image' | 'video' }> = {
  'image/jpeg': { ext: 'jpg', kind: 'image' }, 'image/png': { ext: 'png', kind: 'image' },
  'image/webp': { ext: 'webp', kind: 'image' }, 'image/gif': { ext: 'gif', kind: 'image' },
  'image/svg+xml': { ext: 'svg', kind: 'image' },
  'video/mp4': { ext: 'mp4', kind: 'video' }, 'video/webm': { ext: 'webm', kind: 'video' },
}

/** JSON helper for route responses. */
function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** Loopback host check for the same-origin fence (see the reference skin plugins). */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])
function isLoopbackHost(host: string): boolean {
  let bare = host
  if (host.startsWith('[')) {
    const end = host.indexOf(']')
    if (end !== -1) bare = host.slice(0, end + 1)
  } else {
    const colon = host.indexOf(':')
    if (colon !== -1) bare = host.slice(0, colon)
  }
  return LOOPBACK_HOSTS.has(bare) || LOOPBACK_HOSTS.has(host)
}

/** Reject cross-site browser requests against the local wallpaper endpoint. */
function isSameOriginRequest(req: IncomingMessage): boolean {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false
  const host = req.headers.host
  if (typeof host !== 'string' || !isLoopbackHost(host)) return false
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    try { return new URL(origin).host === host } catch { return false }
  }
  return true
}

/** Read a bounded JSON body without destroying the socket. */
function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const parts: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 4096) { req.pause(); reject(new Error('body-too-large')); return }
      parts.push(chunk)
    })
    req.on('end', () => {
      try {
        const text = Buffer.concat(parts).toString('utf8')
        resolve(text === '' ? {} : JSON.parse(text) as Record<string, unknown>)
      } catch { reject(new Error('invalid-json')) }
    })
    req.on('error', reject)
  })
}

/** One user-authored prompt (CCswitch-style), persisted and injected globally. */
export interface ManagedPrompt {
  /** Stable id (slug). */
  readonly id: string
  /** Display name. */
  readonly name: string
  /** One-line description. */
  readonly description: string
  /** Prompt body injected into the system prompt when enabled. */
  readonly content: string
  /** Registration order among enabled prompts. */
  readonly order: number
  /** Whether this prompt is currently injected into the system prompt. */
  readonly enabled: boolean
  /** Whether this is the marked-default prompt (sorted first). */
  readonly isDefault: boolean
}

/** Persisted slice of this plugin's state. */
export interface SwitchbladeSettings {
  /** Owned skills Switchblade reinstates as runtime skills on startup. */
  readonly installedSkills: readonly SkillDefinition[]
  /** Custom slash commands Switchblade reinstates on startup. */
  readonly customCommands: readonly CommandDefinition[]
  /** User-authored prompts injected into the system prompt. */
  readonly prompts: readonly ManagedPrompt[]
  /** Configured MCP servers (each bridges one external MCP server's tools). */
  readonly mcpServers: readonly McpServerConfig[]
  /** Runtime status of each configured MCP server, maintained by the Host. */
  readonly mcpStatus: Readonly<Record<string, McpServerStatus>>
  /** One-shot test request written by the Web panel; the Host processes it. */
  readonly mcpTestRequest?: { readonly serverName: string; readonly ts: number }
}

/** Runtime schema for the persisted slice. */
export const SwitchbladeSettingsSchema = z.object({
  installedSkills: z.array(z.any()).default([]),
  customCommands: z.array(z.any()).default([]),
  prompts: z.array(z.any()).default([]),
  mcpServers: z.array(z.any()).default([]),
  mcpStatus: z.dict(z.any()).default({}),
  mcpTestRequest: z.any(),
  background: z.any(),
})

/** One prompt section id prefix registered on ctx.systemPrompt. */
const PROMPT_SECTION_PREFIX = 'switchblade:prompt:'

export interface Config {
  /** Default profile id composed when a session names none. */
  readonly defaultProfile?: string
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    switchblade: Switchblade
  }
}

/**
 * Registry over skills, prompt profiles, and slash commands.
 *
 * Lifecycle model matches CCswitch: an initialized object is "installed", then
 * flipped between "enabled" (registered/visible) and "disabled" (registration
 * disposed). Only owned skills — those installed from a local source — change
 * the registry; provider-discovered skills are treated as read-only inventory.
 */
export class Switchblade extends Service {
  /** Services the plugin reads from ctx; inject-declared so Cordis resolves them. */
  static inject = ['loader', 'skills', 'systemPrompt']

  /** Registry configuration. */
  static Config: z<Config> = z.object({
    defaultProfile: z.string(),
  })

  /** Live enabled registration disposers, keyed by entry id. */
  private readonly registrations = new Map<string, () => void>()

  /** Live disposers for enabled prompt sections, keyed by prompt id. */
  private readonly promptSections = new Map<string, () => void>()

  /** Live mcp-client loader entry ids, keyed by serverName. */
  private readonly mcpEntries = new Map<string, string>()

  /** Last startup/connection error per serverName, surfaced in mcpStatus. */
  private readonly mcpErrors = new Map<string, string>()

  /** Last processed test-request timestamp per serverName (idempotency guard). */
  private readonly lastTestTs = new Map<string, number>()

  /** The settings namespace scope; present only while a settings provider is composed. */
  private settingsScope: SettingsScope<SwitchbladeSettings> | undefined

  /** The settings service behind {@link settingsScope}, for path writes. */
  private settingsService: SettingsService | undefined

  constructor(ctx: Context, public config: Config = {}) {
    super(ctx, 'switchblade')
    ctx.logger.warn('[switchblade] Switchblade service constructed')

    // Persistence, attached lazily like the agent-presets precedent.
    ctx.inject(['settings', 'webServer'], (settingsCtx) => {
      const scope = settingsCtx.settings.register(
        settingsNamespace(SETTINGS_NAMESPACE),
        SwitchbladeSettingsSchema,
        { base: {} },
      )
      this.settingsScope = scope
      this.settingsService = settingsCtx.settings
      // React to external writes (the Web panel writes through settings RPC):
      // re-inject prompts and reinstall skills whenever our namespace changes.
      // Reconcile on a microtask so it never blocks the settings commit path
      // (a synchronous reconcile caused the earlier deadlock), and guard
      // against re-entry and failures.
      let reconciling = false
      let scheduled = false
      const reconcile = (): void => {
        if (scheduled) return
        scheduled = true
        queueMicrotask(() => {
          scheduled = false
          if (reconciling) return
          reconciling = true
          // Each step is independently guarded so one failure never skips the
          // others.
          try { this.applyPromptRegistrations() } catch (e) { settingsCtx.logger.warn(`[switchblade] prompt reconcile: ${String(e)}`) }
          try { this.applySkillRegistrations() } catch (e) { settingsCtx.logger.warn(`[switchblade] skill reconcile: ${String(e)}`) }
          try { this.reconcileMcpServers() } catch (e) { settingsCtx.logger.warn(`[switchblade] mcp reconcile: ${String(e)}`) }
          try { this.handleMcpTestRequest() } catch (e) { settingsCtx.logger.warn(`[switchblade] mcp test reconcile: ${String(e)}`) }
          try { void this.publishMcpStatus() } catch (e) { settingsCtx.logger.warn(`[switchblade] mcp status reconcile: ${String(e)}`) }
          reconciling = false
        })
      }
      scope.watch(reconcile)
      settingsCtx.effect(() => () => {
        this.settingsScope = undefined
        this.settingsService = undefined
      }, 'switchblade.settings()')
      // Reinstall the persisted owned rows on startup.
      settingsCtx.logger.warn(`[switchblade] settings registered; prompts=${scope.get().prompts.length} skills=${scope.get().installedSkills.length}`)
      this.reinstall(scope.get())
      try {
        for (const route of this.wallpaperRoutes()) {
          settingsCtx.effect(() => { try { settingsCtx.webServer.register(route) } catch (e) { settingsCtx.logger.warn(`[switchblade] route failed: ${String(e)}`) } }, 'switchblade: bg route')
        }
      } catch (e) { settingsCtx.logger.warn(`[switchblade] route setup failed: ${String(e)}`) }
    })

    // Command registration moved to the entry plugin's apply(ctx) — the
    // Service constructor's ctx cannot resolve ctx.commands (Service fibers
    // isolate external services), while a function plugin's ctx can.
  }

  /** All persisted state, merged over schema defaults. */
  private settings(): SwitchbladeSettings {
    return this.settingsScope?.get() ?? { installedSkills: [], customCommands: [], prompts: [], mcpServers: [], mcpStatus: {} }
  }

  // ---------------------------------------------------------------------------
  // Prompt management (CCswitch-style, globally injected)
  // ---------------------------------------------------------------------------

  /** All managed prompts, sorted (default first, then by order). */
  listPrompts(): readonly ManagedPrompt[] {
    return [...this.settings().prompts].sort((a, b) =>
      Number(b.isDefault) - Number(a.isDefault) || a.order - b.order)
  }

  /**
   * Add a new prompt. Persists it, marks it enabled, and injects it into the
   * system prompt (global scope — every agent reads it).
   * @param input - name, description, and content.
   * @returns the created prompt.
   */
  async addPrompt(input: { name: string; description: string; content: string }): Promise<ManagedPrompt> {
    const name = input.name.trim()
    if (name.length === 0) throw new Error('prompt name is required')
    if (input.content.trim().length === 0) throw new Error('prompt content is required')
    const id = this.slugify(name)
    const prompts = this.settings().prompts
    if (prompts.some((p) => p.id === id)) throw new Error(`a prompt named "${name}" already exists`)
    const prompt: ManagedPrompt = {
      id,
      name,
      description: input.description.trim(),
      content: input.content,
      order: prompts.length,
      enabled: true,
      isDefault: prompts.length === 0,
    }
    await this.writePrompts([...prompts, prompt])
    this.applyPromptRegistrations()
    return prompt
  }

  /** Toggle one prompt's global injection. */
  async setPromptEnabled(id: string, enabled: boolean): Promise<void> {
    const next = this.settings().prompts.map((p) => p.id === id ? { ...p, enabled } : p)
    await this.writePrompts(next)
    this.applyPromptRegistrations()
  }

  /** Mark one prompt as the default (sorted first); clears the others. */
  async setDefaultPrompt(id: string): Promise<void> {
    const next = this.settings().prompts.map((p) => ({ ...p, isDefault: p.id === id }))
    await this.writePrompts(next)
  }

  /** Update a prompt's name/description/content. */
  async updatePrompt(id: string, patch: { name?: string; description?: string; content?: string }): Promise<void> {
    const next = this.settings().prompts.map((p) => {
      if (p.id !== id) return p
      return {
        ...p,
        name: patch.name?.trim() || p.name,
        description: patch.description?.trim() ?? p.description,
        content: patch.content ?? p.content,
      }
    })
    await this.writePrompts(next)
    this.applyPromptRegistrations()
  }

  /** Delete one prompt and un-inject it. */
  async deletePrompt(id: string): Promise<void> {
    const next = this.settings().prompts.filter((p) => p.id !== id)
    await this.writePrompts(next)
    this.applyPromptRegistrations()
  }

  /** Persist the prompt list. */
  private async writePrompts(prompts: readonly ManagedPrompt[]): Promise<void> {
    await this.settingsService?.mutate(
      settingsNamespace(SETTINGS_NAMESPACE),
      [{ op: 'set', path: ['prompts'], value: prompts }],
    )
  }

  /**
   * Reconcile live systemPrompt registrations against the persisted prompt
   * list. Directly reads this.ctx.systemPrompt (the plugin's own context can
   * resolve it; no ctx.inject here — that would spawn a fiber inside the
   * settings watch callback and deadlock the commit path). Fully guarded so a
   * bad prompt never wedges settings.
   */
  applyPromptRegistrations(): void {
    try {
      const system = (this.ctx as Context & { systemPrompt?: { section: (s: { name: string; order: number; text: string }) => () => void } }).systemPrompt
      if (system === undefined || typeof system.section !== 'function') {
        this.ctx.logger.warn('[switchblade] systemPrompt service unavailable — prompts will NOT be injected')
        return
      }
      this.ctx.logger.warn(`[switchblade] applying prompt registrations: ${this.listPrompts().filter(p => p.enabled).length} enabled`)
      const wanted = new Set<string>()
      for (const prompt of this.listPrompts()) {
        if (!prompt.enabled) continue
        wanted.add(prompt.id)
        const key = `${PROMPT_SECTION_PREFIX}${prompt.id}`
        if (!this.promptSections.has(prompt.id)) {
          try {
            const dispose = system.section({
              name: key,
              order: 200 + prompt.order,
              text: prompt.content,
            })
            this.promptSections.set(prompt.id, dispose)
            this.ctx.logger.warn(`[switchblade] registered prompt section ${key} (order ${200 + prompt.order})`)
          } catch (error) {
            this.ctx.logger.warn(`[switchblade] failed to register prompt ${prompt.name}: ${String(error)}`)
          }
        }
      }
      // Un-register prompts no longer wanted.
      for (const [id, dispose] of [...this.promptSections]) {
        if (!wanted.has(id)) {
          dispose()
          this.promptSections.delete(id)
        }
      }
    } catch (error) {
      this.ctx.logger.warn(`[switchblade] prompt reconcile failed: ${String(error)}`)
    }
  }

  /** Live disposers for enabled prompt sections, keyed by prompt id. */

  /**
   * Reconcile live runtime-skill registrations against the persisted
   * installedSkills list (honoring each skill's `enabled` flag). Called on
   * startup and whenever the settings namespace changes.
   */
  applySkillRegistrations(): void {
    try {
      const skills = (this.ctx as Context & { skills?: { register: (def: unknown) => () => void } }).skills
      if (skills === undefined || typeof skills.register !== 'function') return
      const wanted = new Set<string>()
      for (const def of this.settings().installedSkills) {
        const id = `${ID_PREFIX.skill}:${def.name}`
        const enabled = (def as SkillDefinition & { enabled?: boolean }).enabled ?? true
        if (!enabled) continue
        wanted.add(id)
        if (!this.registrations.has(id)) {
          try {
            this.registrations.set(id, skills.register(def))
          } catch (error) {
            this.ctx.logger.warn(`[switchblade] failed to register skill ${def.name}: ${String(error)}`)
          }
        }
      }
      // Un-register skills no longer enabled or removed.
      for (const [id, dispose] of [...this.registrations]) {
        if (!wanted.has(id)) {
          dispose()
          this.registrations.delete(id)
        }
      }
    } catch (error) {
      this.ctx.logger.warn(`[switchblade] skill reconcile failed: ${String(error)}`)
    }
  }

  /** Sluggify a display name into a stable id. */
  private slugify(value: string): string {
    const slug = value.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return slug.length > 0 ? slug : `prompt-${Date.now()}`
  }

  /**
   * The full management catalog.
   * @param agent - agent whose command view to read; omitted, the command
   *   section is empty (the CLI handler supplies it).
   * @returns normalized entries and the defaulted profile id.
   */
  async catalog(agent: Agent): Promise<SwitchbladeCatalog> {
    const raw = await this.snapshot(agent)
    const entries: SwitchbladeEntry[] = [
      ...raw.skills.map((skill) => this.ownedSkillEntry(skill)),
      ...raw.presets.map((preset) => this.profileEntry(preset)),
      ...raw.commands.map((descriptor) => this.commandEntry(descriptor)),
    ]
    const defaultProfile = this.config.defaultProfile ?? await this.currentProfile()
    return {
      entries,
      ...defaultProfile === undefined ? {} : { defaultProfile },
    }
  }

  /**
   * Install an owned skill from a local source and enable it immediately.
   * @param input - skill name, body, and routing metadata.
   * @returns the addressed id and resulting state.
   */
  async installSkill(input: InstallSkillInput): Promise<SwitchbladeActionResult> {
    if (!isInstallSkillName(input.name)) {
      throw new TypeError(`skill name "${input.name}" must be kebab-case`)
    }
    const id = `${ID_PREFIX.skill}:${input.name}`
    const existing = this.registrations.get(id)
    if (existing !== undefined) {
      return { id, state: 'enabled' }
    }
    const definition: SkillDefinition = {
      name: input.name,
      content: input.content,
      description: input.description,
      invocation: input.invocation ?? { modelInvocable: true, userInvocable: true },
      provider: input.provider ?? 'runtime',
      source: 'custom',
    }
    const state = await this.setOwnedSkill(id, definition, true)
    return { id, state }
  }

  /**
   * Install a skill from a local directory (SKILL.md + references, or a flat
   * .md) by copying it into the user skills root (`~/.dsh/skills`), which the
   * official `skill-filesystem` provider scans. This makes directory skills
   * (multi-file, with references) fully loadable and invocable via `/name`.
   * @param sourceDir - absolute path of the skill directory (or .md file).
   * @returns the installed skill name.
   */
  async installSkillFromDir(sourceDir: string): Promise<string> {
    const root = join(homedir(), '.dsh', 'skills')
    await mkdir(root, { recursive: true })
    const name = basename(sourceDir).replace(/\.md$/i, '')
    const target = join(root, name)
    await cp(sourceDir, target, { recursive: true, force: true })
    this.ctx.logger.warn(`[switchblade] installed skill from dir ${sourceDir} → ${target}`)
    // Register into managed installedSkills (panel Skills tab).
    try {
      const { readFile } = await import('node:fs/promises')
      const md = await readFile(join(sourceDir, 'SKILL.md'), 'utf8').catch(() => undefined)
        ?? await readFile(sourceDir, 'utf8').catch(() => undefined)
      if (md !== undefined) {
        const skillName = parseSkillName(md) ?? name
        const desc = parseSkillDescription(md) ?? ''
        await this.registerManagedSkill(skillName, desc, md)
      }
    } catch (error) {
      this.ctx.logger.warn(`[switchblade] failed to register dir skill ${name}: ${String(error)}`)
    }
    return name
  }

  /** Write a flat skill .md into the user skills root. */
  async installSkillFile(name: string, content: string): Promise<string> {
    const root = join(homedir(), '.dsh', 'skills')
    await mkdir(root, { recursive: true })
    const target = join(root, `${name}.md`)
    await writeFile(target, content, 'utf8')
    this.ctx.logger.warn(`[switchblade] wrote skill file ${target}`)
    return name
  }

  /**
   * Register a skill into the managed installedSkills list (persisted) and as
   * a runtime registration, so it appears in the panel's Skills tab and is
   * callable via /name.
   */
  private async registerManagedSkill(name: string, description: string, content: string): Promise<void> {
    const definition: SkillDefinition = {
      name,
      content,
      description,
      invocation: { modelInvocable: true, userInvocable: true },
      provider: 'runtime',
      source: 'custom',
    }
    const id = `${ID_PREFIX.skill}:${name}`
    // Dispose any existing registration for this name, then re-register.
    const existing = this.registrations.get(id)
    if (existing !== undefined) {
      existing()
      this.registrations.delete(id)
    }
    try {
      this.registrations.set(id, this.ctx.skills.register(definition))
    } catch (error) {
      this.ctx.logger.warn(`[switchblade] runtime register of ${name} failed: ${String(error)}`)
    }
    // Persist into installedSkills (skip if already present).
    const current = this.settings().installedSkills
    if (!current.some((s) => s.name === name)) {
      await this.settingsService?.mutate(
        settingsNamespace(SETTINGS_NAMESPACE),
        [{ op: 'set', path: ['installedSkills'], value: [...current, definition] }],
      )
      this.ctx.logger.warn(`[switchblade] registered managed skill ${name}`)
    }
  }

  /**
   * Install skills from a zip archive by extracting it into the user skills
   * root (`~/.dsh/skills`). Uses the platform archive tool (tar on Windows
   * 10+ handles zip; macOS/Linux tar handles zip) — zero extra dependencies.
   * The zip may contain one skill (SKILL.md at root) or many skill dirs.
   * @param zipPath - absolute path to the .zip archive.
   * @returns the extracted directory names.
   */
  async installSkillFromZip(zipPath: string): Promise<string[]> {
    const root = join(homedir(), '.dsh', 'skills')
    await mkdir(root, { recursive: true })
    // Extract into a temp dir first so we can list what landed.
    const temp = join(root, `.zip-tmp-${Date.now()}`)
    await mkdir(temp, { recursive: true })
    try {
      // tar -xf handles .zip on Windows 10+ (bsdtar) and macOS/Linux.
      await execFileAsync('tar', ['-xf', zipPath, '-C', temp])
    } catch {
      // Fallback: PowerShell Expand-Archive on Windows.
      await execFileAsync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${temp}' -Force`])
    }
    const { readdir, readFile } = await import('node:fs/promises')
    const entries = await readdir(temp)
    const installed: string[] = []
    for (const entry of entries) {
      const src = join(temp, entry)
      // If the zip root is a single skill dir (SKILL.md inside), move it up.
      const target = join(root, entry)
      await cp(src, target, { recursive: true, force: true })
      installed.push(entry)
      this.ctx.logger.warn(`[switchblade] installed zip entry ${entry} → ${target}`)
      // Register into the managed installedSkills so it appears in the panel's
      // Skills tab (editable / toggleable / removable) as well as being
      // callable via /name.
      try {
        const skillMd = join(target, 'SKILL.md')
        const md = await readFile(skillMd, 'utf8').catch(() => undefined)
        if (md !== undefined) {
          const name = parseSkillName(md) ?? entry
          const desc = parseSkillDescription(md) ?? ''
          await this.registerManagedSkill(name, desc, md)
        } else {
          // Flat .md file itself (zip root had a single file).
          const flat = await readFile(src, 'utf8').catch(() => undefined)
          if (flat !== undefined) {
            const name = parseSkillName(flat) ?? entry.replace(/\.md$/i, '')
            const desc = parseSkillDescription(flat) ?? ''
            await this.registerManagedSkill(name, desc, flat)
          }
        }
      } catch (error) {
        this.ctx.logger.warn(`[switchblade] failed to register zip entry ${entry} as managed: ${String(error)}`)
      }
    }
    await execFileAsync(process.platform === 'win32' ? 'rmdir' : 'rm', process.platform === 'win32' ? ['/s', '/q', temp] : ['-rf', temp])
    return installed
  }

  /**
   * Uninstall an owned skill, disposing its runtime registration.
   * @param name - runtime skill name to remove.
   * @returns the addressed id and resulting state.
   */
  async uninstallSkill(name: string): Promise<SwitchbladeActionResult> {
    const id = `${ID_PREFIX.skill}:${name}`
    await this.setOwnedSkill(id, undefined, false)
    return { id, state: 'disabled' }
  }

  /** Toggle one owned skill's runtime registration on or off. */
  async setSkillEnabled(name: string, enabled: boolean): Promise<SwitchbladeActionResult> {
    const id = `${ID_PREFIX.skill}:${name}`
    return { id, state: await this.setOwnedSkillEnabled(id, enabled) }
  }

  /** List all skill summary rows, regardless of ownership. */
  async listSkills(): Promise<readonly { id: string; name: string; description: string }[]> {
    const skills = await this.ctx.skills.list({})
    return skills.map((skill) => ({ id: `${ID_PREFIX.skill}:${skill.name}`, name: skill.name, description: skill.description }))
  }

  /** Copy a shipped preset into a locally authored prompt profile. */
  async addProfile(from: string, id: string, name?: string): Promise<void> {
    await this.authorableRoster().copy(from, id, name)
  }

  /** Remove a locally authored prompt profile. */
  async removeProfile(id: string): Promise<void> {
    await this.agentPresetsOrThrow().remove(id)
  }

  /** The prompt profile composed when a session names none. */
  async currentProfile(): Promise<string | undefined> {
    return this.agentPresetsOrThrow().defaultId
  }

  /** Persist a new session default prompt profile. */
  async setDefaultProfile(id: string): Promise<void> {
    const service = this.settingsService
    if (service === undefined) return
    await service.mutate(
      settingsNamespace('agent-presets'),
      [{ op: 'set', path: ['default'], value: id }],
    )
  }

  /** Register a custom slash command and persist it for reinstatement. */
  async registerCommand(definition: CommandDefinition): Promise<void> {
    if (!isCommandName(definition.name)) {
      throw new TypeError(`command name "${definition.name}" must match the command grammar`)
    }
    this.ctx.commands.register(definition)
    const next = this.settings().customCommands
    if (!next.some((row) => row.name === definition.name)) {
      await this.settingsService?.mutate(
        settingsNamespace(SETTINGS_NAMESPACE),
        [{ op: 'set', path: ['customCommands'], value: [...next, definition] }],
      )
    }
  }

  /** Unregister a custom slash command. */
  async unregisterCommand(name: string): Promise<void> {
    const id = `${ID_PREFIX.command}:${name}`
    this.registrations.get(id)?.()
    this.registrations.delete(id)
    const rest = this.settings().customCommands.filter((row) => row.name !== name)
    await this.settingsService?.mutate(
      settingsNamespace(SETTINGS_NAMESPACE),
      [{ op: 'set', path: ['customCommands'], value: rest }],
    )
  }

  /**
   * Export the current managed state as a bundle patch layer (`cordis.patch.yml`).
   * Drop the returned text into a profile bundle's patch file to re-instate the
   * same skills, custom commands, and default profile on another process.
   */
  async exportBundle(): Promise<string> {
    const settings = this.settings()
    const defaultProfile = this.config.defaultProfile
    return renderPatch({
      installedSkills: settings.installedSkills,
      customCommands: settings.customCommands,
      ...defaultProfile === undefined ? {} : { defaultProfile },
    })
  }

  /**
   * Import switchblade-owned rows from a bundle patch and apply them. The
   * persisted slice is replaced, live registrations are rebuilt, and any
   * `agent-presets` default in the patch is adopted.
   * @param patch - a `cordis.patch.yml` document the exporter (or a compatible
   *   bundle) produced.
   */
  async importBundle(patch: string): Promise<void> {
    const parsed = parsePatch(patch)
    // Tear down every live registration so the rebuild starts clean.
    for (const dispose of this.registrations.values()) dispose()
    this.registrations.clear()

    // Rebuild persisted rows: skills as runtime registrations, commands with a
    // starter passthrough handler (the host owns the real handler surface).
    for (const definition of parsed.installedSkills) {
      this.registrations.set(`${ID_PREFIX.skill}:${definition.name}`, this.ctx.skills.register(definition))
    }
    for (const row of parsed.customCommands) {
      this.registrations.set(`${ID_PREFIX.command}:${row.name}`, this.ctx.commands.register(passthroughCommand(row)))
    }

    await this.settingsService?.mutate(settingsNamespace(SETTINGS_NAMESPACE), [
      { op: 'set', path: ['installedSkills'], value: parsed.installedSkills },
      { op: 'set', path: ['customCommands'], value: parsed.customCommands },
    ])
    if (parsed.defaultProfile !== undefined) await this.setDefaultProfile(parsed.defaultProfile)
  }

  /** Build the raw snapshot underlying a catalog. */
  private async snapshot(agent: Agent): Promise<SwitchbladeSnapshot> {
    const [skills, presets] = await Promise.all([
      this.ctx.skills.list({}),
      this.agentPresetsOrThrow().list(),
    ])
    const commands = this.ctx.commands === undefined ? [] : this.ctx.commands.list(agent)
    return { skills, presets, commands }
  }

  // ---------------------------------------------------------------------------
  // Lifetimes
  // ---------------------------------------------------------------------------

  /** Re-register every persisted owned row after a settings reload. */
  private reinstall(settings: SwitchbladeSettings): void {
    // Skills: reconcile from persisted enabled flags (the Web panel writes
    // installedSkills with an `enabled` field).
    this.applySkillRegistrations()
    try {
      const commands = (this.ctx as Context & { commands?: { register: (d: unknown) => () => void } }).commands
      if (commands !== undefined && typeof commands.register === 'function') {
        for (const row of settings.customCommands) {
          const id = `${ID_PREFIX.command}:${row.name}`
          if (!this.registrations.has(id)) this.registrations.set(id, commands.register(passthroughCommand(row)))
        }
      }
    } catch (error) {
      this.ctx.logger.warn(`[switchblade] custom command reinstall failed: ${String(error)}`)
    }
    // Re-inject enabled prompts into the system prompt.
    if (settings.prompts.length > 0) this.applyPromptRegistrations()
    // Reconnect enabled MCP servers (each bridges one external server's tools).
    for (const server of settings.mcpServers) {
      if (server.enabled) void this.startMcpServer(server.serverName)
    }
    // Publish runtime status so the panel renders tools/state on first open.
    void this.publishMcpStatus()
  }

  // ---------------------------------------------------------------------------
  // Global wallpaper (persisted via the settings document; served to the
  // browser half through a same-origin route so it survives restarts)
  // ---------------------------------------------------------------------------

  /** Persist the background section through the switchblade settings document. */
  async writeBackground(section: Record<string, unknown>): Promise<void> {
    await this.settingsService?.mutate(
      settingsNamespace(SETTINGS_NAMESPACE),
      [{ op: 'set', path: ['background'], value: section }],
    )
  }

  /** Read the resolved background section (defaults merged over the user layer). */
  private readBackground(): BackgroundSettings {
    const raw = this.settings().background as Partial<BackgroundSettings> | undefined
    return { ...DEFAULT_BACKGROUND, ...(raw ?? {}) } as BackgroundSettings
  }

  /**
   * Same-origin media routes: POST /upload stores a local image/video on disk
   * (bytes NEVER enter the settings document, so it stays well under the size
   * cap and survives restarts) and GET /image/<id> serves it back. Mirrors the
   * reference dsh-background / skin-center pattern.
   */
  private wallpaperRoutes(): WebRoute[] {
    const readRawBody = (req: IncomingMessage, limit: number): Promise<Buffer> =>
      new Promise((resolve, reject) => {
        const chunks: Buffer[] = []; let size = 0
        req.on('data', (c: Buffer) => { size += c.length; if (size > limit) { req.pause(); reject(new Error('body-too-large')); return } chunks.push(c) })
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
      })
    const upload = { kind: 'exact' as const, path: `${BACKGROUND_API_PREFIX}/upload`, handler: async (req: IncomingMessage, res: ServerResponse) => {
      if (!isSameOriginRequest(req)) { jsonResponse(res, 403, { ok: false, error: 'rejected' }); return }
      if (req.method !== 'POST') { jsonResponse(res, 405, { ok: false, error: 'method-not-allowed' }); return }
      const mime = (req.headers['content-type'] ?? '').split(';')[0]?.trim() ?? ''
      const meta = ACCEPTED_MEDIA[mime]
      if (meta === undefined) { jsonResponse(res, 400, { ok: false, error: 'unsupported-media-type' }); return }
      try {
        const body = await readRawBody(req, 60 * 1024 * 1024)
        if (body.length === 0) { jsonResponse(res, 400, { ok: false, error: 'empty-body' }); return }
        const id = 'up-' + randomBytes(12).toString('hex')
        await writeFile(join(wallpaperDir(), `${id}.${meta.ext}`), body)
        jsonResponse(res, 200, { ok: true, id, kind: meta.kind, url: `${BACKGROUND_API_PREFIX}/image/${id}` })
      } catch (error) { jsonResponse(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) }) }
    } }
    const serve = { kind: 'prefix' as const, path: `${BACKGROUND_API_PREFIX}/image`, handler: async (req: IncomingMessage, res: ServerResponse) => {
      if (!isSameOriginRequest(req)) { jsonResponse(res, 403, { ok: false, error: 'rejected' }); return }
      if (req.method !== 'GET') { jsonResponse(res, 405, { ok: false }); return }
      const id = (req.url ?? '').slice(`${BACKGROUND_API_PREFIX}/image`.length + 1).replace(/[^a-z0-9.-]/gi, '')
      if (!/^up-[a-f0-9]{24}/.test(id)) { jsonResponse(res, 404, { ok: false }); return }
      const dir = join(homedir(), '.dsh', 'wallpapers')
      if (!existsSync(dir)) { jsonResponse(res, 404, { ok: false }); return }
      const found = Object.values(ACCEPTED_MEDIA).map((m) => join(dir, id.endsWith(m.ext) ? id : `${id}.${m.ext}`)).find((p) => existsSync(p))
      if (found === undefined) { jsonResponse(res, 404, { ok: false }); return }
      const mime = extname(found).slice(1) === 'mp4' ? 'video/mp4' : extname(found).slice(1) === 'webm' ? 'video/webm' : `image/${extname(found).slice(1).replace('jpg', 'jpeg')}`
      res.writeHead(200, { 'content-type': mime, 'cache-control': 'public, max-age=31536000, immutable' })
      res.end(await readFile(found))
    } }
    return [upload, serve]
  }

  // ---------------------------------------------------------------------------
  // MCP server management
  // ---------------------------------------------------------------------------

  /** Reconcile live mcp-client instances against the persisted config list. */
  private reconcileMcpServers(): void {
    const servers = this.settings().mcpServers
    const wanted = new Set<string>()
    for (const server of servers) {
      wanted.add(server.serverName)
      if (server.enabled && !this.mcpEntries.has(server.serverName)) {
        void this.startMcpServer(server.serverName)
      } else if (!server.enabled && this.mcpEntries.has(server.serverName)) {
        void this.stopMcpServer(server.serverName)
      }
    }
    // Stop servers removed from the config.
    for (const name of [...this.mcpEntries.keys()]) {
      if (!wanted.has(name)) void this.stopMcpServer(name)
    }
  }

  /** List all configured MCP servers with their runtime status. */
  async listMcpServers(): Promise<McpServerStatus[]> {
    return this.settings().mcpServers.map((server) => this.statusOf(server.serverName))
  }

  /** Compute the runtime status of one configured server. */
  private statusOf(name: string): McpServerStatus {
    const server = this.settings().mcpServers.find((s) => s.serverName === name)
    const running = this.mcpEntries.has(name)
    const tools = this.listMcpTools().filter((t) => t.name.startsWith(`mcp__${name}__`))
    const lastError = this.mcpErrors.get(name)
    return {
      serverName: name,
      transport: server?.transport ?? 'stdio',
      enabled: server?.enabled ?? false,
      running,
      toolCount: tools.length,
      tools,
      ...(lastError !== undefined ? { lastError } : {}),
    }
  }

  /** Compute the full runtime status map for all configured servers. */
  private computeMcpStatus(): Record<string, McpServerStatus> {
    const status: Record<string, McpServerStatus> = {}
    for (const server of this.settings().mcpServers) {
      status[server.serverName] = this.statusOf(server.serverName)
    }
    return status
  }

  /**
   * Publish the runtime status map into the settings namespace so the Web
   * panel (which reads settings over the connection RPC, not Typert) can
   * render per-server tools, running state, and last error. Skips the write
   * when nothing changed to avoid a settings-watch reconcile loop.
   */
  private async publishMcpStatus(): Promise<void> {
    const current = this.settings().mcpStatus ?? {}
    const next = this.computeMcpStatus()
    if (JSON.stringify(current) === JSON.stringify(next)) return
    await this.settingsService?.mutate(
      settingsNamespace(SETTINGS_NAMESPACE),
      [{ op: 'set', path: ['mcpStatus'], value: next }],
    )
  }

  /**
   * Process a one-shot test request written by the Web panel. Idempotent per
   * timestamp: ensures the server is started, waits for tool discovery, then
   * republishes status so the panel sees the live result.
   */
  private handleMcpTestRequest(): void {
    const req = this.settings().mcpTestRequest
    if (req === undefined) return
    const last = this.lastTestTs.get(req.serverName) ?? 0
    if (req.ts <= last) return
    this.lastTestTs.set(req.serverName, req.ts)
    void this.runMcpTest(req.serverName)
  }

  /** Start (if needed) one server, wait for tools, then republish status. */
  private async runMcpTest(name: string): Promise<void> {
    if (!this.mcpEntries.has(name)) await this.startMcpServer(name)
    // Give the mcp-client a moment to discover and register tools.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await this.publishMcpStatus()
  }

  /** Add a new MCP server config and start it if enabled. */
  async addMcpServer(config: McpServerConfig): Promise<void> {
    const servers = this.settings().mcpServers
    if (servers.some((s) => s.serverName === config.serverName)) {
      throw new Error(`MCP server "${config.serverName}" already exists`)
    }
    await this.writeMcpServers([...servers, config])
    if (config.enabled) await this.startMcpServer(config.serverName)
  }

  /** Update an MCP server config; restarts it if it was running. */
  async updateMcpServer(name: string, patch: Partial<McpServerConfig>): Promise<void> {
    const servers = this.settings().mcpServers
    const index = servers.findIndex((s) => s.serverName === name)
    if (index < 0) throw new Error(`MCP server "${name}" not found`)
    const wasRunning = this.mcpEntries.has(name)
    if (wasRunning) await this.stopMcpServer(name)
    const next = servers.map((s, i) => i === index ? { ...s, ...patch, serverName: name } : s)
    await this.writeMcpServers(next)
    if (patch.enabled ?? next[index].enabled) await this.startMcpServer(name)
  }

  /** Remove an MCP server config and stop it if running. */
  async removeMcpServer(name: string): Promise<void> {
    if (this.mcpEntries.has(name)) await this.stopMcpServer(name)
    const next = this.settings().mcpServers.filter((s) => s.serverName !== name)
    await this.writeMcpServers(next)
  }

  /** Start (load) one MCP server's mcp-client instance. */
  async startMcpServer(name: string): Promise<void> {
    if (this.mcpEntries.has(name)) return
    const server = this.settings().mcpServers.find((s) => s.serverName === name)
    if (server === undefined) throw new Error(`MCP server "${name}" not found`)
    const loader = (this.ctx as Context & { loader?: { create: (o: { name: string; config?: unknown }) => Promise<string> } }).loader
    if (loader === undefined || typeof loader.create !== 'function') {
      this.ctx.logger.warn(`[switchblade] loader unavailable — cannot start MCP server ${name}`)
      return
    }
    try {
      const id = await loader.create({
        name: '@deepseek-ai/dsh-mcp-client',
        config: {
          serverName: server.serverName,
          transport: server.transport,
          ...(server.transport === 'stdio'
            ? { command: server.command, args: server.args ?? [], env: server.env ?? {} }
            : { url: server.url, headers: server.headers ?? {} }),
        },
      })
      this.mcpEntries.set(name, id)
      this.mcpErrors.delete(name)
      this.ctx.logger.warn(`[switchblade] started MCP server ${name}`)
    } catch (error) {
      this.mcpErrors.set(name, String(error))
      this.ctx.logger.warn(`[switchblade] failed to start MCP server ${name}: ${String(error)}`)
    }
  }

  /** Stop (unload) one MCP server's mcp-client instance. */
  async stopMcpServer(name: string): Promise<void> {
    const id = this.mcpEntries.get(name)
    if (id === undefined) return
    const loader = (this.ctx as Context & { loader?: { remove: (id: string) => Promise<void> } }).loader
    if (loader !== undefined && typeof loader.remove === 'function') {
      try { await loader.remove(id) } catch (error) { this.ctx.logger.warn(`[switchblade] failed to stop MCP server ${name}: ${String(error)}`) }
    }
    this.mcpEntries.delete(name)
    this.mcpErrors.delete(name)
  }

  /** List all MCP tools currently registered on ctx.tools. */
  listMcpTools(): McpToolInfo[] {
    const tools = (this.ctx as Context & { tools?: { schemas: () => readonly { name: string; description?: string }[] } }).tools
    if (tools === undefined || typeof tools.schemas !== 'function') return []
    return tools.schemas()
      .filter((t) => t.name.startsWith('mcp__'))
      .map((t) => ({ name: t.name, description: t.description ?? '' }))
  }

  /** Persist the MCP server config list. */
  private async writeMcpServers(servers: readonly McpServerConfig[]): Promise<void> {
    await this.settingsService?.mutate(
      settingsNamespace(SETTINGS_NAMESPACE),
      [{ op: 'set', path: ['mcpServers'], value: servers }],
    )
  }

  /** Flip one owned skill's runtime registration and persist the definition set. */
  private async setOwnedSkill(id: string, def: SkillDefinition | undefined, enabled: boolean): Promise<'enabled' | 'disabled'> {    const existing = this.registrations.get(id)
    if (existing !== undefined) {
      existing()
      this.registrations.delete(id)
    }
    if (def !== undefined && enabled) {
      this.registrations.set(id, this.ctx.skills.register(def))
    }
    const kept = this.settings().installedSkills.filter((row) => `${ID_PREFIX.skill}:${row.name}` !== id)
    const next = def === undefined ? kept : [...kept, def]
    await this.settingsService?.mutate(
      settingsNamespace(SETTINGS_NAMESPACE),
      [{ op: 'set', path: ['installedSkills'], value: next }],
    )
    return enabled ? 'enabled' : 'disabled'
  }

  private async setOwnedSkillEnabled(id: string, enabled: boolean): Promise<'enabled' | 'disabled'> {
    const definition = this.settings().installedSkills.find((row) => `${ID_PREFIX.skill}:${row.name}` === id)
    if (definition === undefined) throw new Error(`owned skill "${id}" is not installed`)
    const existing = this.registrations.get(id)
    if (existing !== undefined) {
      existing()
      this.registrations.delete(id)
    }
    if (enabled) this.registrations.set(id, this.ctx.skills.register(definition))
    return enabled ? 'enabled' : 'disabled'
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------

  private ownedSkillEntry(skill: SkillSummary): SkillEntry {
    return {
      kind: 'skill',
      id: `${ID_PREFIX.skill}:${skill.name}`,
      name: skill.name,
      description: skill.description,
      state: this.registrations.has(`${ID_PREFIX.skill}:${skill.name}`) ? 'enabled' : 'disabled',
      source: skill.source,
      invocation: skill.invocation,
      owned: this.registrations.has(`${ID_PREFIX.skill}:${skill.name}`),
    }
  }

  private profileEntry(preset: import('@deepseek-ai/dsh-agent-presets').AgentPreset): ProfileEntry {
    return {
      kind: 'profile',
      id: `${ID_PREFIX.profile}:${preset.id}`,
      name: preset.name ?? preset.id,
      description: preset.description ?? 'agent preset',
      state: 'installed',
      isDefault: preset.id === this.config.defaultProfile,
      preset,
    }
  }

  private commandEntry(descriptor: CommandDescriptor): CommandEntry {
    return {
      kind: 'command',
      id: `${ID_PREFIX.command}:${descriptor.name}`,
      name: descriptor.name,
      description: descriptor.description,
      state: this.registrations.has(`${ID_PREFIX.command}:${descriptor.name}`) ? 'enabled' : 'installed',
      descriptor,
    }
  }

  /** The agent-preset roster, read live from the composition. */
  private agentPresetsOrThrow(): import('@deepseek-ai/dsh-agent-presets').AgentPresets {
    const service = this.ctx.get('agentPresets')
    if (service === undefined) throw new Error('switchblade requires the agent-presets service to manage prompt profiles')
    return service
  }

  private authorableRoster(): import('@deepseek-ai/dsh-agent-presets').AgentPresets {
    return this.agentPresetsOrThrow()
  }
}

/** Parse the frontmatter `name:` field from a skill markdown body. */
function parseSkillName(md: string): string | undefined {
  const m = /^---[\s\S]*?^name:\s*([^\n]+)/m.exec(md)
  return m?.[1]?.trim()
}

/** Parse the frontmatter `description:` field from a skill markdown body. */
function parseSkillDescription(md: string): string | undefined {
  const m = /^---[\s\S]*?^description:\s*([^\n]+)/m.exec(md)
  return m?.[1]?.trim()
}

/** Starter handler for imported command rows that arrive without a real handler. */
function passthroughCommand(row: CommandDefinition): CommandDefinition {
  if (typeof row.handler === 'function') return row
  return {
    ...row,
    handler: async (): Promise<CommandResult> => ({ kind: 'success', text: row.description }),
  }
}

export default Switchblade
