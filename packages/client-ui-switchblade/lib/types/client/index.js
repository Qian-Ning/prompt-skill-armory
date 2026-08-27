/**
 * Switchblade management page, browser half: registers the `settings.section`
 * navigation entry and renders the edgelord panel from the connection RPC
 * state. Global scope (root) — one management seat for every session.
 * @module @deepseek-ai/dsh-client-ui-switchblade
 */
import { en, NS, zh } from "./locales.js";
import { SwitchbladeSection } from "./SwitchbladeSection.js";
import { SwitchbladeSectionController } from "./store.js";
export { SwitchbladeSection } from "./SwitchbladeSection.js";
export { SwitchbladeSectionController } from "./store.js";
/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'connection', 'sessions'];
/**
 * Mount the Switchblade settings section.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-switchblade: dictionaries');
    const api = ctx.get('connection').api;
    const sessions = ctx.get('sessions');
    const controller = new SwitchbladeSectionController(api, () => {
        const state = sessions.list.getSnapshot();
        return state.current === undefined ? undefined : state.current;
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'switchblade',
        order: 30,
        label: () => ctx.locale.bind(NS)('nav'),
        locale: NS,
        inject: () => ({
            hooks: { switchblade: controller.store },
            load: () => controller.load(),
            setDefaultPreset: (id) => controller.setDefaultPreset(id),
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
    }, SwitchbladeSection));
}
/** Cordis plugin identity. */
export const name = 'ui-switchblade';
//# sourceMappingURL=index.js.map