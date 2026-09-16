import assert from "node:assert/strict";
import test from "node:test";
import { applyPackCopyToProject, spreadCopyAcrossPack } from "./pack-copy.ts";
import { createEmptyBrand } from "./brand.ts";
import { convertContent } from "./convert.ts";
import { emptyCopy } from "./copy.ts";
import { pagesOf } from "./layers.ts";
import { buildLayout } from "./layout.ts";
import { visualAssetOf } from "./pack-visual.ts";
import type { Artboard, Brief, CopyDeck, Project } from "./types.ts";

const deck: CopyDeck = {
  eyebrow: "09/24",
  headline: "三分鐘呼吸\n考前也可以用",
  subhead: "9/24（三）19:00",
  body: "商管大樓 B302",
  cta: "來坐一下",
  handle: "@tku.zen",
  caption: "考前很躁的時候，先坐三分鐘。\n\n9/24 晚上七點，商管 B302。",
  hashtags: ["#淡江禪學社"],
  altText: "紙白底海報，大標三分鐘呼吸",
};

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

function project(patch: Partial<Project> & { id: string }): Project {
  return {
    name: patch.id,
    createdAt: 1,
    updatedAt: 1,
    brandId: "brand",
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "making",
    contentKind: "ig-post",
    campaignId: null,
    scheduledAt: null,
    publishedAt: null,
    brief: brief(),
    copy: deck,
    plan: null,
    copyDrafts: [],
    studentReview: null,
    reels: null,
    sources: [],
    artboards: {},
    slides: {},
    slideIndex: 0,
    snapshots: [],
    planVersions: [],
    exports: [],
    ...patch,
  };
}

test("spreadCopyAcrossPack writes LINE and Threads from the same draft", () => {
  const origin = project({ id: "origin", contentKind: "ig-post" });
  const line = project({ id: "line", contentKind: "line", convertedFromId: "origin", updatedAt: 2 });
  const threads = project({ id: "threads", contentKind: "threads", convertedFromId: "origin", updatedAt: 3 });
  const updates = spreadCopyAcrossPack([origin, line, threads], "origin", deck);
  const lineCopy = updates.find((item) => item.projectId === "line")?.copy;
  const threadsCopy = updates.find((item) => item.projectId === "threads")?.copy;
  assert.equal(updates.length, 3);
  assert.ok(lineCopy);
  assert.equal(lineCopy.headline.includes("\n"), false);
  assert.match(lineCopy.caption, /來坐一下/);
  assert.ok(threadsCopy);
  assert.match(threadsCopy.caption, /考前很躁/);
  assert.equal(threadsCopy.eyebrow, "");
});

test("spreadCopyAcrossPack rebuilds a Reels script from the new copy", () => {
  const origin = project({ id: "origin", contentKind: "ig-post" });
  const reels = project({ id: "reels", contentKind: "reels", convertedFromId: "origin", updatedAt: 2 });
  const updates = spreadCopyAcrossPack([origin, reels], "origin", deck);
  const hit = updates.find((item) => item.projectId === "reels");
  assert.ok(hit?.reels);
  assert.match(hit.reels.hook, /三分鐘呼吸|考前很躁/);
  assert.equal(hit.reels.beats.length, 5);
});

test("a lone project still gets one converted copy for its own kind", () => {
  const solo = project({ id: "solo", contentKind: "line" });
  const updates = spreadCopyAcrossPack([solo], "solo", deck);
  assert.equal(updates.length, 1);
  assert.equal(updates[0]?.copy.headline.includes("\n"), false);
  assert.equal(updates[0]?.rebuildLayout, false);
});

test("story and carousel mark rebuildLayout, LINE does not", () => {
  const origin = project({ id: "origin", contentKind: "ig-post" });
  const story = project({ id: "story", contentKind: "story", convertedFromId: "origin", updatedAt: 2 });
  const carousel = project({ id: "carousel", contentKind: "carousel", convertedFromId: "origin", updatedAt: 3 });
  const line = project({ id: "line", contentKind: "line", convertedFromId: "origin", updatedAt: 4 });
  const updates = spreadCopyAcrossPack([origin, story, carousel, line], "origin", deck);
  assert.equal(updates.find((item) => item.projectId === "story")?.rebuildLayout, true);
  assert.equal(updates.find((item) => item.projectId === "carousel")?.rebuildLayout, true);
  assert.equal(updates.find((item) => item.projectId === "line")?.rebuildLayout, false);
  assert.equal(updates.find((item) => item.projectId === "origin")?.rebuildLayout, false);
});

function headlineOf(page: Artboard | undefined): string {
  const layer = page?.layers.find((item) => item.type === "text" && item.role === "headline");
  return layer && layer.type === "text" ? layer.text : "";
}

test("applyPackCopyToProject rebuilds story pages with the new hook and keeps the photo", () => {
  const brand = createEmptyBrand("禪學社");
  const copy = {
    ...emptyCopy(brand.handle, brand.boilerplate),
    headline: "第一次來，會經歷什麼？",
    subhead: "到場、坐下、做什麼",
    cta: "來坐一下",
  };
  const board = buildLayout("feed-portrait", copy, brand, "editorial", { imageAssetId: "asset_photo" });
  const origin: Project = {
    ...project({ id: "origin", brandId: brand.id }),
    copy,
    artboards: { "feed-portrait": board },
    slides: { "feed-portrait": [board] },
  };
  const story = convertContent(origin, brand, "story");
  const nextCopy = { ...story.copy, headline: "考前先坐三分鐘" };
  const rebuilt = applyPackCopyToProject(story, brand, nextCopy);
  assert.match(headlineOf(pagesOf(rebuilt)[0]), /考前先坐三分鐘/);
  assert.match(headlineOf(pagesOf(rebuilt)[2]), /來坐一下/);
  assert.equal(visualAssetOf(rebuilt), "asset_photo");
  assert.ok(pagesOf(rebuilt).length >= 3);
});

