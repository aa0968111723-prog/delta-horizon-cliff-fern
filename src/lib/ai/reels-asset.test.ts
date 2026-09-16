import assert from "node:assert/strict";
import test from "node:test";
import { attachReelsCover, attachReelsVideo, memoryAssetId, previewMediaId, reelsCoverAsset, reelsPreviewReady, reelsVideoAsset } from "./reels-asset.ts";
import { reelsAtmosphereInput, directionPosterSvg } from "./poster.ts";

test("reels video assets are 9:16 films in the creative library", () => {
  const asset = reelsVideoAsset({ id: "asset_reels_tea", eventName: "浮游茶會", width: 1080, height: 1920 });
  assert.equal(asset.kind, "video");
  assert.equal(asset.category, "reels");
  assert.equal(asset.mime, "video/mp4");
  assert.equal(asset.source, "generated");
  assert.match(asset.licenseNotes, /AI Generated/);
  assert.ok(asset.tags.includes("短影音"));
  assert.doesNotMatch(asset.name, /負責人|Assignee/);
});

test("attachReelsVideo only writes onto that campaign's Reels rows", () => {
  const next = attachReelsVideo(
    [
      { id: "a", kind: "reels", campaignId: "tea", videoAssetId: undefined },
      { id: "b", kind: "carousel", campaignId: "tea" },
      { id: "c", kind: "reels", campaignId: "other" },
    ],
    "asset_film",
    "tea",
  );
  assert.equal(next[0]?.videoAssetId, "asset_film");
  assert.equal(next[1]?.videoAssetId, undefined);
  assert.equal(next[2]?.videoAssetId, undefined);
});

test("attachReelsVideo does nothing until a campaign is known", () => {
  const rows = [{ id: "a", kind: "reels" as const, campaignId: "tea", videoAssetId: undefined }];
  assert.equal(attachReelsVideo(rows, "asset_film")[0]?.videoAssetId, undefined);
});

test("attachReelsCover writes a 9:16 atmosphere still onto that campaign's Reels row", () => {
  const next = attachReelsCover(
    [
      { id: "a", kind: "reels", campaignId: "tea", imageAssetId: "hero_45" },
      { id: "b", kind: "carousel", campaignId: "tea", imageAssetId: "hero_45" },
      { id: "c", kind: "reels", campaignId: "other", imageAssetId: "hero_45" },
    ],
    "asset_atmosphere",
    "tea",
  );
  assert.equal(next[0]?.imageAssetId, "asset_atmosphere");
  assert.equal(next[1]?.imageAssetId, "hero_45");
  assert.equal(next[2]?.imageAssetId, "hero_45");
  const cover = reelsCoverAsset({ id: "c1", eventName: "茶會", mime: "image/png", width: 1080, height: 1920 });
  assert.equal(cover.category, "reels");
  assert.equal(cover.kind, "image");
  assert.equal(cover.width, 1080);
  assert.equal(cover.height, 1920);
  assert.doesNotMatch(cover.name, /負責人|Assignee/);
});

test("attachReelsCover does nothing until a campaign is known", () => {
  const rows = [{ id: "a", kind: "reels" as const, campaignId: "tea", imageAssetId: "hero_45" }];
  assert.equal(attachReelsCover(rows, "asset_atmosphere")[0]?.imageAssetId, "hero_45");
});

test("Reels atmosphere still has no student headline burned in", () => {
  const svg = directionPosterSvg(reelsAtmosphereInput());
  assert.match(svg, /height="1920"/);
  assert.match(svg, /width="1080"/);
  assert.match(svg, /氣氛畫面/);
  assert.doesNotMatch(svg, /可以自己來/);
  assert.doesNotMatch(svg, /誠摯邀請/);
  assert.doesNotMatch(svg, /<text[\s>]/);
});

test("IG Preview hides a tea-party Reels phone until the cover or film is ready", () => {
  assert.equal(reelsPreviewReady({ kind: "reels" }, {}), false);
  assert.equal(reelsPreviewReady({ kind: "reels", imageAssetId: "cover" }, {}), false);
  assert.equal(reelsPreviewReady({ kind: "reels", imageAssetId: "cover" }, { cover: "blob:cover" }), true);
  assert.equal(
    reelsPreviewReady({ kind: "reels", videoAssetId: "film", imageAssetId: "cover" }, { film: "blob:film" }),
    true,
  );
  assert.equal(reelsPreviewReady({ kind: "carousel", imageAssetId: "cover" }, { cover: "blob:cover" }), false);
});

test("IG Preview prefers the stored Reels film over the cover still", () => {
  assert.equal(
    previewMediaId({ kind: "reels", videoAssetId: "asset_film", imageAssetId: "asset_cover" }),
    "asset_film",
  );
  assert.equal(previewMediaId({ kind: "reels", imageAssetId: "asset_cover" }), "asset_cover");
  assert.equal(previewMediaId({ kind: "reels" }), undefined);
  assert.equal(previewMediaId({ kind: "carousel", imageAssetId: "asset_cover", videoAssetId: "asset_film" }), "asset_cover");
  assert.equal(
    memoryAssetId({ kind: "reels", videoAssetId: "asset_film", imageAssetId: "asset_cover" }),
    "asset_film",
  );
});
