import { adaptArtboard } from "./adapt.ts";
import {
  CAROUSEL_SEQUENCE,
  completeCarouselPages,
  copyForCarouselPage,
  stampSlideMeta,
} from "./carousel.ts";
import { uid } from "./ids.ts";
import { buildLayout } from "./layout.ts";
import { MAX_SLIDES, pagesOf } from "./layers.ts";
import { pageVisualAsset, visualAssetOf } from "./pack-visual.ts";
import { CONTENT_KIND_META, contentKindLabel, deliverablesForKind, kindUsesPagedLayout } from "./status.ts";
import type { Artboard, BrandKit, ContentKind, CopyDeck, Project, ReelsScript } from "./types.ts";
import { convertCopy } from "./convert-copy.ts";

export { CONVERT_TARGETS, convertCopy, convertTargetLabel, remainingConvertTargets } from "./convert-copy.ts";

function firstLine(text: string): string {
  return text.split("\n").map((line) => line.trim()).filter(Boolean)[0] ?? "";
}

/**
 * 把現有文案拆成 20 秒 Reels 腳本。轉換時沒有再打一次模型，
 * 所以 source 是 mock，但字幕／旁白都來自這則內容，不是寫死的示範句。
 */
export function reelsFromCopy(
  copy: CopyDeck,
  brief: { schedule?: string; location?: string; notes?: string },
): ReelsScript {
  const hook = firstLine(copy.headline) || firstLine(copy.caption) || "先坐一下再說";
  const captionLines = copy.caption.split("\n").map((line) => line.trim()).filter(Boolean);
  const where = [brief.schedule, brief.location].filter(Boolean).join(" ") || copy.subhead;
  const mid = firstLine(copy.body) || copy.subhead || captionLines[1] || "一小時，什麼都不用做";
  return {
    hook,
    cover: `紙白底＋一句「${hook}」，右下角三色光標誌。`,
    beats: [
      {
        range: "0–3 秒",
        visual: "安靜的窗邊或宿舍書桌",
        caption: hook,
        voice: "（無旁白）",
        transition: "畫面變慢",
        asset: "現有主視覺",
      },
      {
        range: "3–7 秒",
        visual: "從捷運站走上坡的第一人稱",
        caption: firstLine(copy.subhead) || captionLines[0] || hook,
        voice: brief.notes || captionLines[0] || hook,
        transition: "推門",
        asset: "校園實拍",
      },
      {
        range: "7–12 秒",
        visual: "坐墊、窗邊光、有人坐下",
        caption: mid.slice(0, 28),
        voice: copy.body || "不用盤腿，不用信什麼。",
        transition: "淡入",
        asset: "活動照片",
      },
      {
        range: "12–17 秒",
        visual: "時間地點大字",
        caption: where || copy.subhead || copy.cta,
        voice: copy.subhead || where,
        transition: "切黑",
        asset: "時間地點字卡",
      },
      {
        range: "17–20 秒",
        visual: "紙白底大字＋三色光",
        caption: copy.cta || "來坐一下",
        voice: copy.cta || "來坐一下",
        transition: "停格",
        asset: "三色光標誌",
      },
    ],
    createdAt: Date.now(),
    source: "mock",
  };
}

function storyPages(source: Project, brand: BrandKit, copy: CopyDeck): Artboard[] {
  const imageAssetId = visualAssetOf(source);
  const beats: { headline: string; subhead: string; body: string; cta: string }[] = [
    { headline: copy.headline, subhead: copy.subhead, body: "", cta: "" },
    {
      headline: copy.subhead || copy.body.split("\n")[0] || copy.headline,
      subhead: source.brief.schedule,
      body: source.brief.location,
      cta: "",
    },
    { headline: copy.cta || "來坐一下", subhead: source.brief.schedule, body: source.brief.location, cta: copy.cta },
  ];
  return stampSlideMeta(
    beats.map((beat, index) => {
      const coverTemplate = imageAssetId ? "product" : "quote";
      const board = buildLayout(
        "story",
        {
          ...copy,
          eyebrow: index === 0 ? copy.eyebrow : index === 1 ? "INFO" : "NOW",
          headline: beat.headline,
          subhead: beat.subhead,
          body: beat.body,
          cta: beat.cta,
        },
        brand,
        index === 2 ? "offer" : index === 0 ? coverTemplate : "editorial",
        { imageAssetId },
      );
      board.role = index === 0 ? "cover" : index === 2 ? "cta" : "detail";
      board.templateId = index === 2 ? "offer" : index === 0 ? coverTemplate : "editorial";
      return board;
    }),
  );
}

/** 從一張圖做成輪播時，一頁主視覺不能當成已經寫好的五頁腳本。 */
function photoCarouselFallback(copy: CopyDeck, brief: Project["brief"]) {
  const hook = firstLine(copy.caption) || firstLine(copy.headline) || "先坐一下再說";
  return {
    headline: hook,
    subhead: copy.subhead.trim() || "不用盤腿，不用信什麼",
    body: copy.body.trim() || "一小時，什麼都不用做。",
    cta: copy.cta.trim() || "來坐一下",
    hook,
    insight: brief.notes || brief.features || "每天都在趕，沒有一段時間是自己的",
    templateId: "product" as const,
  };
}

