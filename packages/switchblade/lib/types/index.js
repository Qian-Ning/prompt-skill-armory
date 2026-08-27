/**
 * `@deepseek-ai/dsh-switchblade` — CCswitch-style manager for skills, prompt
 * profiles, and slash commands in the DeepSeek Harness.
 *
 * The package exports a function plugin exactly like `@deepseek-ai/dsh-command-goal`:
 *   - `name`   — plugin identity
 *   - `inject` — services the plugin requires (commands), so ctx.commands is
 *     resolvable; WITHOUT this, `ctx.commands` throws "without inject"
 *   - `apply`  — mounts the {@link Switchblade} service and registers the /sw
 *     slash-command family
 *
 * NOTE: do NOT add a `export default` — the loader's `unwrapExports` returns
 * `exports.default ?? exports`, so a default export would shadow the module's
 * `name`/`inject`/`apply` and break inject resolution.
 *
 * @module @deepseek-ai/dsh-switchblade
 */
import { defineCommands } from "./commands.js";
import { Switchblade } from "./switchblade.js";
export { Switchblade, SETTINGS_NAMESPACE, SwitchbladeSettingsSchema, } from "./switchblade.js";
export * from "./invariant.js";
/** Cordis plugin identity. */
export const name = 'switchblade';
/** Services this plugin requires; declaring them makes ctx.commands resolvable. */
export const inject = ['commands'];
/** Mount switchblade and its /sw command family. */
export function apply(ctx) {
    ctx.logger.warn('[switchblade] apply() invoked — mounting Switchblade service');
    // The Switchblade service mounts in a child fiber; read the live instance
    // from the child ctx after it resolves. Register commands on the apply ctx,
    // which (via `inject`) can resolve ctx.commands.
    void ctx.plugin(Switchblade).then((fiber) => {
        ctx.logger.warn('[switchblade] Switchblade service mounted');
        const service = fiber.ctx.switchblade;
        defineCommands(ctx, service);
    }, (error) => {
        ctx.logger.warn(`[switchblade] command registration failed: ${error instanceof Error ? error.message : String(error)}`);
    });
}
//# sourceMappingURL=index.js.map