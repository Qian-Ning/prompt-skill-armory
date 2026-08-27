/**
 * Switchblade management page, browser half: registers the `settings.section`
 * navigation entry and renders the edgelord panel from the connection RPC
 * state. Global scope (root) — one management seat for every session.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */

import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type { ClientContext, ISessions } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings shell's SlotMap merge (the 'settings.section' entry).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the LocaleNamespaceMap merge slot (the 'settings.switchblade' entry).
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { en, NS, zh, type SwitchbladeKey } from './locales.ts'
import { SwitchbladeSection } from './SwitchbladeSection.tsx'
import type { SwitchbladeSectionInjected } from './SwitchbladeSection.tsx'
import { SwitchbladeSectionController } from './store.ts'

export { SwitchbladeSection } from './SwitchbladeSection.tsx'
export type { SwitchbladeSectionInjected, SwitchbladeSectionProps } from './SwitchbladeSection.tsx'
export { SwitchbladeSectionController } from './store.ts'
export type { SwitchbladeSectionState, SkillRow, PresetRow } from './store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Switchblade management page copy. */
    'settings.switchblade': SwitchbladeKey
  }
}

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'connection', 'sessions']

/**
 * Mount the Switchblade settings section.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-switchblade: dictionaries')

  const api = (ctx.get('connection') as ConnectionHandle).api
  const sessions = ctx.get('sessions') as ISessions
  const controller = new SwitchbladeSectionController(api, () => {
    const state = sessions.list.getSnapshot()
    return state.current === undefined ? undefined : state.current
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'switchblade',
    order: 30,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS,
    inject: (): SwitchbladeSectionInjected => ({
      hooks: { switchblade: controller.store },
      load: () => controller.load(),
      setDefaultPreset: (id: string) => controller.setDefaultPreset(id),
      addPrompt: (input) => controller.addPrompt(input),
      updatePrompt: (id, patch) => controller.updatePrompt(id, patch),
      setPromptEnabled: (id, enabled) => controller.setPromptEnabled(id, enabled),
      setDefaultPrompt: (id) => controller.setDefaultPrompt(id),
      deletePrompt: (id) => controller.deletePrompt(id),
      installSkill: (input) => controller.installSkill(input),
      updateSkill: (name, patch) => controller.updateSkill(name, patch),
      setSkillEnabled: (name, enabled) => controller.setSkillEnabled(name, enabled),
      uninstallSkill: (name) => controller.uninstallSkill(name),
      installSkillFromZip: (name, dataBase64) => controller.installSkillFromZip(name, dataBase64),
    }),
  }, SwitchbladeSection))
}

/** Cordis plugin identity. */
export const name = 'ui-switchblade'
