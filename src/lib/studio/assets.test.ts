import assert from "node:assert/strict";
import test from "node:test";
import { matchesAssetQuery, migrateAsset, uniqueAssets, upsertAssetList } from "./assets.ts";

const tea = migrateAsset({
  id: "asset_tea",
  name: "夜間茶會",
  category: "event",
  tags: ["茶會", "晚上", "同學互動"],
  source: "seed",
  licenseNotes: "歷屆茶會氣氛參考。",
  seedSrc: "/seed/tea.svg",
});

test("unspaced Drive questions still find the tea ceremony photo", () => {
  assert.equal(matchesAssetQuery(tea, "找以前晚上的茶會照片"), true);
  assert.equal(matchesAssetQuery(tea, "茶會"), true);
  assert.equal(matchesAssetQuery(tea, "龜龜"), false);
});

test("addAsset upserts by id instead of duplicating", () => {
  const once = upsertAssetList([tea], { ...tea, licenseNotes: "Google Drive / 2025 茶會" });
  const twice = upsertAssetList(once, { ...tea, tags: [...tea.tags, "drive"] });
  assert.equal(once.filter((item) => item.id === "asset_tea").length, 1);
  assert.equal(twice.filter((item) => item.id === "asset_tea").length, 1);
  assert.equal(twice[0]?.id, "asset_tea");
  assert.ok(twice[0]?.tags.includes("drive"));
  assert.ok(twice[0]?.tags.includes("茶會"));
  assert.equal(uniqueAssets([tea, tea]).length, 1);
});
