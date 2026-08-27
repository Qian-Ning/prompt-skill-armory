/**
 * `@deepseek-ai/dsh-switchblade` — CCswitch-style manager for skills, prompt
 * profiles, and slash commands in the DeepSeek Harness.
 *
 * The package default-exports the {@link Switchblade} Cordis service, matching
 * the `CommandRuntime`/`SkillRegistry` plugin convention: mounting the package
 * composes the service, and the service constructor wires setting persistence
 * and the `/sw` slash-command family.
 *
 * @module @deepseek-ai/dsh-switchblade
 */
export { Switchblade, SETTINGS_NAMESPACE, SwitchbladeSettingsSchema, type SwitchbladeSettings, type Config, } from './switchblade.ts';
export type * from './types.ts';
export * from './invariant.ts';
export { default } from './switchblade.ts';
//# sourceMappingURL=index.d.ts.map