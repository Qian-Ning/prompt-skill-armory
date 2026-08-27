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
const PHOSPHOR = '#00ff9c';
const DAMNED = '#ff2b4b';
const AMBER = '#ffb000';
const GRAY = '#0f3d2c';
const CSS = {
    root: {
        fontFamily: "'JetBrains Mono','IBM Plex Mono',ui-monospace,monospace",
        background: '#04070a',
        color: PHOSPHOR,
        padding: '16px',
        border: `1px solid ${GRAY}`,
        boxShadow: 'inset 0 0 40px rgba(0,255,156,.06), 0 0 18px rgba(0,255,156,.15)',
        borderRadius: '2px',
        width: '100%',
        boxSizing: 'border-box',
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
        flexWrap: 'wrap',
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
        flexDirection: 'column',
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
        wordBreak: 'break-all',
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
        textTransform: 'uppercase',
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
        flexDirection: 'column',
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
        resize: 'vertical',
    },
    actions: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
    },
    hint: {
        color: GRAY,
        fontSize: '9px',
        letterSpacing: '1px',
    },
    scrollBox: {
        maxHeight: '520px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
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
        boxSizing: 'border-box',
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
        textAlign: 'center',
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
};
/** Open-book glyph. */
function BookIcon({ size = 16 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 16 16", fill: "none", style: { flex: 'none' }, "aria-hidden": "true", children: [_jsx("path", { d: "M7.5 3.2C6.2 2.4 4.6 2.2 2.8 2.5c-.5.08-.8.5-.8 1v7.6c0 .4.3.7.7.7 1.7-.2 3.2.1 4.8 1V3.2z", fill: "currentColor", opacity: "0.55" }), _jsx("path", { d: "M8.5 3.2c1.3-.8 2.9-1 4.7-.7.5.08.8.5.8 1v7.6c0 .4-.3.7-.7.7-1.7-.2-3.2.1-4.8 1V3.2z", fill: "currentColor", opacity: "0.85" }), _jsx("path", { d: "M8 3.2v10.3", stroke: "currentColor", strokeWidth: "0.7" })] }));
}
/** Bump with every release; keep in sync with package.json version + CHANGELOG. */
const ARMORY_VERSION = '0.4.5';
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
    return (_jsxs("div", { style: CSS.root, children: [_jsxs("div", { style: CSS.head, children: [_jsxs("div", { style: CSS.title, children: [_jsx(BookIcon, { size: 16 }), " ", _jsx("span", { style: CSS.titleAccent, children: "Prompt\u2022Skill" }), "-Armory", _jsxs("span", { style: CSS.versionBadge, children: ["v", ARMORY_VERSION] })] }), _jsx("button", { style: CSS.refreshBtn, onClick: refresh, children: t('refresh') })] }), state.status === 'error' && _jsxs("div", { style: CSS.error, children: ["\u2716 ", t('loadFailed'), ": ", state.message] }), _jsxs("div", { style: CSS.tabs, children: [_jsxs("button", { style: { ...CSS.tab, ...(activeTab === 'prompts' ? CSS.tabActive : {}) }, onClick: () => setActiveTab('prompts'), children: [t('promptsTitle'), " (", state.status === 'loading' ? '…' : promptRows.length, ")"] }), _jsxs("button", { style: { ...CSS.tab, ...(activeTab === 'skills' ? CSS.tabActive : {}) }, onClick: () => setActiveTab('skills'), children: [t('installSkill'), " (", state.status === 'loading' ? '…' : allSkillRows.length, ")"] }), _jsxs("button", { style: { ...CSS.tab, ...(activeTab === 'presets' ? CSS.tabActive : {}) }, onClick: () => setActiveTab('presets'), children: [t('agentPresetsTitle'), " (", state.status === 'loading' ? '…' : presetRows.length, ")"] })] }), activeTab === 'prompts' && (_jsxs("div", { style: CSS.columns, children: [_jsx("div", { style: CSS.column, children: _jsxs("div", { style: CSS.form, children: [_jsx("input", { style: CSS.input, placeholder: t('promptNamePlaceholder'), value: promptName, onChange: (e) => setPromptName(e.target.value) }), _jsx("input", { style: CSS.input, placeholder: t('promptDescPlaceholder'), value: promptDesc, onChange: (e) => setPromptDesc(e.target.value) }), _jsx("textarea", { style: CSS.textarea, placeholder: t('promptContentPlaceholder'), value: promptContent, onChange: (e) => setPromptContent(e.target.value) }), _jsxs("div", { style: CSS.actions, children: [_jsx("button", { style: CSS.actionBtn, disabled: busy, onClick: submitPrompt, children: editingPromptId !== undefined ? t('save') : t('addPrompt') }), editingPromptId !== undefined && (_jsx("button", { style: CSS.actionBtn, onClick: () => { setEditingPromptId(undefined); setPromptName(''); setPromptDesc(''); setPromptContent(''); }, children: t('cancel') }))] })] }) }), _jsxs("div", { style: CSS.column, children: [_jsx("input", { style: CSS.searchInput, placeholder: t('searchPlaceholder'), value: promptQuery, onChange: (e) => setPromptQuery(e.target.value) }), _jsx("div", { style: CSS.scrollBox, children: filteredPrompts.length === 0
                                    ? _jsx("div", { style: CSS.empty, children: t('empty') })
                                    : filteredPrompts.map((row) => (_jsxs("div", { style: CSS.card, children: [_jsxs("div", { style: CSS.cardTop, children: [_jsxs("div", { style: CSS.name, children: [row.isDefault ? '★ ' : '', row.name] }), _jsx("span", { style: { ...CSS.badge, ...row.state === 'enabled' ? CSS.badgeEnabled : CSS.badgeDisabled }, children: row.state === 'enabled' ? t('enabled') : t('disabled') })] }), _jsx("div", { style: CSS.desc, children: row.desc || row.content?.slice(0, 80) }), _jsxs("div", { style: CSS.actions, children: [!row.isDefault && _jsx("button", { style: CSS.actionBtn, onClick: () => markDefault(row.promptId), children: t('setDefault') }), _jsx("button", { style: CSS.actionBtn, onClick: () => togglePrompt(row.promptId, !row.promptEnabled), children: row.state === 'enabled' ? t('disable') : t('enable') }), _jsx("button", { style: CSS.actionBtn, onClick: () => startEditPrompt(row), children: t('edit') }), _jsx("button", { style: { ...CSS.actionBtn, ...CSS.dangerBtn }, onClick: () => removePrompt(row.promptId), children: t('delete') })] })] }, row.id))) })] })] })), activeTab === 'skills' && (_jsxs("div", { style: CSS.columns, children: [_jsxs("div", { style: CSS.column, children: [_jsxs("div", { style: CSS.form, children: [_jsxs("label", { style: CSS.fileBtn, children: [pickedFile !== '' ? `📄 ${pickedFile}` : t('pickSkillFile'), _jsx("input", { type: "file", accept: ".md,.markdown,text/markdown,text/plain", style: { display: 'none' }, onChange: (e) => onSkillFile(e.target.files?.[0]) })] }), _jsx("input", { style: CSS.input, placeholder: t('skillNamePlaceholder'), value: skillName, onChange: (e) => setSkillName(e.target.value) }), _jsx("input", { style: CSS.input, placeholder: t('skillDescPlaceholder'), value: skillDesc, onChange: (e) => setSkillDesc(e.target.value) }), _jsx("textarea", { style: CSS.textarea, placeholder: t('skillContentPlaceholder'), value: skillContent, onChange: (e) => setSkillContent(e.target.value) }), _jsxs("div", { style: CSS.actions, children: [_jsx("button", { style: CSS.actionBtn, disabled: busy, onClick: submitSkill, children: editingSkillName !== undefined ? t('save') : t('addSkill') }), editingSkillName !== undefined && (_jsx("button", { style: CSS.actionBtn, onClick: () => { setEditingSkillName(undefined); setSkillName(''); setSkillDesc(''); setSkillContent(''); }, children: t('cancel') }))] })] }), _jsxs("div", { style: CSS.cliBox, children: [_jsx("div", { style: { marginBottom: '4px' }, children: t('cliHint') }), _jsx("code", { style: { fontSize: '10px', color: PHOSPHOR }, children: "/armory-skill-dir <\u76EE\u5F55>" }), _jsx("br", {}), _jsx("code", { style: { fontSize: '10px', color: PHOSPHOR }, children: "/armory-install-zip <zip\u8DEF\u5F84>" })] })] }), _jsxs("div", { style: CSS.column, children: [_jsx("input", { style: CSS.searchInput, placeholder: t('searchPlaceholder'), value: skillQuery, onChange: (e) => setSkillQuery(e.target.value) }), _jsx("div", { style: CSS.scrollBox, children: filteredSkills.length === 0
                                    ? _jsx("div", { style: CSS.empty, children: t('empty') })
                                    : filteredSkills.map((row) => (_jsxs("div", { style: CSS.card, children: [_jsxs("div", { style: CSS.cardTop, children: [_jsx("div", { style: CSS.name, children: row.name }), _jsx("span", { style: { ...CSS.badge, ...badge(row.state) }, children: label(row.state) })] }), _jsx("div", { style: CSS.desc, children: row.desc }), _jsxs("div", { style: CSS.invokeHint, children: ["/ ", row.name] }), _jsx("div", { style: CSS.actions, children: row.source === 'scanned' ? (_jsx("button", { style: CSS.actionBtn, onClick: () => adoptSkill(row.name), children: t('manage') })) : (_jsxs(_Fragment, { children: [_jsx("button", { style: CSS.actionBtn, onClick: () => toggleSkill(row.installedName, !row.skillEnabled), children: row.state === 'enabled' ? t('disable') : t('enable') }), _jsx("button", { style: CSS.actionBtn, onClick: () => startEditSkill(row), children: t('edit') }), _jsx("button", { style: { ...CSS.actionBtn, ...CSS.dangerBtn }, onClick: () => removeSkill(row.installedName), children: t('uninstall') })] })) })] }, row.key))) })] })] })), activeTab === 'presets' && (_jsx("div", { style: CSS.columns, children: _jsxs("div", { style: CSS.column, children: [_jsxs("div", { style: CSS.colHeader, children: [t('agentPresetsTitle'), " (", presetRows.length, ")"] }), _jsx("input", { style: CSS.searchInput, placeholder: t('searchPlaceholder'), value: presetQuery, onChange: (e) => setPresetQuery(e.target.value) }), _jsx("div", { style: CSS.scrollBox, children: filteredPresets.length === 0
                                ? _jsx("div", { style: CSS.empty, children: t('empty') })
                                : filteredPresets.map((row) => (_jsxs("div", { style: CSS.card, children: [_jsxs("div", { style: CSS.cardTop, children: [_jsxs("div", { style: CSS.name, children: [row.isDefault ? '★ ' : '', row.name] }), _jsx("span", { style: { ...CSS.badge, ...badge(row.state) }, children: label(row.state) })] }), _jsx("div", { style: CSS.desc, children: row.desc }), !row.isDefault && _jsx("button", { style: CSS.actionBtn, onClick: () => setDefault(row.presetId), children: t('setDefault') })] }, row.id))) })] }) }))] }));
}
//# sourceMappingURL=SwitchbladeSection.js.map