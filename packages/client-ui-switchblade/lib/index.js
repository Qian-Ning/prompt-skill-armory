//#region lib/types/index.js
/**
* Switchblade management page, node half. Pure UI plugin: the empty apply
* exists so the plugin appears in the host cordis.yml / Loader; the browser
* half ships via exports["./client"], discovered through the package.json
* dsh.client declaration.
*/
/** Host plugin body — no host-side behavior for this UI plugin. */
function apply() {}
/** Cordis plugin identity (host face). */
const name = "ui-switchblade";
//#endregion
export { apply, name };
