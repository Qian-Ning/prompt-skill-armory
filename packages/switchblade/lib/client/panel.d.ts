/**
 * The edgelord panel view for `@deepseek-ai/dsh-switchblade`.
 *
 * Self-contained and dependency-free: pure DOM construction inside a Shadow
 * root, so it drops into any host (a `ui-*` slot, a dev harness page, or a
 * plain browser tab) without a framework. It renders the Switchblade catalog
 * as phospor-green CRT cards, each with a state badge and an enable/disable
 * toggle that drives the same Host service the CLI uses — zero duplicate
 * logic on the client.
 *
 * @module @deepseek-ai/dsh-switchblade/client/panel
 */
import type { SwitchbladeRemote } from './index.ts';
/** One normalized row the panel renders, matching the Host catalog projection. */
export interface PanelEntry {
    readonly kind: 'skill' | 'profile' | 'command';
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly state: string;
}
/** Shape of the catalog the panel expects from `proxy.catalog(agent)`. */
export interface PanelCatalog {
    readonly entries: readonly PanelEntry[];
    readonly defaultProfile?: string;
}
/**
 * Mount the Switchblade panel into `host`.
 * @param proxy - the Typert-generated remote proxy for the Host service.
 * @param host - element the panel mounts inside (its children are replaced).
 * @returns a disposer that unmounts the panel and its shadow tree.
 */
export declare function mountSwitchbladePanel(proxy: SwitchbladeRemote, host: HTMLElement): () => void;
export default mountSwitchbladePanel;
//# sourceMappingURL=panel.d.ts.map