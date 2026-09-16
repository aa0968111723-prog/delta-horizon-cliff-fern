import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { tt as cn } from "./studio-store-BqpaoTm7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-DWCS9kce.js
var import_jsx_runtime = require_jsx_runtime();
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
	variants: { variant: {
		default: "bg-surface-2 text-fg",
		accent: "bg-accent text-accent-fg",
		warn: "bg-warn/15 text-warn",
		danger: "bg-danger/15 text-danger",
		success: "bg-success/15 text-success"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
//#endregion
export { Badge as t };
