/** Sync fallback so Drive / Canva / IG / seed thumbs show before IndexedDB hydrates. */

export function seedSrcById(assets: Array<{ id: string; seedSrc?: string }>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const asset of assets) {
    if (asset.seedSrc) next[asset.id] = asset.seedSrc;
  }
  return next;
}

export function resolveAssetSrc(
  id: string | undefined | null,
  blobUrls: Record<string, string>,
  seeds: Record<string, string> = {},
): string | undefined {
  if (!id) return undefined;
  return blobUrls[id] || seeds[id];
}