function carouselPages(source: Project, brand: BrandKit, copy: CopyDeck): Artboard[] {
  const existing = pagesOf(source);
  const imageAssetId = visualAssetOf(source);
  const fromPhoto = existing.length <= 1;
  const plans = completeCarouselPages(
    fromPhoto
      ? []
      : existing.map((page, i) => ({
          role: page.role ?? CAROUSEL_SEQUENCE[i]?.role ?? "detail",
          headline: copy.headline,
          subhead: copy.subhead,
          body: copy.body,
          cta: copy.cta,
          visualNote: "",
          templateId: page.templateId ?? source.templateId,
        })),
    fromPhoto
      ? photoCarouselFallback(copy, source.brief)
      : {
          headline: copy.headline,
          subhead: copy.subhead,
          body: copy.body,
          cta: copy.cta,
          hook: firstLine(copy.caption) || copy.headline,
          insight: source.brief.notes || source.brief.offer,
          templateId: source.templateId,
        },
  ).slice(0, Math.min(5, MAX_SLIDES));

  return stampSlideMeta(
    plans.map((page, i) => {
      const board = buildLayout(
        "feed-portrait",
        copyForCarouselPage(copy, page, source.plan ?? undefined),
        brand,
        page.templateId,
        { imageAssetId: pageVisualAsset(existing[i] ?? existing[0]) ?? imageAssetId },
      );
      board.role = page.role;
      board.templateId = page.templateId;
      return board;
    }),
  );
}

/**
 * 把現有畫面依內容型態重組成限動／輪播頁。從一張圖做成輪播時也走這裡。
 */
export function applyKindLayout(project: Project, brand: BrandKit, kind: ContentKind): Project {
  const meta = CONTENT_KIND_META[kind];
  const copy = convertCopy(project.copy, kind);
  let pages: Artboard[];
  if (kind === "story") {
    pages = storyPages(project, brand, copy);
  } else if (kindUsesPagedLayout(kind)) {
    pages = carouselPages(project, brand, copy);
  } else {
    const sourcePage = pagesOf(project)[0];
    pages = [
      sourcePage
        ? adaptArtboard(sourcePage, meta.formatId, brand, {
            templateId: kind === "line" ? "offer" : project.templateId,
            copy,
          })
        : buildLayout(meta.formatId, copy, brand, kind === "line" ? "offer" : project.templateId),
    ];
  }
  return {
    ...project,
    copy,
    contentKind: kind,
    activeFormatId: meta.formatId,
    slides: { ...project.slides, [meta.formatId]: pages },
    artboards: { ...project.artboards, [meta.formatId]: pages[0]! },
    slideIndex: 0,
    brief: {
      ...project.brief,
      deliverables: deliverablesForKind(kind),
    },
    reels:
      kind === "reels" && !project.reels
        ? reelsFromCopy(copy, {
            schedule: project.brief.schedule,
            location: project.brief.location,
            notes: project.brief.notes,
          })
        : project.reels,
  };
}
export function convertContent(source: Project, brand: BrandKit, kind: ContentKind): Project {
  const meta = CONTENT_KIND_META[kind];
  const copy = convertCopy(source.copy, kind);
  const now = Date.now();
  const next: Project = {
    ...structuredClone(source),
    id: uid("proj"),
    name: `${source.name} · ${meta.label}`,
    createdAt: now,
    updatedAt: now,
    status: "making",
    contentKind: kind,
    scheduledAt: null,
    publishedAt: null,
    exports: [],
    copy,
    sources: [
      ...(source.sources ?? []),
      { kind: "local", label: `從「${source.name}」轉換`, detail: contentKindLabel(source.contentKind) },
    ],
    convertedFromId: source.convertedFromId ?? source.id,
  };

  let pages: Artboard[];
  if (kind === "carousel") {
    pages = carouselPages(source, brand, copy);
  } else if (kind === "story") {
    pages = storyPages(source, brand, copy);
  } else if (kind === "reels") {
    const cover = adaptArtboard(pagesOf(source)[0] ?? buildLayout(meta.formatId, copy, brand, "quote"), "reels-cover", brand, {
      templateId: "quote",
      copy,
    });
    pages = [cover];
    if (!next.reels) {
      next.reels = reelsFromCopy(copy, {
        schedule: source.brief.schedule,
        location: source.brief.location,
        notes: source.brief.notes,
      });
    }
  } else {
    const sourcePage = pagesOf(source)[0];
    pages = [
      sourcePage
        ? adaptArtboard(sourcePage, meta.formatId, brand, { templateId: kind === "line" ? "offer" : source.templateId, copy })
        : buildLayout(meta.formatId, copy, brand, kind === "line" ? "offer" : source.templateId),
    ];
  }

  next.activeFormatId = meta.formatId;
  next.slides = { ...next.slides, [meta.formatId]: pages };
  next.artboards = { ...next.artboards, [meta.formatId]: pages[0] };
  next.slideIndex = 0;
  next.brief = {
    ...next.brief,
    deliverables: deliverablesForKind(kind),
  };
  return next;
}
