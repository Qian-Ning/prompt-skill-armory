/**
 * Client-side Web UI projection for `@deepseek-ai/dsh-switchblade`.
 *
 * ⚠ WIRING REQUIRED — the binding seam for the Typert-generated remote proxy.
 *
 *  1. The `@Remote` methods on the Host `Switchblade` service become the
 *     `ctx.remote.switchblade` proxy only after the monorepo Typert build runs
 *     over this package (it emits `lib/typert.host.js` + the remote client).
 *  2. The remote binding is composed into the Web app's client assembly (the
 *     `packages/api/remotes` composition) so `ctx.remote.switchblade` resolves.
 *  3. Once it does, `mountSwitchbladePanel()` renders the edgelord view.
 *
 * @module @deepseek-ai/dsh-switchblade/client
 */
import type { Context } from '@deepseek-ai/cordis';
export { default as mountSwitchbladePanel } from './panel.ts';
export type { PanelCatalog, PanelEntry } from './panel.ts';
/**
 * The generated client proxy expected once Typert emits the remote binding.
 * Declared structurally here so the view compiles before codegen lands; swap
 * for the real generated type at assembly time.
 */
export interface SwitchbladeRemote {
    catalog(agent: unknown): Promise<unknown>;
    listSkills(): Promise<readonly {
        id: string;
        name: string;
        description: string;
    }[]>;
    installSkill(input: unknown): Promise<{
        id: string;
        state: string;
    }>;
    uninstallSkill(name: string): Promise<{
        id: string;
        state: string;
    }>;
    setSkillEnabled(name: string, enabled: boolean): Promise<{
        id: string;
        state: string;
    }>;
    addProfile(from: string, id: string, name?: string): Promise<void>;
    removeProfile(id: string): Promise<void>;
    setDefaultProfile(id: string): Promise<void>;
    currentProfile(): Promise<string | undefined>;
    registerCommand(definition: unknown): Promise<void>;
    unregisterCommand(name: string): Promise<void>;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        remote: {
            switchblade: SwitchbladeRemote;
        };
    }
}
/**
 * Mount the edgelord Switchblade panel. When running inside a browser and no
 * explicit host is given, it appends a full-screen panel to `document.body`.
 * @param ctx - the client plugin context whose `remote.switchblade` proxy drives the view.
 * @param host - optional mount element; defaults to a body-attached shell.
 * @returns a disposer, or undefined when no remote proxy is composed.
 */
export declare function switchbladePanel(ctx: Context, host?: HTMLElement): (() => void) | undefined;
//# sourceMappingURL=index.d.ts.map