export function exportFilename(
  name: string,
  formatShort: string,
  suffix: string,
  width: number,
  height: number,
  ext: string,
): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "export";
  return `${safe}-${formatShort}${suffix}-${width}x${height}.${ext}`;
}
