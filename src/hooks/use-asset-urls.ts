import { useEffect, useMemo, useState } from "react";
import { objectUrlForAsset } from "@/lib/studio/assets-idb";
import { useStudio } from "@/stores/studio-store";

export function useAssetUrls(ids: string[]): Record<string, string> {
  const assets = useStudio((s) => s.assets);
  const list = useMemo(() => [...new Set(ids.filter(Boolean))].sort(), [ids]);
  const key = list.join("|");
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
            const url = await objectUrlForAsset(id);
            if (url) next[id] = url;
          } catch {
            /* ignore missing blobs */
          }
        }),
      );
      if (cancelled) return;
      setBlobUrls(next);
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
      const url = blobUrls[id] || seedFallbacks[id];
      if (url) merged[id] = url;
    }
    return merged;
  }, [blobUrls, list, seedFallbacks]);
}
