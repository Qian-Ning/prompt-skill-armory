/**
 * Switchblade management page, browser half: registers the `settings.section`
 * navigation entry and renders the edgelord panel from the connection RPC
 * state. Global scope (root) — one management seat for every session.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type SwitchbladeKey } from './locales.ts';
export { SwitchbladeSection } from './SwitchbladeSection.tsx';
export type { SwitchbladeSectionInjected, SwitchbladeSectionProps } from './SwitchbladeSection.tsx';
export { SwitchbladeSectionController } from './store.ts';
export type { SwitchbladeSectionState, SkillRow, PresetRow } from './store.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Switchblade management page copy. */
        'settings.switchblade': SwitchbladeKey;
    }
}
/** Required services (cordis fiber inject). */
export declare const inject: string[];
/**
 * Mount the Switchblade settings section.
 * @param ctx - the browser plugin context.
 */
export declare function apply(ctx: ClientContext): void;
/** Cordis plugin identity. */
export declare const name = "ui-switchblade";
