import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand } from "./brand.ts";
import { applyKindLayout, convertContent, reelsFromCopy } from "./convert.ts";
import { emptyCopy } from "./copy.ts";
import { pagesOf } from "./layers.ts";
import { buildLayout, extractImageAssetId } from "./layout.ts";
import { uid } from "./ids.ts";
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
  const pages = pagesOf(applyKindLayout(sampleProject(), brand, "carousel"));
  assert.ok(pages.length >= 4, `expected 4+ carousel pages, got ${pages.length}`);
  assert.ok(pages.some((page) => extractImageAssetId(page) === "asset_photo"));
});

test("applyKindLayout turns one photo into a 3-page story", () => {
  const brand = createEmptyBrand("禪學社");
  const next = applyKindLayout(sampleProject(), brand, "story");
  assert.equal(next.activeFormatId, "story");
  assert.ok(pagesOf(next).length >= 3);
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
});

test("reelsFromCopy uses headline and schedule instead of generic mock lines", () => {
  const copy = sampleProject().copy;
  const reels = reelsFromCopy(copy, { schedule: "週三 19:00", location: "商管 B302" });
  assert.equal(reels.hook, "第一次來，會經歷什麼？");
  assert.match(reels.cover, /第一次來/);
  assert.ok(reels.beats[0]?.caption.includes("第一次來"));
  assert.ok(reels.beats.some((beat) => beat.caption.includes("週三") || beat.caption.includes("B302")));
});
