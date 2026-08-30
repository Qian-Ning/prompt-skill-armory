/**
 * Switchblade section data controller: reads the skill catalog and the prompt
 * preset roster through the existing connection RPC surface (no Typert
 * generation needed — these methods are already wired).
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */
import type { ConnectionHandle, SessionId } from '@deepseek-ai/dsh-api-remotes/client';
import { type SnapshotStore } from '@deepseek-ai/dsh-client-runtime/client';
/** A skill row as reported by skill.list. */
export interface SkillRow {
    readonly name: string;
    readonly description: string;
    readonly modelInvocable: boolean;
}
/** A prompt-preset row as reported by agentPreset.list. */
export interface PresetRow {
    readonly id: string;
    readonly name?: string;
    readonly description?: string;
    readonly isDefault: boolean;
    readonly trust: string;
    readonly broken?: string;
}
/** A command row (not yet wired to an RPC; kept for the section's third group). */
export interface CommandRow {
    readonly name: string;
    readonly description: string;
}
/** One user-authored prompt (mirrors the Host ManagedPrompt). */
export interface PromptRow {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly content: string;
    readonly order: number;
    readonly enabled: boolean;
    readonly isDefault: boolean;
}
/** An installed skill row. */
export interface InstalledSkillRow {
    readonly name: string;
    readonly description: string;
    readonly content: string;
    /** Whether this skill is currently registered (enabled) as a runtime skill. */
    readonly enabled: boolean;
}
/** The section's loaded view state. */
export interface SwitchbladeSectionState {
    readonly status: 'idle' | 'loading' | 'ready' | 'error';
    readonly message?: string;
    readonly skills: readonly SkillRow[];
    readonly presets: readonly PresetRow[];
    readonly commands: readonly CommandRow[];
    readonly prompts: readonly PromptRow[];
    readonly installedSkills: readonly InstalledSkillRow[];
}
/**
 * Data controller bound to one session's connection.
 * @param api - the connection's API client.
 * @param sessionId - session the skill catalog resolves against.
 */
export declare class SwitchbladeSectionController {
    private readonly api;
    private readonly sessionId?;
    /** Snapshot store backing the section's view state. */
    readonly store: SnapshotStore<SwitchbladeSectionState>;
    constructor(api: ConnectionHandle['api'], sessionId?: () => SessionId | undefined);
    /**
     * Load skills, presets, prompts, and installed skills. Prompts and installed
     * skills come from the `switchblade` settings namespace (the Host watches
     * it and re-injects on change).
     */
    load(): Promise<void>;
    /** Read one namespace's user section from a settings.describe value. */
    private sectionFromSettings;
    /** Add a prompt. */
    addPrompt(input: {
        name: string;
        description: string;
        content: string;
    }): Promise<void>;
    /** Toggle one prompt's enabled state. */
    setPromptEnabled(id: string, enabled: boolean): Promise<void>;
    /** Mark one prompt default; clears others. */
    setDefaultPrompt(id: string): Promise<void>;
    /** Delete one prompt. */
    deletePrompt(id: string): Promise<void>;
    /** Update a prompt's name/description/content. */
    updatePrompt(id: string, patch: {
        name?: string;
        description?: string;
        content?: string;
    }): Promise<void>;
    /** Persist the prompt list through the settings RPC. */
    private writePrompts;
    /** Current prompt list from the loaded snapshot. */
    private currentPrompts;
    /** Sluggify a name into an id. */
    private slugify;
    /** Install a skill from a name + content (enabled by default). */
    installSkill(input: {
        name: string;
        description: string;
        content: string;
    }): Promise<void>;
    /** Toggle one installed skill's enabled state. */
    setSkillEnabled(name: string, enabled: boolean): Promise<void>;
    /** Uninstall one installed skill. */
    uninstallSkill(name: string): Promise<void>;
    /** Update an installed skill's name/description/content. */
    updateSkill(name: string, patch: {
        name?: string;
        description?: string;
        content?: string;
    }): Promise<void>;
    /** Current installed skills from the loaded snapshot. */
    private currentInstalledSkills;
    /**
     * Queue a zip archive (base64) for extraction into ~/.dsh/skills. The Host
     * watch sees pendingZip and installs it (skil-filesystem then discovers it).
     */
    installSkillFromZip(name: string, dataBase64: string): Promise<void>;
    /** Set the default prompt preset. */
    setDefaultPreset(id: string): Promise<void>;
}
/** The section's injected face: hooks (snapshot store) + actions. */
export interface SwitchbladeSectionInjected {
    hooks: {
        /** Page snapshot bound by the renderer as useSwitchblade. */
        switchblade: SnapshotStore<SwitchbladeSectionState>;
    };
    load: () => Promise<void>;
    setDefaultPreset: (id: string) => Promise<void>;
    addPrompt: (input: {
        name: string;
        description: string;
        content: string;
    }) => Promise<void>;
    updatePrompt: (id: string, patch: {
        name?: string;
        description?: string;
        content?: string;
    }) => Promise<void>;
    setPromptEnabled: (id: string, enabled: boolean) => Promise<void>;
    setDefaultPrompt: (id: string) => Promise<void>;
    deletePrompt: (id: string) => Promise<void>;
    installSkill: (input: {
        name: string;
        description: string;
        content: string;
    }) => Promise<void>;
    updateSkill: (name: string, patch: {
        name?: string;
        description?: string;
        content?: string;
    }) => Promise<void>;
    setSkillEnabled: (name: string, enabled: boolean) => Promise<void>;
    uninstallSkill: (name: string) => Promise<void>;
    installSkillFromZip: (name: string, dataBase64: string) => Promise<void>;
}
