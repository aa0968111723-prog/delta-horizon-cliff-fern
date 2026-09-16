import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand } from "./brand.ts";
import { convertContent } from "./convert.ts";
import { emptyCopy } from "./copy.ts";
import { pagesOf } from "./layers.ts";
import { buildLayout } from "./layout.ts";
import { paintAssetOnProject, pageVisualAsset, spreadVisualAcrossPack, visualAssetOf } from "./pack-visual.ts";
import type { Brief, Project } from "./types.ts";

function brief(): Brief {
  return {
    product: "",
    eventName: "浮游禪光",
    schedule: "9/24 19:00",
    location: "商管 B302",
    offer: "",
    audience: "",
    goal: "awareness",
    features: "",
    style: "",
    notes: "",
    deliverables: { post: true, story: false, carousel: false, reels: false },
  };
}

function originWithPhoto(): Project {
  const brand = createEmptyBrand("禪學社");
  const copy = {
    ...emptyCopy(brand.handle, brand.boilerplate),
    headline: "三分鐘呼吸",
    caption: "考前很躁的時候，先坐三分鐘。",
    cta: "來坐一下",
  };
  const board = buildLayout("feed-portrait", copy, brand, "editorial", { imageAssetId: "asset_old" });
  return {
    id: "origin",
    name: "貼文",
    createdAt: 1,
    updatedAt: 1,
    brandId: brand.id,
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "making",
    contentKind: "ig-post",
    campaignId: null,
    scheduledAt: null,
    publishedAt: null,
    brief: brief(),
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

test("visualAssetOf reads the photo on the current page", () => {
  assert.equal(visualAssetOf(originWithPhoto()), "asset_old");
});

test("paintAssetOnProject replaces the photo on every page", () => {
  const brand = createEmptyBrand("禪學社");
  const story = convertContent(originWithPhoto(), brand, "story");
  const painted = paintAssetOnProject(story, "asset_new");
  const pages = pagesOf(painted);
  assert.ok(pages.length >= 3);
  assert.ok(pages.every((page) => pageVisualAsset(page) === "asset_new"));
});

test("spreadVisualAcrossPack skips Threads and keeps LINE plus Reels", () => {
  const brand = createEmptyBrand("禪學社");
  const origin = originWithPhoto();
  const line = convertContent(origin, brand, "line");
  const threads = convertContent(origin, brand, "threads");
  const reels = convertContent(origin, brand, "reels");
  const targets = spreadVisualAcrossPack([origin, line, threads, reels], "origin");
  const ids = targets.map((item) => item.projectId);
  assert.ok(ids.includes("origin"));
  assert.ok(ids.includes(line.id));
  assert.ok(ids.includes(reels.id));
  assert.equal(ids.includes(threads.id), false);
});

test("a lone LINE project still gets one visual target", () => {
  const brand = createEmptyBrand("禪學社");
  const line = { ...convertContent(originWithPhoto(), brand, "line"), id: "solo" };
  const targets = spreadVisualAcrossPack([line], "solo");
  assert.equal(targets.length, 1);
  assert.equal(targets[0]?.projectId, "solo");
});

test("painting a Reels cover writes coverAssetId", () => {
  const brand = createEmptyBrand("禪學社");
  const reels = convertContent(originWithPhoto(), brand, "reels");
  const painted = paintAssetOnProject(reels, "asset_cover");
  assert.equal(painted.reels?.coverAssetId, "asset_cover");
  assert.equal(pageVisualAsset(pagesOf(painted)[0]), "asset_cover");
});
