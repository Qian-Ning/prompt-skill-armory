/**
 * Prompt-SkillArmory management page.
 *
 * Three tabs within the settings dialog's fixed width: Prompts / Skills /
 * MCP / Wallpaper / Chat / Stats. The Skills tab is the single home for skills — both the ones
 * installed through this panel and the ones scanned from the local skill
 * roots — merged into one list with full management (add / edit / toggle /
 * remove / invoke hint). A CLI entry box offers direct command installation.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SwitchbladeKey } from './locales.ts'
import type { McpServerRow, SwitchbladeSectionInjected, SwitchbladeSectionState } from './store.ts'
import { backgroundClient, DEFAULT_BACKGROUND, applyBackground, uploadMedia, isDesktopSurface, GRADIENTS, type BackgroundSettings } from './background.ts'
import { listConversations, exportConversations, downloadExport, importConversations, deleteConversations, checkLatestVersion, runUpdate, isOlder, fetchStats, type ConversationRow, type UsageStats } from './conversations.ts'

export type { SwitchbladeSectionInjected } from './store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Prompt-SkillArmory page copy. */
    'settings.switchblade': SwitchbladeKey
  }
}

/** Full component props: settings-section runtime + locale + injected face. */
export type SwitchbladeSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.switchblade'>
  & InjectFace<SwitchbladeSectionInjected>

/* ── Design tokens ────────────────────────────────────────────────
 * Modern dark UI (Linear / GitHub Dark / Raycast language):
 * low-saturation surfaces, one soft accent, pill badges, generous
 * radius + spacing, system sans for text, mono only for code.
 * ──────────────────────────────────────────────────────────────── */
const BG = '#0d1117'          // root background
const SURFACE = '#161b22'     // card / form surface
const BORDER = '#30363d'      // hairline border
const TEXT = '#e6edf3'        // primary text
const TEXT_MUTED = '#8b949e'  // secondary text
const ACCENT = '#58a6ff'      // brand accent (soft blue)
const SUCCESS = '#3fb950'     // enabled / success
const DANGER = '#f85149'      // danger / delete
const WARN = '#d29922'        // installed / warning
const MONO = "'JetBrains Mono',ui-monospace,'SF Mono',Consolas,monospace"
const SANS = "-apple-system,'Segoe UI','Inter',Roboto,'Helvetica Neue',sans-serif"

const CSS: Record<string, CSSProperties> = {
  root: {
    fontFamily: SANS,
    background: BG,
    color: TEXT,
    padding: '20px',
    border: `1px solid ${BORDER}`,
    borderRadius: '12px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${BORDER}`,
    paddingBottom: '12px',
    marginBottom: '14px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '0.2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: TEXT,
  },
  titleAccent: {
    color: ACCENT,
  },
  tabs: {
    display: 'flex',
    gap: '2px',
    borderBottom: `1px solid ${BORDER}`,
    marginBottom: '14px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: TEXT_MUTED,
    font: 'inherit',
    fontSize: '13px',
    fontWeight: 500,
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'color .15s ease, border-color .15s ease',
  },
  tabActive: {
    color: TEXT,
    borderBottomColor: ACCENT,
  },
  /* Fixed-height content area so every tab renders the same height. */
  content: {
    height: '600px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '12px',
    border: `1px solid ${BORDER}`,
    borderRadius: '10px',
    background: SURFACE,
  },
  input: {
    background: BG,
    border: `1px solid ${BORDER}`,
    color: TEXT,
    font: 'inherit',
    fontSize: '13px',
    padding: '8px 10px',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color .15s ease',
  },
  textarea: {
    background: BG,
    border: `1px solid ${BORDER}`,
    color: TEXT,
    font: 'inherit',
    fontSize: '13px',
    padding: '8px 10px',
    borderRadius: '6px',
    minHeight: '48px',
    resize: 'vertical' as const,
    outline: 'none',
    transition: 'border-color .15s ease',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  actionBtn: {
    background: 'transparent',
    border: `1px solid ${BORDER}`,
    color: TEXT_MUTED,
    font: 'inherit',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'color .15s ease, border-color .15s ease, background .15s ease',
  },
  dangerBtn: {
    borderColor: 'rgba(248,81,73,.4)',
    color: DANGER,
  },
  fileBtn: {
    background: 'transparent',
    border: `1px dashed ${BORDER}`,
    color: TEXT_MUTED,
    font: 'inherit',
    fontSize: '12px',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'color .15s ease, border-color .15s ease',
  },
  cliBox: {
    border: `1px solid ${BORDER}`,
    padding: '10px 12px',
    fontSize: '12px',
    color: TEXT_MUTED,
    background: SURFACE,
    borderRadius: '8px',
  },
  searchInput: {
    background: BG,
    border: `1px solid ${BORDER}`,
    color: TEXT_MUTED,
    font: 'inherit',
    fontSize: '12px',
    padding: '7px 10px',
    borderRadius: '6px',
    width: '100%',
    boxSizing: 'border-box' as const,
    outline: 'none',
    transition: 'border-color .15s ease',
  },
  scrollBox: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    paddingRight: '6px',
    minHeight: '0',
  },
  wallGrid: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
    gap: '10px',
    paddingRight: '6px',
    minHeight: '0',
    alignContent: 'start' as const,
  },
  wallCard: {
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    borderRadius: '10px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color .15s ease',
  },
  wallActive: {
    borderColor: ACCENT,
  },
  wallPreview: {
    height: '88px',
    backgroundSize: 'cover' as const,
    backgroundPosition: 'center' as const,
  },
  wallName: {
    padding: '6px 10px',
    fontSize: '12px',
    color: TEXT,
  },
  card: {
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    borderRadius: '10px',
    padding: '10px 12px',
    transition: 'border-color .15s ease, background .15s ease',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  name: {
    fontSize: '13px',
    fontWeight: 600,
    wordBreak: 'break-all' as const,
    color: TEXT,
  },
  badge: {
    fontSize: '11px',
    fontWeight: 500,
    padding: '2px 10px',
    borderRadius: '999px',
    flex: 'none',
  },
  badgeEnabled: { color: SUCCESS, background: 'rgba(63,185,80,.12)' },
  badgeDisabled: { color: TEXT_MUTED, background: 'rgba(139,148,158,.12)' },
  badgeInstalled: { color: WARN, background: 'rgba(210,153,34,.12)' },
  desc: {
    fontSize: '12px',
    color: TEXT_MUTED,
    marginTop: '6px',
    lineHeight: '1.5',
  },
  invokeHint: {
    fontSize: '11px',
    color: ACCENT,
    marginTop: '6px',
    fontFamily: MONO,
  },
  empty: {
    fontSize: '12px',
    color: TEXT_MUTED,
    padding: '12px 0',
    textAlign: 'center' as const,
  },
  error: {
    color: DANGER,
    fontSize: '12px',
    padding: '10px 0',
  },
  refreshBtn: {
    background: 'transparent',
    border: `1px solid ${BORDER}`,
    color: TEXT_MUTED,
    font: 'inherit',
    fontSize: '12px',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'color .15s ease, border-color .15s ease',
  },
  hint: {
    color: TEXT_MUTED,
    fontSize: '11px',
  },
  versionBadge: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    color: ACCENT,
    border: `1px solid ${BORDER}`,
    borderRadius: '999px',
    padding: '2px 10px',
    marginLeft: '8px',
    background: 'rgba(88,166,255,.08)',
    flex: 'none',
  },
}

