import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { r as STATUS_META } from "./status-BrzQjlVh.mjs";
import { t as Badge } from "./badge-DWCS9kce.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/status-badge-Coap4BY7.js
var import_jsx_runtime = require_jsx_runtime();
function StatusBadge({ status }) {
	const meta = STATUS_META[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: meta.tone,
		children: meta.label
	});
}
//#endregion
export { StatusBadge as t };
