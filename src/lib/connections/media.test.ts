import assert from "node:assert/strict";
import test from "node:test";
import {
  canImportRemote,
  canvaDesignUrl,
  canvaExportBody,
  canvaExportJobUrl,
  driveDownloadUrl,
  driveMetaUrl,
  enlargeDriveThumbnail,
  instagramMediaUrl,
} from "./media.ts";

test("Drive URLs request the file bytes and metadata", () => {
  const download = driveDownloadUrl("abc 1");
  assert.match(download, /alt=media/);
  assert.match(download, /abc%201/);
  assert.match(download, /supportsAllDrives=true/);
  assert.match(driveMetaUrl("x"), /thumbnailLink/);
});

test("Instagram lookup asks for media_url and thumbnail", () => {
  assert.match(instagramMediaUrl("ig1"), /media_url/);
  assert.match(instagramMediaUrl("ig1"), /thumbnail_url/);
});

test("Canva export asks for a png of that design", () => {
  const body = canvaExportBody("d1");
  assert.equal(body.design_id, "d1");
  assert.equal(body.format.type, "png");
  assert.match(canvaExportJobUrl("job/1"), /exports\/job%2F1/);
  assert.match(canvaDesignUrl("d1"), /designs\/d1/);
});

test("only visual remote kinds can be brought into create", () => {
  assert.equal(canImportRemote("image"), true);
  assert.equal(canImportRemote("design"), true);
  assert.equal(canImportRemote("post"), true);
  assert.equal(canImportRemote("video"), true);
  assert.equal(canImportRemote("doc"), false);
  assert.equal(canImportRemote("other"), false);
});

test("Drive thumbnails are enlarged before using them as a starting image", () => {
  assert.equal(
    enlargeDriveThumbnail("https://lh3.googleusercontent.com/x=s220"),
    "https://lh3.googleusercontent.com/x=s1600",
  );
});
