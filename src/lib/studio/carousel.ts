import { formatById } from "./formats.ts";
import { uid } from "./ids.ts";
import type {
  Artboard,
  CampaignPlan,
  CarouselPagePlan,
  CarouselPageRole,
  CopyDeck,
  FormatId,
  Layer,
  TemplateId,
  TextLayer,
} from "./types.ts";

export const CAROUSEL_SEQUENCE: {
  role: CarouselPageRole;
  templateId: TemplateId;
  eyebrow: string;
  label: string;
  hint: string;
}[] = [
  { role: "cover", templateId: "quote", eyebrow: "COVER", label: "封面", hint: "Hook 先行，活動名可小" },
  { role: "problem", templateId: "quote", eyebrow: "ISSUE", label: "痛點", hint: "為什麼現在要看" },
  { role: "detail", templateId: "editorial", eyebrow: "FOCUS", label: "重點", hint: "內容與規格" },
  { role: "proof", templateId: "product", eyebrow: "PROOF", label: "案例", hint: "現場或證明" },
  { role: "cta", templateId: "offer", eyebrow: "NOW", label: "行動", hint: "時間地點 CTA" },
  { role: "close", templateId: "quote", eyebrow: "NOTE", label: "結尾", hint: "一句話收束" },
];

export const CAROUSEL_ROLES: CarouselPageRole[] = CAROUSEL_SEQUENCE.map((item) => item.role);

export const PAGE_ROLE_LABEL: Record<CarouselPageRole, string> = {
  cover: "封面",
  problem: "痛點",
  detail: "重點",
  proof: "案例",
  cta: "行動",
  close: "結尾",
};

export const ADAPT_FORMATS: FormatId[] = [
  "feed-square",
  "feed-portrait",
  "story",
  "reels-cover",
  "threads",
  "line",
];

export function isCarouselRole(value: unknown): value is CarouselPageRole {
  return typeof value === "string" && (CAROUSEL_ROLES as string[]).includes(value);
}

export function roleTemplate(role?: CarouselPageRole, fallback: TemplateId = "editorial"): TemplateId {
  return CAROUSEL_SEQUENCE.find((item) => item.role === role)?.templateId ?? fallback;
}

export function roleEyebrow(role?: CarouselPageRole, coverEyebrow = ""): string {
  if (!role || role === "cover") return coverEyebrow || "EVENT";
  return CAROUSEL_SEQUENCE.find((item) => item.role === role)?.eyebrow ?? role.toUpperCase();
}

export function typeScaleFor(formatId: FormatId): number {
  if (formatId === "story" || formatId === "reels-cover") return 1.2;
  if (formatId === "feed-landscape") return 0.62;
  if (formatId === "feed-square" || formatId === "threads" || formatId === "line") return 0.94;
  return 1;
}

export function innerFrame(formatId: FormatId) {
  const format = formatById(formatId);
  return {
    x: format.safe.left,
    y: format.safe.top,
    w: format.width - format.safe.left - format.safe.right,
    h: format.height - format.safe.top - format.safe.bottom,
  };
}

export function mapBoxToFormat(
  box: { x: number; y: number; w: number; h: number },
  from: FormatId,
  to: FormatId,
) {
  const src = innerFrame(from);
  const dst = innerFrame(to);
  const relX = src.w ? (box.x - src.x) / src.w : 0;
  const relY = src.h ? (box.y - src.y) / src.h : 0;
  const relW = src.w ? box.w / src.w : 1;
  const relH = src.h ? box.h / src.h : 1;
  return {
    x: Math.round(dst.x + relX * dst.w),
    y: Math.round(dst.y + relY * dst.h),
    w: Math.max(24, Math.round(relW * dst.w)),
    h: Math.max(24, Math.round(relH * dst.h)),
  };
}

export function remapLayerToFormat(layer: Layer, from: FormatId, to: FormatId): Layer {
  const box = mapBoxToFormat(layer, from, to);
  if (layer.type === "text") {
    const scale = typeScaleFor(to) / typeScaleFor(from);
    return {
      ...layer,
      id: uid("ly"),
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      fontSize: Math.max(14, Math.min(120, Math.round(layer.fontSize * scale))),
    };
  }
  return {
    ...layer,
    id: uid("ly"),
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
  };
}

