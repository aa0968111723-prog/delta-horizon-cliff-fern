//#region node_modules/.nitro/vite/services/ssr/assets/ids-D2oCDrlv.js
function uid(prefix = "id") {
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
//#endregion
export { uid as t };