/** Open-book glyph. */
function BookIcon({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flex: 'none' }} aria-hidden="true">
      <path d="M7.5 3.2C6.2 2.4 4.6 2.2 2.8 2.5c-.5.08-.8.5-.8 1v7.6c0 .4.3.7.7.7 1.7-.2 3.2.1 4.8 1V3.2z" fill="currentColor" opacity="0.55" />
      <path d="M8.5 3.2c1.3-.8 2.9-1 4.7-.7.5.08.8.5.8 1v7.6c0 .4-.3.7-.7.7-1.7-.2-3.2.1-4.8 1V3.2z" fill="currentColor" opacity="0.85" />
      <path d="M8 3.2v10.3" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  )
}

type TabKey = 'prompts' | 'skills' | 'mcp' | 'wallpaper' | 'chat' | 'stats'

/** Bump with every release; keep in sync with package.json version + CHANGELOG. */
const ARMORY_VERSION = '0.9.7'

/** Compact duration: 45.2s / 2m42s / 1h05m. */
function fmtDuration(ms: number): string {
  const s = ms / 1000
  if (s < 60) return `${Math.round(s * 10) / 10}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m${Math.round(s % 60)}s`
  const h = Math.floor(m / 60)
  return `${h}h${String(m % 60).padStart(2, '0')}m`
}

