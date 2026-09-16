import { emptyBrief } from "../studio/brief.ts";
import type { Brief, CampaignPlan, CreativeDirection, SourceRef } from "../studio/types.ts";
import type { MemoryItem } from "./memory.ts";
import type { ParsedIdea } from "./idea.ts";

export type FoundGroup = {
  key: string;
  items: MemoryItem[];
};

export function briefFromIdea(parsed: ParsedIdea, extraNotes = ""): Brief {
  return {
    ...emptyBrief(),
    eventName: parsed.eventName,
    product: parsed.eventName,
    schedule: `${parsed.date} ${parsed.time}`,
    location: parsed.location,
    audience: parsed.audience,
    features: parsed.raw.slice(0, 400),
    notes: extraNotes || parsed.raw,
    style: "學生生活感，不要宗教、不要說教、不要金句堆疊",
    deliverables: { post: true, story: true, carousel: true, reels: true },
  };
}

export function flattenHits(groups: Record<string, MemoryItem[] | undefined>): MemoryItem[] {
  return Object.values(groups)
    .flatMap((list) => list ?? [])
    .filter((item, index, all) => all.findIndex((row) => row.id === item.id) === index);
}

export function summarizeFound(groups: Record<string, MemoryItem[] | undefined>) {
  const counts = [
    ["drive", "Google Drive"],
    ["canva", "Canva"],
    ["instagram", "Instagram"],
    ["generated", "AI Generated"],
    ["brand", "Brand Memory"],
  ] as const;
  const parts = counts
    .map(([key, label]) => {
      const n = groups[key]?.length ?? 0;
      return n ? `${label} ${n}` : "";
    })
    .filter(Boolean);
  const found = flattenHits(groups).length;
  return {
    found,
    line: found ? `找到 ${found} 個相關素材` : "先用社團 Creative Memory 繼續",
    detail: parts.join(" · "),
  };
}

export function notesFromHits(parsed: ParsedIdea, hits: MemoryItem[], styleMemory: string[] = []) {
  const lines = hits.slice(0, 8).map((item) => `- ${item.subtitle} — ${item.title}：${item.notes}`);
  const canva = hits.filter((item) => item.source === "canva").slice(0, 2);
  const ig = hits.filter((item) => item.source === "instagram").slice(0, 2);
  return [
    `使用者想法：${parsed.raw}`,
    styleMemory[0] ? `記住的風格：${styleMemory.slice(0, 2).join("／")}` : "",
    "已找到相關素材（延續品牌 DNA，不要複製舊作品）：",
    ...(lines.length ? lines : ["- Brand Memory / 龜龜與三色光"]),
    canva.length ? `Canva 風格：延續配色與留白，不要複製舊排版。${canva.map((item) => item.title).join("、")}` : "",
    ig.length ? `IG DNA：先學 Hook 與停留感。${ig.map((item) => item.title).join("、")}` : "",
    "目標客群是淡江大學學生，不是抽象年輕人。",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1200);
}

export function sourcesFromHits(hits: MemoryItem[]): SourceRef[] {
  const brand: SourceRef = { kind: "brand", label: "Brand Memory / 龜龜與三色光" };
  const fromHits = hits.slice(0, 8).map((item) => ({
    kind: item.source,
    label: item.subtitle,
    id: item.id,
  }));
  return [brand, ...fromHits].filter(
    (item, index, all) => all.findIndex((row) => row.kind === item.kind && row.label === item.label) === index,
  );
}

export function mergePlanSources(plan: CampaignPlan, hits: MemoryItem[]): CampaignPlan {
  const extra = sourcesFromHits(hits);
  const existing = plan.sources ?? [];
  const sources = [...extra, ...existing].filter(
    (item, index, all) => all.findIndex((row) => `${row.kind}:${row.label}` === `${item.kind}:${item.label}`) === index,
  );
  return { ...plan, sources };
}

export function applyPickedDirection(plan: CampaignPlan, direction: CreativeDirection): CampaignPlan {
  return {
    ...plan,
    visualTheme: `${direction.palette}。${direction.composition}`,
    visualDirection: `${direction.concept} 構圖：${direction.composition}。字：${direction.typeDirection}。Prompt：${direction.imagePrompt}`,
    colorMood: direction.palette,
    headline: direction.headline || plan.headline,
    subhead: direction.subhead || plan.subhead,
    directions: plan.directions,
  };
}
