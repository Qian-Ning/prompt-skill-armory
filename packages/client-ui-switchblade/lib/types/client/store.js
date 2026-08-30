/**
 * Switchblade section data controller: reads the skill catalog and the prompt
 * preset roster through the existing connection RPC surface (no Typert
 * generation needed — these methods are already wired).
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/** Initial (idle) state. */
const IDLE = {
    status: 'idle',
    skills: [],
    presets: [],
    commands: [],
    prompts: [],
    installedSkills: [],
};
/** Normalize a thrown wire error to a message. */
function messageOf(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Data controller bound to one session's connection.
 * @param api - the connection's API client.
 * @param sessionId - session the skill catalog resolves against.
 */
export class SwitchbladeSectionController {
    api;
    sessionId;
    /** Snapshot store backing the section's view state. */
    store = createSnapshotStore(IDLE);
    constructor(api, sessionId) {
        this.api = api;
        this.sessionId = sessionId;
    }
    /**
     * Load skills, presets, prompts, and installed skills. Prompts and installed
     * skills come from the `switchblade` settings namespace (the Host watches
     * it and re-injects on change).
     */
    async load() {
        this.store.set({ ...IDLE, status: 'loading' });
        try {
            // skill.list requires a live session; without one we skip it (never
            // hang). Presets + settings always resolve, so the panel opens reliably.
            const sessionId = this.sessionId?.();
            const calls = [
                this.api.agentPresets.list({}),
                this.api.settings.describe({}),
            ];
            if (sessionId !== undefined)
                calls.push(this.api.skills.list({ sessionId }));
            const [presetRes, settingsRes, skillRes] = await Promise.all(calls);
            if (!presetRes.result.ok)
                throw new Error(`agentPreset.list: ${presetRes.result.error.message}`);
            if (!settingsRes.result.ok)
                throw new Error(`settings.describe: ${settingsRes.result.error.message}`);
            const skills = skillRes !== undefined && skillRes.result.ok
                ? skillRes.result.value.skills.map((skill) => ({
                    name: skill.name,
                    description: skill.description,
                    modelInvocable: skill.modelInvocable,
                }))
                : [];
            const presets = presetRes.result.value.presets.map((preset) => ({
                id: preset.id,
                isDefault: preset.isDefault,
                trust: preset.trust,
                ...preset.name === undefined ? {} : { name: preset.name },
                ...preset.description === undefined ? {} : { description: preset.description },
                ...preset.broken === undefined ? {} : { broken: preset.broken },
            }));
            const switchbladeSection = this.sectionFromSettings(settingsRes.result.value, 'switchblade');
            const prompts = Array.isArray(switchbladeSection?.prompts) ? switchbladeSection.prompts : [];
            const installedSkills = Array.isArray(switchbladeSection?.installedSkills)
                ? switchbladeSection.installedSkills.map((s) => ({
                    name: s.name ?? '',
                    description: s.description ?? '',
                    content: s.content ?? '',
                    enabled: s.enabled ?? true,
                }))
                : [];
            this.store.set({
                status: 'ready',
                skills,
                presets,
                commands: [],
                prompts,
                installedSkills,
            });
        }
        catch (error) {
            this.store.set({ ...IDLE, status: 'error', message: messageOf(error) });
        }
    }
    /** Read one namespace's user section from a settings.describe value. */
    sectionFromSettings(value, ns) {
        if (typeof value !== 'object' || value === null)
            return undefined;
        const entries = value.namespaces;
        if (!Array.isArray(entries))
            return undefined;
        for (const entry of entries) {
            const row = entry;
            if (row.ns === ns) {
                const section = row.value;
                return typeof section === 'object' && section !== null ? section : undefined;
            }
        }
        return undefined;
    }
    // ---------------------------------------------------------------------------
    // Prompt CRUD (writes to the switchblade settings namespace; Host re-injects)
    // ---------------------------------------------------------------------------
    /** Add a prompt. */
    async addPrompt(input) {
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['prompts'], value: [...this.currentPrompts(), {
                            id: this.slugify(input.name),
                            name: input.name,
                            description: input.description,
                            content: input.content,
                            order: this.currentPrompts().length,
                            enabled: true,
                            isDefault: this.currentPrompts().length === 0,
                        }] }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
    /** Toggle one prompt's enabled state. */
    async setPromptEnabled(id, enabled) {
        const next = this.currentPrompts().map((p) => p.id === id ? { ...p, enabled } : p);
        await this.writePrompts(next);
    }
    /** Mark one prompt default; clears others. */
    async setDefaultPrompt(id) {
        const next = this.currentPrompts().map((p) => ({ ...p, isDefault: p.id === id }));
        await this.writePrompts(next);
    }
    /** Delete one prompt. */
    async deletePrompt(id) {
        const next = this.currentPrompts().filter((p) => p.id !== id);
        await this.writePrompts(next);
    }
    /** Update a prompt's name/description/content. */
    async updatePrompt(id, patch) {
        const next = this.currentPrompts().map((p) => p.id === id ? {
            ...p,
            name: patch.name?.trim() || p.name,
            description: patch.description ?? p.description,
            content: patch.content ?? p.content,
        } : p);
        await this.writePrompts(next);
    }
    /** Persist the prompt list through the settings RPC. */
    async writePrompts(prompts) {
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['prompts'], value: prompts }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
    /** Current prompt list from the loaded snapshot. */
    currentPrompts() {
        return this.store.getSnapshot().prompts;
    }
    /** Sluggify a name into an id. */
    slugify(value) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return slug.length > 0 ? slug : `prompt-${Date.now()}`;
    }
    // ---------------------------------------------------------------------------
    // Skill install/uninstall (writes to the switchblade settings namespace)
    // ---------------------------------------------------------------------------
    /** Install a skill from a name + content (enabled by default). */
    async installSkill(input) {
        const next = [...this.currentInstalledSkills(), {
                name: input.name,
                description: input.description,
                content: input.content,
                enabled: true,
            }];
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['installedSkills'], value: next }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
    /** Toggle one installed skill's enabled state. */
    async setSkillEnabled(name, enabled) {
        const next = this.currentInstalledSkills().map((s) => s.name === name ? { ...s, enabled } : s);
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['installedSkills'], value: next }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
    /** Uninstall one installed skill. */
    async uninstallSkill(name) {
        const next = this.currentInstalledSkills().filter((s) => s.name !== name);
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['installedSkills'], value: next }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
    /** Update an installed skill's name/description/content. */
    async updateSkill(name, patch) {
        const next = this.currentInstalledSkills().map((s) => s.name === name ? {
            ...s,
            name: patch.name?.trim() || s.name,
            description: patch.description ?? s.description,
            content: patch.content ?? s.content,
        } : s);
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['installedSkills'], value: next }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
    /** Current installed skills from the loaded snapshot. */
    currentInstalledSkills() {
        return this.store.getSnapshot().installedSkills;
    }
    /**
     * Queue a zip archive (base64) for extraction into ~/.dsh/skills. The Host
     * watch sees pendingZip and installs it (skil-filesystem then discovers it).
     */
    async installSkillFromZip(name, dataBase64) {
        const res = await this.api.settings.mutate({
            ns: 'switchblade',
            ops: [{ op: 'set', path: ['pendingZip'], value: { name, dataBase64 } }],
        });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        // Wait a tick for the Host watch to extract, then refresh.
        await new Promise((r) => setTimeout(r, 500));
        await this.load();
    }
    /** Set the default prompt preset. */
    async setDefaultPreset(id) {
        const res = await this.api.settings.update({ ns: 'agent-presets', patch: { default: id } });
        if (!res.result.ok)
            throw new Error(res.result.error.message);
        await this.load();
    }
}
