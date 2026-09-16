export { readFileAsImage } from "./asset-upload";

const DB_NAME = "tamkang-zen-assets";
const STORE = "blobs";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
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

export async function putAssetBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAssetBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return blob;
}

export async function hasAssetBlob(id: string): Promise<boolean> {
  const blob = await getAssetBlob(id);
  return Boolean(blob);
}

export async function deleteAssetBlob(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function hydrateSeedAsset(id: string, src: string): Promise<void> {
  if (await hasAssetBlob(id)) return;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`無法載入素材 ${src}`);
  const blob = await res.blob();
  await putAssetBlob(id, blob);
}

const urlCache = new Map<string, string>();

export async function objectUrlForAsset(id: string, seedSrc?: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  let blob = await getAssetBlob(id);
  if (!blob && seedSrc) {
    try {
      await hydrateSeedAsset(id, seedSrc);
      blob = await getAssetBlob(id);
    } catch {
      return seedSrc;
    }
  }
  if (!blob) return seedSrc ?? null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export function revokeAssetUrl(id: string) {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}
