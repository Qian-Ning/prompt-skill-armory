//#region lib/types/invariant.js
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
/** All three managed kinds in canonical order. */
const MANAGED_KINDS = [
	"skill",
	"profile",
	"command"
];
/** Prefix used to namespaced-entry `id`s at the action seam. */
const ID_PREFIX = {
	skill: "skill",
	profile: "profile",
	command: "command"
};
/**
* Return whether a string looks like a stable Switchblade entry id
* (`skill:<kebab>`, `profile:<id>`, `command:<name>`).
* @param value - candidate entry id.
* @returns whether the id is split into a known kind prefix and a non-empty tail.
*/
function isEntryId(value) {
	const slash = value.indexOf(":");
	if (slash <= 0 || slash === value.length - 1) return false;
	const kind = value.slice(0, slash);
	return MANAGED_KINDS.includes(kind);
}
/**
* Return whether a candidate install name is a safe runtime skill name.
* @param name - candidate skill name.
* @returns whether it satisfies the public skill-name grammar (kebab-case).
*/
function isInstallSkillName(name) {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name);
}
/**
* Return whether a kebab or underscore command name is a safe slash command.
* @param name - candidate command name without a leading slash.
* @returns whether it satisfies the command grammar.
*/
function isCommandName(name) {
	return /^[a-z][a-z0-9_-]*$/u.test(name);
}
//#endregion
export { ID_PREFIX, MANAGED_KINDS, isCommandName, isEntryId, isInstallSkillName };
