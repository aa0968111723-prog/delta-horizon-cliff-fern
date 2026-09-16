import type { CreativeHit } from "./search.ts";

function sourceLabel(source: CreativeHit["source"]) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "本機／品牌記憶";
}

function abstract(hit: CreativeHit): string {
  if (hit.source === "canva") return "抽配色、層級與留白，不要整張沿用。";
  if (hit.source === "instagram") return "學自己的 Hook 與 Caption 長度。";
  if (hit.source === "drive") return "用現場空氣與人，不要海報牆。";
  if (hit.source === "generated") return "當氣氛參考，再往學生生活靠。";
  return "當氣氛參考。";
}

/** Prefer the source the user came from, without making them pick files first. */
export function pickSourceRefs(mode: string, hits: CreativeHit[]): CreativeHit[] {
  if (mode === "from-canva") return hits.filter((h) => h.source === "canva").slice(0, 4);
  if (mode === "from-drive") return hits.filter((h) => h.source === "drive").slice(0, 4);
  if (mode === "from-ig") return hits.filter((h) => h.source === "instagram").slice(0, 4);
  if (mode === "from-image") return hits.filter((h) => h.source === "generated" || h.source === "local").slice(0, 4);
  return hits.slice(0, 6);
}

/** Style brief for generators — continue DNA, never duplicate the old poster. */
export function styleFromHits(hits: CreativeHit[]): string {
  if (!hits.length) return "延續淡江禪學社 DNA，不要複製舊作品。";
  const bits = hits.slice(0, 6).map((hit) => `${sourceLabel(hit.source)}「${hit.title}」：${abstract(hit)}`);
  bits.push("延續品牌 DNA，不要直接複製舊作品。");
  return bits.join(" ");
}
