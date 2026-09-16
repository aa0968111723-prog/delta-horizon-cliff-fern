import assert from "node:assert/strict";
import test from "node:test";
import { applyBrandToArtboard, brandPalette, normalizeHex } from "./apply-brand.ts";
import { emptyBrandRules, emptyImageStyle, emptyBrandMemory } from "./brand.ts";
import { emptyBoilerplate } from "./boilerplate.ts";
import type { Artboard, BrandKit, Layer } from "./types.ts";

const SHADOW = { enabled: false, x: 0, y: 12, blur: 28, color: "rgba(26,24,20,0.28)" };

function brand(partial: Partial<BrandKit> = {}): BrandKit {
  return {
    id: "brand_zen",
    name: "淡江大學禪學社",
    handle: "@tku_zen",
    website: "",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
    colors: [
      { id: "c1", hex: "#174D49", role: "primary", label: "淡水深綠" },
      { id: "c2", hex: "#D8B86A", role: "secondary", label: "禪光金" },
      { id: "c3", hex: "#F4F1EA", role: "background", label: "霧白" },
      { id: "c4", hex: "#D97A5B", role: "accent", label: "晚霞珊瑚" },
      { id: "c5", hex: "#18312F", role: "ink", label: "深墨綠" },
    ],
    fontDisplay: "Noto Serif TC",
    fontBody: "Noto Sans TC",
    logoAssetId: "asset_tku_zen_logo",
    logos: [{ id: "logo1", name: "三色光", assetId: "asset_tku_zen_logo", usage: "primary" }],
    slogans: [],
    ctas: [],
    imageStyle: emptyImageStyle(),
    rules: emptyBrandRules(),
    boilerplate: emptyBoilerplate(),
    memory: emptyBrandMemory(),
    updatedAt: 1,
    ...partial,
  };
}

function layer(partial: Partial<Layer> & Pick<Layer, "id" | "name" | "type" | "x" | "y" | "w" | "h">): Layer {
  return {
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    radius: 0,
    shadow: SHADOW,
    ...partial,
  } as Layer;
}

function board(layers: Layer[], background = "#F4F1EA"): Artboard {
  return {
    formatId: "feed-portrait",
    background: { type: "solid", color: background },
    layers,
  };
}

test("normalizeHex expands short colors", () => {
  assert.equal(normalizeHex("#abc"), "#AABBCC");
  assert.equal(normalizeHex("174d49"), "#174D49");
});

test("follow remaps primary shapes and background when Brand Memory changes", () => {
  const current = brand();
  const artboard = board([
    layer({
      id: "s1",
      name: "CTA 底",
      type: "shape",
      shape: "pill",
      fill: "#174D49",
      x: 80,
      y: 1100,
      w: 240,
      h: 64,
    }),
    layer({
      id: "t1",
      name: "標題",
      type: "text",
      role: "headline",
      text: "浮游禪光",
      fontFamily: "Noto Serif TC",
      fontWeight: 600,
      fontSize: 64,
      lineHeight: 1.15,
      letterSpacing: -1,
      color: "#18312F",
      align: "left",
      x: 80,
      y: 200,
      w: 800,
      h: 160,
    }),
  ]);
  const nextBrand = brand({
    colors: current.colors.map((color) =>
      color.role === "primary" ? { ...color, hex: "#112233" } : color,
    ),
  });
  const next = applyBrandToArtboard(artboard, nextBrand, current, "follow");
  assert.equal(next.background.color, brandPalette(current).background);
  assert.ok(next.layers.some((layer) => layer.type === "shape" && layer.fill === "#112233"));
  assert.equal(
    next.layers.filter((layer) => layer.type === "shape" && layer.fill === "#174D49").length,
    0,
  );
});

test("force applies fonts, ink, background and seed mark even if colors drifted", () => {
  const current = brand();
  const artboard = board(
    [
      layer({
        id: "t1",
        name: "標題",
        type: "text",
        role: "headline",
        text: "浮游禪光",
        fontFamily: "Georgia",
        fontWeight: 600,
        fontSize: 64,
        lineHeight: 1.15,
        letterSpacing: -1,
        color: "#FF00AA",
        align: "left",
        x: 80,
        y: 200,
        w: 800,
        h: 160,
      }),
      layer({
        id: "logo",
        name: "Logo",
        type: "logo",
        assetId: "old-mark",
        x: 900,
        y: 80,
        w: 96,
        h: 96,
      }),
    ],
    "#111111",
  );
  const nextBrand = brand({
    colors: current.colors.map((color) =>
      color.role === "background" ? { ...color, hex: "#E8F2F0" } : color,
    ),
  });
  const next = applyBrandToArtboard(artboard, nextBrand, current, "force");
  assert.equal(next.background.color, "#E8F2F0");
  const headline = next.layers.find((layer) => layer.type === "text" && layer.role === "headline");
  assert.equal(headline?.type === "text" ? headline.fontFamily : "", "Noto Serif TC");
  assert.equal(headline?.type === "text" ? headline.color : "", brandPalette(nextBrand).ink);
  const logo = next.layers.find((layer) => layer.type === "logo");
  assert.equal(logo?.type === "logo" ? logo.assetId : "", "asset_tku_zen_logo");
});

test("follow leaves a custom fill that is not in the previous palette", () => {
  const current = brand();
  const artboard = board([
    layer({
      id: "s1",
      name: "自訂色塊",
      type: "shape",
      shape: "rect",
      fill: "#00FFAA",
      fromLayout: false,
      x: 0,
      y: 0,
      w: 200,
      h: 200,
    }),
  ]);
  const nextBrand = brand({
    colors: current.colors.map((color) =>
      color.role === "accent" ? { ...color, hex: "#990000" } : color,
    ),
  });
  const next = applyBrandToArtboard(artboard, nextBrand, current, "follow");
  assert.ok(next.layers.some((layer) => layer.type === "shape" && layer.fill === "#00FFAA"));
});
