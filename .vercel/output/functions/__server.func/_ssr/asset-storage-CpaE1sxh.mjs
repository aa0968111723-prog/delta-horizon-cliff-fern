import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { tt as cn } from "./studio-store-BqpaoTm7.mjs";
import { n as getAssetBlob, o as putAssetBlob, r as hasAssetBlob, t as deleteAssetBlob } from "./assets-idb-DwbJEnrX.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		suppressHydrationWarning: true,
		className: cn("flex h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none", "placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/30", "disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		suppressHydrationWarning: true,
		className: cn("flex min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none", "placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/30", "disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/asset-storage-CpaE1sxh.js
var localAssetStorage = {
	backend: "local",
	label: "此裝置（尚未連接雲端）",
	synced: false,
	put: putAssetBlob,
	get: getAssetBlob,
	delete: deleteAssetBlob,
	has: hasAssetBlob
};
/**
* Replaceable blob backend. Swap the return value when a remote adapter exists.
* Callers must read `synced` / `label` instead of assuming upload succeeded to a server.
*/
function getAssetStorage() {
	return localAssetStorage;
}
//#endregion
export { Input as n, Textarea as r, getAssetStorage as t };