export function copyFromArtboard(artboard: Artboard, fallback?: CopyDeck): CopyDeck {
  const texts: Partial<Record<TextLayer["role"], string>> = {};
  for (const layer of artboard.layers) {
    if (layer.type !== "text" || layer.role === "custom") continue;
    if (!texts[layer.role]) texts[layer.role] = layer.text;
  }
  return {
    eyebrow: texts.eyebrow ?? fallback?.eyebrow ?? "",
    headline: texts.headline ?? fallback?.headline ?? "",
    subhead: texts.subhead ?? fallback?.subhead ?? "",
    body: texts.body ?? fallback?.body ?? "",
    cta: texts.cta ?? fallback?.cta ?? "",
    handle: texts.handle ?? fallback?.handle ?? "",
    caption: fallback?.caption ?? "",
    hashtags: fallback?.hashtags ?? [],
    altText: fallback?.altText ?? "",
  };
}

export function pagePlanFromArtboard(artboard: Artboard, index: number): CarouselPagePlan {
  const copy = copyFromArtboard(artboard);
  const role = artboard.role ?? CAROUSEL_SEQUENCE[index]?.role ?? "detail";
  return {
    role,
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    visualNote: "",
    templateId: artboard.templateId ?? roleTemplate(role),
  };
}

export function stampSlideMeta(pages: Artboard[]): Artboard[] {
  return pages.map((page, index) => {
    const role = page.role ?? CAROUSEL_SEQUENCE[index]?.role;
    return {
      ...page,
      role,
      templateId: page.templateId ?? roleTemplate(role, "editorial"),
    };
  });
}

export function completeCarouselPages(
  pages: CarouselPagePlan[],
  fallback: {
    headline: string;
    subhead: string;
    body: string;
    cta: string;
    hook?: string;
    insight?: string;
    templateId?: TemplateId;
  },
): CarouselPagePlan[] {
  const byRole = new Map<CarouselPageRole, CarouselPagePlan>();
  for (const page of pages) {
    if (!byRole.has(page.role)) byRole.set(page.role, page);
  }
  const unnamed = pages.filter((page) => !isCarouselRole(page.role));
  return CAROUSEL_SEQUENCE.map((seq, index) => {
    const existing = byRole.get(seq.role) ?? unnamed[index];
    if (existing) {
      return {
        ...existing,
        role: seq.role,
        templateId: existing.templateId || seq.templateId,
      };
    }
    const defaults: Record<CarouselPageRole, Pick<CarouselPagePlan, "headline" | "subhead" | "body">> = {
      cover: { headline: fallback.hook || fallback.headline, subhead: fallback.headline, body: fallback.hook || fallback.body },
      problem: {
        headline: "為什麼現在看",
        subhead: fallback.insight || fallback.subhead,
        body: fallback.insight || fallback.body,
      },
      detail: { headline: fallback.body || fallback.headline, subhead: fallback.subhead, body: fallback.body },
      proof: { headline: fallback.subhead || fallback.headline, subhead: fallback.subhead, body: fallback.body },
      cta: { headline: fallback.cta, subhead: fallback.subhead, body: fallback.hook || fallback.body },
      close: { headline: fallback.hook || fallback.headline, subhead: fallback.subhead, body: fallback.cta },
    };
    const slot = defaults[seq.role];
    return {
      role: seq.role,
      headline: slot.headline,
      subhead: slot.subhead,
      body: slot.body,
      cta: fallback.cta,
      visualNote: seq.hint,
      templateId: seq.templateId,
    };
  });
}

export function copyForCarouselPage(base: CopyDeck, page: CarouselPagePlan, plan?: CampaignPlan): CopyDeck {
  return {
    ...base,
    eyebrow: roleEyebrow(page.role, base.eyebrow),
    headline: page.headline || base.headline,
    subhead: page.subhead || base.subhead,
    body: page.body || base.body,
    cta: page.cta || plan?.cta || base.cta,
  };
}
