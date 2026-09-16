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

/** 全套帶走時的文案檔名。同一則內容的貼文、Threads、LINE、Reels 腳本都在裡面。 */
export function packCaptionsFilename(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "export";
  return `${safe}-全套文案.txt`;
}
