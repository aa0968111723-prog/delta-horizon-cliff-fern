import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-badge-C16rMtxS.js
var import_jsx_runtime = require_jsx_runtime();
var STATUS_META = {
	draft: {
		label: "草稿",
		tone: "warn"
	},
	ready: {
		label: "可輸出",
		tone: "accent"
	},
	exported: {
		label: "已輸出",
		tone: "success"
	}
};
function StatusBadge({ status }) {
	const meta = STATUS_META[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: meta.tone,
		children: meta.label
	});
}
//#endregion
export { StatusBadge as t };
