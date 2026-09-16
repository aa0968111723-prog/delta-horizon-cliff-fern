import { BRAND_MOTIFS, CTA_BANK, HASHTAG_BANK } from "./identity.ts";
import type { IgMemoryPost, MemoryItem } from "../creative/types.ts";
import { clubInsightsFromPosts } from "./insights.ts";

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
  lessons: string[];
};

export function clubDnaFromMemory(input: {
  igPosts: Pick<IgMemoryPost, "caption" | "saves" | "comments" | "reach" | "likes" | "shares" | "mediaType" | "analysis">[];
  memory: Pick<MemoryItem, "title" | "summary" | "sourceLabel" | "tags">[];
}): ClubDna {
  const insights = clubInsightsFromPosts(input.igPosts);
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
    captionHint: `自己 IG 平均大約 ${insights.avgCaption} 字。${insights.hookLesson}`,
    winningHooks: insights.winningHooks,
    avoid: ["誠摯邀請", "寺廟金", "僧袍", "一開始就講經", "連續招生廣告"],
    notes: memoryBits,
    lessons: insights.answers.concat(insights.mixLesson),
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
過去素材：${dna.notes || "品牌記憶"}
成效學習：
${dna.lessons.join("\n")}`;
}
