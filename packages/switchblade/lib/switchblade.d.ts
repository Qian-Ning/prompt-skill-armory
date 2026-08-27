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
import { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { CommandDefinition } from '@deepseek-ai/dsh-commands';
import { type SkillDefinition } from '@deepseek-ai/dsh-skill';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import z from '@deepseek-ai/schemastery';
import type { InstallSkillInput, SwitchbladeActionResult, SwitchbladeCatalog } from './types.ts';
/** Switchblade settings namespace name. */
export declare const SETTINGS_NAMESPACE = "switchblade";
/** Persisted slice of this plugin's state. */
export interface SwitchbladeSettings {
    /** Owned skills Switchblade reinstates as runtime skills on startup. */
    readonly installedSkills: readonly SkillDefinition[];
    /** Custom slash commands Switchblade reinstates on startup. */
    readonly customCommands: readonly CommandDefinition[];
}
/** Runtime schema for the persisted slice. */
export declare const SwitchbladeSettingsSchema: z<Schemastery.ObjectS<{
    installedSkills: z<any[], any[]>;
    customCommands: z<any[], any[]>;
}>, Schemastery.ObjectT<{
    installedSkills: z<any[], any[]>;
    customCommands: z<any[], any[]>;
}>>;
export interface Config {
    /** Default profile id composed when a session names none. */
    readonly defaultProfile?: string;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        switchblade: Switchblade;
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
export declare class Switchblade extends TypertRemoteService {
    config: Config;
    /** The roster, commands, and runtime-skill seams are required to run. */
    static inject: string[];
    /** Registry configuration. */
    static Config: z<Config>;
    /** Live enabled registration disposers, keyed by entry id. */
    private readonly registrations;
    /** The settings namespace scope; present only while a settings provider is composed. */
    private settingsScope;
    /** The settings service behind {@link settingsScope}, for path writes. */
    private settingsService;
    constructor(ctx: Context, config?: Config);
    /** All persisted state, merged over schema defaults. */
    private settings;
    /**
     * The full management catalog.
     * @param agent - agent whose command view to read; omitted, the command
     *   section is empty (the CLI handler supplies it).
     * @returns normalized entries and the defaulted profile id.
     */
    catalog(agent: Agent): Promise<SwitchbladeCatalog>;
    /**
     * Install an owned skill from a local source and enable it immediately.
     * @param input - skill name, body, and routing metadata.
     * @returns the addressed id and resulting state.
     */
    installSkill(input: InstallSkillInput): Promise<SwitchbladeActionResult>;
    /**
     * Uninstall an owned skill, disposing its runtime registration.
     * @param name - runtime skill name to remove.
     * @returns the addressed id and resulting state.
     */
    uninstallSkill(name: string): Promise<SwitchbladeActionResult>;
    /** Toggle one owned skill's runtime registration on or off. */
    setSkillEnabled(name: string, enabled: boolean): Promise<SwitchbladeActionResult>;
    /** List all skill summary rows, regardless of ownership. */
    listSkills(): Promise<readonly {
        id: string;
        name: string;
        description: string;
    }[]>;
    /** Copy a shipped preset into a locally authored prompt profile. */
    addProfile(from: string, id: string, name?: string): Promise<void>;
    /** Remove a locally authored prompt profile. */
    removeProfile(id: string): Promise<void>;
    /** The prompt profile composed when a session names none. */
    currentProfile(): Promise<string | undefined>;
    /** Persist a new session default prompt profile. */
    setDefaultProfile(id: string): Promise<void>;
    /** Register a custom slash command and persist it for reinstatement. */
    registerCommand(definition: CommandDefinition): Promise<void>;
    /** Unregister a custom slash command. */
    unregisterCommand(name: string): Promise<void>;
    /**
     * Export the current managed state as a bundle patch layer (`cordis.patch.yml`).
     * Drop the returned text into a profile bundle's patch file to re-instate the
     * same skills, custom commands, and default profile on another process.
     */
    exportBundle(): Promise<string>;
    /**
     * Import switchblade-owned rows from a bundle patch and apply them. The
     * persisted slice is replaced, live registrations are rebuilt, and any
     * `agent-presets` default in the patch is adopted.
     * @param patch - a `cordis.patch.yml` document the exporter (or a compatible
     *   bundle) produced.
     */
    importBundle(patch: string): Promise<void>;
    /** Build the raw snapshot underlying a catalog. */
    private snapshot;
    /** Re-register every persisted owned row after a settings reload. */
    private reinstall;
    /** Flip one owned skill's runtime registration and persist the definition set. */
    private setOwnedSkill;
    private setOwnedSkillEnabled;
    private ownedSkillEntry;
    private profileEntry;
    private commandEntry;
    /** The agent-preset roster, read live from the composition. */
    private agentPresetsOrThrow;
    private authorableRoster;
}
export default Switchblade;
//# sourceMappingURL=switchblade.d.ts.map