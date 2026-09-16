import assert from "node:assert/strict";
import test from "node:test";
import { collectUsedAssetIds, migrateAsset } from "./assets.ts";
import { emptyBrandMemory } from "./brand.ts";
import type { BrandKit, Project } from "./types.ts";

test("migrateAsset keeps Drive / Canva / IG sources and insight", () => {
  const next = migrateAsset({
    id: "a1",
    name: "茶會現場",
    source: "drive",
    insight: {
      summary: "夜間教室",
      subjects: ["茶杯"],
      palette: ["#2B2B36"],
      mood: "靜",
      studentFit: 80,
      brandFit: 70,
      stopPower: 60,
      warnings: [],
      suggestions: [],
      analyzedAt: 1,
      source: "mock",
    },
    externalRef: { provider: "drive", id: "file-1", label: "茶會/" },
  });
  assert.equal(next.source, "drive");
  assert.equal(next.insight?.summary, "夜間教室");
  assert.equal(next.externalRef?.provider, "drive");
});

test("collectUsedAssetIds includes covers, logos, and mascot", () => {
  const brand = {
    id: "b",
    logoAssetId: "logo",
    logos: [{ id: "l1", name: "mark", assetId: "mark", usage: "mark" }],
    memory: { ...emptyBrandMemory(), mascotAssetId: "gugu" },
  } as BrandKit;
  const project = {
    artboards: {
      "feed-portrait": {
        layers: [{ type: "image", assetId: "on-canvas" }],
        background: { assetId: null },
      },
    },
    slides: {},
  } as unknown as Project;
  const ids = collectUsedAssetIds([project], [brand], [
    { coverAssetId: "cover-1" },
    { coverAssetId: null, reels: [{ assetId: "reel-shot" }] },
  ]);
  assert.equal(ids.has("logo"), true);
  assert.equal(ids.has("mark"), true);
  assert.equal(ids.has("gugu"), true);
  assert.equal(ids.has("on-canvas"), true);
  assert.equal(ids.has("cover-1"), true);
  assert.equal(ids.has("reel-shot"), true);
});
