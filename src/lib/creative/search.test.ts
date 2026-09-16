import assert from "node:assert/strict";
import test from "node:test";
import { searchCreative } from "./search.ts";
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
