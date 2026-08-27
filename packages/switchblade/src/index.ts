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

import type { Context } from '@deepseek-ai/cordis'
import { defineCommands } from './commands.ts'
import { Switchblade } from './switchblade.ts'

export {
  Switchblade,
  SETTINGS_NAMESPACE,
  SwitchbladeSettingsSchema,
  type SwitchbladeSettings,
  type Config,
} from './switchblade.ts'
export type * from './types.ts'
export * from './invariant.ts'

/** Cordis plugin identity. */
export const name = 'switchblade'

/** Services this plugin requires; declaring them makes ctx.commands resolvable. */
export const inject = ['commands']

/** Mount switchblade and its /sw command family. */
export function apply(ctx: Context): void {
  ctx.logger.warn('[switchblade] apply() invoked — mounting Switchblade service')
  // The Switchblade service mounts in a child fiber; read the live instance
  // from the child ctx after it resolves. Register commands on the apply ctx,
  // which (via `inject`) can resolve ctx.commands.
  void ctx.plugin(Switchblade).then((fiber) => {
    ctx.logger.warn('[switchblade] Switchblade service mounted')
    const service = (fiber.ctx as Context & { switchblade: Switchblade }).switchblade
    defineCommands(ctx, service)
  }, (error: unknown) => {
    ctx.logger.warn(`[switchblade] command registration failed: ${error instanceof Error ? error.message : String(error)}`)
  })
}
