import assert from "node:assert/strict";
import test from "node:test";
import { driveImportBlockedReason, driveItemToLibraryAsset, hasPlaceablePixels } from "./drive-import.ts";

test("Drive import stays blocked when the connector is unavailable or login has no URL", () => {
  assert.match(driveImportBlockedReason("unavailable") ?? "", /尚未提供/);
  assert.match(driveImportBlockedReason("login") ?? "", /不會顯示 Continue with Grok/);
  assert.match(driveImportBlockedReason("not_connected") ?? "", /尚未連接/);
  assert.equal(driveImportBlockedReason("connected"), null);
});

test("Drive library refs keep provenance and never pretend to have pixels", () => {
  const asset = driveItemToLibraryAsset({
    id: "photo-1",
    provider: "google-drive",
    title: "2025 夜間茶會",
    mimeType: "image/jpeg",
    isFolder: false,
    modifiedAt: "2026-09-01T12:00:00Z",
    webUrl: "https://drive.google.com/file/d/photo-1/view",
    thumbnailUrl: "",
    parentId: "folder-1",
    snippet: "社員在暖光下聊天",
    syncedAt: 1,
    collection: "茶會",
  }, 99);

  assert.equal(asset.source, "google-drive");
  assert.equal(asset.provenance?.externalId, "photo-1");
  assert.equal(asset.width, 0);
  assert.equal(hasPlaceablePixels(asset), false);
  assert.match(asset.licenseNotes, /不是已下載的原圖/);
  assert.equal(JSON.stringify(asset).includes("access_token"), false);
});

test("seed and generated assets with dimensions remain placeable", () => {
  assert.equal(hasPlaceablePixels({ width: 1080, height: 1350 }), true);
  assert.equal(hasPlaceablePixels({ width: 0, height: 0, seedSrc: "/seed/zen-mark.svg" }), true);
});
