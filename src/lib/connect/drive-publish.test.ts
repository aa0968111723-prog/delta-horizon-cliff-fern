import assert from "node:assert/strict";
import test from "node:test";
import {
  DRIVE_PUBLISH_FOLDER,
  DRIVE_SCOPES,
  driveAnyoneReader,
  driveFileMetadata,
  driveFolderQuery,
  driveMultipartBody,
  drivePublicImageUrl,
} from "./drive-publish.ts";

test("Drive publish URL is public HTTPS googleusercontent, not localhost", () => {
  const url = drivePublicImageUrl("abc-123");
  assert.match(url, /^https:\/\/lh3\.googleusercontent.com\/d\/abc-123=/);
  assert.doesNotMatch(url, /localhost|127\.0\.0\.1/);
});

test("Drive upload metadata stays in the app folder and is PNG", () => {
  assert.equal(DRIVE_PUBLISH_FOLDER, "禪光發布");
  assert.match(DRIVE_SCOPES, /drive\.readonly/);
  assert.match(DRIVE_SCOPES, /drive\.file/);
  assert.deepEqual(driveAnyoneReader(), { role: "reader", type: "anyone" });
  assert.deepEqual(driveFileMetadata("茶會主視覺", "folder_1"), {
    name: "茶會主視覺",
    mimeType: "image/png",
    parents: ["folder_1"],
  });
  assert.match(driveFolderQuery(DRIVE_PUBLISH_FOLDER), /禪光發布/);
  assert.match(driveFolderQuery(DRIVE_PUBLISH_FOLDER), /trashed = false/);
});

test("multipart body includes JSON metadata then PNG bytes", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const { body, contentType } = driveMultipartBody({ name: "tea.png" }, png, "image/png", "zenbound");
  const text = new TextDecoder("latin1").decode(body);
  assert.match(contentType, /boundary=zenbound/);
  assert.match(text, /tea\.png/);
  assert.match(text, /image\/png/);
  assert.match(text, /\x89PNG/);
});
