import type { PosterInput, PosterVariation } from "./poster.ts";
import type { CarouselPagePlan, ScheduleItem } from "../studio/types.ts";

const PAGE_VARIATION: PosterVariation[] = ["composition", "mood", "background", "style", "text", "composition"];

const PAGE_ROLE: Record<string, string> = {
  cover: "封面 Hook",
  problem: "情境",
  detail: "痛點",
  proof: "活動內容",
  cta: "CTA",
  close: "收束",
};

export function carouselPageLine(page: Pick<CarouselPagePlan, "role" | "headline">, index: number) {
  const role = PAGE_ROLE[page.role] ?? page.role;
  return `第 ${index + 1} 頁 ${role}：${page.headline.replace(/\n/g, " ")}`;
}

/** Cover must be the student hook, not the event name (spec §17). */
export function studentCoverHeadline(current: string, hook: string, eventName?: string) {
  const headline = current.trim();
  const student = hook.trim();
  if (!student) return headline;
  if (!headline) return student;
  const event = (eventName ?? "").trim();
  if (event && (headline === event || headline === event.slice(0, 10))) return student;
  if (/[？?]/.test(student) && !/[？?]/.test(headline)) return student;
  return headline;
}

export function zenCarouselPages(opts: {
  hook: string;
  name: string;
  when: string;
  where: string;
  audience?: string;
  insight?: string;
  features?: string;
  cta: string;
}): CarouselPagePlan[] {
  const { hook, name, when, where, cta } = opts;
  const audience = opts.audience || "淡江學生";
  const insight = opts.insight || "課表很滿的時候，人其實只是想坐一下。";
  const features = opts.features || `${name}是一個可以坐下的晚上。`;
  const whenWhere = [when, where].filter(Boolean).join(" · ");
  return [
    {
      role: "cover",
      headline: hook,
      subhead: "封面 Hook",
      body: insight,
      cta,
      visualNote: "封面只放學生問句，不要活動名。",
      templateId: "quote",
    },
    {
      role: "problem",
      headline: "最近很滿嗎",
      subhead: audience,
      body: insight,
      cta,
      visualNote: "情境：課表、宿舍、淡水晚上。",
      templateId: "quote",
    },
    {
      role: "detail",
      headline: "想慢一點",
      subhead: "痛點",
      body: insight,
      cta,
      visualNote: "痛點：壓力、趕、沒地方坐下來。",
      templateId: "editorial",
    },
    {
      role: "proof",
      headline: name,
      subhead: when,
      body: features,
      cta,
      visualNote: "活動內容：時間、地點、做什麼。",
      templateId: "product",
    },
    {
      role: "cta",
      headline: cta,
      subhead: whenWhere,
      body: whenWhere,
      cta,
      visualNote: "CTA 頁只留時間地點。",
      templateId: "offer",
    },
    {
      role: "close",
      headline: "想找人一起",
      subhead: when,
      body: "可以自己來，也可以揪人。",
      cta,
      visualNote: "收束：可以傳給朋友。",
      templateId: "quote",
    },
  ];
}

export function carouselPagesFromPlan(plan: {
  hook: string;
  campaignName: string;
  insight?: string;
  body?: string;
  cta: string;
  subhead?: string;
  carouselPages?: CarouselPagePlan[];
}): CarouselPagePlan[] {
  const listed = (plan.carouselPages ?? []).filter((page) => page.headline.trim());
  const fallback = zenCarouselPages({
    hook: plan.hook,
    name: plan.campaignName,
    when: plan.subhead || "",
    where: "",
    insight: plan.insight,
    features: plan.body,
    cta: plan.cta,
  });
  const pages = listed.length >= 5 ? listed.slice(0, 6) : listed.length ? listed : fallback;
  const filled = pages.length >= 5 ? pages : [...pages, ...fallback.slice(pages.length)].slice(0, 6);
  return filled.map((page, index) =>
    index === 0 || page.role === "cover"
      ? {
          ...page,
          headline: studentCoverHeadline(page.headline, plan.hook, plan.campaignName),
        }
      : page,
  );
}

export function carouselPosterInput(
  page: Pick<CarouselPagePlan, "headline" | "subhead" | "body" | "visualNote">,
  index: number,
  opts?: { title?: string; name?: string; hook?: string; palette?: string },
): PosterInput {
  const headline =
    index === 0 ? studentCoverHeadline(page.headline, opts?.hook || page.headline, opts?.title) : page.headline.trim();
  return {
    headline: headline || opts?.title || "最近是不是很久沒坐好",
    subhead: page.subhead || page.body,
    concept: page.visualNote,
    name: opts?.name,
    palette: opts?.palette || "靜水、琥珀點",
    width: 1080,
    height: 1350,
    variation: PAGE_VARIATION[index % PAGE_VARIATION.length],
  };
}

export function encodedCarouselIds(item: { slideAssetIds?: string[] } | undefined) {
  const ids = (item?.slideAssetIds ?? []).filter(Boolean);
  return ids.length >= 2 ? ids : [];
}

export function attachCarouselAssets<
  T extends { kind: string; campaignId?: string | null; imageAssetId?: string; slideAssetIds?: string[] },
>(items: T[], assetIds: string[], campaignId?: string | null): T[] {
  if (!campaignId || assetIds.length < 2) return items;
  return items.map((item) =>
    item.kind === "carousel" && item.campaignId === campaignId
      ? { ...item, imageAssetId: assetIds[0], slideAssetIds: assetIds }
      : item,
  );
}

export function carouselRowsForCampaign(
  existing: Array<Pick<ScheduleItem, "id" | "kind" | "campaignId">>,
  campaignId: string,
) {
  return existing.filter((item) => item.kind === "carousel" && item.campaignId === campaignId);
}
