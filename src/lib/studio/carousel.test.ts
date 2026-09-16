import assert from "node:assert/strict";
import test from "node:test";
import {
  CAROUSEL_SEQUENCE,
  completeCarouselPages,
  copyFromArtboard,
  mapBoxToFormat,
  typeScaleFor,
} from "./carousel.ts";
import type { Artboard, TextLayer } from "./types.ts";

test("mapBoxToFormat keeps a bottom 4:5 box visible in 1:1 instead of cropping", () => {
  const mapped = mapBoxToFormat({ x: 72, y: 1200, w: 400, h: 80 }, "feed-portrait", "feed-square");
  assert.ok(mapped.y + mapped.h <= 1080, `expected in-canvas, got y=${mapped.y} h=${mapped.h}`);
  assert.ok(mapped.y > 700, `expected remapped near bottom of 1:1, got y=${mapped.y}`);
});

test("mapBoxToFormat uses story safe area instead of stretching to the top crop", () => {
  const mapped = mapBoxToFormat({ x: 72, y: 80, w: 900, h: 120 }, "feed-portrait", "story");
  assert.ok(mapped.y >= 250, `expected below story safe top, got y=${mapped.y}`);
  assert.ok(mapped.y + mapped.h <= 1920 - 250);
});

test("typeScaleFor enlarges story type and slightly reduces square", () => {
  assert.ok(typeScaleFor("story") > typeScaleFor("feed-portrait"));
  assert.ok(typeScaleFor("feed-square") < typeScaleFor("feed-portrait"));
});

test("completeCarouselPages fills the six-role script", () => {
  const pages = completeCarouselPages(
    [
      {
        role: "cover",
        headline: "九月單品",
        subhead: "櫃上",
        body: "只烘一個產地",
        cta: "查看風味",
        visualNote: "",
        templateId: "product",
      },
    ],
    {
      headline: "九月單品",
      subhead: "櫃上",
      body: "風味三詞",
      cta: "到店手沖",
      hook: "這個月只烘一個產地。",
      insight: "要的是理由不是折扣",
    },
  );
  assert.deepEqual(
    pages.map((page) => page.role),
    CAROUSEL_SEQUENCE.map((item) => item.role),
  );
  assert.equal(pages.length, 6);
  assert.equal(pages[0].headline, "九月單品");
  assert.ok(pages[1].body.includes("理由"));
});

test("copyFromArtboard reads text roles", () => {
  const headline: TextLayer = {
    id: "t1",
    name: "標題",
    type: "text",
    x: 0,
    y: 0,
    w: 100,
    h: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
    fromLayout: true,
    text: "衣索比亞",
    role: "headline",
    fontFamily: "serif",
    fontWeight: 600,
    fontSize: 48,
    lineHeight: 1.2,
    letterSpacing: 0,
    color: "#000",
    align: "left",
  };
  const board: Artboard = {
    formatId: "feed-square",
    background: { type: "solid", color: "#fff" },
    layers: [headline],
  };
  const copy = copyFromArtboard(board);
  assert.equal(copy.headline, "衣索比亞");
});
