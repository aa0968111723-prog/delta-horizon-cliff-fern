import assert from "node:assert/strict";
import test from "node:test";
import { migrateAsset } from "../studio/assets.ts";
import { relatedAssetsForIdea, relatedNotesFromAssets } from "./related.ts";

const tea = migrateAsset({
  id: "asset_tea",
  name: "夜間茶會",
  category: "event",
  tags: ["茶會", "晚上", "同學互動"],
  source: "seed",
  licenseNotes: "歷屆茶會氣氛參考。",
  seedSrc: "/seed/tea.svg",
});

const turtle = migrateAsset({
  id: "asset_turtle",
  name: "龜龜",
  category: "illustration",
  tags: ["龜龜"],
  source: "seed",
  seedSrc: "/seed/turtle.svg",
});

const drive = migrateAsset({
  id: "asset_drv_tea_2025",
  name: "2025 夜間茶會照片",
  source: "drive",
  tags: ["茶會", "晚上"],
  licenseNotes: "Google Drive / 2025 茶會",
  seedSrc: "/seed/tea.svg",
});

test("tea idea ranks Drive tea photos before turtle", () => {
  const related = relatedAssetsForIdea([turtle, tea, drive], "我要宣傳茶會");
  assert.ok(related.length >= 2);
  assert.equal(related[0]?.id, "asset_drv_tea_2025");
  assert.ok(related.some((item) => item.id === "asset_tea"));
  assert.equal(related.some((item) => item.id === "asset_turtle"), false);
  assert.match(relatedNotesFromAssets(related), /Google Drive \/ 2025 夜間茶會照片/);
});

test("unrelated idea still falls back to seed brand assets", () => {
  const related = relatedAssetsForIdea([turtle, tea], "完全無關的外星主題");
  assert.ok(related.some((item) => item.id === "asset_turtle" || item.id === "asset_tea"));
});
