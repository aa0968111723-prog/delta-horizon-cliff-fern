import assert from "node:assert/strict";
import test from "node:test";
import { asDriveHits, adoptIdeaFromAsset, adoptIdeaFromHit, assetFromHit, assetIdFromHit, driveThumb, hitFromIgPost, hitFromPack, localCreativeHits, mergeLocalHits, mergeRanked } from "./hits.ts";

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
  assert.ok(hits[0]?.tags.includes("晚上"));
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

test("adopting a search hit continues brand DNA instead of copying the old work", () => {
  const idea = adoptIdeaFromHit({
    source: "canva",
    title: "浮游禪光",
    subtitle: "Canva / 浮游禪光",
    notes: "歷屆夜間主視覺，留白多。",
  });
  assert.match(idea, /品牌 DNA/);
  assert.match(idea, /浮游禪光/);
  assert.match(idea, /Canva/);
  assert.match(idea, /不要直接複製/);
  assert.match(idea, /配色|留白|文字層級/);
  const drive = adoptIdeaFromHit({
    source: "drive",
    title: "夜間茶會照片",
    subtitle: "Google Drive / 2025 茶會",
    notes: "很多人圍坐。",
  });
  assert.match(drive, /現場感覺/);
  const ig = adoptIdeaFromHit({
    source: "instagram",
    title: "茶會回顧",
    subtitle: "Instagram / 2025-11-13",
    notes: "Hook 有效。",
  });
  assert.match(ig, /Hook|停留感/);
});

test("Drive tea hits become library assets with source tags, not duplicate seed ids", () => {
  const hits = asDriveHits({
    files: [{ id: "drv_tea_2025", name: "夜間茶會照片", mimeType: "image/jpeg", modifiedTime: "2025-11-12T19:00:00Z" }],
  });
  const asset = assetFromHit(hits[0]!);
  assert.equal(asset.id, "asset_drv_tea_2025");
  assert.equal(assetIdFromHit({ id: "asset_tea" }), "asset_tea");
  assert.equal(asset.source, "drive");
  assert.ok(asset.tags.includes("茶會"));
  assert.equal(asset.seedSrc, "/seed/tea.svg");
  assert.match(asset.licenseNotes, /Google Drive/);
  assert.equal(asset.licenseOwner, "Google Drive");
  const canva = assetFromHit({
    id: "cnv_tea_poster",
    source: "canva",
    title: "茶會海報",
    subtitle: "Canva / 茶會",
    tags: ["茶會", "海報"],
    kind: "poster",
    date: "2025-10-02",
    thumb: "/seed/tea.svg",
    notes: "留白多。",
  });
  assert.equal(canva.source, "canva");
  assert.equal(canva.category, "poster");
  const ig = assetFromHit({
    id: "ig_tea_recap",
    source: "instagram",
    title: "茶會回顧",
    subtitle: "Instagram / 2025-11-13",
    tags: ["茶會"],
    kind: "carousel",
    date: "2025-11-13",
    thumb: "/seed/tea.svg",
    notes: "Hook 有效。",
  });
  assert.equal(ig.source, "instagram");
});

test("adopting a library asset keeps the Drive or Canva source in the idea", () => {
  const idea = adoptIdeaFromAsset({
    name: "2025 夜間茶會照片",
    licenseNotes: "Google Drive / 2025 茶會。很多人圍坐。",
    source: "drive",
    tags: ["茶會", "晚上"],
  });
  assert.match(idea, /夜間茶會/);
  assert.match(idea, /Google Drive|現場感覺/);
  assert.match(idea, /不要直接複製/);
});

test("local generated pack hits merge into the generated group", () => {
  const grouped = mergeLocalHits(
    "茶會",
    { generated: [{ id: "gen_old", source: "generated", title: "舊草稿", subtitle: "AI Generated", tags: ["AI生成"], kind: "ig-post", date: "", thumb: "/seed/campus.svg", notes: "" }] },
    [hitFromPack({ projectId: "proj_tea", eventName: "茶會", hook: "最近是不是很久沒有好好坐下來？", kind: "ig-post", heroThumb: "/seed/tea.svg" })],
  );
  assert.ok(grouped.generated?.some((item) => item.id === "gen_pack_proj_tea"));
  assert.equal(grouped.generated?.[0]?.title, "茶會");
});

test("just-published tea posts rank into Instagram Content Memory", () => {
  const published = hitFromIgPost({
    id: "ig_pub_proj_tea_ig-post",
    mediaType: "image",
    caption: "最近是不是連休息都覺得有罪惡感？\n下週茶會。人到了就好。",
    takenAt: Date.parse("2026-09-16T19:00:00+08:00"),
    thumb: "/seed/tea.svg",
    analysis: "剛發布 · ig-post · 茶會。Hook：「最近是不是連休息都覺得有罪惡感？」",
  });
  assert.equal(published.source, "instagram");
  assert.ok(published.tags.includes("茶會"));
  assert.match(published.subtitle, /Instagram \/ 2026-09-16/);
  const turtle = {
    id: "ig_turtle",
    mediaType: "image" as const,
    caption: "龜龜今天也在。",
    takenAt: Date.parse("2026-03-04T18:00:00+08:00"),
    thumb: "/seed/turtle.svg",
    analysis: "角色可愛，但要搭配一句學生生活才會停。",
  };
  const extras = localCreativeHits(
    {
      igPosts: [
        turtle,
        {
          id: published.id,
          mediaType: "image",
          caption: published.caption || "",
          takenAt: Date.parse("2026-09-16T19:00:00+08:00"),
          thumb: "/seed/tea.svg",
          analysis: published.notes,
        },
      ],
    },
    "下週有一場茶會",
  );
  assert.equal(extras.some((item) => item.id === turtle.id), false);
  assert.ok(extras.some((item) => item.id === published.id));
  const grouped = mergeLocalHits("下週有一場茶會", { instagram: [] }, extras);
  assert.equal(grouped.instagram?.[0]?.id, published.id);
});
