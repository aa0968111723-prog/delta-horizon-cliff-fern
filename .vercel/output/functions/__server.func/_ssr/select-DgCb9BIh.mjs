import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { v as cn } from "./empty-state-DJ_-9JB5.mjs";
import { B as ChevronDown, V as Check } from "../_libs/lucide-react.mjs";
import { t as Root } from "../_libs/radix-ui__react-label.mjs";
import { a as SelectItemIndicator, c as SelectTrigger$1, i as SelectItem$1, l as SelectValue$1, n as SelectContent$1, o as SelectItemText, r as SelectIcon, s as SelectPortal, t as Select$1, u as SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
		className: cn("text-xs font-medium text-muted", className),
		...props
	});
}
var DB_NAME = "kouzhen-assets";
var STORE = "blobs";
var VERSION = 1;
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function putAssetBlob(id, blob) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).put(blob, id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
async function getAssetBlob(id) {
	const db = await openDb();
	const blob = await new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
	db.close();
	return blob;
}
async function hasAssetBlob(id) {
	const blob = await getAssetBlob(id);
	return Boolean(blob);
}
async function deleteAssetBlob(id) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
async function hydrateSeedAsset(id, src) {
	if (await hasAssetBlob(id)) return;
	const res = await fetch(src);
	if (!res.ok) throw new Error(`無法載入素材 ${src}`);
	await putAssetBlob(id, await res.blob());
}
var urlCache = /* @__PURE__ */ new Map();
async function objectUrlForAsset(id) {
	const cached = urlCache.get(id);
	if (cached) return cached;
	const blob = await getAssetBlob(id);
	if (!blob) return null;
	const url = URL.createObjectURL(blob);
	urlCache.set(id, url);
	return url;
}
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
var Select = Select$1;
var SelectValue = SelectValue$1;
function SelectTrigger({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
		className: cn("flex h-11 w-full items-center justify-between rounded-md border border-border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30", className),
		...props,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-muted" }) })]
	});
}
function SelectContent({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent$1, {
		className: cn("z-50 min-w-[8rem] overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]", className),
		position: "popper",
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: "p-1",
			children
		})
	}) });
}
function SelectItem({ className, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
		className: cn("relative flex h-9 cursor-pointer items-center rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none data-highlighted:bg-surface-2", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, {
			className: "absolute right-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
		})]
	});
}
//#endregion
export { SelectItem as a, deleteAssetBlob as c, hydrateSeedAsset as d, objectUrlForAsset as f, SelectContent as i, getAssetBlob as l, Label as n, SelectTrigger as o, putAssetBlob as p, Select as r, SelectValue as s, Badge as t, hasAssetBlob as u };
