import { driveSearchQuery, canvaPresetFor, folderSearchInput, canvaDesignTypeFor, jpegBase64Payload, canvaJobAssetId, canvaJobExportUrl, canvaMetadataHeader, canvaDesignsUrl } from "./presets.ts";
import assert from "node:assert/strict";
import test from "node:test";

test("drive search includes the named club folder", () => {
  assert.equal(driveSearchQuery("茶會", "淡江禪學社主要資料夾"), "淡江禪學社主要資料夾 茶會");
  assert.equal(driveSearchQuery("淡江禪學社主要資料夾 茶會", "淡江禪學社主要資料夾"), "淡江禪學社主要資料夾 茶會");
});

test("folder search input carries name and optional id", () => {
  assert.deepEqual(folderSearchInput("茶會", { driveFolder: "淡江禪學社主要資料夾", driveFolderId: "abc" }), {
    query: "茶會",
    folderName: "淡江禪學社主要資料夾",
    folderId: "abc",
  });
  assert.deepEqual(folderSearchInput("茶會", { driveFolder: "", driveFolderId: "" }), { query: "茶會" });
});

test("Canva presets map IG formats without inventing carousel types", () => {
  assert.equal(canvaPresetFor("story"), "instagramStory");
  assert.equal(canvaPresetFor("reels"), "instagramReel");
  assert.equal(canvaPresetFor("carousel"), "instagramPost");
  assert.equal(canvaPresetFor("ig-post"), "instagramPost");
});

test("official Canva list URL can query by club language", () => {
  assert.equal(canvaDesignsUrl(), "https://api.canva.com/rest/v1/designs?limit=24");
  assert.equal(
    canvaDesignsUrl("茶會"),
    "https://api.canva.com/rest/v1/designs?limit=24&query=%E8%8C%B6%E6%9C%83&sort_by=relevance",
  );
});

test("Canva design type uses official custom pixel sizes", () => {
  assert.deepEqual(canvaDesignTypeFor("ig-post"), { type: "custom", width: 1080, height: 1350 });
  assert.deepEqual(canvaDesignTypeFor("story"), { type: "custom", width: 1080, height: 1920 });
  assert.deepEqual(canvaDesignTypeFor("threads"), { type: "custom", width: 1080, height: 1080 });
});

test("Canva upload payload and job helpers stay official-shaped", () => {
  const payload = jpegBase64Payload("data:image/jpeg;base64,/9j/xxxx");
  assert.equal(payload?.mime, "image/jpeg");
  assert.equal(payload?.base64, "/9j/xxxx");
  assert.equal(jpegBase64Payload("data:image/svg+xml;base64,abc"), null);
  assert.equal(canvaJobAssetId({ job: { status: "success", asset: { id: "Msd123" } } }), "Msd123");
  assert.equal(canvaJobAssetId({ job: { status: "failed", asset: { id: "Msd123" } } }), "");
  assert.equal(canvaJobExportUrl({ job: { status: "success", urls: ["https://export-download.canva.com/a.jpg"] } }), "https://export-download.canva.com/a.jpg");
  assert.match(canvaMetadataHeader("茶會-ig-post.jpg"), /name_base64/);
});
