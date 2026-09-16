import assert from "node:assert/strict";
import test from "node:test";
import { fallbackHeroThumb, formatIdFromKind, kindAspectClass, lastPackFromPlan, lastPackPreviewSrc, persistablePack, withPackKind } from "./last-pack.ts";

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

test("persistablePack drops data-url thumbs", () => {
  const pack = lastPackFromPlan({
    projectId: "p",
    campaignId: "c",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    heroThumb: "data:image/svg+xml;charset=utf-8,x",
    updatedAt: 1,
  });
  assert.equal(persistablePack(pack)?.heroThumb, "/seed/tea.svg");
});

test("lastPackPreviewSrc prefers the generated asset url", () => {
  const pack = lastPackFromPlan({
    projectId: "proj_1",
    campaignId: "camp_1",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [], hashtags: [] },
    heroAssetId: "asset_hero",
    updatedAt: 1,
  });
  assert.equal(lastPackPreviewSrc(pack, { asset_hero: "blob:hero" }), "blob:hero");
  assert.equal(lastPackPreviewSrc(pack, {}), "/seed/tea.svg");
});
