/**
 * Switchblade management page, node half. Pure UI plugin: the empty apply
 * exists so the plugin appears in the host cordis.yml / Loader; the browser
 * half ships via exports["./client"], discovered through the package.json
 * dsh.client declaration.
 */
/** Host plugin body — no host-side behavior for this UI plugin. */
export declare function apply(): void;
/** Cordis plugin identity (host face). */
export declare const name = "ui-switchblade";
//# sourceMappingURL=index.d.ts.map