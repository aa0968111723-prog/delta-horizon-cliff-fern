import assert from "node:assert/strict";
import test from "node:test";
import { riskOf } from "./actions.ts";
import { interpretMock, isRecognizedPlan, UNRECOGNIZED_SUMMARY } from "./edit-mock.ts";
import type { EditorScene } from "./scene.ts";

function scene(over: Partial<EditorScene> = {}): EditorScene {
  return {
    projectId: "proj_seed",
    projectName: "九月單品",
    formatId: "feed-portrait",
    formatName: "直式貼文",
    width: 1080,
    height: 1350,
    slideIndex: 0,
    slideCount: 2,
    templateId: "product",
    selectedId: null,
    copy: {
      eyebrow: "SEPTEMBER",
      headline: "這個月只烘一個產地",
      subhead: "茉莉、佛手柑、蜂蜜尾韻",
      body: "淺中焙，水洗處理。",
      cta: "到店手沖",
      handle: "@tku.zen",
    },
    brief: {
      eventName: "九月單品・耶加雪菲",
      schedule: "2026年9月櫃上",
      location: "商管大樓 B302",
      audience: "都市咖啡愛好者",
      style: "沉靜",
    },
    brand: {
      name: "淡江大學禪學社",
      handle: "@tku.zen",
      website: "淡江大學禪學社",
      voice: "沉靜",
      colors: [
        { hex: "#1A1814", role: "ink", label: "墨" },
        { hex: "#F4E6D4", role: "background", label: "亞麻" },
        { hex: "#B85C38", role: "accent", label: "赤陶" },
      ],
      forbiddenWords: ["爆款"],
      ctas: ["到店手沖", "立刻報名"],
    },
    layers: [
      {
        id: "ly_img",
        name: "主視覺",
        type: "image",
        x: 0,
        y: 0,
        w: 1080,
        h: 756,
        assetId: "asset_cup",
        locked: false,
        hidden: false,
      },
      {
        id: "ly_headline",
        name: "標題",
        type: "text",
        role: "headline",
        x: 72,
        y: 848,
        w: 936,
        h: 200,
        text: "這個月只烘一個產地",
        fontSize: 64,
        align: "left",
        locked: false,
        hidden: false,
      },
      {
        id: "ly_cta_bg",
        name: "CTA 底",
        type: "shape",
        x: 72,
        y: 1198,
        w: 240,
        h: 64,
        locked: false,
        hidden: false,
      },
      {
        id: "ly_cta",
        name: "CTA",
        type: "text",
        role: "cta",
        x: 72,
        y: 1198,
        w: 240,
        h: 64,
        text: "到店手沖",
        fontSize: 22,
        locked: false,
        hidden: false,
      },
      {
        id: "ly_logo",
        name: "Logo",
        type: "logo",
        x: 928,
        y: 1182,
        w: 72,
        h: 72,
        locked: false,
        hidden: false,
      },
    ],
    assets: [
      { id: "asset_cup", name: "手沖杯", category: "photo", kind: "image" },
      { id: "asset_beans", name: "烘焙豆", category: "background", kind: "image" },
    ],
    ...over,
  };
}

test("eight example commands produce real canvas actions from the current scene", () => {
  const current = scene();

  const enlarge = interpretMock("把標題放大並移到上方中央", current);
  assert.equal(enlarge.risk, "small");
  assert.ok(enlarge.actions.some((a) => a.type === "update-layer" && a.layerId === "ly_headline"));
  assert.ok(enlarge.actions.some((a) => a.type === "align-layer" && a.mode === "safe-center"));
  assert.ok(enlarge.actions.some((a) => a.type === "align-layer" && a.mode === "safe-top"));
  const size = enlarge.actions.find((a) => a.type === "update-layer");
  assert.ok(size && size.type === "update-layer" && (size.patch.fontSize ?? 0) > 64);

  const photo = interpretMock("將這張圖換成比較明亮的照片", current);
  assert.equal(photo.risk, "small");
  assert.equal(photo.actions[0]?.type, "replace-image");
  assert.ok(photo.actions[0]?.type === "replace-image" && photo.actions[0].assetId === "asset_beans");

  const lively = interpretMock("把整體改成淡江學生喜歡的活潑風格", current);
  assert.equal(lively.risk, "large");
  assert.ok(lively.actions.some((a) => a.type === "set-background"));
  assert.ok(lively.actions.some((a) => a.type === "update-layer"));

  const story = interpretMock("轉成限時動態尺寸", current);
  assert.equal(story.actions[0]?.type, "set-format");
  assert.ok(story.actions[0]?.type === "set-format" && story.actions[0].formatId === "story");

  const del = interpretMock("刪除左下角資訊", current);
  assert.ok(del.actions.length >= 2);
  assert.ok(del.actions.every((a) => a.type === "delete-layer"));
  assert.ok(del.actions.some((a) => a.type === "delete-layer" && a.layerId === "ly_cta"));
  assert.equal(del.risk, "large");

  const qr = interpretMock("增加活動日期與報名 QR Code", current);
  assert.ok(qr.actions.some((a) => a.type === "add-text" && a.text.includes("2026")));
  assert.ok(qr.actions.some((a) => a.type === "add-qr"));

  const space = interpretMock("讓畫面更有留白", current);
  assert.equal(space.actions[0]?.type, "whitespace");

  const versions = interpretMock("產生三個不同排版版本", current);
  assert.equal(versions.risk, "large");
  assert.equal(versions.actions[0]?.type, "layout-versions");
});

test("already-story command is recognized and does not invent actions", () => {
  const plan = interpretMock("轉成限時動態尺寸", scene({ formatId: "story", formatName: "限時動態" }));
  assert.equal(plan.actions.length, 0);
  assert.equal(isRecognizedPlan(plan), true);
  assert.ok(plan.notes?.[0]?.includes("9:16"));
});

test("unknown command stays empty so the UI cannot pretend it finished", () => {
  const plan = interpretMock("幫我寫一首詩", scene());
  assert.equal(plan.summary, UNRECOGNIZED_SUMMARY);
  assert.equal(plan.actions.length, 0);
  assert.equal(isRecognizedPlan(plan), false);
});

test("blank command never mutates", () => {
  const plan = interpretMock("   ", scene());
  assert.equal(plan.actions.length, 0);
});

test("riskOf marks bulk delete and template as large", () => {
  assert.equal(riskOf([{ type: "whitespace", amount: "more" }]), "small");
  assert.equal(riskOf([{ type: "apply-template", templateId: "quote" }]), "large");
  assert.equal(
    riskOf([
      { type: "delete-layer", layerId: "a" },
      { type: "delete-layer", layerId: "b" },
    ]),
    "large",
  );
});

test("brighter photo prefers a real photo over a generated QR icon", () => {
  const plan = interpretMock(
    "將這張圖換成比較明亮的照片",
    scene({
      assets: [
        { id: "asset_qr", name: "掃碼報名", category: "icon", kind: "image" },
        { id: "asset_cup", name: "手沖杯", category: "photo", kind: "image" },
        { id: "asset_beans", name: "烘焙豆", category: "background", kind: "image" },
      ],
    }),
  );
  assert.equal(plan.actions[0]?.type, "replace-image");
  assert.ok(plan.actions[0]?.type === "replace-image" && plan.actions[0].assetId === "asset_beans");
  assert.equal(plan.summary.includes("掃碼"), false);
});
