import assert from "node:assert/strict";
import test from "node:test";
import { fallbackHeroThumb, lastPackFromPlan, lastPackPreviewSrc } from "./last-pack.ts";

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
