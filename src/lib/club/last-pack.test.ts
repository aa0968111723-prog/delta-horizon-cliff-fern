import assert from "node:assert/strict";
import test from "node:test";
import { fallbackHeroThumb, formatIdFromKind, kindAspectClass, lastPackFromPlan, lastPackPreviewSrc, persistablePack, withCanvaExport, withPackKind } from "./last-pack.ts";

test("lastPackFromPlan keeps hook, caption, and a public hero fallback", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_1",
    campaignId: "camp_1",
    eventName: "茶會",
    plan: {
      hook: "最近是不是連休息都覺得有罪惡感？",
      captions: [{ style: "學生版", text: "下週茶會。人到了就好。" }],
      hashtags: ["#淡江禪學社", "#淡江"],
    },
    kind: "carousel",
    directionName: "安靜的晚上",
    updatedAt: 1,
  });
  assert.equal(pack.hook, "最近是不是連休息都覺得有罪惡感？");
  assert.equal(pack.caption, "下週茶會。人到了就好。");
  assert.equal(pack.heroAssetId, null);
  assert.equal(pack.heroThumb, "/seed/tea.svg");
  assert.equal(pack.kind, "carousel");
  assert.equal(fallbackHeroThumb("浮游禪光"), "/seed/tricolor.svg");
  assert.equal(formatIdFromKind("story"), "story");
  assert.equal(formatIdFromKind("reels"), "reels-cover");
  assert.equal(kindAspectClass("story"), "aspect-[9/16]");
  assert.equal(kindAspectClass("carousel"), "aspect-[4/5]");
});

test("withPackKind keeps the hero and swaps convert pages", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_1",
    campaignId: "camp_1",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    heroAssetId: "asset_hero",
    packs: {
      story: [{ heading: "張 1", body: "今晚先坐", visual: "9:16" }],
      reels: [{ heading: "0–3 秒", body: "Hook", visual: "封面" }],
    },
    formatAssetIds: { story: "asset_story", reels: "asset_reels" },
    updatedAt: 1,
  });
  const next = withPackKind(pack, "story");
  assert.equal(next.kind, "story");
  assert.equal(next.heroAssetId, "asset_story");
  assert.equal(next.converted[0]?.heading, "張 1");
  const reels = withPackKind(next, "reels");
  assert.equal(reels.heroAssetId, "asset_reels");
  assert.equal(lastPackPreviewSrc(reels, { asset_reels: "blob:reels" }), "blob:reels");
  assert.equal(lastPackPreviewSrc(pack, { asset_story: "blob:story" }, "story"), "blob:story");
});

test("persistablePack drops data-url thumbs and keeps https Canva exports", () => {
  const pack = lastPackFromPlan({
    projectId: "p",
    campaignId: "c",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    heroThumb: "data:image/svg+xml;charset=utf-8,x",
    formatPublicUrls: {
      "ig-post": "https://export-download.canva.com/hero.jpg",
      story: "data:image/jpeg;base64,xx",
    },
    canvaEditUrl: "https://www.canva.com/design/tea/edit",
    canvaExportUrl: "https://export-download.canva.com/hero.jpg",
    updatedAt: 1,
  });
  const saved = persistablePack(pack);
  assert.equal(saved?.heroThumb, "/seed/tea.svg");
  assert.equal(saved?.formatPublicUrls?.["ig-post"], "https://export-download.canva.com/hero.jpg");
  assert.equal(saved?.formatPublicUrls?.story, undefined);
  assert.equal(saved?.canvaExportUrl, "https://export-download.canva.com/hero.jpg");
  assert.equal(saved?.canvaEditUrl, "https://www.canva.com/design/tea/edit");
});

test("lastPackPreviewSrc prefers the generated asset url", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_1",
    campaignId: "camp_1",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    heroAssetId: "asset_hero",
    formatPublicUrls: { "ig-post": "https://export-download.canva.com/tea.jpg" },
    updatedAt: 1,
  });
  assert.equal(lastPackPreviewSrc(pack, { asset_hero: "blob:hero" }), "blob:hero");
  assert.equal(lastPackPreviewSrc(pack, {}), "https://export-download.canva.com/tea.jpg");
});

test("withCanvaExport stores the public export url on the current format", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_tea",
    campaignId: "camp_tea",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    updatedAt: 1,
  });
  const next = withCanvaExport(pack, {
    id: "DAF123",
    editUrl: "https://www.canva.com/design/tea/edit",
    exportUrl: "https://export-download.canva.com/tea.jpg",
  });
  assert.equal(next.canvaDesignId, "DAF123");
  assert.equal(next.canvaExportUrl, "https://export-download.canva.com/tea.jpg");
  assert.equal(next.formatPublicUrls?.["ig-post"], "https://export-download.canva.com/tea.jpg");
});
