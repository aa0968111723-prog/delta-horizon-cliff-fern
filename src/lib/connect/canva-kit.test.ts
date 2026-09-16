import assert from "node:assert/strict";
import test from "node:test";
import { buildCanvaKit, canvaCreateBody, canvaDesignType, canvaDesignIdFromEditUrl, canvaReturnTitle, memoryFromCanvaKit } from "./canva-kit.ts";

test("carousel and post use 4:5, not a fake instagramCarousel preset", () => {
  assert.deepEqual(canvaDesignType("carousel"), { type: "custom", width: 1080, height: 1350 });
  assert.deepEqual(canvaDesignType("post"), { type: "custom", width: 1080, height: 1350 });
  assert.deepEqual(canvaDesignType("story"), { type: "preset", name: "instagramStory" });
  assert.deepEqual(canvaDesignType("reels"), { type: "preset", name: "instagramStory" });
});

test("asset upload wins over a blank preset", () => {
  const body = canvaCreateBody({ title: "浮游禪光", kind: "carousel", assetId: "UAFabc" });
  assert.equal(body.asset_id, "UAFabc");
  assert.equal("design_type" in body, false);
});

test("kit is Traditional Chinese and paste-ready", () => {
  const kit = buildCanvaKit({
    campaignName: "浮游禪光",
    hook: "最近是不是很久沒有好好坐下來？",
    caption: "課表有了，人還在趕路。\n9/24 圖書館前。",
    cta: "晚上來坐一下",
    hashtags: ["#淡江禪學社", "#浮游禪光"],
    palette: "霧亞麻、三色光",
    composition: "下半留坐的人",
    imagePrompt: "淡江圖書館前夜間三色光",
    carousel: [{ headline: "很久沒坐好", body: "先呼吸。" }],
  });
  assert.equal(kit.includes("instagramCarousel"), false);
  assert.equal(kit.includes("誠摯邀請"), false);
  assert.ok(kit.includes("Canva 微調清單"));
  assert.ok(kit.includes("浮游禪光"));
  assert.ok(kit.includes("Carousel"));
  assert.ok(kit.includes("晚上來坐一下"));
});

test("kit is saved as Canva Creative Memory, not a hidden copy", () => {
  const kit = buildCanvaKit({
    campaignName: "浮游禪光",
    hook: "最近是不是很久沒有好好坐下來？",
    caption: "課表有了。",
    cta: "晚上來坐一下",
    hashtags: ["#淡江禪學社"],
  });
  const item = memoryFromCanvaKit({
    campaignName: "浮游禪光",
    kit,
    id: "canva_kit_test",
    openUrl: "https://www.canva.com/design/DAFtest/edit",
  });
  assert.equal(item.source, "canva");
  assert.equal(item.sourceLabel, "Canva / 浮游禪光");
  assert.equal(item.openUrl, "https://www.canva.com/design/DAFtest/edit");
  assert.ok(item.summary.includes("Canva"));
});

test("edit URLs keep the Canva design id for taking the image back", () => {
  assert.equal(
    canvaDesignIdFromEditUrl("https://www.canva.com/design/DAFVztcvd9z/edit"),
    "DAFVztcvd9z",
  );
  assert.equal(canvaDesignIdFromEditUrl("https://evil.example/design/nope"), null);
  assert.equal(canvaReturnTitle("浮游禪光"), "浮游禪光 · Canva");
});
