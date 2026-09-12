/**
 * Switchblade management page, browser half: registers the `settings.section`
 * navigation entry and renders the edgelord panel from the connection RPC
 * state. Global scope (root) — one management seat for every session.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */

import { en, NS, zh, type SwitchbladeKey } from './locales.ts'
import { SwitchbladeSection } from './SwitchbladeSection.tsx'
import type { SwitchbladeSectionInjected } from './SwitchbladeSection.tsx'
import { SwitchbladeSectionController } from './store.ts'
import { backgroundClient, initBackgroundClient, applyBackground, applyHintStyle } from './background.ts'

export { SwitchbladeSection } from './SwitchbladeSection.tsx'
export type { SwitchbladeSectionInjected, SwitchbladeSectionProps } from './SwitchbladeSection.tsx'
export { SwitchbladeSectionController } from './store.ts'
export type { SwitchbladeSectionState, SkillRow } from './store.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Switchblade management page copy. */
    'settings.switchblade': SwitchbladeKey
  }
}

/** Minimal browser-plugin context (avoids a runtime require of
 * `dsh-client-runtime/client`, which the 2.0.9 module table does not seed). */
interface ClientContext {
  effect(callback: () => void, label?: string): () => void
  get(name: string): unknown
  slots: {
    inject(slot: string, register: () => unknown): void
    register(entry: {
      name: string
      id: string
      order: number
      label: () => string
      locale: string
      inject: () => SwitchbladeSectionInjected
    }): unknown
  }
  locale: {
    register(ns: string, dict: unknown): unknown
    bind(ns: string): (key: SwitchbladeKey) => string
  }
}

/** The session-list surface we read the current session from. */
interface SessionsLike {
  list: { getSnapshot(): { current?: string | undefined } }
}

/** 2.0.9 settings-scope binder (`ctx.settingsScope`). */
interface SettingsScopeBinderLike {
  bind(spec: { namespace: string }): import('./store.ts').SettingsScopeLike
}

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'settingsScope', 'remote', 'sessions']

/**
 * Mount the Switchblade settings section.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-switchblade: dictionaries')

  const scope = (ctx.get('settingsScope') as SettingsScopeBinderLike).bind({ namespace: 'switchblade' })
  const remote = ctx.get('remote') as import('./store.ts').RemoteLike
  const sessions = ctx.get('sessions') as SessionsLike

  // Global background/effects survives restart: the Host persists the section
  // in its settings document and serves it over a same-origin route; we fetch
  // it at startup and repaint on every load or change. paint() gates on
  // status==='ready' so a not-yet-loaded snapshot never clears the backdrop.
  applyHintStyle()
  try {
    initBackgroundClient(scope)
    const paintBackground = (): void => { const s = backgroundClient.getSnapshot(); if (s.status === 'ready') applyBackground(s.value) }
    backgroundClient.subscribe(paintBackground)
    const applyPersisted = (): void => { void backgroundClient.load().then((ok) => { if (!ok) setTimeout(applyPersisted, 1200) }) }
    applyPersisted()
  } catch (error) {
    // Never let the background integration take the renderer/plugin tree down.
    console.warn('[switchblade] background init skipped:', error)
  }

  const controller = new SwitchbladeSectionController(scope, remote, () => {
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
      addMcpServer: (config) => controller.addMcpServer(config),
      updateMcpServer: (name, patch) => controller.updateMcpServer(name, patch),
      toggleMcpServer: (name, enabled) => controller.toggleMcpServer(name, enabled),
      removeMcpServer: (name) => controller.removeMcpServer(name),
      testMcpServer: (name) => controller.testMcpServer(name),
      refreshSessions: () => { (sessions as { refresh?: () => Promise<void> }).refresh?.().catch(() => {}) },
    }),
  }, SwitchbladeSection))
}

/** Cordis plugin identity. */
export const name = 'ui-switchblade'
