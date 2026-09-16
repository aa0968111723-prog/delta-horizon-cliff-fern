import type { MemoryItem } from "@/lib/creative/types";

export type CanvaKind = "post" | "story" | "carousel" | "reels";

export type CanvaDesignType =
  | { type: "preset"; name: "instagramPost" | "instagramStory" }
  | { type: "custom"; width: number; height: number };

/** Canva Connect 沒有穩定的 carousel preset；主視覺用 4:5，限動／Reels 用 Story。 */
export function canvaDesignType(kind: CanvaKind = "post"): CanvaDesignType {
  if (kind === "story" || kind === "reels") {
    return { type: "preset", name: "instagramStory" };
  }
  return { type: "custom", width: 1080, height: 1350 };
}

export function canvaCreateBody(input: { title: string; kind?: CanvaKind; assetId?: string }) {
  const body: Record<string, unknown> = { title: input.title.slice(0, 80) };
  if (input.assetId) {
    body.asset_id = input.assetId;
    return body;
  }
  body.design_type = canvaDesignType(input.kind);
  return body;
}

export function buildCanvaKit(input: {
  campaignName: string;
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
  palette?: string;
  composition?: string;
  typeDirection?: string;
  imagePrompt?: string;
  carousel?: { headline: string; body: string }[];
}) {
  const pages = (input.carousel ?? [])
    .map((page, index) => `${index + 1}. ${page.headline.replace(/\n/g, " ")}\n${page.body}`)
    .join("\n");
  return [
    "【淡江禪學社 · Canva 微調清單】",
    `活動：${input.campaignName}`,
    `Hook：${input.hook}`,
    "",
    "文案：",
    input.caption.trim(),
    "",
    `CTA：${input.cta}`,
    input.hashtags.join(" "),
    input.palette ? `配色：${input.palette}` : null,
    input.composition ? `構圖：${input.composition}` : null,
    input.typeDirection ? `字：${input.typeDirection}` : null,
    input.imagePrompt ? `Prompt：${input.imagePrompt}` : null,
    pages ? `\nCarousel\n${pages}` : null,
    "",
    "不要變成寺廟金或滿版標語。留空氣，字少，讓淡江學生停下來。",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function canvaDesignIdFromEditUrl(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("canva.com")) return null;
    const match = parsed.pathname.match(/\/design\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function canvaReturnTitle(campaignName: string) {
  return `${campaignName.replace(/\s+/g, " ").slice(0, 24)} · Canva`;
}

export function memoryFromCanvaKit(input: {
  campaignName: string;
  kit: string;
  thumbUrl?: string | null;
  id?: string;
  openUrl?: string | null;
}): MemoryItem {
  return {
    id: input.id ?? `canva_kit_${Date.now()}`,
    source: "canva",
    sourceLabel: `Canva / ${input.campaignName}`,
    title: `${input.campaignName} · 微調清單`,
    kind: "design",
    tags: ["canva", "kit"],
    summary: input.kit.slice(0, 240).replace(/\n+/g, " ").trim(),
    thumbUrl: input.thumbUrl ?? undefined,
    openUrl: input.openUrl ?? undefined,
    createdAt: Date.now(),
  };
}
