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

export const CLUB_TERMS = [
  "浮游禪光",
  "三色光",
  "茶會",
  "龜龜",
  "主視覺",
  "招生",
  "互動",
  "晚上",
  "夜間",
  "淡水",
  "校園",
  "海報",
  "同學",
  "圍坐",
  "carousel",
  "限動",
  "story",
];

export function clubTagsFromText(text: string) {
  const blob = text.toLowerCase();
  const tags = CLUB_TERMS.filter((term) => blob.includes(term.toLowerCase()));
  if (/夜|晚/.test(text) && !tags.includes("晚上")) tags.push("晚上");
  if (/龜|turtle/i.test(text) && !tags.includes("龜龜")) tags.push("龜龜");
  if (/茶|tea/i.test(text) && !tags.includes("茶會")) tags.push("茶會");
  return [...new Set(tags)];
}

export function searchKeys(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const cleaned = q.replace(/的照片|照片|素材|檔案|文宣|幫我|一下|找以前|找/g, " ");
  const parts = cleaned
    .split(/\s+/)
    .filter((part) => part.length >= 1 && !["適合", "相關", "以前", "有很多", "同學"].includes(part));
  const terms = CLUB_TERMS.filter((term) => q.includes(term.toLowerCase()));
  const keys = [...new Set([...terms, ...parts])].filter(Boolean);
  return keys.length ? keys : [q];
}

export function fuzzyMatch(blob: string, part: string) {
  if (part.includes("茶") && blob.includes("茶")) return true;
  if ((part.includes("龜") || part.includes("turtle")) && blob.includes("龜")) return true;
  if (part.includes("浮游") && blob.includes("浮游")) return true;
  if (part.includes("光") && blob.includes("三色")) return true;
  if (part.includes("晚上") && (blob.includes("夜") || blob.includes("晚"))) return true;
  if ((part.includes("互動") || part.includes("同學")) && (blob.includes("互動") || blob.includes("圍坐"))) return true;
  if (part.includes("主視覺") && (blob.includes("主視覺") || blob.includes("海報"))) return true;
  if (/\big\b|instagram/.test(part) && (blob.includes("主視覺") || blob.includes("ig") || blob.includes("海報"))) return true;
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
