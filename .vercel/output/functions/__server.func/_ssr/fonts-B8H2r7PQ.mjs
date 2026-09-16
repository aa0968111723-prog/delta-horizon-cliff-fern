import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { W as cn } from "./studio-store-BWfSiXeC.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fonts-B8H2r7PQ.js
var import_jsx_runtime = require_jsx_runtime();
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-surface-2 data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-surface shadow-[var(--shadow-border)] transition-transform data-[state=checked]:translate-x-[18px]" })
	});
}
var STUDIO_FONTS = [{
	id: "Noto Sans TC",
	label: "Noto Sans TC 黑體",
	category: "sans"
}, {
	id: "Noto Serif TC",
	label: "Noto Serif TC 宋體",
	category: "serif"
}];
var FONT_WEIGHTS = [
	400,
	500,
	600,
	700
];
//#endregion
export { STUDIO_FONTS as n, Switch as r, FONT_WEIGHTS as t };
