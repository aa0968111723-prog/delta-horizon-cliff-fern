export function assetUrlKey(ids: string[]) {
  return [...new Set(ids.filter(Boolean))].sort().join("|");
}
