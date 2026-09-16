//#region node_modules/.nitro/vite/services/ssr/assets/assets-idb-DwbJEnrX.js
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
//#endregion
export { objectUrlForAsset as a, hydrateSeedAsset as i, getAssetBlob as n, putAssetBlob as o, hasAssetBlob as r, deleteAssetBlob as t };
