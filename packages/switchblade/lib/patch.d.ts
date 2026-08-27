/**
 * bundle patch-layer serialization for `@deepseek-ai/dsh-switchblade`.
 *
 * A DSH "bundle" is a package whose package.json declares `dsh.bundle.patch`
 * pointing at a `cordis.patch.yml`. Profile composition resolves that field and
 * overlays the patch rows onto the profile root; later patches win per row id.
 * This module renders and re-parses the subset of that format Switchblade owns:
 * the `switchblade` row (carrying the installed skill + custom command rows as
 * plugin config) and the `agent-presets` default row.
 *
 * NOTE: the serialization here is deliberately small and dependency-free —
 * the full composer treats patch text as YAML, so round-tripping fidelity for
 * arbitrary external bundles is out of scope: import only understands the rows
 * this exporter writes. Swap in a real YAML parser if an external bundle must
 * be consumed.
 *
 * @module @deepseek-ai/dsh-switchblade/patch
 */
import type { CommandDefinition } from '@deepseek-ai/dsh-commands';
import type { SkillDefinition } from '@deepseek-ai/dsh-skill';
/** The patch rows Switchblade owns on export. */
export interface SwitchbladePatch {
    /** Owned skills reinstated on the target profile. */
    readonly installedSkills: readonly SkillDefinition[];
    /** Custom slash commands reinstated on the target profile. */
    readonly customCommands: readonly CommandDefinition[];
    /** Profile id to default, or undefined when none was pinned. */
    readonly defaultProfile?: string;
}
/**
 * Render the current Switchblade state as a `cordis.patch.yml` bundle layer.
 * @param patch - state to persist into the patch.
 * @returns YAML text ready to drop into a profile bundle's `cordis.patch.yml`.
 */
export declare function renderPatch(patch: SwitchbladePatch): string;
/**
 * Best-effort parse of the rows this exporter writes. Rows it does not
 * recognize are ignored, so an external patch may carry other plugins.
 * @param text - a `cordis.patch.yml` document.
 * @returns the switchblade-owned rows found in it.
 */
export declare function parsePatch(text: string): SwitchbladePatch;
//# sourceMappingURL=patch.d.ts.map