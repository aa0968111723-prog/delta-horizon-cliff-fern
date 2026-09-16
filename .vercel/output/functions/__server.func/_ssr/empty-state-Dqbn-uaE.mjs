import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { $ as Button, tt as cn } from "./studio-store-BqpaoTm7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/empty-state-Dqbn-uaE.js
var import_jsx_runtime = require_jsx_runtime();
function EmptyState({ icon: Icon, title, description, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center rounded-2xl bg-surface px-6 py-14 text-center shadow-[var(--shadow-border)]", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-11 items-center justify-center rounded-lg bg-surface-2 text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-xl tracking-tight",
				children: title
			}),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm text-muted",
				children: description
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: action
			}) : null
		]
	});
}
function LoadingState({ label = "載入中…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" }), label]
	});
}
function ErrorState({ title = "出了一點問題", message, onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface px-5 py-8 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-danger",
				children: message
			}),
			onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5",
				variant: "secondary",
				onClick: onRetry,
				children: "再試一次"
			}) : null
		]
	});
}
//#endregion
export { ErrorState as n, LoadingState as r, EmptyState as t };
