/**
 * Validation invariants for `@deepseek-ai/dsh-switchblade`.
 *
 * Mirrors the `src/invariant.ts` convention of sibling DSH packages: pure,
 * dependency-light predicates that a consumer (and the snapshot test hint)
 * can rely on instead of re-parsing switchblade's own postconditions.
 * Zero external RUNTIME dependencies — `isInstallSkillName` inlines the skill
 * grammar — so the module is directly loadable in a standalone test rig.
 *
 * @module @deepseek-ai/dsh-switchblade
 */
import type { ManagedKind } from './types.ts';
/** All three managed kinds in canonical order. */
export declare const MANAGED_KINDS: readonly ManagedKind[];
/** Prefix used to namespaced-entry `id`s at the action seam. */
export declare const ID_PREFIX: Record<ManagedKind, string>;
/**
 * Return whether a string looks like a stable Switchblade entry id
 * (`skill:<kebab>`, `profile:<id>`, `command:<name>`).
 * @param value - candidate entry id.
 * @returns whether the id is split into a known kind prefix and a non-empty tail.
 */
export declare function isEntryId(value: string): value is `${ManagedKind}:${string}`;
/**
 * Return whether a candidate install name is a safe runtime skill name.
 * @param name - candidate skill name.
 * @returns whether it satisfies the public skill-name grammar (kebab-case).
 */
export declare function isInstallSkillName(name: string): boolean;
/**
 * Return whether a kebab or underscore command name is a safe slash command.
 * @param name - candidate command name without a leading slash.
 * @returns whether it satisfies the command grammar.
 */
export declare function isCommandName(name: string): boolean;
//# sourceMappingURL=invariant.d.ts.map