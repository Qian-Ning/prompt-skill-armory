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
import mountSwitchbladePanel from "./panel.js";
export { default as mountSwitchbladePanel } from "./panel.js";
/**
 * Mount the edgelord Switchblade panel. When running inside a browser and no
 * explicit host is given, it appends a full-screen panel to `document.body`.
 * @param ctx - the client plugin context whose `remote.switchblade` proxy drives the view.
 * @param host - optional mount element; defaults to a body-attached shell.
 * @returns a disposer, or undefined when no remote proxy is composed.
 */
export function switchbladePanel(ctx, host) {
    const proxy = ctx.remote?.switchblade;
    if (proxy === undefined)
        return undefined;
    if (typeof document === 'undefined')
        return undefined;
    let target = host;
    if (target === undefined) {
        target = document.createElement('div');
        target.style.position = 'fixed';
        target.style.inset = '0';
        target.style.overflow = 'auto';
        target.style.background = '#04070a';
        document.body.append(target);
    }
    return mountSwitchbladePanel(proxy, target);
}
//# sourceMappingURL=index.js.map