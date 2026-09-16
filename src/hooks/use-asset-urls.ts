import { useEffect, useMemo, useState } from "react";
import { objectUrlForAsset } from "@/lib/studio/assets-idb";

export function useAssetUrls(ids: string[]): Record<string, string> {
  const list = useMemo(() => [...new Set(ids.filter(Boolean))].sort(), [ids]);
  const key = list.join("|");
  const [urls, setUrls] = useState<Record<string, string>>({});

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
      setUrls(next);
      const missing = list.filter((id) => !next[id]);
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
  }, [key, list]);

  return urls;
}

export function resolveAssetSrc(id: string | null | undefined, urls: Record<string, string>, seedSrc?: string) {
  if (seedSrc) return seedSrc;
  if (!id) return "";
  return urls[id] || "";
}
