import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
/* ── Design tokens ────────────────────────────────────────────────
 * Modern dark UI (Linear / GitHub Dark / Raycast language):
 * low-saturation surfaces, one soft accent, pill badges, generous
 * radius + spacing, system sans for text, mono only for code.
 * ──────────────────────────────────────────────────────────────── */
const BG = '#0d1117'; // root background
const SURFACE = '#161b22'; // card / form surface
const BORDER = '#30363d'; // hairline border
const TEXT = '#e6edf3'; // primary text
const TEXT_MUTED = '#8b949e'; // secondary text
const ACCENT = '#58a6ff'; // brand accent (soft blue)
const SUCCESS = '#3fb950'; // enabled / success
const DANGER = '#f85149'; // danger / delete
const WARN = '#d29922'; // installed / warning
const MONO = "'JetBrains Mono',ui-monospace,'SF Mono',Consolas,monospace";
const SANS = "-apple-system,'Segoe UI','Inter',Roboto,'Helvetica Neue',sans-serif";
const CSS = {
    root: {
        fontFamily: SANS,
        background: BG,
        color: TEXT,
        padding: '20px',
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box',
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
        flexWrap: 'wrap',
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
        flexDirection: 'column',
        gap: '12px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
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
        resize: 'vertical',
        outline: 'none',
        transition: 'border-color .15s ease',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
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
        textAlign: 'center',
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
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color .15s ease',
    },
    scrollBox: {
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
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
        wordBreak: 'break-all',
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
        textAlign: 'center',
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
};
/** Open-book glyph. */
function BookIcon({ size = 16 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", style: { flex: 'none' }, "aria-hidden": "true", children: [_jsx("path", { d: "M7.5 3.2C6.2 2.4 4.6 2.2 2.8 2.5c-.5.08-.8.5-.8 1v7.6c0 .4.3.7.7.7 1.7-.2 3.2.1 4.8 1V3.2z", fill: "currentColor", opacity: "0.55" }), _jsx("path", { d: "M8.5 3.2c1.3-.8 2.9-1 4.7-.7.5.08.8.5.8 1v7.6c0 .4-.3.7-.7.7-1.7-.2-3.2.1-4.8 1V3.2z", fill: "currentColor", opacity: "0.85" }), _jsx("path", { d: "M8 3.2v10.3", stroke: "currentColor", strokeWidth: "0.7" })] }));
}
/** Bump with every release; keep in sync with package.json version + CHANGELOG. */
const ARMORY_VERSION = '0.5.6';
/** Render the Prompt-SkillArmory management page. */
export function SwitchbladeSection(props) {
    const { useSwitchblade, t, load, setDefaultPreset, addPrompt, updatePrompt, setPromptEnabled, setDefaultPrompt, deletePrompt, installSkill, updateSkill, setSkillEnabled, uninstallSkill, } = props;
    const state = useSwitchblade((snapshot) => snapshot);
    const [promptName, setPromptName] = useState('');
    const [promptDesc, setPromptDesc] = useState('');
    const [promptContent, setPromptContent] = useState('');
    const [skillName, setSkillName] = useState('');
    const [skillDesc, setSkillDesc] = useState('');
    const [skillContent, setSkillContent] = useState('');
    const [busy, setBusy] = useState(false);
    const [pickedFile, setPickedFile] = useState('');
    const [promptQuery, setPromptQuery] = useState('');
    const [skillQuery, setSkillQuery] = useState('');
    const [presetQuery, setPresetQuery] = useState('');
    const [activeTab, setActiveTab] = useState('prompts');
    const [editingPromptId, setEditingPromptId] = useState();
    const [editingSkillName, setEditingSkillName] = useState();
    useEffect(() => {
        void load();
    }, [load]);
    const refresh = () => {
        void load();
    };
    const setDefault = (id) => {
        void setDefaultPreset(id);
    };
    /** Read a local skill .md file into the import form. */
    const onSkillFile = (file) => {
        if (file === undefined)
            return;
        setPickedFile(file.name);
        void file.text().then((text) => {
            const first = text.split('\n')[0]?.trim() ?? '';
            const nameMatch = /^#\s+([a-z0-9][a-z0-9-]*)$/i.exec(first);
            if (nameMatch !== null)
                setSkillName(nameMatch[1]?.toLowerCase() ?? '');
            setSkillContent(text.trim());
            const descLine = text.split('\n').find((l) => l.startsWith('> '));
            if (descLine !== undefined)
                setSkillDesc(descLine.slice(2).trim());
        }).catch((error) => console.error('[switchblade] read skill file failed', error));
    };
    const submitPrompt = () => {
        if (promptName.trim() === '' || promptContent.trim() === '')
            return;
        setBusy(true);
        const action = editingPromptId !== undefined
            ? updatePrompt(editingPromptId, { name: promptName, description: promptDesc, content: promptContent })
            : addPrompt({ name: promptName, description: promptDesc, content: promptContent });
        void action
            .catch((error) => console.error('[switchblade] prompt save failed', error))
            .finally(() => {
            setBusy(false);
            setPromptName('');
            setPromptDesc('');
            setPromptContent('');
            setEditingPromptId(undefined);
        });
    };
    const startEditPrompt = (row) => {
        setEditingPromptId(row.promptId);
        setPromptName(row.name);
        setPromptDesc(row.desc);
        setPromptContent(row.content ?? '');
    };
    const togglePrompt = (id, enabled) => {
        void setPromptEnabled(id, enabled).catch((error) => console.error('[switchblade] toggle failed', error));
    };
    const markDefault = (id) => {
        void setDefaultPrompt(id).catch((error) => console.error('[switchblade] setDefault failed', error));
    };
    const removePrompt = (id) => {
        void deletePrompt(id).catch((error) => console.error('[switchblade] delete failed', error));
    };
    const submitSkill = () => {
        if (skillName.trim() === '' || skillContent.trim() === '')
            return;
        setBusy(true);
        const action = editingSkillName !== undefined
            ? updateSkill(editingSkillName, { name: skillName, description: skillDesc, content: skillContent })
            : installSkill({ name: skillName, description: skillDesc, content: skillContent });
        void action
            .catch((error) => console.error('[switchblade] skill save failed', error))
            .finally(() => {
            setBusy(false);
            setSkillName('');
            setSkillDesc('');
            setSkillContent('');
            setEditingSkillName(undefined);
        });
    };
    const startEditSkill = (row) => {
        const found = state.installedSkills.find((s) => s.name === row.installedName);
        setEditingSkillName(row.installedName);
        setSkillName(row.name);
        setSkillDesc(row.desc);
        setSkillContent(found?.content ?? '');
    };
    const toggleSkill = (name, enabled) => {
        void setSkillEnabled(name, enabled).catch((error) => console.error('[switchblade] toggle skill failed', error));
    };
    const removeSkill = (name) => {
        void uninstallSkill(name).catch((error) => console.error('[switchblade] uninstall failed', error));
    };
    /** Adopt a scanned (local) skill into the managed list. */
    const adoptSkill = (name) => {
        const found = state.skills.find((s) => s.name === name);
        if (found === undefined)
            return;
        void installSkill({ name: found.name, description: found.description, content: `# ${found.name}\n\n${found.description}` })
            .catch((error) => console.error('[switchblade] adopt skill failed', error));
    };
    const promptRows = state.prompts.map((p) => ({
        id: p.id, name: p.name, desc: p.description, state: p.enabled ? 'enabled' : 'disabled',
        promptId: p.id, isDefault: p.isDefault, content: p.content, promptEnabled: p.enabled,
    }));
    const presetRows = state.presets.map((p) => ({
        id: p.id, name: p.name ?? p.id, desc: p.description ?? p.trust,
        state: p.isDefault ? 'enabled' : 'installed',
        presetId: p.id, isDefault: p.isDefault,
    }));
    // Merge managed + scanned skills into ONE list, managed first.
    const managedNames = new Set(state.installedSkills.map((s) => s.name));
    const managedRows = state.installedSkills.map((s) => ({
        key: `m-${s.name}`, name: s.name, desc: s.description,
        state: s.enabled ? 'enabled' : 'disabled',
        installedName: s.name, skillEnabled: s.enabled, source: 'managed',
    }));
    const scannedRows = state.skills
        .filter((s) => !managedNames.has(s.name))
        .map((s) => ({
        key: `s-${s.name}`, name: s.name, desc: s.description,
        state: 'installed', installedName: s.name, skillEnabled: false, source: 'scanned',
    }));
    const allSkillRows = [...managedRows, ...scannedRows];
    const match = (row, q) => {
        const query = q.trim().toLowerCase();
        if (query === '')
            return true;
        return row.name.toLowerCase().includes(query) || row.desc.toLowerCase().includes(query);
    };
    const filteredPrompts = promptRows.filter((r) => match(r, promptQuery));
    const filteredPresets = presetRows.filter((r) => match(r, presetQuery));
    const filteredSkills = allSkillRows.filter((r) => match(r, skillQuery));
    const badge = (state) => (state === 'enabled' ? CSS.badgeEnabled : state === 'disabled' ? CSS.badgeDisabled : CSS.badgeInstalled);
    const label = (state) => (state === 'enabled' ? t('enabled') : state === 'disabled' ? t('disabled') : t('installed'));
    return (_jsxs("div", { style: CSS.root, children: [_jsxs("div", { style: CSS.head, children: [_jsxs("div", { style: CSS.title, children: [_jsx(BookIcon, { size: 16 }), " ", _jsx("span", { style: CSS.titleAccent, children: "Prompt\u2022Skill" }), "-Armory", _jsxs("span", { style: CSS.versionBadge, children: ["v", ARMORY_VERSION] })] }), _jsx("button", { style: CSS.refreshBtn, onClick: refresh, children: t('refresh') })] }), state.status === 'error' && _jsxs("div", { style: CSS.error, children: ["\u2716 ", t('loadFailed'), ": ", state.message] }), _jsxs("div", { style: CSS.tabs, children: [_jsxs("button", { style: { ...CSS.tab, ...(activeTab === 'prompts' ? CSS.tabActive : {}) }, onClick: () => setActiveTab('prompts'), children: [t('promptsTitle'), " (", state.status === 'loading' ? '…' : promptRows.length, ")"] }), _jsxs("button", { style: { ...CSS.tab, ...(activeTab === 'skills' ? CSS.tabActive : {}) }, onClick: () => setActiveTab('skills'), children: [t('installSkill'), " (", state.status === 'loading' ? '…' : allSkillRows.length, ")"] }), _jsxs("button", { style: { ...CSS.tab, ...(activeTab === 'presets' ? CSS.tabActive : {}) }, onClick: () => setActiveTab('presets'), children: [t('agentPresetsTitle'), " (", state.status === 'loading' ? '…' : presetRows.length, ")"] })] }), _jsxs("div", { style: CSS.content, children: [activeTab === 'prompts' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: CSS.form, children: [_jsx("input", { style: CSS.input, placeholder: t('promptNamePlaceholder'), value: promptName, onChange: (e) => setPromptName(e.target.value) }), _jsx("input", { style: CSS.input, placeholder: t('promptDescPlaceholder'), value: promptDesc, onChange: (e) => setPromptDesc(e.target.value) }), _jsx("textarea", { style: CSS.textarea, placeholder: t('promptContentPlaceholder'), value: promptContent, onChange: (e) => setPromptContent(e.target.value) }), _jsxs("div", { style: CSS.actions, children: [_jsx("button", { style: CSS.actionBtn, disabled: busy, onClick: submitPrompt, children: editingPromptId !== undefined ? t('save') : t('addPrompt') }), editingPromptId !== undefined && (_jsx("button", { style: CSS.actionBtn, onClick: () => { setEditingPromptId(undefined); setPromptName(''); setPromptDesc(''); setPromptContent(''); }, children: t('cancel') }))] })] }), _jsx("input", { style: CSS.searchInput, placeholder: t('searchPlaceholder'), value: promptQuery, onChange: (e) => setPromptQuery(e.target.value) }), _jsx("div", { style: CSS.scrollBox, children: filteredPrompts.length === 0
                                    ? _jsx("div", { style: CSS.empty, children: t('empty') })
                                    : filteredPrompts.map((row) => (_jsxs("div", { style: CSS.card, children: [_jsxs("div", { style: CSS.cardTop, children: [_jsxs("div", { style: CSS.name, children: [row.isDefault ? '★ ' : '', row.name] }), _jsx("span", { style: { ...CSS.badge, ...row.state === 'enabled' ? CSS.badgeEnabled : CSS.badgeDisabled }, children: row.state === 'enabled' ? t('enabled') : t('disabled') })] }), _jsx("div", { style: CSS.desc, children: row.desc || row.content?.slice(0, 80) }), _jsxs("div", { style: CSS.actions, children: [!row.isDefault && _jsx("button", { style: CSS.actionBtn, onClick: () => markDefault(row.promptId), children: t('setDefault') }), _jsx("button", { style: CSS.actionBtn, onClick: () => togglePrompt(row.promptId, !row.promptEnabled), children: row.state === 'enabled' ? t('disable') : t('enable') }), _jsx("button", { style: CSS.actionBtn, onClick: () => startEditPrompt(row), children: t('edit') }), _jsx("button", { style: { ...CSS.actionBtn, ...CSS.dangerBtn }, onClick: () => removePrompt(row.promptId), children: t('delete') })] })] }, row.id))) })] })), activeTab === 'skills' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: CSS.form, children: [_jsxs("label", { style: CSS.fileBtn, children: [pickedFile !== '' ? `📄 ${pickedFile}` : t('pickSkillFile'), _jsx("input", { type: "file", accept: ".md,.markdown,text/markdown,text/plain", style: { display: 'none' }, onChange: (e) => onSkillFile(e.target.files?.[0]) })] }), _jsx("input", { style: CSS.input, placeholder: t('skillNamePlaceholder'), value: skillName, onChange: (e) => setSkillName(e.target.value) }), _jsx("input", { style: CSS.input, placeholder: t('skillDescPlaceholder'), value: skillDesc, onChange: (e) => setSkillDesc(e.target.value) }), _jsx("textarea", { style: CSS.textarea, placeholder: t('skillContentPlaceholder'), value: skillContent, onChange: (e) => setSkillContent(e.target.value) }), _jsxs("div", { style: CSS.actions, children: [_jsx("button", { style: CSS.actionBtn, disabled: busy, onClick: submitSkill, children: editingSkillName !== undefined ? t('save') : t('addSkill') }), editingSkillName !== undefined && (_jsx("button", { style: CSS.actionBtn, onClick: () => { setEditingSkillName(undefined); setSkillName(''); setSkillDesc(''); setSkillContent(''); }, children: t('cancel') }))] })] }), _jsxs("div", { style: CSS.cliBox, children: [_jsx("div", { style: { marginBottom: '4px' }, children: t('cliHint') }), _jsx("code", { style: { fontSize: '11px', color: ACCENT, fontFamily: MONO }, children: "/armory-skill-dir <\u76EE\u5F55>" }), _jsx("br", {}), _jsx("code", { style: { fontSize: '11px', color: ACCENT, fontFamily: MONO }, children: "/armory-install-zip <zip\u8DEF\u5F84>" })] }), _jsx("input", { style: CSS.searchInput, placeholder: t('searchPlaceholder'), value: skillQuery, onChange: (e) => setSkillQuery(e.target.value) }), _jsx("div", { style: CSS.scrollBox, children: filteredSkills.length === 0
                                    ? _jsx("div", { style: CSS.empty, children: t('empty') })
                                    : filteredSkills.map((row) => (_jsxs("div", { style: CSS.card, children: [_jsxs("div", { style: CSS.cardTop, children: [_jsx("div", { style: CSS.name, children: row.name }), _jsx("span", { style: { ...CSS.badge, ...badge(row.state) }, children: label(row.state) })] }), _jsx("div", { style: CSS.desc, children: row.desc }), _jsxs("div", { style: CSS.invokeHint, children: ["/ ", row.name] }), _jsx("div", { style: CSS.actions, children: row.source === 'scanned' ? (_jsx("button", { style: CSS.actionBtn, onClick: () => adoptSkill(row.name), children: t('manage') })) : (_jsxs(_Fragment, { children: [_jsx("button", { style: CSS.actionBtn, onClick: () => toggleSkill(row.installedName, !row.skillEnabled), children: row.state === 'enabled' ? t('disable') : t('enable') }), _jsx("button", { style: CSS.actionBtn, onClick: () => startEditSkill(row), children: t('edit') }), _jsx("button", { style: { ...CSS.actionBtn, ...CSS.dangerBtn }, onClick: () => removeSkill(row.installedName), children: t('uninstall') })] })) })] }, row.key))) })] })), activeTab === 'presets' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: CSS.colHeader, children: [t('agentPresetsTitle'), " (", presetRows.length, ")"] }), _jsx("input", { style: CSS.searchInput, placeholder: t('searchPlaceholder'), value: presetQuery, onChange: (e) => setPresetQuery(e.target.value) }), _jsx("div", { style: CSS.scrollBox, children: filteredPresets.length === 0
                                    ? _jsx("div", { style: CSS.empty, children: t('empty') })
                                    : filteredPresets.map((row) => (_jsxs("div", { style: CSS.card, children: [_jsxs("div", { style: CSS.cardTop, children: [_jsxs("div", { style: CSS.name, children: [row.isDefault ? '★ ' : '', row.name] }), _jsx("span", { style: { ...CSS.badge, ...badge(row.state) }, children: label(row.state) })] }), _jsx("div", { style: CSS.desc, children: row.desc }), !row.isDefault && _jsx("button", { style: CSS.actionBtn, onClick: () => setDefault(row.presetId), children: t('setDefault') })] }, row.id))) })] }))] })] }));
}
