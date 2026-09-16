import assert from "node:assert/strict";
import test from "node:test";
import { applyQaFixToPages } from "./quality-fix.ts";
import { emptyBrandMemory } from "./brand.ts";
import { inspectProject } from "./quality.ts";
import type { Artboard, BrandKit, CopyDeck, TextLayer } from "./types.ts";

const SHADOW = { enabled: false, x: 0, y: 12, blur: 28, color: "rgba(26,24,20,0.28)" };

const brand: BrandKit = {
  id: "b",
  name: "禪學社",
  handle: "@tku.zen",
  website: "",
  voice: "",
  doSay: "",
  dontSay: "",
  forbiddenWords: [],
  colors: [
    { id: "c1", hex: "#2C1810", role: "ink", label: "深焙" },
    { id: "c2", hex: "#F4E6D4", role: "background", label: "亞麻" },
    { id: "c3", hex: "#B85C38", role: "accent", label: "赤陶" },
    { id: "c4", hex: "#1A1814", role: "primary", label: "墨" },
    { id: "c5", hex: "#7A6A58", role: "secondary", label: "褐" },
  ],
  fontDisplay: "serif",
  fontBody: "sans",
  logoAssetId: "logo",
  logos: [],
  slogans: [],
  ctas: ["到店手沖"],
  imageStyle: { mood: "", lighting: "", paletteHint: "", composition: "", do: "", dont: "" },
  rules: { noCompetitorMarks: false, noWatermark: false, noLowRes: false, notes: "" },
  boilerplate: { cta: "到店手沖", disclaimer: "", hashtags: [], captionClose: "" },
  memory: {
    mission: "",
    introShort: "",
    introLong: "",
    mascotName: "",
    mascotLook: "",
    mascotPersonality: "",
    mascotUsage: "",
    lights: [],
    likedStyles: "",
    dislikedStyles: "",
    legacyAssetIds: [],
  },
  updatedAt: 1,
};

const copy: CopyDeck = {
  eyebrow: "",
  headline: "hi",
  subhead: "",
  body: "",
  cta: "",
  handle: "",
  caption: "",
  hashtags: [],
  altText: "",
};

function text(partial: Partial<TextLayer> & Pick<TextLayer, "id" | "name" | "text" | "role" | "fontSize" | "color">): TextLayer {
  return {
    type: "text",
    x: 80,
    y: 200,
    w: 800,
    h: 80,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    fontFamily: "serif",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: 0,
    align: "left",
    shadow: { ...SHADOW },
    ...partial,
  };
}

test("low-contrast headline is a fail with a specific suggestion and a fix", () => {
  const page: Artboard = {
    formatId: "feed-portrait",
    background: { type: "solid", color: "#F4E6D4" },
    role: "cover",
    layers: [
      text({
        id: "h1",
        name: "標題",
        role: "headline",
        text: "衣索比亞",
        fontSize: 64,
        color: "#E8D5C4",
        y: 700,
      }),
    ],
  };
  const report = inspectProject([page], brand, copy);
  const contrast = report.issues.find((i) => i.check === "contrast");
  assert.ok(contrast);
  assert.equal(contrast?.severity, "fail");
  assert.ok(contrast?.location.includes("第 1 頁"));
  assert.ok(contrast?.suggestion.includes("品牌") || contrast?.suggestion.includes("底板"));
  assert.ok(contrast?.fix);
  assert.ok(report.score < 90);
});

test("one-click contrast fix actually changes the text color", () => {
  const page: Artboard = {
    formatId: "feed-square",
    background: { type: "solid", color: "#F4E6D4" },
    layers: [
      text({
        id: "h1",
        name: "標題",
        role: "headline",
        text: "衣索比亞",
        fontSize: 64,
        color: "#E8D5C4",
      }),
    ],
  };
  const report = inspectProject([page], brand, copy);
  const issue = report.issues.find((i) => i.check === "contrast" && i.fix);
  assert.ok(issue?.fix);
  const next = applyQaFixToPages([page], issue!.fix!, brand);
  const layer = next[0].layers.find((l) => l.id === "h1");
  assert.ok(layer && layer.type === "text");
  assert.notEqual(layer.color.toUpperCase(), "#E8D5C4");
});

test("tiny type, missing CTA and stretched image all report with locations", () => {
  const page: Artboard = {
    formatId: "story",
    background: { type: "solid", color: "#F4E6D4" },
    role: "detail",
    layers: [
      text({
        id: "h1",
        name: "標題",
        role: "headline",
        text: "重點",
        fontSize: 18,
        color: "#2C1810",
        y: 40,
        x: 10,
      }),
      {
        id: "img",
        name: "主視覺",
        type: "image",
        x: 0,
        y: 400,
        w: 1080,
        h: 80,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        fromLayout: true,
        assetId: "a",
        objectFit: "cover",
        crop: { x: 50, y: 50, zoom: 1 },
        filter: { brightness: 1, contrast: 1, saturate: 1, blur: 0, grayscale: 0 },
        radius: 0,
        shadow: { ...SHADOW },
      },
    ],
  };
  const report = inspectProject([page], brand, copy);
  assert.ok(report.issues.some((i) => i.check === "type-size"));
  assert.ok(report.issues.some((i) => i.check === "safe"));
  assert.ok(report.issues.some((i) => i.check === "image-stretch"));
  assert.ok(report.issues.some((i) => i.check === "cta"));
  assert.equal(report.checks.length, 13);
});

test("carousel font mismatch is a specific cross-page issue", () => {
  const a: Artboard = {
    formatId: "feed-square",
    background: { type: "solid", color: "#F4E6D4" },
    role: "cover",
    layers: [text({ id: "h1", name: "標題", role: "headline", text: "A", fontSize: 64, color: "#2C1810", fontFamily: "serif" })],
  };
  const b: Artboard = {
    formatId: "feed-square",
    background: { type: "solid", color: "#FFFFFF" },
    role: "detail",
    layers: [text({ id: "h2", name: "標題", role: "headline", text: "B", fontSize: 64, color: "#2C1810", fontFamily: "Comic Sans" })],
  };
  const report = inspectProject([a, b], brand, copy);
  const item = report.issues.find((i) => i.check === "carousel" && i.id === "carousel-font");
  assert.ok(item);
  assert.ok(item?.detail.includes("第 2 頁"));
  assert.equal(item?.fix?.kind, "unify-carousel");
  const next = applyQaFixToPages([a, b], item!.fix!, brand);
  const h2 = next[1].layers.find((l) => l.id === "h2");
  assert.ok(h2 && h2.type === "text");
  assert.equal(h2.fontFamily, "serif");
  assert.equal(next[1].background.color, "#F4E6D4");
});
