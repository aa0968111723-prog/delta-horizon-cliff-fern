import { useEffect, useMemo, useState } from "react";
import { objectUrlForAsset } from "@/lib/studio/assets-idb";
import { resolveAssetSrc, seedSrcById } from "@/lib/studio/asset-src";
import { useStudio } from "@/stores/studio-store";

/**
 * 素材預覽網址。示範素材先用 public `seedSrc`，IndexedDB blob 載到再補上。
 * 這樣素材庫不會在水合期間顯示「預覽失敗」。
 */
export function useAssetUrls(ids: string[]): Record<string, string> {
  const assets = useStudio((s) => s.assets);
  const key = [...new Set(ids.filter(Boolean))].sort().join("|");
  const list = useMemo(() => (key ? key.split("|") : []), [key]);
  const seeds = useMemo(() => seedSrcById(assets), [assets]);

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
    const merged: Record<string, string> = {};
    for (const id of list) {
      const url = resolveAssetSrc(id, blobUrls, seeds);
      if (url) merged[id] = url;
    }
    return merged;
  }, [list, blobUrls, seeds]);
}
