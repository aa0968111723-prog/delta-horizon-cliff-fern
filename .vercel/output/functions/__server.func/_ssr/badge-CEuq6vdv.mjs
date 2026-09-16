import { P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { h as cn } from "./button-D9W66xhT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/badge-CEuq6vdv.js
var import_jsx_runtime = require_jsx_runtime();
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
//#endregion
export { hydrateSeedAsset as a, hasAssetBlob as i, deleteAssetBlob as n, objectUrlForAsset as o, getAssetBlob as r, putAssetBlob as s, Badge as t };
