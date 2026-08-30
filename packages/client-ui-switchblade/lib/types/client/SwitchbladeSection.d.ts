/**
 * Prompt-SkillArmory management page.
 *
 * Three tabs within the settings dialog's fixed width: Prompts / Skills /
 * Agent Presets. The Skills tab is the single home for skills — both the ones
 * installed through this panel and the ones scanned from the local skill
 * roots — merged into one list with full management (add / edit / toggle /
 * remove / invoke hint). A CLI entry box offers direct command installation.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */
import type { JSX } from 'react';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SwitchbladeKey } from './locales.ts';
import type { SwitchbladeSectionInjected } from './store.ts';
export type { SwitchbladeSectionInjected } from './store.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Prompt-SkillArmory page copy. */
        'settings.switchblade': SwitchbladeKey;
    }
}
/** Full component props: settings-section runtime + locale + injected face. */
export type SwitchbladeSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.switchblade'> & InjectFace<SwitchbladeSectionInjected>;
/** Render the Prompt-SkillArmory management page. */
export declare function SwitchbladeSection(props: SwitchbladeSectionProps): JSX.Element;
