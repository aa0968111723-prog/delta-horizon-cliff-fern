import { adaptArtboard } from "./adapt.ts";
import {
  CAROUSEL_SEQUENCE,
  completeCarouselPages,
  copyForCarouselPage,
  stampSlideMeta,
} from "./carousel.ts";
import { convertCopy } from "./convert-copy.ts";
import { uid } from "./ids.ts";
import { buildLayout, extractImageAssetId } from "./layout.ts";
import { MAX_SLIDES, pagesOf } from "./layers.ts";
import { CONTENT_KIND_META, contentKindLabel } from "./status.ts";
import type { Artboard, BrandKit, ContentKind, CopyDeck, Project } from "./types.ts";

export { CONVERT_TARGETS, convertCopy, convertTargetLabel } from "./convert-copy.ts";

function storyPages(source: Project, brand: BrandKit, copy: CopyDeck): Artboard[] {
  const imageAssetId = extractImageAssetId(pagesOf(source)[0]);
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
        index === 2 ? "offer" : index === 0 ? "quote" : "editorial",
        { imageAssetId },
      );
      board.role = index === 0 ? "cover" : index === 2 ? "cta" : "detail";
      return board;
    }),
  );
}

function carouselPages(source: Project, brand: BrandKit, copy: CopyDeck): Artboard[] {
  const existing = pagesOf(source);
  const imageAssetId = extractImageAssetId(existing[0]);
  const plans = completeCarouselPages(
    existing.map((page, i) => ({
      role: page.role ?? CAROUSEL_SEQUENCE[i]?.role ?? "detail",
      headline: copy.headline,
      subhead: copy.subhead,
      body: copy.body,
      cta: copy.cta,
      visualNote: "",
      templateId: page.templateId ?? source.templateId,
    })),
    {
      headline: copy.headline,
      subhead: copy.subhead,
      body: copy.body,
      cta: copy.cta,
      hook: source.copy.caption.split("\n")[0],
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
        { imageAssetId: extractImageAssetId(existing[i] ?? existing[0]) ?? imageAssetId },
      );
      board.role = page.role;
      board.templateId = page.templateId;
      return board;
    }),
  );
}

/**
 * 從一則內容做出另一則，不覆蓋原本的。
 * 文案會依型態改寫（限動變短、Threads 變口語、LINE 強調時間地點）。
 */
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
      next.reels = {
        hook: copy.headline.split("\n")[0] || copy.headline,
        cover: `紙白底＋「${copy.headline.split("\n")[0] || copy.headline}」，右下角三色光。`,
        beats: [
          {
            range: "0–3 秒",
            visual: "安靜的宿舍或窗邊",
            caption: copy.headline.split("\n")[0] || copy.headline,
            voice: "（無旁白）",
            transition: "畫面變慢",
            asset: "現有主視覺",
          },
          {
            range: "3–12 秒",
            visual: copy.body || "社課現場",
            caption: copy.subhead,
            voice: copy.body,
            transition: "淡入時間地點",
            asset: "活動照片",
          },
          {
            range: "12–20 秒",
            visual: "時間地點大字",
            caption: copy.cta,
            voice: copy.cta,
            transition: "停格",
            asset: "三色光標誌",
          },
        ],
        createdAt: Date.now(),
        source: "mock",
      };
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
    deliverables: {
      post: kind === "ig-post",
      story: kind === "story" || kind === "countdown",
      carousel: kind === "carousel" || kind === "knowledge" || kind === "qa",
      reels: kind === "reels",
    },
  };
  return next;
}
