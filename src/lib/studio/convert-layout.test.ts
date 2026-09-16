import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand } from "./brand.ts";
import { applyKindLayout, convertContent, reelsFromCopy } from "./convert.ts";
import { emptyCopy } from "./copy.ts";
import { pagesOf } from "./layers.ts";
import { buildLayout, extractImageAssetId } from "./layout.ts";
import { uid } from "./ids.ts";
import { paintAssetOnProject } from "./pack-visual.ts";
import { kindUsesPagedLayout } from "./status.ts";
import type { Project } from "./types.ts";

function sampleProject(): Project {
  const brand = createEmptyBrand("禪學社");
  const copy = {
    ...emptyCopy(brand.handle, brand.boilerplate),
    headline: "第一次來，會經歷什麼？",
    caption: "到場、坐下、做什麼、幾點結束。",
    cta: "來坐一下",
  };
  const board = buildLayout("feed-portrait", copy, brand, "editorial", { imageAssetId: "asset_photo" });
  const now = Date.now();
  return {
    id: uid("proj"),
    name: "從圖片開始",
    createdAt: now,
    updatedAt: now,
    brandId: brand.id,
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "making",
    contentKind: "ig-post",
    campaignId: null,
    scheduledAt: null,
    publishedAt: null,
    brief: {
      product: "社課",
      eventName: "社課",
      schedule: "週三 19:00",
      location: "商管 B302",
      offer: "",
      audience: "淡江學生",
      goal: "awareness",
      features: "",
      style: "",
      notes: "",
      deliverables: { post: true, story: false, carousel: false, reels: false },
    },
    copy,
    plan: null,
    copyDrafts: [],
    studentReview: null,
    reels: null,
    sources: [],
    artboards: { "feed-portrait": board },
    slides: { "feed-portrait": [board] },
    slideIndex: 0,
    snapshots: [],
    planVersions: [],
    exports: [],
  };
}

test("applyKindLayout turns one photo into a multi-page carousel", () => {
  const brand = createEmptyBrand("禪學社");
  const next = applyKindLayout(sampleProject(), brand, "carousel");
  const pages = pagesOf(next);
  assert.equal(next.activeFormatId, "feed-portrait");
  assert.equal(pages.length, 5);
  assert.deepEqual(
    pages.map((page) => page.role),
    ["cover", "problem", "detail", "proof", "cta"],
  );
  const headlines = pages.map((page) => {
    const layer = page.layers.find((item) => item.type === "text" && item.role === "headline");
    return layer && layer.type === "text" ? layer.text : "";
  });
  assert.ok(headlines[0]?.includes("到場") || headlines[0]?.includes("第一次來"));
  assert.notEqual(headlines[1], headlines[0]);
  assert.ok(new Set(headlines.filter(Boolean)).size >= 4, `headlines were ${headlines.join(" / ")}`);
  assert.ok(pages.some((page) => extractImageAssetId(page) === "asset_photo"));
});

test("painting then laying out a no-photo page puts the photo on the product cover", () => {
  const brand = createEmptyBrand("禪學社");
  const source = sampleProject();
  const blank = buildLayout("feed-portrait", source.copy, brand, "editorial");
  const unpainted = {
    ...source,
    templateId: "editorial" as const,
    artboards: { "feed-portrait": blank },
    slides: { "feed-portrait": [blank] },
  };
  assert.equal(extractImageAssetId(pagesOf(unpainted)[0]), null);
  const painted = paintAssetOnProject(unpainted, "asset_dusk");
  const next = applyKindLayout(painted, brand, "carousel");
  const cover = pagesOf(next)[0];
  assert.equal(cover?.role, "cover");
  assert.equal(extractImageAssetId(cover), "asset_dusk");
  assert.equal(
    cover?.layers.some((layer) => layer.name === "主視覺色塊"),
    false,
  );
  const stillBlank = applyKindLayout(unpainted, brand, "carousel");
  const blankCover = pagesOf(stillBlank)[0];
  assert.ok(blankCover?.layers.some((layer) => layer.name === "主視覺色塊"));
  const swapped = paintAssetOnProject(stillBlank, "asset_dusk");
  const swappedCover = pagesOf(swapped)[0];
  assert.equal(extractImageAssetId(swappedCover), "asset_dusk");
  assert.equal(
    swappedCover?.layers.some((layer) => layer.name === "主視覺色塊"),
    false,
  );
});

