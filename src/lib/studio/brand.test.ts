import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand, migrateBrand } from "./brand.ts";
import { inferCategory, migrateAsset } from "./assets.ts";
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
