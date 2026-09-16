import assert from "node:assert/strict";
import test from "node:test";
import { gatherStatusLine, searchCreative, selectSourcesForPack, sourceGroupLabel } from "./search.ts";
import { SEED_CAMPAIGNS, SEED_IG_POSTS, SEED_MEMORY } from "./memory-seed.ts";

test("creative search finds 浮游禪光 across memory sources", () => {
  const hits = searchCreative({
    query: "浮游禪光",
    memory: SEED_MEMORY,
    assets: [],
    campaigns: SEED_CAMPAIGNS,
    igPosts: SEED_IG_POSTS,
    projects: [],
  });
  assert.ok(hits.length > 0);
  assert.ok(hits.some((h) => h.source === "drive" || h.source === "canva" || h.source === "brand"));
});

test("turtle query ranks 龜龜 assets", () => {
  const hits = searchCreative({
    query: "找有龜龜的素材",
    memory: SEED_MEMORY,
    assets: [],
    campaigns: SEED_CAMPAIGNS,
    igPosts: SEED_IG_POSTS,
    projects: [],
  });
  assert.ok(hits.some((h) => h.title.includes("龜") || h.summary.includes("龜")));
});

test("spoken tea query finds night tea photos", () => {
  const hits = searchCreative({
    query: "找以前晚上的茶會照片",
    memory: SEED_MEMORY,
    assets: [],
    campaigns: SEED_CAMPAIGNS,
    igPosts: SEED_IG_POSTS,
    projects: [],
  });
  assert.ok(hits.some((h) => h.source === "drive" && /茶/.test(h.title + h.summary)));
});

test("spoken IG-hero query finds posters without needing the filename", () => {
  const hits = searchCreative({
    query: "找適合 IG 主視覺的照片",
    memory: SEED_MEMORY,
    assets: [],
    campaigns: SEED_CAMPAIGNS,
    igPosts: SEED_IG_POSTS,
    projects: [],
  });
  assert.ok(hits.some((h) => /海報|三色光|茶會|夜間/.test(`${h.title}${h.summary}${h.sourceLabel}`)));
});

test("gather status names live sources without agent jargon", () => {
  assert.equal(
    gatherStatusLine(18, ["google-drive", "canva", "instagram"]),
    "已搜 Drive、Canva、Instagram，找到 18 個相關素材",
  );
  assert.equal(gatherStatusLine(6, []), "找到 6 個相關素材。根據過去內容生成 3 個方向");
  assert.equal(gatherStatusLine(0, []), "先用品牌記憶生成 3 個方向");
});

test("source group labels stay product-facing", () => {
  assert.equal(sourceGroupLabel("drive"), "Google Drive");
  assert.equal(sourceGroupLabel("generated"), "AI 生成");
});

test("picked hits stay in front of pack sources", () => {
  const sources = selectSourcesForPack(
    [{ id: "canva_tea", title: "茶會", source: "canva", sourceLabel: "Canva / 茶會" }],
    [
      { id: "canva_tea", title: "茶會", source: "canva", sourceLabel: "Canva / 茶會" },
      { id: "drive_tea", title: "夜間茶會", source: "drive", sourceLabel: "Google Drive / 2025 茶會" },
    ],
    [{ source: "upload", label: "你丟進來的圖", id: "upload" }],
  );
  assert.equal(sources[0]?.label, "你丟進來的圖");
  assert.equal(sources[1]?.label, "Canva / 茶會");
  assert.equal(sources.some((item) => item.id === "drive_tea"), true);
  assert.equal(sources.filter((item) => item.id === "canva_tea").length, 1);
});