test("applyKindLayout turns one photo into a 3-page story", () => {
  const brand = createEmptyBrand("禪學社");
  const next = applyKindLayout(sampleProject(), brand, "story");
  assert.equal(next.activeFormatId, "story");
  const pages = pagesOf(next);
  assert.ok(pages.length >= 3);
  const cover = pages[0];
  assert.equal(cover?.role, "cover");
  assert.equal(extractImageAssetId(cover), "asset_photo");
  assert.ok(cover?.layers.some((layer) => layer.type === "image" && layer.name === "主視覺"));
  assert.equal(
    cover?.layers.some((layer) => layer.name === "引號"),
    false,
  );
});

test("a story without a photo still uses the quote cover", () => {
  const brand = createEmptyBrand("禪學社");
  const source = sampleProject();
  const blank = buildLayout("feed-portrait", source.copy, brand, "editorial");
  const next = applyKindLayout(
    {
      ...source,
      artboards: { "feed-portrait": blank },
      slides: { "feed-portrait": [blank] },
    },
    brand,
    "story",
  );
  const cover = pagesOf(next)[0];
  assert.ok(cover?.layers.some((layer) => layer.name === "引號"));
  assert.equal(extractImageAssetId(cover), null);
});

test("applyKindLayout turns one photo into a knowledge carousel", () => {
  const brand = createEmptyBrand("禪學社");
  const pages = pagesOf(applyKindLayout(sampleProject(), brand, "knowledge"));
  assert.ok(pages.length >= 4, `expected 4+ knowledge pages, got ${pages.length}`);
  assert.equal(kindUsesPagedLayout("knowledge"), true);
  assert.equal(kindUsesPagedLayout("ig-post"), false);
});

test("convertContent to reels builds beats from the original copy", () => {
  const brand = createEmptyBrand("禪學社");
  const source = sampleProject();
  const next = convertContent(source, brand, "reels");
  assert.equal(next.contentKind, "reels");
  assert.ok(next.reels);
  assert.equal(next.reels.hook, "第一次來，會經歷什麼？");
  assert.ok(next.reels.beats.some((beat) => beat.caption === "來坐一下" || beat.voice.includes("來坐一下")));
  assert.ok(next.reels.beats.some((beat) => /週三|B302|19:00/.test(`${beat.caption}${beat.voice}`)));
  assert.equal(next.reels.beats.length, 5);
  const cover = pagesOf(next)[0];
  assert.equal(cover?.formatId, "reels-cover");
  assert.equal(extractImageAssetId(cover), "asset_photo");
  assert.ok(cover?.layers.some((layer) => layer.type === "image" && layer.name === "主視覺"));
  assert.equal(
    cover?.layers.some((layer) => layer.name === "引號"),
    false,
  );
  assert.match(next.reels.cover, /這張照片當 9:16 封面/);
  assert.equal(next.reels.beats[0]?.visual, "這張照片滿版定格");
});

test("convertContent to reels without a photo keeps the quote cover", () => {
  const brand = createEmptyBrand("禪學社");
  const source = sampleProject();
  const blank = buildLayout("feed-portrait", source.copy, brand, "editorial");
  const next = convertContent(
    {
      ...source,
      artboards: { "feed-portrait": blank },
      slides: { "feed-portrait": [blank] },
    },
    brand,
    "reels",
  );
  const cover = pagesOf(next)[0];
  assert.ok(cover?.layers.some((layer) => layer.name === "引號"));
  assert.equal(extractImageAssetId(cover), null);
  assert.match(next.reels?.cover ?? "", /紙白底/);
});

test("reelsFromCopy uses headline and schedule instead of generic mock lines", () => {
  const copy = sampleProject().copy;
  const reels = reelsFromCopy(copy, { schedule: "週三 19:00", location: "商管 B302" });
  assert.equal(reels.hook, "第一次來，會經歷什麼？");
  assert.match(reels.cover, /第一次來/);
  assert.ok(reels.beats[0]?.caption.includes("第一次來"));
  assert.ok(reels.beats.some((beat) => beat.caption.includes("週三") || beat.caption.includes("B302")));
});

test("convertContent to LINE uses landscape 1.91:1", () => {
  const brand = createEmptyBrand("禪學社");
  const source = sampleProject();
  const next = convertContent(source, brand, "line");
  assert.equal(next.contentKind, "line");
  assert.equal(next.activeFormatId, "feed-landscape");
  assert.ok(pagesOf(next)[0]);
  assert.equal(pagesOf(next)[0]?.formatId, "feed-landscape");
  assert.equal(next.convertedFromId, source.id);
});