/** Compact token count: 517 / 12.2K / 1.2M. */
function fmtTokens(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`
  return `${Math.round(n / 1_000_000 * 10) / 10}M`
}

/** USD cost, 4 decimals or compact. */
function fmtUsd(n: number): string {
  if (n === 0) return '$0'
  if (n < 0.0001) return '<$0.0001'
  return `$${n.toFixed(4)}`
}

/** Percent. */
function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

interface TrendPoint { date: string; steps: number; outputTokens: number; inputTokens: number; cacheReadTokens: number; cacheWriteTokens: number }

/** SVG line chart with dual axes (steps left, tokens right) + hover tooltip. */
function TrendChart({ byDay }: { byDay: TrendPoint[] }): JSX.Element {
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = 180
  const PAD = { l: 38, r: 52, t: 10, b: 22 }
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const n = byDay.length
  if (n === 0) return <div style={CSS.empty}>暂无趋势数据</div>

  const maxSteps = Math.max(...byDay.map((d) => d.steps), 1)
  // All token series share the right axis. Input tokens are typically an
  // order of magnitude larger than output, so a linear scale flattens the
  // output line into the baseline. A log scale keeps both shapes visible;
  // the steps axis on the left stays linear.
  const maxTokens = Math.max(
    ...byDay.map((d) => d.outputTokens),
    ...byDay.map((d) => d.inputTokens),
    ...byDay.map((d) => d.cacheReadTokens),
    ...byDay.map((d) => d.cacheWriteTokens),
    1,
  )
  const logBase = Math.max(Math.log10(maxTokens), 1) // at least one decade
  const x = (i: number): number => PAD.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw)
  const ySteps = (v: number): number => PAD.t + ih - (v / maxSteps) * ih
  const yTok = (v: number): number => {
    const vv = Math.max(v, 1)
    return PAD.t + ih - (Math.log10(vv) / logBase) * ih
  }

  const pathSteps = byDay.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${ySteps(d.steps).toFixed(1)}`).join(' ')
  const pathOut = byDay.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yTok(d.outputTokens).toFixed(1)}`).join(' ')
  const pathIn = byDay.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yTok(d.inputTokens).toFixed(1)}`).join(' ')

  // Right-axis ticks in log space: 0% / 25% / 50% / 75% / 100% of the decade,
  // rounded to a nice token count (1 / 2 / 5 stepping).
  const tokTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.pow(10, f * logBase))
  const niceToken = (v: number): string => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)}M`
    if (v >= 1e3) return `${(v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 1)}k`
    return String(Math.round(v))
  }

  // gridlines (4)
  const grid = [0, 1, 2, 3, 4].map((g) => {
    const v = maxSteps * (g / 4)
    const yy = ySteps(v)
    return { yy, label: g === 0 ? '0' : fmtTokens(v) }
  })

  const hovered = hover !== null ? byDay[hover] : undefined

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="180" onMouseLeave={() => setHover(null)}>
        {/* gridlines + left labels */}
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={g.yy} x2={W - PAD.r} y2={g.yy} stroke="#21262d" strokeWidth="1" />
            <text x={PAD.l - 5} y={g.yy + 3} textAnchor="end" fontSize="9" fill="#8b949e">{g.label}</text>
          </g>
        ))}
        {/* right tokens axis: 5 rounded ticks + max label */}
        {tokTicks.map((v, i) => {
          const yy = yTok(v)
          return (
            <text key={i} x={W - PAD.r + 6} y={yy + 3} fontSize="9" fill={i === 4 ? '#3fb950' : '#8b949e'}>
              {niceToken(v)}
            </text>
          )
        })}
        {/* x labels (max 7) */}
        {byDay.map((d, i) => {
          if (n > 7 && i % Math.ceil(n / 7) !== 0 && i !== n - 1) return null
          return <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#8b949e">{d.date.includes(':') ? d.date : d.date.slice(5)}</text>
        })}
        {/* hover vertical guide */}
        {hover !== null && (
          <line x1={x(hover)} y1={PAD.t} x2={x(hover)} y2={PAD.t + ih} stroke="#58a6ff" strokeDasharray="3 3" strokeWidth="1" />
        )}
        {/* data lines */}
        <path d={pathIn} fill="none" stroke="#58a6ff" strokeWidth="1.6" opacity="0.7" />
        <path d={pathOut} fill="none" stroke="#3fb950" strokeWidth="1.8" />
        <path d={pathSteps} fill="none" stroke="#d29922" strokeWidth="1.8" strokeDasharray="4 3" />
        {/* always-visible data dots + hover hit areas + value labels */}
        {byDay.map((d, i) => (
          <g key={i}>
            <rect x={x(i) - 10} y={PAD.t} width={20} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
            <circle cx={x(i)} cy={ySteps(d.steps)} r={hover === i ? 4 : 3} fill="#d29922" stroke="#0d1117" strokeWidth="1" />
            <circle cx={x(i)} cy={yTok(d.outputTokens)} r={hover === i ? 4 : 3} fill="#3fb950" stroke="#0d1117" strokeWidth="1" />
            <circle cx={x(i)} cy={yTok(d.inputTokens)} r={hover === i ? 4 : 3} fill="#58a6ff" stroke="#0d1117" strokeWidth="1" />
            {n <= 4 && (
              <>
                <text x={x(i)} y={ySteps(d.steps) - 6} textAnchor="middle" fontSize="8.5" fill="#d29922">{d.steps}</text>
                <text x={x(i)} y={yTok(d.outputTokens) - 6} textAnchor="middle" fontSize="8.5" fill="#3fb950">{fmtTokens(d.outputTokens)}</text>
                <text x={x(i)} y={yTok(d.inputTokens) - 6} textAnchor="middle" fontSize="8.5" fill="#58a6ff">{fmtTokens(d.inputTokens)}</text>
              </>
            )}
          </g>
        ))}
      </svg>
      {/* tooltip */}
      {hovered !== undefined && (
        <div style={{ position: 'absolute', top: 0, left: Math.min(Math.max(x(hover!) / W * 100, 10), 70) + '%', background: 'rgba(22,27,34,.95)', border: '1px solid #30363d', borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color: '#e6edf3', zIndex: 5, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(0,0,0,.4)' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: '#58a6ff' }}>{hovered.date}</div>
          <div>步骤：{hovered.steps}</div>
          <div>输出：{fmtTokens(hovered.outputTokens)}</div>
          <div>输入：{fmtTokens(hovered.inputTokens)}</div>
          <div>缓存读：{fmtTokens(hovered.cacheReadTokens)} · 写：{fmtTokens(hovered.cacheWriteTokens)}</div>
        </div>
      )}
      {/* legend */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: '#8b949e', flexWrap: 'wrap' as const }}>
        <span><span style={{ color: '#d29922' }}>—</span> 步骤</span>
        <span><span style={{ color: '#3fb950' }}>—</span> 输出 Token</span>
        <span><span style={{ color: '#58a6ff' }}>—</span> 输入 Token</span>
      </div>
    </div>
  )
}


/** Render the Prompt-SkillArmory management page. */
export function SwitchbladeSection(props: SwitchbladeSectionProps): JSX.Element {
  const {
    useSwitchblade, t, load,
    addPrompt, updatePrompt, setPromptEnabled, setDefaultPrompt, deletePrompt,
    installSkill, updateSkill, setSkillEnabled, uninstallSkill,
    addMcpServer, updateMcpServer, toggleMcpServer, removeMcpServer, testMcpServer,
    refreshSessions,
  } = props
  const state = useSwitchblade((snapshot: SwitchbladeSectionState) => snapshot)
  const [promptName, setPromptName] = useState('')
  const [promptDesc, setPromptDesc] = useState('')
  const [promptContent, setPromptContent] = useState('')
  const [skillName, setSkillName] = useState('')
  const [skillDesc, setSkillDesc] = useState('')
  const [skillContent, setSkillContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [pickedFile, setPickedFile] = useState('')
  const [promptQuery, setPromptQuery] = useState('')
  const [skillQuery, setSkillQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('prompts')
  const [editingPromptId, setEditingPromptId] = useState<string | undefined>()
  const [editingSkillName, setEditingSkillName] = useState<string | undefined>()
  // MCP form state
  const [mcpName, setMcpName] = useState('')
  const [mcpTransport, setMcpTransport] = useState<'stdio' | 'streamable-http'>('stdio')
  const [mcpCommand, setMcpCommand] = useState('')
  const [mcpArgs, setMcpArgs] = useState('')
  const [mcpEnv, setMcpEnv] = useState('')
  const [mcpUrl, setMcpUrl] = useState('')
  const [mcpHeaders, setMcpHeaders] = useState('')
  const [editingMcpName, setEditingMcpName] = useState<string | undefined>()

  useEffect(() => {
    void load()
  }, [load])

  const refresh = (): void => {
    void load()
  }

  /** Parse newline-separated `KEY=VALUE` lines into a record. */
  const parseKv = (text: string): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const line of text.split('\n')) {
      const idx = line.indexOf('=')
      if (idx <= 0) continue
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      if (key !== '') out[key] = value
    }
    return out
  }

  /** Submit the MCP server form (add or update). */
  const submitMcpServer = (): void => {
    if (mcpName.trim() === '') return
    setBusy(true)
    const base = { serverName: mcpName.trim(), transport: mcpTransport, enabled: true }
    const config = mcpTransport === 'stdio'
      ? {
          ...base,
          command: mcpCommand.trim(),
          args: mcpArgs.trim() ? mcpArgs.trim().split(/\s+/) : [],
          env: parseKv(mcpEnv),
        }
      : { ...base, url: mcpUrl.trim(), headers: parseKv(mcpHeaders) }
    const action = editingMcpName !== undefined
      ? updateMcpServer(editingMcpName, config)
      : addMcpServer(config)
    void action
      .catch((error: unknown) => console.error('[switchblade] mcp save failed', error))
      .finally(() => {
        setBusy(false)
        setMcpName(''); setMcpCommand(''); setMcpArgs(''); setMcpEnv(''); setMcpUrl(''); setMcpHeaders('')
        setEditingMcpName(undefined)
      })
  }

  /** Load one MCP server into the edit form. */
  const startEditMcpServer = (server: McpServerRow): void => {
    setEditingMcpName(server.serverName)
    setMcpName(server.serverName)
    setMcpTransport(server.transport)
    setMcpCommand(server.command ?? '')
    setMcpArgs((server.args ?? []).join(' '))
    setMcpEnv(Object.entries(server.env ?? {}).map(([k, v]) => `${k}=${v}`).join('\n'))
    setMcpUrl(server.url ?? '')
    setMcpHeaders(Object.entries(server.headers ?? {}).map(([k, v]) => `${k}=${v}`).join('\n'))
  }

  // Background / effects draft + handlers (persisted via backgroundClient
  // route; live preview through applyBackground / applyBackgroundKnob).
  const [bgDraft, setBgDraft] = useState<BackgroundSettings>(DEFAULT_BACKGROUND)

  // Conversation import/export state
  const [chatRows, setChatRows] = useState<ConversationRow[]>([])
  const [chatSelected, setChatSelected] = useState<Set<string>>(new Set())
  const [chatTarget, setChatTarget] = useState('')
  const [chatProject, setChatProject] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  // Update availability
  const [latestVer, setLatestVer] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  // Usage stats
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [statsRange, setStatsRange] = useState('all')
  const [statsUpdatedAt, setStatsUpdatedAt] = useState(0)

  // Live refresh: poll the current range every 30s while the stats tab is open
  // (the host caches for 4s, so polling is cheap). Keeps the chart and totals
  // tracking the latest usage for today/7d/30d/all alike.
  const reloadStats = async (): Promise<void> => {
    const s = await fetchStats(statsRange)
    if (s !== null) { setStats(s); setStatsUpdatedAt(Date.now()) }
  }
  const changeStatsRange = (r: string): void => {
    setStatsRange(r)
    void fetchStats(r).then((s) => { if (s !== null) { setStats(s); setStatsUpdatedAt(Date.now()) } })
  }
  useEffect(() => {
    if (activeTab !== 'stats') return
    const timer = setInterval(() => { void reloadStats() }, 30000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statsRange])

  useEffect(() => {
    void checkLatestVersion().then((v) => { if (v !== '') setLatestVer(v) })
  }, [])

  const reloadChat = async (): Promise<void> => {
    setChatRows(await listConversations())
  }

  useEffect(() => { void reloadChat() }, [])

  const toggleChatSel = (id: string): void => {
    setChatSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  // Deduplicated project workspaces (projectKey + display name from cwd basename).
  const chatProjects = useMemo(() => {
    const byKey = new Map<string, string>()
    for (const row of chatRows) {
      const name = row.cwd ? row.cwd.split(/[\\/]/).filter(Boolean).pop() ?? row.projectKey : row.projectKey
      if (!byKey.has(row.projectKey)) byKey.set(row.projectKey, name)
    }
    return [...byKey.entries()].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [chatRows])

  // Keep the selected project valid as rows load.
  useEffect(() => {
    if (chatProject === '' && chatProjects.length > 0) setChatProject(chatProjects[0].key)
    else if (chatProject !== '' && !chatProjects.some((p) => p.key === chatProject)) setChatProject(chatProjects[0]?.key ?? '')
  }, [chatProjects, chatProject])

  const doExportChat = async (): Promise<void> => {
    setChatBusy(true); setChatMsg('')
    try {
      const name = await exportConversations([...chatSelected])
      if (name === null) { setChatMsg('导出失败'); return }
      const ok = await downloadExport(name)
      setChatMsg(ok ? `已导出 ${name}` : '导出失败：下载未完成')
    } catch { setChatMsg('导出失败') } finally { setChatBusy(false) }
  }

  const doExportProject = async (): Promise<void> => {
    const key = chatProject.trim()
    if (key === '') { setChatMsg('请先选择项目工作区'); return }
    setChatBusy(true); setChatMsg('')
    try {
      const name = await exportConversations([], key)
      if (name === null) { setChatMsg('导出失败'); return }
      const ok = await downloadExport(name)
      setChatMsg(ok ? `已导出整个项目 ${key} → ${name}` : '导出失败：下载未完成')
    } catch { setChatMsg('导出失败') } finally { setChatBusy(false) }
  }

  const doUpdate = async (): Promise<void> => {
    setUpdating(true); setUpdateMsg('')
    const r = await runUpdate()
    setUpdateMsg(r.ok ? '更新完成，请重启客户端生效' : (r.error !== undefined && r.error !== '' ? `更新失败：${r.error.slice(0, 300)}` : '更新失败'))
    setUpdating(false)
  }

  const onChatFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return
    setChatBusy(true); setChatMsg('')
    try {
      const n = await importConversations(file, chatTarget.trim() || undefined)
      setChatMsg(n === null ? '导入失败' : `已导入 ${n} 个对话，重启客户端后生效`)
      if (n !== null) { refreshSessions(); await reloadChat() }
    } catch { setChatMsg('导入失败') } finally { setChatBusy(false) }
  }

  const doDeleteChat = async (): Promise<void> => {
    const ids = [...chatSelected]
    if (ids.length === 0) return
    if (!window.confirm(`确定删除选中的 ${ids.length} 个对话吗？此操作不可恢复。`)) return
    setChatBusy(true); setChatMsg('')
    try {
      const r = await deleteConversations(ids)
      if (r === null) { setChatMsg('删除失败'); return }
      setChatSelected(new Set())
      const failMsg = r.failed.length > 0 ? `；${r.failed.length} 个删除失败（文件可能被占用，可稍后重试）` : ''
      setChatMsg(`已删除 ${r.deleted} 个对话${failMsg}`)
      refreshSessions()
      await reloadChat()
    } catch { setChatMsg('删除失败') } finally { setChatBusy(false) }
  }

  useEffect(() => {
    const snap = backgroundClient.getSnapshot()
    if (snap.status === 'ready') {
      setBgDraft({ ...snap.value })
      applyBackground(snap.value)
    }
  }, [])

  const saveBackground = (draft: BackgroundSettings): void => {
    void backgroundClient.save(draft)
  }
  const resetBackground = (): void => {
    const d = { ...DEFAULT_BACKGROUND }
    setBgDraft(d); applyBackground(d); void backgroundClient.save(d)
  }
  const updateBgLive = (patch: Partial<BackgroundSettings>): void => {
    setBgDraft((prev) => {
      const next = { ...prev, ...patch }
      applyBackground(next)
      void backgroundClient.save(next)
      return next
    })
  }
  const bgSlider = (label: string, key: 'opacity' | 'scrim' | 'panelOpacity' | 'blur' | 'wallpaperBlur', min: number, max: number, step: number): JSX.Element => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ ...CSS.hint, width: '76px', flex: 'none' }}>{label}</span>
      <input type="range" min={min} max={max} step={step}
        value={bgDraft[key] as number}
        onChange={(e) => updateBgLive({ [key]: Number(e.target.value) } as Partial<BackgroundSettings>)}
        style={{ flex: 1 }} />
      <span style={{ ...CSS.hint, width: '34px', textAlign: 'right' as const }}>{Math.round((bgDraft[key] as number) * 100)}</span>
    </div>
  )

  /** Read a local skill .md file into the import form. */
  const onSkillFile = (file: File | undefined): void => {
    if (file === undefined) return
    setPickedFile(file.name)
    void file.text().then((text) => {
      const first = text.split('\n')[0]?.trim() ?? ''
      const nameMatch = /^#\s+([a-z0-9][a-z0-9-]*)$/i.exec(first)
      if (nameMatch !== null) setSkillName(nameMatch[1]?.toLowerCase() ?? '')
      setSkillContent(text.trim())
      const descLine = text.split('\n').find((l) => l.startsWith('> '))
      if (descLine !== undefined) setSkillDesc(descLine.slice(2).trim())
    }).catch((error: unknown) => console.error('[switchblade] read skill file failed', error))
  }

  const submitPrompt = (): void => {
    if (promptName.trim() === '' || promptContent.trim() === '') return
    setBusy(true)
    const action = editingPromptId !== undefined
      ? updatePrompt(editingPromptId, { name: promptName, description: promptDesc, content: promptContent })
      : addPrompt({ name: promptName, description: promptDesc, content: promptContent })
    void action
      .catch((error: unknown) => console.error('[switchblade] prompt save failed', error))
      .finally(() => {
        setBusy(false)
        setPromptName(''); setPromptDesc(''); setPromptContent('')
        setEditingPromptId(undefined)
      })
  }

  const startEditPrompt = (row: { promptId: string; name: string; desc: string; content?: string }): void => {
    setEditingPromptId(row.promptId)
    setPromptName(row.name)
    setPromptDesc(row.desc)
    setPromptContent(row.content ?? '')
  }

  const togglePrompt = (id: string, enabled: boolean): void => {
    void setPromptEnabled(id, enabled).catch((error: unknown) => console.error('[switchblade] toggle failed', error))
  }

  const markDefault = (id: string): void => {
    void setDefaultPrompt(id).catch((error: unknown) => console.error('[switchblade] setDefault failed', error))
  }

  const removePrompt = (id: string): void => {
    void deletePrompt(id).catch((error: unknown) => console.error('[switchblade] delete failed', error))
  }

  const submitSkill = (): void => {
    if (skillName.trim() === '' || skillContent.trim() === '') return
    setBusy(true)
    const action = editingSkillName !== undefined
      ? updateSkill(editingSkillName, { name: skillName, description: skillDesc, content: skillContent })
      : installSkill({ name: skillName, description: skillDesc, content: skillContent })
    void action
      .catch((error: unknown) => console.error('[switchblade] skill save failed', error))
      .finally(() => {
        setBusy(false)
        setSkillName(''); setSkillDesc(''); setSkillContent('')
        setEditingSkillName(undefined)
      })
  }

  const startEditSkill = (row: { installedName: string; name: string; desc: string }): void => {
    const found = state.installedSkills.find((s) => s.name === row.installedName)
    setEditingSkillName(row.installedName)
    setSkillName(row.name)
    setSkillDesc(row.desc)
    setSkillContent(found?.content ?? '')
  }

  const toggleSkill = (name: string, enabled: boolean): void => {
    void setSkillEnabled(name, enabled).catch((error: unknown) => console.error('[switchblade] toggle skill failed', error))
  }

  const removeSkill = (name: string): void => {
    void uninstallSkill(name).catch((error: unknown) => console.error('[switchblade] uninstall failed', error))
  }

  /** Adopt a scanned (local) skill into the managed list. */
  const adoptSkill = (name: string): void => {
    const found = state.skills.find((s) => s.name === name)
    if (found === undefined) return
    void installSkill({ name: found.name, description: found.description, content: `# ${found.name}\n\n${found.description}` })
      .catch((error: unknown) => console.error('[switchblade] adopt skill failed', error))
  }

  const promptRows = state.prompts.map((p) => ({
    id: p.id, name: p.name, desc: p.description, state: p.enabled ? ('enabled' as const) : ('disabled' as const),
    promptId: p.id, isDefault: p.isDefault, content: p.content, promptEnabled: p.enabled,
  }))

  // Merge managed + scanned skills into ONE list, managed first.
  const managedNames = new Set(state.installedSkills.map((s) => s.name))
  const managedRows = state.installedSkills.map((s) => ({
    key: `m-${s.name}`, name: s.name, desc: s.description,
    state: s.enabled ? ('enabled' as const) : ('disabled' as const),
    installedName: s.name, skillEnabled: s.enabled, source: 'managed' as const,
  }))
  const scannedRows = state.skills
    .filter((s) => !managedNames.has(s.name))
    .map((s) => ({
      key: `s-${s.name}`, name: s.name, desc: s.description,
      state: ('installed' as const), installedName: s.name, skillEnabled: false, source: 'scanned' as const,
    }))
  const allSkillRows = [...managedRows, ...scannedRows]

  const match = (row: { name: string; desc: string }, q: string): boolean => {
    const query = q.trim().toLowerCase()
    if (query === '') return true
    return row.name.toLowerCase().includes(query) || row.desc.toLowerCase().includes(query)
  }
  const filteredPrompts = promptRows.filter((r) => match(r, promptQuery))
  const filteredSkills = allSkillRows.filter((r) => match(r, skillQuery))

  const badge = (state: 'enabled' | 'disabled' | 'installed'): CSSProperties => (
    state === 'enabled' ? CSS.badgeEnabled! : state === 'disabled' ? CSS.badgeDisabled! : CSS.badgeInstalled!
  )
  const label = (state: 'enabled' | 'disabled' | 'installed'): string => (
    state === 'enabled' ? t('enabled') : state === 'disabled' ? t('disabled') : t('installed')
  )

  return (
    <div style={CSS.root}>
      <div style={CSS.head}>
        <div style={CSS.title}>
          <BookIcon size={16} /> <span style={CSS.titleAccent}>Armory</span>
          <span style={CSS.versionBadge}>v{ARMORY_VERSION}</span>
          {latestVer !== '' && isOlder(ARMORY_VERSION, latestVer) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
              <button style={{ ...CSS.actionBtn, ...CSS.badgeEnabled, fontSize: '11px', padding: '2px 8px' }} disabled={updating} onClick={() => void doUpdate()}>
                {updating ? '更新中…' : `↑ v${latestVer} 更新`}
              </button>
              {updateMsg !== '' && <span style={{ ...CSS.hint, whiteSpace: 'nowrap' as const }}>{updateMsg.slice(0, 60)}</span>}
            </span>
          )}
        </div>
        <button style={CSS.refreshBtn} onClick={refresh}>{t('refresh')}</button>
      </div>

      {state.status === 'error' && <div style={CSS.error}>✖ {t('loadFailed')}: {state.message}</div>}

      {/* Tab bar */}
      <div style={CSS.tabs}>
        <button style={{ ...CSS.tab, ...(activeTab === 'prompts' ? CSS.tabActive : {}) }} onClick={() => setActiveTab('prompts')}>
          {t('promptsTitle')} ({state.status === 'loading' ? '…' : promptRows.length})
        </button>
        <button style={{ ...CSS.tab, ...(activeTab === 'skills' ? CSS.tabActive : {}) }} onClick={() => setActiveTab('skills')}>
          {t('installSkill')} ({state.status === 'loading' ? '…' : allSkillRows.length})
        </button>
        <button style={{ ...CSS.tab, ...(activeTab === 'mcp' ? CSS.tabActive : {}) }} onClick={() => setActiveTab('mcp')}>
          MCP ({state.status === 'loading' ? '…' : state.mcpServers.length})
        </button>
        <button style={{ ...CSS.tab, ...(activeTab === 'wallpaper' ? CSS.tabActive : {}) }} onClick={() => setActiveTab('wallpaper')}>
          Wallpaper
        </button>
        <button style={{ ...CSS.tab, ...(activeTab === 'chat' ? CSS.tabActive : {}) }} onClick={() => { setActiveTab('chat'); void reloadChat() }}>
          对话 ({chatRows.length})
        </button>
        <button style={{ ...CSS.tab, ...(activeTab === 'stats' ? CSS.tabActive : {}) }} onClick={() => { setActiveTab('stats'); void reloadStats() }}>
          统计
        </button>
      </div>

      {/* Fixed-height content area — every tab renders the same height. */}
      <div style={CSS.content}>
        {/* ── Tab: prompts ─────────────────────────────────────── */}
        {activeTab === 'prompts' && (
          <>
            <div style={CSS.form}>
              <input style={CSS.input} placeholder={t('promptNamePlaceholder')} value={promptName} onChange={(e) => setPromptName(e.target.value)} />
              <input style={CSS.input} placeholder={t('promptDescPlaceholder')} value={promptDesc} onChange={(e) => setPromptDesc(e.target.value)} />
              <textarea style={CSS.textarea} placeholder={t('promptContentPlaceholder')} value={promptContent} onChange={(e) => setPromptContent(e.target.value)} />
              <div style={CSS.actions}>
                <button style={CSS.actionBtn} disabled={busy} onClick={submitPrompt}>
                  {editingPromptId !== undefined ? t('save') : t('addPrompt')}
                </button>
                {editingPromptId !== undefined && (
                  <button style={CSS.actionBtn} onClick={() => { setEditingPromptId(undefined); setPromptName(''); setPromptDesc(''); setPromptContent('') }}>{t('cancel')}</button>
                )}
              </div>
            </div>
            <input style={CSS.searchInput} placeholder={t('searchPlaceholder')} value={promptQuery} onChange={(e) => setPromptQuery(e.target.value)} />
            <div style={CSS.scrollBox}>
              {filteredPrompts.length === 0
                ? <div style={CSS.empty}>{t('empty')}</div>
                : filteredPrompts.map((row) => (
                  <div key={row.id} style={CSS.card}>
                    <div style={CSS.cardTop}>
                      <div style={CSS.name}>{row.isDefault ? '★ ' : ''}{row.name}</div>
                      <span style={{ ...CSS.badge, ...row.state === 'enabled' ? CSS.badgeEnabled : CSS.badgeDisabled }}>
                        {row.state === 'enabled' ? t('enabled') : t('disabled')}
                      </span>
                    </div>
                    <div style={CSS.desc}>{row.desc || row.content?.slice(0, 80)}</div>
                    <div style={CSS.actions}>
                      {!row.isDefault && <button style={CSS.actionBtn} onClick={() => markDefault(row.promptId!)}>{t('setDefault')}</button>}
                      <button style={CSS.actionBtn} onClick={() => togglePrompt(row.promptId!, !row.promptEnabled)}>
                        {row.state === 'enabled' ? t('disable') : t('enable')}
                      </button>
                      <button style={CSS.actionBtn} onClick={() => startEditPrompt(row)}>{t('edit')}</button>
                      <button style={{ ...CSS.actionBtn, ...CSS.dangerBtn }} onClick={() => removePrompt(row.promptId!)}>{t('delete')}</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── Tab: skills (merged managed + scanned) ───────────── */}
        {activeTab === 'skills' && (
          <>
            <div style={CSS.form}>
              <label style={CSS.fileBtn}>
                {pickedFile !== '' ? `📄 ${pickedFile}` : t('pickSkillFile')}
                <input type="file" accept=".md,.markdown,text/markdown,text/plain" style={{ display: 'none' }} onChange={(e) => onSkillFile(e.target.files?.[0])} />
              </label>
              <input style={CSS.input} placeholder={t('skillNamePlaceholder')} value={skillName} onChange={(e) => setSkillName(e.target.value)} />
              <input style={CSS.input} placeholder={t('skillDescPlaceholder')} value={skillDesc} onChange={(e) => setSkillDesc(e.target.value)} />
              <textarea style={CSS.textarea} placeholder={t('skillContentPlaceholder')} value={skillContent} onChange={(e) => setSkillContent(e.target.value)} />
              <div style={CSS.actions}>
                <button style={CSS.actionBtn} disabled={busy} onClick={submitSkill}>
                  {editingSkillName !== undefined ? t('save') : t('addSkill')}
                </button>
                {editingSkillName !== undefined && (
                  <button style={CSS.actionBtn} onClick={() => { setEditingSkillName(undefined); setSkillName(''); setSkillDesc(''); setSkillContent('') }}>{t('cancel')}</button>
                )}
              </div>
            </div>
            <div style={CSS.cliBox}>
              <div style={{ marginBottom: '4px' }}>{t('cliHint')}</div>
              <code style={{ fontSize: '11px', color: ACCENT, fontFamily: MONO }}>/armory-skill-dir &lt;目录&gt; · /armory-install-zip &lt;zip路径&gt;</code>
            </div>
            <input style={CSS.searchInput} placeholder={t('searchPlaceholder')} value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} />
            <div style={CSS.scrollBox}>
              {filteredSkills.length === 0
                ? <div style={CSS.empty}>{t('empty')}</div>
                : filteredSkills.map((row) => (
                  <div key={row.key} style={CSS.card}>
                    <div style={CSS.cardTop}>
                      <div style={CSS.name}>{row.name}</div>
                      <span style={{ ...CSS.badge, ...badge(row.state) }}>{label(row.state)}</span>
                    </div>
                    <div style={CSS.desc}>{row.desc}</div>
                    <div style={CSS.invokeHint}>/ {row.name}</div>
                    <div style={CSS.actions}>
                      {row.source === 'scanned' ? (
                        <button style={CSS.actionBtn} onClick={() => adoptSkill(row.name)}>{t('manage')}</button>
                      ) : (
                        <>
                          <button style={CSS.actionBtn} onClick={() => toggleSkill(row.installedName!, !row.skillEnabled)}>
                            {row.state === 'enabled' ? t('disable') : t('enable')}
                          </button>
                          <button style={CSS.actionBtn} onClick={() => startEditSkill(row)}>{t('edit')}</button>
                          <button style={{ ...CSS.actionBtn, ...CSS.dangerBtn }} onClick={() => removeSkill(row.installedName!)}>{t('uninstall')}</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── Tab: MCP servers ─────────────────────────────────── */}
        {activeTab === 'mcp' && (
          <>
            <div style={CSS.form}>
              <input style={CSS.input} placeholder="服务器名称 (serverName)" value={mcpName} onChange={(e) => setMcpName(e.target.value)} />
              <div style={CSS.actions}>
                <button style={{ ...CSS.actionBtn, ...(mcpTransport === 'stdio' ? CSS.tabActive : {}) }} onClick={() => setMcpTransport('stdio')}>stdio</button>
                <button style={{ ...CSS.actionBtn, ...(mcpTransport === 'streamable-http' ? CSS.tabActive : {}) }} onClick={() => setMcpTransport('streamable-http')}>HTTP</button>
              </div>
              {mcpTransport === 'stdio' ? (
                <>
                  <input style={CSS.input} placeholder="命令 (command, 如 npx)" value={mcpCommand} onChange={(e) => setMcpCommand(e.target.value)} />
                  <input style={CSS.input} placeholder="参数 (args, 空格分隔)" value={mcpArgs} onChange={(e) => setMcpArgs(e.target.value)} />
                  <textarea style={CSS.textarea} placeholder="环境变量 (env, 每行 KEY=VALUE)" value={mcpEnv} onChange={(e) => setMcpEnv(e.target.value)} />
                </>
              ) : (
                <>
                  <input style={CSS.input} placeholder="URL (如 http://localhost:3000/mcp)" value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} />
                  <textarea style={CSS.textarea} placeholder="请求头 (headers, 每行 KEY=VALUE)" value={mcpHeaders} onChange={(e) => setMcpHeaders(e.target.value)} />
                </>
              )}
              <div style={CSS.actions}>
                <button style={CSS.actionBtn} disabled={busy} onClick={submitMcpServer}>
                  {editingMcpName !== undefined ? '保存' : '添加'}
                </button>
                {editingMcpName !== undefined && (
                  <button style={CSS.actionBtn} onClick={() => { setEditingMcpName(undefined); setMcpName(''); setMcpCommand(''); setMcpArgs(''); setMcpEnv(''); setMcpUrl(''); setMcpHeaders('') }}>取消</button>
                )}
              </div>
            </div>
            <div style={CSS.scrollBox}>
              {state.mcpServers.length === 0
                ? <div style={CSS.empty}>暂无 MCP 服务器</div>
                : state.mcpServers.map((server) => (
                  <div key={server.serverName} style={CSS.card}>
                    <div style={CSS.cardTop}>
                      <div style={CSS.name}>{server.serverName}</div>
                      <span style={{ ...CSS.badge, ...(server.enabled ? CSS.badgeEnabled : CSS.badgeDisabled) }}>
                        {server.enabled ? '启用' : '停用'}
                      </span>
                    </div>
                    <div style={CSS.desc}>
                      {server.transport}{server.transport === 'stdio' ? ` · ${server.command ?? ''}` : ` · ${server.url ?? ''}`}
                      {' · '}{server.running ? `运行中 (${server.tools?.length ?? 0} 工具)` : '未运行'}
                    </div>
                    {server.lastError !== undefined && server.lastError !== '' && (
                      <div style={{ ...CSS.error, marginTop: '4px' }}>✖ {server.lastError}</div>
                    )}
                    {(server.tools?.length ?? 0) > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {server.tools!.map((tool) => (
                          <div key={tool.name} style={{ fontSize: '11px', color: ACCENT, fontFamily: MONO, wordBreak: 'break-all' as const }}>
                            {tool.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={CSS.actions}>
                      <button style={CSS.actionBtn} onClick={() => toggleMcpServer(server.serverName, !server.enabled)}>
                        {server.enabled ? '停用' : '启用'}
                      </button>
                      <button style={CSS.actionBtn} onClick={() => testMcpServer(server.serverName)}>测试</button>
                      <button style={CSS.actionBtn} onClick={() => startEditMcpServer(server)}>编辑</button>
                      <button style={{ ...CSS.actionBtn, ...CSS.dangerBtn }} onClick={() => removeMcpServer(server.serverName)}>删除</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── Tab: global background & effects ──────────────── */}
        {activeTab === 'wallpaper' && (
          <>
            <div style={CSS.form}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: isDesktopSurface ? '#7ee787' : '#79c0ff' }}>
                  {isDesktopSurface ? '桌面客户端 · 全局壁纸' : '网页 · 全局壁纸'}
                </span>
                <button style={{ ...CSS.actionBtn, ...CSS.dangerBtn }} onClick={resetBackground}>重置</button>
              </div>
              <div onClick={() => { const d = { ...bgDraft, enabled: !bgDraft.enabled }; setBgDraft(d); applyBackground(d); void backgroundClient.save(d) }}
                role="switch" aria-checked={bgDraft.enabled}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${bgDraft.enabled ? '#238636' : '#30363d'}`, background: bgDraft.enabled ? 'rgba(35,134,54,0.22)' : '#161b22' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: bgDraft.enabled ? '#7ee787' : '#8b949e' }}>启用壁纸</span>
                <span style={{ flex: 1 }} />
                <span style={{ width: '40px', height: '22px', borderRadius: '999px', background: bgDraft.enabled ? '#3fb950' : '#30363d', position: 'relative', flex: 'none', transition: 'background .15s ease' }}>
                  <span style={{ position: 'absolute', top: '2px', left: bgDraft.enabled ? 20 : 2, width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .15s ease' }} />
                </span>
              </div>

              <label style={CSS.fileBtn}>
                🖼 上传本地壁纸（图片 / 视频，存盘不撑爆配置）
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (f === undefined) return
                  const up = await uploadMedia(f)
                  if (up !== null) { const d = { ...bgDraft, uploadId: up.id, kind: up.kind, url: '' }; setBgDraft(d); applyBackground(d); void backgroundClient.save(d) }
                  e.target.value = ''
                }} />
              </label>
              <input style={CSS.input} placeholder="图片 URL（https://…，留空则无壁纸）" value={bgDraft.url}
                onChange={(e) => setBgDraft({ ...bgDraft, url: e.target.value })}
                onBlur={() => { if (bgDraft.url.trim() !== '') { applyBackground(bgDraft); void backgroundClient.save(bgDraft) } }}
                onKeyDown={(e) => { if (e.key === 'Enter' && bgDraft.url.trim() !== '') { applyBackground(bgDraft); void backgroundClient.save(bgDraft) } }} />

              {(bgDraft.uploadId !== '' || bgDraft.url.trim() !== '') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#58a6ff' }}>
                  <span>已选择：{bgDraft.kind === 'video' ? '🎬 视频' : '🖼 图片'}{bgDraft.uploadId !== '' ? '（本地上传）' : '（链接）'}</span>
                  <span style={{ flex: 1 }} />
                  <button style={{ ...CSS.actionBtn, ...CSS.dangerBtn }} onClick={() => { const d = { ...bgDraft, uploadId: '', url: '' }; setBgDraft(d); applyBackground(d); void backgroundClient.save(d) }}>清除</button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3' }}>样式</span>
                <div style={{ flex: 1, height: '1px', background: '#30363d' }} />
              </div>
              {bgSlider('图片透明度', 'opacity', 0, 1, 0.05)}
              {bgSlider('遮罩', 'scrim', 0, 1, 0.05)}
              {bgSlider('面板透明度', 'panelOpacity', 0, 1, 0.05)}
              {bgSlider('玻璃模糊', 'blur', 0, 40, 1)}
              {bgSlider('壁纸模糊', 'wallpaperBlur', 0, 40, 1)}

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ ...CSS.hint, width: '76px', flex: 'none' }}>铺法</span>
                {(['cover', 'contain'] as const).map((f) => (
                  <button key={f} style={{ ...CSS.actionBtn, ...(bgDraft.fit === f ? CSS.tabActive : {}) }}
                    onClick={() => updateBgLive({ fit: f })}>{f === 'cover' ? '铺满' : '适应'}</button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e6edf3' }}>输入框下方提示样式</span>
                <div style={{ flex: 1, height: '1px', background: '#30363d' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ ...CSS.hint, width: '76px', flex: 'none' }}>启用</span>
                <button style={{ ...CSS.actionBtn, ...(bgDraft.hint.enabled ? CSS.badgeEnabled : {}) }} onClick={() => updateBgLive({ hint: { ...bgDraft.hint, enabled: !bgDraft.hint.enabled } })}>
                  {bgDraft.hint.enabled ? '已启用' : '已停用'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ ...CSS.hint, width: '76px', flex: 'none' }}>颜色</span>
                <input type="color" value={bgDraft.hint.color} onChange={(e) => updateBgLive({ hint: { ...bgDraft.hint, color: e.target.value } })} style={{ flex: 'none', width: '34px', height: '26px', border: 'none', background: 'transparent', padding: 0 }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ ...CSS.hint, width: '76px', flex: 'none' }}>字号</span>
                <input type="range" min={10} max={16} step={1} value={bgDraft.hint.size} onChange={(e) => updateBgLive({ hint: { ...bgDraft.hint, size: Number(e.target.value) } })} style={{ flex: 1 }} />
                <span style={{ ...CSS.hint, width: '30px', textAlign: 'right' as const }}>{bgDraft.hint.size}px</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' as const }}>
                <span style={{ ...CSS.hint, width: '76px', flex: 'none' }}>渐变色</span>
                {GRADIENTS.map((g) => (
                  <button key={g.id} title={g.name}
                    style={{ ...CSS.actionBtn, ...(bgDraft.hint.gradient === g.id ? CSS.tabActive : {}), ...(g.css !== '' ? { backgroundImage: g.css, color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text', fontWeight: 700 } : {}) }}
                    onClick={() => updateBgLive({ hint: { ...bgDraft.hint, gradient: g.id } })}>{g.name}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Tab: conversations ───────────────────────────── */}
        {activeTab === 'chat' && (
          <>
            <div style={CSS.form}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>对话导入 / 导出</span>
                <button style={CSS.actionBtn} onClick={() => void reloadChat()} disabled={chatBusy}>刷新</button>
              </div>
              <div style={{ ...CSS.desc, lineHeight: '1.5' }}>
                可导出选中的对话，也可下拉选择某个项目工作区整体导出；导入后项目工作区名会尽量与导出端保持一致。
              </div>
              <div style={CSS.actions}>
                <button style={CSS.actionBtn} disabled={chatBusy || chatSelected.size === 0} onClick={() => void doExportChat()}>
                  导出选中（{chatSelected.size}）
                </button>
                <button style={CSS.actionBtn} disabled={chatBusy || chatProject === ''} onClick={() => void doExportProject()} title="导出该项目工作区下的全部对话，导入后可保留项目名">
                  导出整个项目
                </button>
                <select
                  style={{ ...CSS.input, maxWidth: '220px', textOverflow: 'ellipsis' }}
                  value={chatProject}
                  onChange={(e) => setChatProject(e.target.value)}
                  disabled={chatProjects.length === 0}
                  title="选择要整体导出的项目工作区"
                >
                  {chatProjects.length === 0 && <option value="">（无项目）</option>}
                  {chatProjects.map((p) => (
                    <option key={p.key} value={p.key}>{p.name}（{chatRows.filter((r) => r.projectKey === p.key).length} 个对话）</option>
                  ))}
                </select>
                <button style={{ ...CSS.actionBtn, ...CSS.dangerBtn }} disabled={chatBusy || chatSelected.size === 0} onClick={() => void doDeleteChat()}>
                  删除选中（{chatSelected.size}）
                </button>
                <label style={CSS.fileBtn}>
                  {chatBusy ? '处理中…' : '选择 zip 导入'}
                  <input type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => void onChatFile(e.target.files?.[0])} />
                </label>
                <input style={CSS.input} placeholder="目标项目 key（留空=保持原项目）" value={chatTarget} onChange={(e) => setChatTarget(e.target.value)} />
              </div>
              {chatMsg !== '' && <div style={CSS.hint}>{chatMsg}</div>}
            </div>
            <div style={CSS.scrollBox}>
              {chatRows.length === 0
                ? <div style={CSS.empty}>暂无对话</div>
                : chatRows.map((row) => {
                    const id = `${row.projectKey}/${row.sessionId}`
                    const sel = chatSelected.has(id)
                    return (
                      <div key={id} style={CSS.card}>
                        <div style={CSS.cardTop}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <input type="checkbox" checked={sel} onChange={() => toggleChatSel(id)} style={{ flex: 'none' }} />
                            <div style={{ ...CSS.name, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }} title={row.title || id}>
                              {row.title || '未命名对话'}
                            </div>
                          </div>
                          <span style={{ ...CSS.badge, ...CSS.badgeDisabled, flex: 'none', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.cwd || row.projectKey}>
                            {row.cwd ? row.cwd.split(/[\\/]/).filter(Boolean).pop() : row.projectKey}
                          </span>
                        </div>
                        <div style={{ ...CSS.desc, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.cwd || row.projectKey} · {new Date(row.mtime).toLocaleString()} · {row.size >= 1024 ? (row.size / 1024).toFixed(1) + ' KB' : row.size + ' B'}
                        </div>
                      </div>
                    )
                  })}
            </div>
          </>
        )}

                        {/* ── Tab: usage stats ─────────────────────────────── */}
        {activeTab === 'stats' && (
          <>
            <div style={CSS.form}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  使用统计
                  {statsUpdatedAt > 0 && (
                    <span style={{ ...CSS.hint, marginLeft: '8px', fontWeight: 400 }}>
                      自动刷新 · 上次更新 {new Date(statsUpdatedAt).toLocaleTimeString()}
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {(['all', '30d', '7d', 'today'] as const).map((r) => (
                    <button key={r} style={{ ...CSS.actionBtn, ...(statsRange === r ? CSS.tabActive : {}) }} onClick={() => changeStatsRange(r)}>
                      {r === 'all' ? '全部' : r === '30d' ? '30天' : r === '7d' ? '7天' : '今天'}
                    </button>
                  ))}
                  <button style={CSS.actionBtn} onClick={() => void reloadStats()}>刷新</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                <div style={CSS.card}><div style={CSS.hint}>会话</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats?.totals.sessions ?? '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>轮 / 步骤</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? `${stats.totals.turns} / ${stats.totals.steps}` : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>LLM / 工具时长</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? `${fmtDuration(stats.totals.llmMs)} / ${fmtDuration(stats.totals.toolMs)}` : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>输入 Token</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? fmtTokens(stats.totals.inputTokens) : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>输出 Token</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? fmtTokens(stats.totals.outputTokens) : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>缓存读 / 写</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? `${fmtTokens(stats.totals.cacheReadTokens)} / ${fmtTokens(stats.totals.cacheWriteTokens)}` : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>缓存命中率</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? fmtPct(stats.totals.cacheHitRate) : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>总成本</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? fmtUsd(stats.totals.costUsd) : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>平均首Token</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? fmtDuration(stats.totals.avgTtftMs) : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>输出吞吐</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? `${stats.totals.tokPerSec.toFixed(0)} tok/s` : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>每会话平均</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats ? `${stats.totals.perSessionSteps.toFixed(1)} 步` : '—'}</div></div>
                <div style={CSS.card}><div style={CSS.hint}>活跃天数</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#e6edf3' }}>{stats?.totals.activeDays ?? '—'}</div></div>
              </div>
              {stats !== null && (stats.byDay.length > 0 || stats.byHour.length > 0) && (
                <TrendChart byDay={stats.byHour.length > 0
                  ? stats.byHour.map((h) => ({
                      date: `${String(h.hour).padStart(2, '0')}:00`,
                      steps: h.steps,
                      outputTokens: h.outputTokens,
                      inputTokens: h.inputTokens,
                      cacheReadTokens: h.cacheReadTokens,
                      cacheWriteTokens: h.cacheWriteTokens,
                    }))
                  : stats.byDay} />
              )}
            </div>
            <div style={CSS.scrollBox}>
              {(stats?.byProject ?? []).length === 0 && (stats?.recent ?? []).length === 0
                ? <div style={CSS.empty}>暂无使用记录</div>
                : <></>}
              {(stats?.recent ?? []).length > 0 && (
                <div>
                  <div style={{ ...CSS.hint, marginBottom: '4px' }}>请求日志（最近 {stats!.recent.length}）</div>
                  {stats!.recent.map((r) => (
                    <div key={r.time + '-' + r.provider} style={CSS.card}>
                      <div style={CSS.cardTop}>
                        <div style={{ ...CSS.name, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{r.provider}</div>
                        <span style={{ ...CSS.badge, ...(r.status === 'done' ? CSS.badgeEnabled : CSS.badgeInstalled) }}>{r.status === 'done' ? '完成' : '进行中'}</span>
                      </div>
                      <div style={CSS.desc}>
                        {new Date(r.time).toLocaleString()} · {fmtTokens(r.inputTokens)} in / {fmtTokens(r.outputTokens)} out · R{fmtTokens(r.cacheReadTokens)}·W{fmtTokens(r.cacheWriteTokens)} · 命中 {fmtPct(r.cacheHitRate)} · {fmtUsd(r.costUsd)} · {fmtDuration(r.latencyMs)} / 首字 {fmtDuration(r.firstTokenMs)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(stats?.byProject ?? []).length > 0 && (
                <div>
                  <div style={{ ...CSS.hint, marginBottom: '4px' }}>Provider / 项目统计</div>
                  {stats!.byProject.slice(0, 20).map((p) => (
                    <div key={p.project} style={CSS.card}>
                      <div style={CSS.cardTop}>
                        <div style={{ ...CSS.name, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{p.project}</div>
                        <span style={{ ...CSS.badge, ...CSS.badgeDisabled }}>{p.sessions} 会话</span>
                      </div>
                      <div style={CSS.desc}>
                        {p.steps} 步 · {fmtTokens(p.inputTokens)} in / {fmtTokens(p.outputTokens)} out · R{fmtTokens(p.cacheReadTokens)} · 命中 {fmtPct(p.cacheHitRate)} · {fmtUsd(p.costUsd)} · 延迟 {p.avgLatencyMs.toFixed(0)}ms · 成功 {p.successRate.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(stats?.byModel ?? []).length > 0 && (
                <div>
                  <div style={{ ...CSS.hint, marginBottom: '4px' }}>模型统计</div>
                  {stats!.byModel.slice(0, 20).map((m) => (
                    <div key={m.model} style={CSS.card}>
                      <div style={CSS.cardTop}>
                        <div style={{ ...CSS.name, whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{m.model}</div>
                        <span style={{ ...CSS.badge, ...CSS.badgeDisabled }}>{m.sessions} 会话</span>
                      </div>
                      <div style={CSS.desc}>{m.steps} 步 · {fmtTokens(m.inputTokens)} in / {fmtTokens(m.outputTokens)} out · 命中 {fmtPct(m.cacheHitRate)} · {fmtUsd(m.costUsd)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
