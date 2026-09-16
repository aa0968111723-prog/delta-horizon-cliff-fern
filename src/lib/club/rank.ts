export type RankableHit = {
  title: string;
  subtitle?: string;
  notes?: string;
  caption?: string;
  tags?: string[];
};

export function hitText(item: RankableHit) {
  return [item.title, item.subtitle, item.notes, item.caption, ...(item.tags ?? [])].join(" ").toLowerCase();
}

export function searchKeys(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const cleaned = q.replace(/的照片|照片|素材|檔案|文宣|幫我|一下|找/g, " ");
  const parts = cleaned.split(/\s+/).filter((part) => part.length >= 1 && !["適合", "相關", "以前"].includes(part));
  return parts.length ? parts : [q];
}

export function fuzzyMatch(blob: string, part: string) {
  if (part.includes("茶") && blob.includes("茶")) return true;
  if ((part.includes("龜") || part.includes("turtle")) && blob.includes("龜")) return true;
  if (part.includes("浮游") && blob.includes("浮游")) return true;
  if (part.includes("光") && blob.includes("三色")) return true;
  if (part.includes("晚上") && (blob.includes("夜") || blob.includes("晚"))) return true;
  if (part.includes("互動") && blob.includes("互動")) return true;
  if (part.includes("主視覺") && blob.includes("主視覺")) return true;
  return false;
}

export function matchHit(item: RankableHit, query: string) {
  const keys = searchKeys(query);
  if (!keys.length) return true;
  const blob = hitText(item);
  return keys.some((part) => blob.includes(part) || fuzzyMatch(blob, part));
}

export function hitScore(item: RankableHit, query: string) {
  const q = query.trim().toLowerCase();
  const keys = searchKeys(query);
  const blob = hitText(item);
  let n = 0;
  if (q && item.title.toLowerCase().includes(q)) n += 5;
  if (item.tags?.some((tag) => q.includes(tag.toLowerCase()) || tag.toLowerCase().includes(q))) n += 3;
  if (q && (item.notes || "").toLowerCase().includes(q)) n += 1;
  n += keys.reduce((sum, part) => sum + (blob.includes(part) || fuzzyMatch(blob, part) ? 2 : 0), 0);
  return n;
}

export function rankHits<T extends RankableHit>(items: T[], query: string): T[] {
  return [...items].sort((a, b) => hitScore(b, query) - hitScore(a, query));
}
