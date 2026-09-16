import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand, migrateBrand, brandMemoryBlock } from "./brand.ts";
import { inferCategory, matchesAssetQuery, migrateAsset } from "./assets.ts";
import { validateAssetFile } from "./asset-upload.ts";

test("migrateBrand fills slogans, logos, image style and rules", () => {
  const next = migrateBrand({
    id: "brand_x",
    name: "測試",
    handle: "@x",
    logoAssetId: "asset_1",
    forbiddenWords: ["爆款"],
  } as Parameters<typeof migrateBrand>[0]);
  assert.equal(next.name, "測試");
  assert.equal(next.logos.length, 1);
  assert.equal(next.logos[0].assetId, "asset_1");
  assert.equal(next.logoAssetId, "asset_1");
  assert.deepEqual(next.slogans, []);
  assert.equal(next.imageStyle.mood, "");
  assert.equal(next.rules.noWatermark, true);
  assert.deepEqual(next.forbiddenWords, ["爆款"]);
});

test("createEmptyBrand has usable defaults", () => {
  const brand = createEmptyBrand("  ");
  assert.equal(brand.name, "未命名品牌");
  assert.ok(brand.colors.some((c) => c.role === "primary"));
  assert.ok(brand.colors.some((c) => c.role === "background"));
  assert.equal(brand.fontDisplay, "Noto Serif TC");
  assert.equal(brand.ctas.length, 0);
});

test("inferCategory reads kind and tags", () => {
  assert.equal(inferCategory({ kind: "logo", name: "mark" }), "logo");
  assert.equal(inferCategory({ kind: "pattern", name: "paper" }), "background");
  assert.equal(inferCategory({ name: "店員人像", tags: ["人物"] }), "people");
  assert.equal(inferCategory({ name: "手沖杯", tags: ["商品"] }), "photo");
});

test("migrateAsset infers category and local source", () => {
  const next = migrateAsset({
    id: "asset_x",
    name: "背景木紋",
    kind: "image",
    mime: "image/jpeg",
    width: 100,
    height: 80,
    tags: ["背景"],
    createdAt: 1,
  });
  assert.equal(next.category, "background");
  assert.equal(next.source, "upload");
  assert.equal(next.favorite, false);
  assert.equal(next.useCount, 0);
});

test("spoken asset search finds 龜龜 without the filename", () => {
  const turtle = migrateAsset({
    id: "asset_turtle",
    name: "社團吉祥物",
    kind: "image",
    mime: "image/png",
    width: 100,
    height: 100,
    tags: ["龜龜"],
    createdAt: 1,
  });
  assert.equal(matchesAssetQuery(turtle, "找有龜龜的素材"), true);
  assert.equal(matchesAssetQuery(turtle, "茶會照片"), false);
});

test("brand memory block is Traditional Chinese and names the club motifs", () => {
  const brand = migrateBrand({
    id: "brand_zen",
    name: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "口語、先生活",
    doSay: "淡江、淡水、坐下來",
    dontSay: "誠摯邀請",
    forbiddenWords: ["誠摯邀請", "年輕人"],
    slogans: ["先坐下來。"],
    ctas: ["晚上來坐一下"],
    imageStyle: {
      mood: "夜間暖光",
      lighting: "三色光",
      paletteHint: "霧亞麻",
      composition: "下半留白",
      do: "龜龜、茶杯",
      dont: "香爐特寫",
    },
  } as Parameters<typeof migrateBrand>[0]);
  const block = brandMemoryBlock(brand);
  assert.ok(block.includes("Brand Memory"));
  assert.ok(block.includes("龜龜"));
  assert.ok(block.includes("三色光"));
  assert.equal(block.includes("Z世代"), false);
  assert.ok(block.includes("不要說"));
});

test("validateAssetFile rejects empty, huge and non-image files", () => {
  const empty = new File([], "blank.png", { type: "image/png" });
  assert.equal(validateAssetFile(empty)?.code, "empty");

  const pdf = new File([new Uint8Array([1, 2, 3])], "brief.pdf", { type: "application/pdf" });
  assert.equal(validateAssetFile(pdf)?.code, "format");

  const huge = new File([new Uint8Array(8 * 1024 * 1024 + 12)], "hero.jpg", { type: "image/jpeg" });
  assert.equal(validateAssetFile(huge)?.code, "too-large");

  const ok = new File([new Uint8Array([1, 2, 3, 4])], "cup.jpg", { type: "image/jpeg" });
  assert.equal(validateAssetFile(ok), null);
});
