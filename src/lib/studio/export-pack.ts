export function safePackStem(name: string) {
  const stem = name.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "-").trim().slice(0, 40);
  return stem || "export";
}

export function publishPackManifest(stem: string, formatShort: string, pageCount: number) {
  const pages = Math.max(1, pageCount);
  const format = formatShort.replace(/[\\/:*?"<>|]/g, "-");
  return {
    noteName: `${stem}-publish.txt`,
    imageNames: Array.from({ length: pages }, (_, index) => (
      pages > 1 ? `${stem}-${format}-p${index + 1}.png` : `${stem}-${format}.png`
    )),
    zipName: `${stem}-publish-pack.zip`,
  };
}
