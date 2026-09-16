import { useEffect, useMemo, useState } from "react";
import { objectUrlForAsset } from "@/lib/studio/assets-idb";
import { previewUrlForAsset } from "@/lib/studio/assets";
import { useStudio } from "@/stores/studio-store";

/**
 * 素材預覽網址。示範素材先用 public `seedSrc`，IndexedDB blob 載到再補上。
 * 這樣素材庫不會在水合期間顯示「預覽失敗」。
 */
export function useAssetUrls(ids: string[]): Record<string, string> {
  const assets = useStudio((s) => s.assets);
  const list = useMemo(() => [...new Set(ids.filter(Boolean))].sort(), [ids]);
  const key = list.join("|");
  const seeds = useMemo(() => {
    const map: Record<string, string> = {};
    for (const asset of assets) {
      const url = previewUrlForAsset(asset);
      if (url) map[asset.id] = url;
    }
    return map;
  }, [assets]);
  const seedFallback = useMemo(() => {
    const next: Record<string, string> = {};
    for (const id of list) {
      if (seeds[id]) next[id] = seeds[id];
    }
    return next;
  }, [key, list, seeds]);
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const load = async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        list.map(async (id) => {
          try {
            const url = await objectUrlForAsset(id);
            if (url) next[id] = url;
          } catch {
            /* ignore missing blobs */
          }
        }),
      );
      if (cancelled) return;
      setBlobUrls(next);
      const missing = list.filter((id) => !next[id] && !seeds[id]);
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
  }, [key, list, seeds]);

  return useMemo(() => {
    const merged: Record<string, string> = { ...blobUrls };
    for (const [id, url] of Object.entries(seedFallback)) {
      merged[id] = url;
    }
    return merged;
  }, [blobUrls, seedFallback]);
}
