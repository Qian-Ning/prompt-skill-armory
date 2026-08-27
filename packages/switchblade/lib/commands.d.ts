/**
 * The `/sw` slash-command family.
 *
 * Registered through `ctx.commands.register` (global layer) by the Switchblade
 * service constructor. Each handler runs directly, without a model round-trip,
 * exactly like a CCswitch toggle — the result text is what surfaces.
 *
 * @module @deepseek-ai/dsh-switchblade
 */
import type { Switchblade } from './switchblade.ts';
/** Register every `/sw` command against a live Switchblade instance. */
export declare function defineCommands(ctx: Switchblade['ctx'], sb: Switchblade): void;
//# sourceMappingURL=commands.d.ts.map