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
import type { SwitchbladeSectionInjected, SwitchbladeSectionState } from './store.ts'

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
const SURFACE2 = '#1c2128'    // raised surface
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
    minHeight: '480px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    padding: '14px',
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
    minHeight: '80px',
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
    gap: '10px',
    paddingRight: '6px',
    minHeight: '0',
  },
  card: {
    border: `1px solid ${BORDER}`,
    background: SURFACE,
    borderRadius: '10px',
    padding: '12px 14px',
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

type TabKey = 'prompts' | 'skills' | 'presets'

/** Bump with every release; keep in sync with package.json version + CHANGELOG. */
const ARMORY_VERSION = '0.4.6'

/** Render the Prompt-SkillArmory management page. */
export function SwitchbladeSection(props: SwitchbladeSectionProps): JSX.Element {
  const {
    useSwitchblade, t, load,
    setDefaultPreset, addPrompt, updatePrompt, setPromptEnabled, setDefaultPrompt, deletePrompt,
    installSkill, updateSkill, setSkillEnabled, uninstallSkill,
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

  useEffect(() => {
    void load()
  }, [load])

  const refresh = (): void => {
    void load()
  }

  const setDefault = (id: string): void => {
    void setDefaultPreset(id)
  }

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
          <BookIcon size={16} /> <span style={CSS.titleAccent}>Prompt•Skill</span>-Armory
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
              <code style={{ fontSize: '11px', color: ACCENT, fontFamily: MONO }}>/armory-skill-dir &lt;目录&gt;</code><br />
              <code style={{ fontSize: '11px', color: ACCENT, fontFamily: MONO }}>/armory-install-zip &lt;zip路径&gt;</code>
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
      </div>
    </div>
  )
}
