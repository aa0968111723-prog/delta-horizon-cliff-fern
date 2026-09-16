import { BRAND_MOTIFS, CTA_BANK, HASHTAG_BANK } from "./identity.ts";
import type { IgMemoryPost, MemoryItem } from "../creative/types.ts";

export type ClubDna = {
  palette: string;
  motifs: string[];
  voice: string;
  ctas: string[];
  hashtags: string[];
  captionHint: string;
  winningHooks: string[];
  avoid: string[];
  notes: string;
};

export function clubDnaFromMemory(input: {
  igPosts: Pick<IgMemoryPost, "caption" | "saves" | "analysis">[];
  memory: Pick<MemoryItem, "title" | "summary" | "sourceLabel" | "tags">[];
}): ClubDna {
  const ranked = [...input.igPosts].sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0));
  const winningHooks = ranked
    .slice(0, 4)
    .map((post) => post.analysis?.hook || post.caption.split("\n")[0] || "")
    .filter(Boolean);
  const lengths = ranked.map((post) => post.caption.length).filter((n) => n > 0);
  const avg = lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 80;
  const memoryBits = input.memory
    .slice(0, 6)
    .map((item) => `${item.sourceLabel}：${item.title}`)
    .join("；");
  return {
    palette: `霧亞麻 ${BRAND_MOTIFS.colors.linen}、淡水綠 ${BRAND_MOTIFS.colors.water}、三色光 ${BRAND_MOTIFS.colors.amber}/${BRAND_MOTIFS.colors.teal}/${BRAND_MOTIFS.colors.lotus}`,
    motifs: [BRAND_MOTIFS.turtle, BRAND_MOTIFS.lights, "茶杯", "淡水河岸", "校園小路"],
    voice: "口語、短、先生活再活動。像社員在發文，不像海報。",
    ctas: [...CTA_BANK],
    hashtags: [...HASHTAG_BANK],
    captionHint: `自己 IG 平均大約 ${avg} 字。問句 Hook 比社團介紹更容易停。`,
    winningHooks,
    avoid: ["誠摯邀請", "寺廟金", "僧袍", "一開始就講經", "連續招生廣告"],
    notes: memoryBits,
  };
}

export function dnaPromptBlock(dna: ClubDna) {
  return `Zen Club IG DNA：
配色 ${dna.palette}
常用元素 ${dna.motifs.join("、")}
語氣 ${dna.voice}
有效 Hook：${dna.winningHooks.join(" ／ ") || "生活問句"}
${dna.captionHint}
常用 CTA ${dna.ctas.slice(0, 3).join("、")}
不要：${dna.avoid.join("、")}
過去素材：${dna.notes || "品牌記憶"}`;
}
