import assert from "node:assert/strict";
import test from "node:test";
import { hitScore, matchHit, rankHits, searchKeys } from "./rank.ts";

test("unspaced Drive questions still keep tea and night keys", () => {
  const keys = searchKeys("找以前晚上的茶會照片");
  assert.ok(keys.includes("茶會"));
  assert.ok(keys.includes("晚上"));
  assert.ok(searchKeys("找有龜龜的素材").includes("龜龜"));
  assert.ok(searchKeys("找適合 IG 主視覺的照片").some((key) => key.includes("主視覺") || key === "ig"));
});

test("night tea ranks tea photos above a generic campus file", () => {
  const ranked = rankHits(
    [
      { title: "校園空景", subtitle: "Google Drive", tags: ["校園"], notes: "" },
      { title: "2025 夜間茶會照片", subtitle: "Google Drive / 2025 茶會", tags: ["茶會", "晚上"], notes: "很多人圍坐" },
      { title: "招生簡章", subtitle: "Canva", tags: ["招生"], notes: "" },
    ],
    "晚上的茶會照片",
  );
  assert.equal(ranked[0]?.title.includes("茶會"), true);
  assert.equal(matchHit({ title: "茶會海報", tags: ["茶會"] }, "晚上的茶會"), true);
  assert.ok(hitScore({ title: "2025 夜間茶會照片", tags: ["茶會", "晚上"] }, "茶會") > hitScore({ title: "校園空景", tags: ["校園"] }, "茶會"));
});
