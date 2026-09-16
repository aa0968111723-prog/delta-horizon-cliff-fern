import { isCarouselRole, PAGE_ROLE_LABEL as ROLE_LABEL } from "./carousel.ts";
import type {
  AssetNeed,
  Brief,
  CampaignPlan,
  CarouselPagePlan,
  DeliverableFlags,
  FormatId,
  PlanVersion,
} from "./types.ts";

export const MAX_PLAN_VERSIONS = 12;

export function emptyDeliverables(): DeliverableFlags {
  return { post: true, story: false, carousel: false, reels: false };
}

export function emptyBrief(): Brief {
  return {
    product: "",
    eventName: "",
    schedule: "",
    location: "",
    offer: "",
    audience: "淡江大學學生，包含新生、住宿生、通勤生，以及最近感到壓力或想認識新朋友的人",
    goal: "awareness",
    features: "",
    style: "明亮、自然、有學生生活感；把禪轉譯成喘口氣、安定與認識自己",
    notes: "先從淡江學生正在經歷的生活情境切入，不說教、不過度宗教、不寫成工整的 AI 金句。",
    deliverables: emptyDeliverables(),
  };
}

export function migrateBrief(raw?: Partial<Brief> | null): Brief {
  const base = emptyBrief();
  if (!raw) return base;
  const eventName = (raw.eventName || raw.product || "").trim();
  return {
    ...base,
    ...raw,
    product: (raw.product || eventName).trim(),
    eventName,
    schedule: raw.schedule ?? "",
    location: raw.location ?? "",
    features: raw.features ?? "",
    style: raw.style ?? "",
    notes: raw.notes ?? "",
    offer: raw.offer ?? "",
    audience: raw.audience ?? "",
    goal: raw.goal ?? "awareness",
    deliverables: { ...emptyDeliverables(), ...(raw.deliverables ?? {}) },
  };
}

export function briefTitle(brief: Brief) {
  return brief.eventName.trim() || brief.product.trim() || "未命名活動";
}

export function formatsFromBrief(brief: Brief, current: FormatId): FormatId[] {
  const d = { ...emptyDeliverables(), ...brief.deliverables };
  if (!d.post && !d.story && !d.carousel && !d.reels) d.post = true;
  const feed: FormatId = current.startsWith("feed") ? current : "feed-portrait";
  const next: FormatId[] = [];
  if (d.post || d.carousel) next.push(feed);
  if (d.story) next.push("story");
  if (d.reels) next.push("reels-cover");
  return [...new Set(next)];
}

function asPages(raw: unknown): CarouselPagePlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Partial<CarouselPagePlan>;
      if (!row.headline) return null;
      return {
        role: isCarouselRole(row.role) ? row.role : "detail",
        headline: row.headline,
        subhead: row.subhead ?? "",
        body: row.body ?? "",
        cta: row.cta ?? "",
        visualNote: row.visualNote ?? "",
        templateId: row.templateId ?? "product",
      };
    })
    .filter((item): item is CarouselPagePlan => Boolean(item));
}

function asNeeds(raw: unknown): AssetNeed[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = item as Partial<AssetNeed>;
      if (!row.title) return null;
      return {
        kind: row.kind ?? "photo",
        title: row.title,
        detail: row.detail ?? "",
        required: row.required ?? true,
      };
    })
    .filter((item): item is AssetNeed => Boolean(item));
}

export function migratePlan(raw?: Partial<CampaignPlan> | null): CampaignPlan | null {
  if (!raw) return null;
  const captions = Array.isArray(raw.captions) ? raw.captions : [];
  return {
    campaignName: raw.campaignName ?? "",
    concept: raw.concept || raw.insight || "",
    insight: raw.insight ?? "",
    hook: raw.hook ?? "",
    visualTheme: raw.visualTheme || raw.colorMood || "",
    visualDirection: raw.visualDirection ?? "",
    templateId: raw.templateId ?? "editorial",
    colorMood: raw.colorMood ?? "",
    eyebrow: raw.eyebrow ?? "",
    headline: raw.headline || raw.hook || raw.campaignName || "",
    subhead: raw.subhead || raw.insight || "",
    body: raw.body || raw.visualDirection || "",
    cta: raw.cta || "了解更多",
    captions,
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    storyBeats: Array.isArray(raw.storyBeats) ? raw.storyBeats : [],
    carouselPages: asPages(raw.carouselPages),
    assetNeeds: asNeeds(raw.assetNeeds),
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist
      : Array.isArray(raw.qaNotes)
        ? raw.qaNotes
        : [],
    altText: raw.altText ?? "",
    qaNotes: Array.isArray(raw.qaNotes) ? raw.qaNotes : [],
    generatedAt: raw.generatedAt ?? Date.now(),
    source: raw.source === "mock" || raw.source === "live" ? raw.source : "live",
  };
}

export function migratePlanVersions(raw: unknown, fallback?: CampaignPlan | null): PlanVersion[] {
  if (Array.isArray(raw) && raw.length) {
    return raw
      .map((item) => {
        const row = item as Partial<PlanVersion>;
        const plan = migratePlan(row.plan);
        if (!plan) return null;
        return {
          id: row.id || `plan_${plan.generatedAt}`,
          createdAt: row.createdAt ?? plan.generatedAt,
          source: row.source ?? plan.source,
          name: row.name || plan.campaignName || "企劃版本",
          plan,
        };
      })
      .filter((item): item is PlanVersion => Boolean(item));
  }
  if (fallback) {
    return [
      {
        id: `plan_${fallback.generatedAt}`,
        createdAt: fallback.generatedAt,
        source: fallback.source,
        name: fallback.campaignName || "初稿",
        plan: fallback,
      },
    ];
  }
  return [];
}

export const DELIVERABLE_OPTIONS: { id: keyof DeliverableFlags; label: string; hint: string }[] = [
  { id: "post", label: "貼文", hint: "1:1 或 4:5 單張" },
  { id: "carousel", label: "輪播", hint: "六頁說完活動" },
  { id: "story", label: "限時動態", hint: "9:16 分鏡" },
  { id: "reels", label: "Reels 封面", hint: "9:16 封面" },
];

export const ASSET_NEED_LABEL: Record<AssetNeed["kind"], string> = {
  photo: "活動照片",
  people: "人物",
  background: "背景",
  logo: "Logo",
  illustration: "插圖",
};

export const PAGE_ROLE_LABEL = ROLE_LABEL;
