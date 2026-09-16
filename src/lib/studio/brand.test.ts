import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand, formatBrandMemory, migrateBrand, toggleLegacyAssetId } from "./brand.ts";
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
  assert.ok(next.memory);
  assert.equal(next.memory.mascotName, "");
  assert.ok(Array.isArray(next.memory.lights));
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
  assert.equal(inferCategory({ name: "龜龜揮手", tags: ["吉祥物"] }), "mascot");
  assert.equal(inferCategory({ name: "淡水河", tags: ["夕陽"] }), "campus");
  assert.equal(inferCategory({ name: "迎新海報", tags: ["文宣"] }), "poster");
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

test("formatBrandMemory names marked legacy assets so the model can see 歷屆文宣", () => {
  const memory = migrateBrand({
    id: "brand_x",
    name: "測試",
    memory: {
      mission: "給淡江學生一個可以坐下來的地方。",
      legacyAssetIds: ["asset_gugu", "asset_dusk"],
    },
  } as Parameters<typeof migrateBrand>[0]).memory;
  const text = formatBrandMemory(memory, [
    { id: "asset_gugu", name: "龜龜" },
    { id: "asset_dusk", name: "淡水河傍晚" },
  ]);
  assert.match(text, /歷屆文宣：龜龜、淡水河傍晚/);
  assert.match(text, /淡江學生/);
  assert.deepEqual(toggleLegacyAssetId(["asset_gugu"], "asset_dusk"), ["asset_gugu", "asset_dusk"]);
  assert.deepEqual(toggleLegacyAssetId(["asset_gugu", "asset_dusk"], "asset_gugu"), ["asset_dusk"]);
});

test("migrateBrand keeps an IG reading without inventing one", () => {
  const empty = migrateBrand({ id: "b", name: "x" } as Parameters<typeof migrateBrand>[0]);
  assert.equal(empty.memory.igReading, undefined);
  const withReading = migrateBrand({
    id: "b",
    name: "x",
    memory: {
      igReading: {
        voice: "像學長姐在說話",
        continueWith: ["開頭用生活提問"],
        avoid: ["不要編造數字"],
        nextPost: "寫一篇有時間地點的社課邀請",
        analyzedAt: 1,
        sampleCount: 3,
        adapter: "live",
      },
    },
  } as Parameters<typeof migrateBrand>[0]);
  assert.equal(withReading.memory.igReading?.adapter, "live");
  assert.equal(withReading.memory.igReading?.voice, "像學長姐在說話");
});
