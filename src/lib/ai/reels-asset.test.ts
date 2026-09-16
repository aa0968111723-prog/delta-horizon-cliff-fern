import assert from "node:assert/strict";
import test from "node:test";
import { attachReelsVideo, memoryAssetId, previewMediaId, reelsVideoAsset } from "./reels-asset.ts";

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

test("IG Preview prefers the stored Reels film over the cover still", () => {
  assert.equal(
    previewMediaId({ kind: "reels", videoAssetId: "asset_film", imageAssetId: "asset_cover" }),
    "asset_film",
  );
  assert.equal(previewMediaId({ kind: "reels", imageAssetId: "asset_cover" }), "asset_cover");
  assert.equal(previewMediaId({ kind: "carousel", imageAssetId: "asset_cover", videoAssetId: "asset_film" }), "asset_cover");
  assert.equal(
    memoryAssetId({ kind: "reels", videoAssetId: "asset_film", imageAssetId: "asset_cover" }),
    "asset_film",
  );
});
