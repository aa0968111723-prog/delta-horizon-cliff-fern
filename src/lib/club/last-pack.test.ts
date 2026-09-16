import assert from "node:assert/strict";
import test from "node:test";
import { applyReelsClip, fallbackHeroThumb, formatIdFromKind, httpsVideoUrl, ideaFlowRestore, kindAspectClass, lastPackFromPlan, lastPackPreviewSrc, needsPublicRaster, packForScheduleRow, persistablePack, publicReelsCoverUrl, rasterReadyMessage, skipRasterPrep, withCanvaExport, withPackKind, withReelsVideo } from "./last-pack.ts";

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

test("persistablePack keeps the campaign plan so pack UI survives a remount", () => {
  const pack = lastPackFromPlan({
    projectId: "p",
    campaignId: "c",
    eventName: "茶會",
    sourceIdea: "下週有一場茶會",
    plan: {
      campaignName: "茶會",
      hook: "最近是不是很久沒有好好坐下來？",
      captions: [{ style: "學生版", text: "人到了就好。" }],
      hashtags: ["#淡江禪學社"],
      directions: [
        {
          id: "d1",
          name: "安靜的晚上",
          concept: "淡水夜色",
          palette: "暖燈",
          composition: "近景",
          typeDirection: "手寫感",
          imagePrompt: "tea night",
          headline: "最近是不是很久沒有好好坐下來？",
          subhead: "人到了就好",
        },
      ],
    },
    directionName: "安靜的晚上",
    updatedAt: 1,
  });
  const saved = persistablePack(pack);
  assert.equal(saved?.plan?.hook, "最近是不是很久沒有好好坐下來？");
  assert.equal(saved?.sourceIdea, "下週有一場茶會");
  const restored = ideaFlowRestore(saved);
  assert.equal(restored?.idea, "下週有一場茶會");
  assert.equal(restored?.picked.name, "安靜的晚上");
  assert.equal(restored?.plan.hook, "最近是不是很久沒有好好坐下來？");
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

test("needsPublicRaster is true until a Canva or Imagine https raster exists", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_tea",
    campaignId: "camp_tea",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    updatedAt: 1,
  });
  assert.equal(needsPublicRaster(pack), true);
  assert.equal(
    needsPublicRaster({
      ...pack,
      canvaExportUrl: "https://export-download.canva.com/tea.jpg",
    }),
    false,
  );
  assert.equal(
    needsPublicRaster({
      ...pack,
      formatPublicUrls: { "ig-post": "https://imgen.x.ai/tea.png" },
    }),
    false,
  );
  assert.match(rasterReadyMessage(pack), /Canva/);
  assert.match(
    rasterReadyMessage({ ...pack, canvaExportUrl: "https://export-download.canva.com/tea.jpg" }),
    /公開圖/,
  );
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

test("a scheduled wave uses lastPack kind when a pack exists", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_tea",
    campaignId: "camp_tea",
    eventName: "茶會",
    plan: { hook: "最近是不是很久沒有好好坐下來？", captions: [{ style: "學生版", text: "人到了就好。" }], hashtags: ["#淡江禪學社"] },
    kind: "ig-post",
    updatedAt: 1,
  });
  const next = packForScheduleRow(
    { campaignId: "camp_tea", projectId: "proj_tea", title: "預熱 · 浮游禪光", contentKind: "story" },
    pack,
  );
  assert.equal(next.kind, "story");
  assert.equal(next.hook, "最近是不是很久沒有好好坐下來？");
});

test("without a pack, the wave title becomes the publish hook", () => {
  const next = packForScheduleRow(
    { campaignId: "camp_floating_light", projectId: "proj_floating_light", title: "預熱 · 浮游禪光", contentKind: "ig-post" },
    null,
  );
  assert.equal(next.kind, "ig-post");
  assert.equal(next.hook, "預熱 · 浮游禪光");
  assert.equal(next.eventName, "預熱 · 浮游禪光");
});

test("https video urls persist on a reels pack", () => {
  assert.equal(httpsVideoUrl("https://imgen.x.ai/clip.mp4"), "https://imgen.x.ai/clip.mp4");
  assert.equal(httpsVideoUrl("data:video/mp4;base64,xx"), "");
  assert.equal(httpsVideoUrl("https://cdn.example/hero.png"), "");
  const pack = lastPackFromPlan({
    projectId: "proj_tea",
    campaignId: "camp_tea",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    kind: "ig-post",
    formatPublicUrls: { reels: "https://export-download.canva.com/cover.jpg" },
    canvaExportUrl: "https://export-download.canva.com/cover.jpg",
    updatedAt: 1,
  });
  assert.equal(publicReelsCoverUrl(pack), "https://export-download.canva.com/cover.jpg");
  const next = withReelsVideo(pack, { url: "https://imgen.x.ai/clip.mp4", requestId: "job_1" });
  assert.equal(next.kind, "reels");
  assert.equal(next.reelsVideoUrl, "https://imgen.x.ai/clip.mp4");
  assert.equal(next.reelsJobId, "job_1");
  assert.equal(persistablePack(next)?.reelsVideoUrl, "https://imgen.x.ai/clip.mp4");
  assert.equal(skipRasterPrep(pack), false);
  assert.equal(skipRasterPrep(next), true);
  const pending = applyReelsClip(pack, { ok: true, pending: true, requestId: "job_2" });
  assert.equal(pending.videoPending, true);
  assert.equal(pending.pack.reelsJobId, "job_2");
  const ready = applyReelsClip(pack, { ok: true, url: "https://imgen.x.ai/clip.mp4", requestId: "job_3" });
  assert.equal(ready.videoReady, true);
  assert.equal(ready.pack.reelsVideoUrl, "https://imgen.x.ai/clip.mp4");
  const failed = applyReelsClip(pack, { ok: false, error: "生成 Reels 影片需要公開封面 JPG（Canva 匯出或 Imagine）。" });
  assert.equal(failed.videoReady, false);
  assert.match(failed.videoError ?? "", /公開封面/);
});
