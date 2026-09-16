import { useEffect, useMemo, useState } from "react";
import { objectUrlForAsset } from "@/lib/studio/assets-idb";
import { assetUrlKey } from "@/lib/studio/asset-url-key";
import { useStudio } from "@/stores/studio-store";

/**
 * 素材預覽網址。示範素材先用 public `seedSrc`，IndexedDB blob 載到再補上。
 * 這樣素材庫不會在水合期間顯示「預覽失敗」。
 */
export function useAssetUrls(ids: string[]): Record<string, string> {
  const assets = useStudio((s) => s.assets);
  const key = assetUrlKey(ids);
  const list = useMemo(() => (key ? key.split("|") : []), [key]);
  const seedFallbacks = useMemo(() => {
    const map: Record<string, string> = {};
    for (const asset of assets) {
      if (asset.seedSrc) map[asset.id] = asset.seedSrc;
    }
    return map;
  }, [assets]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const load = async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        list.map(async (id) => {
          try {
            const url = await objectUrlForAsset(id, seeds[id]);
            if (url) next[id] = url;
          } catch {
            /* ignore missing blobs */
          }
        }),
      );
      if (cancelled) return;
      setBlobUrls((prev) => {
        const same =
          Object.keys(prev).length === Object.keys(next).length &&
          Object.keys(next).every((id) => prev[id] === next[id]);
        return same ? prev : next;
      });
      const missing = list.filter((id) => !next[id] && !seedFallbacks[id]);
      if (missing.length && attempts < 10) {
        attempts += 1;
        window.setTimeout(() => {
          void load();
        }, 200);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [key, list, seedFallbacks]);

  return useMemo(() => {
    const merged: Record<string, string> = {};
    for (const id of list) {
      const url = seedFallbacks[id] || blobUrls[id];
      if (url) merged[id] = url;
    }
    return merged;
  }, [blobUrls, list, seedFallbacks]);
}
