import assert from "node:assert/strict";
import test from "node:test";
import { migrateAsset } from "../studio/assets.ts";
import { matchAssetNeed } from "./needs.ts";

const logo = migrateAsset({
  id: "logo-1",
  name: "三色光標誌",
  kind: "logo",
  category: "logo",
  tags: ["Logo", "龜龜"],
  createdAt: 1,
});

const crowd = migrateAsset({
  id: "people-1",
  name: "夜間茶會社員互動",
  category: "people",
  tags: ["茶會", "同學"],
  createdAt: 1,
});

test("asset needs match local library by kind and wording, never invent files", () => {
  const logoHits = matchAssetNeed(
    { kind: "logo", title: "三色光標誌", detail: "小尺寸放角落。", required: true },
    [logo, crowd],
  );
  assert.equal(logoHits[0]?.id, "logo-1");
  const empty = matchAssetNeed(
    { kind: "photo", title: "淡江傍晚校園", detail: "有空氣感", required: true },
    [logo, crowd],
  );
  assert.equal(empty.length, 0);
});
