import assert from "node:assert/strict";
import test from "node:test";
import { matchesAssetQuery } from "../studio/assets.ts";
import type { AssetMeta, IgMemoryPost, RemoteFile } from "../studio/types.ts";
import { composeMemoryHint, hookFromMemoryHint } from "./memory-hook.ts";
import {
  blobMatchesQuery,
  driveContainsQuery,
  igPostsMatchingQuery,
  igSearchHookBlock,
  searchCreative,
  searchTokens,
} from "./search.ts";

const teaDrive: RemoteFile = {
  id: "drv_tea_2025",
  provider: "drive",
  name: "2025 茶會現場",
  mime: "image/jpeg",
  tags: ["茶會", "晚上", "同學", "互動"],
  summary: "歷屆晚上茶會，很多人圍坐。",
};

const teaCanva: RemoteFile = {
  id: "canva_tea",
  provider: "canva",
  name: "茶會 IG 主視覺",
  mime: "application/canva",
  tags: ["茶會", "Canva", "主視覺"],
  summary: "歷屆茶會版型，三色光。",
};

const turtle: AssetMeta = {
  id: "asset_turtle",
  name: "龜龜",
  kind: "image",
  category: "mascot",
  mime: "image/svg+xml",
  width: 80,
  height: 80,
  tags: ["龜龜", "角色", "吉祥物"],
  createdAt: 1,
  updatedAt: 1,
  source: "seed",
  licenseNotes: "社團角色",
  licenseOwner: "淡江大學禪學社",
  favorite: true,
  lastUsedAt: 1,
  useCount: 1,
};

const nightIg: IgMemoryPost = {
  id: "ig_mem_tea",
  caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
  date: "2025-12-04",
  kind: "post",
  source: "local",
};

test("searchTokens turns NL tea-party requests into Drive keywords", () => {
  const tokens = searchTokens("找以前晚上的茶會照片");
  assert.ok(tokens.includes("茶會"));
  assert.ok(tokens.includes("晚上"));
  assert.ok(!tokens.includes("找以前晚上的茶會照片"));
  assert.ok(!tokens.some((token) => /找以前/.test(token)));
});

test("searchTokens understands 龜龜 and 浮游禪光", () => {
  assert.ok(searchTokens("找有龜龜的素材").includes("龜龜"));
  assert.ok(searchTokens("找浮游禪光文宣").includes("浮游禪光"));
});

test("driveContainsQuery uses token OR, not the whole sentence", () => {
  const q = driveContainsQuery("找以前晚上的茶會照片");
  assert.match(q, /茶會/);
  assert.match(q, /晚上/);
  assert.doesNotMatch(q, /找以前晚上的茶會照片/);
});

test("blobMatchesQuery matches tea-party remotes without the filename", () => {
  assert.equal(blobMatchesQuery(`${teaDrive.name} ${teaDrive.tags.join(" ")}`, "找以前晚上的茶會照片"), true);
});

test("matchesAssetQuery finds 龜龜 from a spoken request", () => {
  assert.equal(matchesAssetQuery(turtle, "找有龜龜的素材"), true);
});

test("searchCreative groups Drive / Canva / IG for 茶會", () => {
  const hits = searchCreative({
    query: "找以前晚上的茶會照片",
    assets: [turtle],
    projects: [],
    campaigns: [],
    igMemory: [nightIg],
    remoteFiles: [teaDrive, teaCanva],
  });
  const drive = hits.find((hit) => hit.title.includes("茶會") && hit.source === "drive");
  assert.ok(drive);
  assert.equal(drive?.remoteId, "drv_tea_2025");
  assert.ok(hits.some((hit) => hit.source === "canva"));
  assert.ok(hits.some((hit) => hit.source === "instagram"));
});

test("searchCreative finds tea-party Drive files from 我要宣傳茶會", () => {
  const hits = searchCreative({
    query: "我要宣傳茶會",
    assets: [turtle],
    projects: [],
    campaigns: [],
    igMemory: [nightIg],
    remoteFiles: [teaDrive, teaCanva],
  });
  assert.ok(hits.some((hit) => hit.source === "drive" && /茶會/.test(hit.title)));
  assert.ok(hits.some((hit) => hit.source === "canva"));
  assert.ok(!hits.some((hit) => /負責人|Assignee/.test(hit.title)));
});

test("searchCreative keeps thumbnails so tea-party sources can show pictures", () => {
  const tamsui: AssetMeta = { ...turtle, id: "asset_tamsui", name: "淡水晚上", seedSrc: "/seed/tamsui.svg", tags: ["淡水"] };
  const hits = searchCreative({
    query: "茶會",
    assets: [{ ...turtle, seedSrc: "/seed/turtle.svg" }, tamsui],
    projects: [],
    campaigns: [],
    igMemory: [{ ...nightIg, assetId: "asset_tamsui" }],
    remoteFiles: [{ ...teaDrive, thumbnail: "/seed/tamsui.svg" }, { ...teaCanva, thumbnail: "/seed/trilight.svg" }],
  });
  assert.equal(hits.find((hit) => hit.source === "drive")?.thumbnail, "/seed/tamsui.svg");
  assert.equal(hits.find((hit) => hit.source === "canva")?.thumbnail, "/seed/trilight.svg");
  assert.equal(hits.find((hit) => hit.source === "instagram")?.thumbnail, "/seed/tamsui.svg");
  const turtleHits = searchCreative({
    query: "龜龜",
    assets: [{ ...turtle, seedSrc: "/seed/turtle.svg" }],
    projects: [],
    campaigns: [],
    igMemory: [],
    remoteFiles: [],
  });
  assert.equal(turtleHits.find((hit) => hit.title === "龜龜")?.thumbnail, "/seed/turtle.svg");
});

test("igPostsMatchingQuery keeps tea-party captions for this kit to learn", () => {
  const posts = igPostsMatchingQuery(
    [
      nightIg,
      { id: "ig_tea", caption: "下週茶會，要不要自己來？", date: "2025-11-02", kind: "carousel", source: "instagram" },
      { id: "ig_other", caption: "招新現場很熱", date: "2025-09-01", kind: "post", source: "instagram" },
    ],
    "幫我做新的茶會宣傳",
  );
  assert.ok(posts.some((post) => post.id === "ig_tea"));
  assert.ok(posts.some((post) => post.id === "ig_mem_tea"));
  assert.equal(
    posts.some((post) => post.id === "ig_other"),
    false,
  );
});

test("igSearchHookBlock puts the matching live caption first so this kit learns it", () => {
  const block = igSearchHookBlock(
    [
      {
        id: "seed",
        caption: "課表排滿的時候，你還記得自己喜歡什麼嗎？",
        date: "2025-08-01",
        kind: "post",
        source: "local",
        saves: 33,
      },
      { id: "ig_tea", caption: "可以自己來？\n下週茶會，不用一次認識完。", date: "2025-11-02", kind: "carousel", source: "instagram" },
    ],
    "下週有一場茶會",
  );
  const hint = composeMemoryHint([
    block,
    "過去表現較好的 Hook：「課表排滿的時候，你還記得自己喜歡什麼嗎？」收藏 22",
  ]);
  assert.equal(hookFromMemoryHint(hint), "可以自己來？");
  assert.match(hint, /這次搜到的 IG：可以自己來？/);
});
