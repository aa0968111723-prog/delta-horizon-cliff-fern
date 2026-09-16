import assert from "node:assert/strict";
import test from "node:test";
import { asDriveHits, driveThumb, mergeRanked } from "./hits.ts";

test("Drive files keep a useful thumb and club tags", () => {
  assert.equal(driveThumb({ name: "2024 茶會現場.JPG" }), "/seed/tea.svg");
  assert.equal(driveThumb({ thumbnailLink: "https://lh3.googleusercontent.com/tea.jpg", name: "x" }), "https://lh3.googleusercontent.com/tea.jpg");
  const hits = asDriveHits({
    files: [
      { id: "1", name: "夜間茶會照片", mimeType: "image/jpeg", modifiedTime: "2025-11-12T19:00:00Z" },
      { id: "2", name: "浮游禪光文宣", mimeType: "application/pdf" },
    ],
  });
  assert.equal(hits[0]?.subtitle, "Google Drive / 夜間茶會照片");
  assert.ok(hits[0]?.tags.includes("茶會"));
  assert.equal(hits[1]?.thumb, "/seed/tricolor.svg");
});

test("live Canva results for tea stay above generic memory when ranking 茶會", () => {
  const ranked = mergeRanked(
    "茶會",
    [{ id: "live_tea", source: "canva", title: "秋季茶會", subtitle: "Canva / 秋季茶會", tags: ["canva"], kind: "poster", date: "", thumb: "/seed/tea.svg", notes: "Canva 設計" }],
    [{ id: "mem_campus", source: "drive", title: "校園空景", subtitle: "Google Drive", tags: ["校園"], kind: "asset", date: "", thumb: "/seed/campus.svg", notes: "" }],
  );
  assert.equal(ranked[0]?.id, "live_tea");
});

test("English Canva titles still appear even when they miss the Chinese query", () => {
  const ranked = mergeRanked(
    "茶會",
    [{ id: "live_en", source: "canva", title: "Untitled Design", subtitle: "Canva / Untitled Design", tags: ["canva"], kind: "poster", date: "", thumb: "/seed/tea.svg", notes: "Canva 設計" }],
    [{ id: "mem_tea", source: "canva", title: "茶會海報", subtitle: "Canva / 茶會", tags: ["茶會"], kind: "poster", date: "", thumb: "/seed/tea.svg", notes: "" }],
  );
  assert.equal(ranked[0]?.id, "mem_tea");
  assert.ok(ranked.some((row) => row.id === "live_en"));
});
