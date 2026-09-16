import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { v as cn } from "./empty-state-DJ_-9JB5.mjs";
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
export { Textarea as n, Input as t };
