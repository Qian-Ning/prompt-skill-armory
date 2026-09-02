/**
 * Prompt-SkillArmory management page.
 *
 * Three tabs within the settings dialog's fixed width: Prompts / Skills /
 * Agent Presets. The Skills tab is the single home for skills — both the ones
 * installed through this panel and the ones scanned from the local skill
 * roots — merged into one list with full management (add / edit / toggle /
 * remove / invoke hint). A CLI entry box offers direct command installation.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */

import { useEffect, useState } from 'react'
import type { CSSProperties, JSX } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SwitchbladeKey } from './locales.ts'
import type { McpServerRow, SwitchbladeSectionInjected, SwitchbladeSectionState } from './store.ts'
import { backgroundClient, DEFAULT_BACKGROUND, applyBackground, uploadMedia, isDesktopSurface, GRADIENTS, type BackgroundSettings } from './background.ts'
import { listConversations, exportConversations, downloadExport, importConversations, deleteConversations, type ConversationRow } from './conversations.ts'

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

type TabKey = 'prompts' | 'skills' | 'mcp' | 'wallpaper' | 'presets' | 'chat'

/** Bump with every release; keep in sync with package.json version + CHANGELOG. */
const ARMORY_VERSION = '0.8.2'

/** Render the Prompt-SkillArmory management page. */
export function SwitchbladeSection(props: SwitchbladeSectionProps): JSX.Element {
  const {
    useSwitchblade, t, load,
    setDefaultPreset, addPrompt, updatePrompt, setPromptEnabled, setDefaultPrompt, deletePrompt,
    installSkill, updateSkill, setSkillEnabled, uninstallSkill,
    addMcpServer, updateMcpServer, toggleMcpServer, removeMcpServer, testMcpServer,
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
  const [presetQuery, setPresetQuery] = useState('')
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

  const setDefault = (id: string): void => {
    void setDefaultPreset(id)
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
  const [chatBusy, setChatBusy] = useState(false)
  const [chatMsg, setChatMsg] = useState('')

  const reloadChat = async (): Promise<void> => {
    setChatRows(await listConversations())
  }

  useEffect(() => { void reloadChat() }, [])

  const toggleChatSel = (id: string): void => {
    setChatSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const doExportChat = async (): Promise<void> => {
    setChatBusy(true); setChatMsg('')
    const name = await exportConversations([...chatSelected])
    if (name === null) { setChatMsg('导出失败'); setChatBusy(false); return }
    await downloadExport(name)
    setChatMsg(`已导出 ${name}`)
    setChatBusy(false)
  }

  const onChatFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) return
    setChatBusy(true); setChatMsg('')
    const n = await importConversations(file, chatTarget.trim() || undefined)
    setChatMsg(n === null ? '导入失败' : `已导入 ${n} 个对话，重启客户端后生效`)
    setChatBusy(false)
  }

  const doDeleteChat = async (): Promise<void> => {
    const ids = [...chatSelected]
    if (ids.length === 0) return
    if (!window.confirm(`确定删除选中的 ${ids.length} 个对话吗？此操作不可恢复。`)) return
    setChatBusy(true); setChatMsg('')
    const n = await deleteConversations(ids)
    if (n === null) { setChatMsg('删除失败'); setChatBusy(false); return }
    setChatSelected(new Set())
    setChatMsg(`已删除 ${n} 个对话`)
    await reloadChat()
    setChatBusy(false)
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
  const presetRows = state.presets.map((p) => ({
    id: p.id, name: p.name ?? p.id, desc: p.description ?? p.trust,
    state: p.isDefault ? ('enabled' as const) : ('installed' as const),
    presetId: p.id, isDefault: p.isDefault,
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
  const filteredPresets = presetRows.filter((r) => match(r, presetQuery))
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
        <button style={{ ...CSS.tab, ...(activeTab === 'presets' ? CSS.tabActive : {}) }} onClick={() => setActiveTab('presets')}>
          {t('agentPresetsTitle')} ({state.status === 'loading' ? '…' : presetRows.length})
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

        {/* ── Tab: presets ──────────────────────────────────────── */}
        {activeTab === 'presets' && (
          <>
            <div style={CSS.colHeader}>{t('agentPresetsTitle')} ({presetRows.length})</div>
            <input style={CSS.searchInput} placeholder={t('searchPlaceholder')} value={presetQuery} onChange={(e) => setPresetQuery(e.target.value)} />
            <div style={CSS.scrollBox}>
              {filteredPresets.length === 0
                ? <div style={CSS.empty}>{t('empty')}</div>
                : filteredPresets.map((row) => (
                  <div key={row.id} style={CSS.card}>
                    <div style={CSS.cardTop}>
                      <div style={CSS.name}>{row.isDefault ? '★ ' : ''}{row.name}</div>
                      <span style={{ ...CSS.badge, ...badge(row.state) }}>{label(row.state)}</span>
                    </div>
                    <div style={CSS.desc}>{row.desc}</div>
                    {!row.isDefault && <button style={CSS.actionBtn} onClick={() => setDefault(row.presetId!)}>{t('setDefault')}</button>}
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
                勾选要导出的对话，打成一个 zip；在另一台机器选该 zip 导入即可还原（含附件与工作区）。
              </div>
              <div style={CSS.actions}>
                <button style={CSS.actionBtn} disabled={chatBusy || chatSelected.size === 0} onClick={() => void doExportChat()}>
                  导出选中（{chatSelected.size}）
                </button>
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
                          <span style={{ ...CSS.badge, ...CSS.badgeDisabled, flex: 'none' }}>{row.cwd ? row.cwd.split(/[\\/]/).filter(Boolean).pop() : row.projectKey}</span>
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
      </div>
    </div>
  )
}
