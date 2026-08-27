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

const PHOSPHOR = '#00ff9c'
const DAMNED = '#ff2b4b'
const AMBER = '#ffb000'
const GRAY = '#0f3d2c'

const CSS: Record<string, CSSProperties> = {
  root: {
    fontFamily: "'JetBrains Mono','IBM Plex Mono',ui-monospace,monospace",
    background: '#04070a',
    color: PHOSPHOR,
    padding: '16px',
    border: `1px solid ${GRAY}`,
    boxShadow: 'inset 0 0 40px rgba(0,255,156,.06), 0 0 18px rgba(0,255,156,.15)',
    borderRadius: '2px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${GRAY}`,
    paddingBottom: '8px',
    marginBottom: '8px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '1px',
    textShadow: `0 0 8px ${PHOSPHOR}`,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  titleAccent: {
    color: DAMNED,
    textShadow: `0 0 8px ${DAMNED}`,
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    borderBottom: `1px solid ${GRAY}`,
    marginBottom: '12px',
    flexWrap: 'wrap' as const,
  },
  tab: {
    background: 'transparent',
    border: `1px solid transparent`,
    borderBottom: 'none',
    color: '#5fb08c',
    font: 'inherit',
    fontSize: '12px',
    letterSpacing: '0.5px',
    padding: '6px 10px',
    cursor: 'pointer',
  },
  tabActive: {
    color: PHOSPHOR,
    borderColor: GRAY,
    background: 'rgba(0,40,24,.1)',
    textShadow: `0 0 6px ${PHOSPHOR}`,
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    alignItems: 'start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    minWidth: '0',
  },
  colHeader: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: AMBER,
    borderBottom: `1px solid ${GRAY}`,
    paddingBottom: '6px',
    marginBottom: '2px',
  },
  card: {
    border: `1px solid ${GRAY}`,
    background: 'rgba(0,40,24,.08)',
    padding: '8px 10px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  name: {
    fontSize: '12px',
    fontWeight: 700,
    wordBreak: 'break-all' as const,
  },
  badge: {
    fontSize: '9px',
    letterSpacing: '1px',
    padding: '2px 6px',
    border: '1px solid currentColor',
    flex: 'none',
  },
  badgeEnabled: { color: PHOSPHOR },
  badgeDisabled: { color: DAMNED },
  badgeInstalled: { color: AMBER },
  desc: {
    fontSize: '11px',
    color: '#5fb08c',
    marginTop: '4px',
  },
  invokeHint: {
    fontSize: '10px',
    color: '#3f8f6a',
    marginTop: '4px',
    fontStyle: 'italic',
  },
  empty: {
    fontSize: '11px',
    color: GRAY,
    padding: '8px 0',
  },
  error: {
    color: DAMNED,
    fontSize: '11px',
    padding: '8px 0',
  },
  refreshBtn: {
    background: 'transparent',
    border: `1px solid ${GRAY}`,
    color: PHOSPHOR,
    font: 'inherit',
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    padding: '4px 10px',
    cursor: 'pointer',
  },
  actionBtn: {
    background: 'transparent',
    border: `1px solid ${GRAY}`,
    color: PHOSPHOR,
    font: 'inherit',
    fontSize: '10px',
    letterSpacing: '1px',
    padding: '2px 8px',
    cursor: 'pointer',
    marginTop: '6px',
  },
  dangerBtn: {
    borderColor: DAMNED,
    color: DAMNED,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '10px',
    padding: '10px',
    border: `1px solid ${GRAY}`,
    background: 'rgba(0,40,24,.05)',
  },
  input: {
    background: '#04070a',
    border: `1px solid ${GRAY}`,
    color: PHOSPHOR,
    font: 'inherit',
    fontSize: '11px',
    padding: '6px 8px',
  },
  textarea: {
    background: '#04070a',
    border: `1px solid ${GRAY}`,
    color: PHOSPHOR,
    font: 'inherit',
    fontSize: '11px',
    padding: '6px 8px',
    minHeight: '80px',
    resize: 'vertical' as const,
  },
  actions: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  hint: {
    color: GRAY,
    fontSize: '9px',
    letterSpacing: '1px',
  },
  scrollBox: {
    maxHeight: '520px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    paddingRight: '4px',
  },
  searchInput: {
    background: '#04070a',
    border: `1px solid ${GRAY}`,
    color: '#5fb08c',
    font: 'inherit',
    fontSize: '10px',
    padding: '5px 8px',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  fileBtn: {
    background: 'transparent',
    border: `1px dashed ${GRAY}`,
    color: '#5fb08c',
    font: 'inherit',
    fontSize: '10px',
    letterSpacing: '1px',
    padding: '8px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  cliBox: {
    border: `1px dashed ${AMBER}`,
    padding: '8px 10px',
    fontSize: '10px',
    color: '#5fb08c',
    background: 'rgba(255,176,0,.04)',
  },
  versionBadge: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1px',
    color: PHOSPHOR,
    border: `1px solid ${PHOSPHOR}`,
    borderRadius: '3px',
    padding: '1px 6px',
    marginLeft: '6px',
    background: 'rgba(0,255,156,.08)',
    textShadow: `0 0 6px ${PHOSPHOR}`,
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

      {/* ── Tab: prompts ─────────────────────────────────────── */}
      {activeTab === 'prompts' && (
        <div style={CSS.columns}>
          <div style={CSS.column}>
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
          </div>
          <div style={CSS.column}>
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
          </div>
        </div>
      )}

      {/* ── Tab: skills (merged managed + scanned) ───────────── */}
      {activeTab === 'skills' && (
        <div style={CSS.columns}>
          <div style={CSS.column}>
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
            {/* CLI entry */}
            <div style={CSS.cliBox}>
              <div style={{ marginBottom: '4px' }}>{t('cliHint')}</div>
              <code style={{ fontSize: '10px', color: PHOSPHOR }}>/armory-skill-dir &lt;目录&gt;</code><br />
              <code style={{ fontSize: '10px', color: PHOSPHOR }}>/armory-install-zip &lt;zip路径&gt;</code>
            </div>
          </div>
          <div style={CSS.column}>
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
          </div>
        </div>
      )}

      {/* ── Tab: presets ──────────────────────────────────────── */}
      {activeTab === 'presets' && (
        <div style={CSS.columns}>
          <div style={CSS.column}>
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
          </div>
        </div>
      )}
    </div>
  )
}
