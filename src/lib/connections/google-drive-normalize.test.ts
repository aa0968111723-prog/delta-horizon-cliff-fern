import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDriveContent, normalizeDriveFiles } from "./google-drive-normalize.ts";

test("normalizes Drive folder and file metadata without retaining credentials", () => {
  const files = normalizeDriveFiles({
    files: [
      {
        file_id: "folder-1",
        name: "淡江禪學社",
        mime_type: "application/vnd.google-apps.folder",
      },
      {
        fileId: "photo-1",
        title: "2025 夜間茶會",
        mimeType: "image/jpeg",
        modifiedTime: "2026-09-01T12:00:00Z",
        webViewLink: "https://drive.google.com/file/d/photo-1/view",
        snippet: "社員在暖光下聊天",
      },
    ],
    access_token: "must-not-survive",
  });

  assert.equal(files.length, 2);
  assert.equal(files[0]?.isFolder, true);
  assert.equal(files[1]?.provider, "google-drive");
  assert.equal(files[1]?.title, "2025 夜間茶會");
  assert.equal(JSON.stringify(files).includes("must-not-survive"), false);
});

test("normalizes connector content envelopes and caps retained text", () => {
  assert.equal(
    normalizeDriveContent({ content: [{ type: "text", text: "茶會企劃摘要" }] }),
    "茶會企劃摘要",
  );
  assert.equal(normalizeDriveContent("x".repeat(15_000)).length, 12_000);
});

test("accepts JSON text returned by connector content wrappers", () => {
  const files = normalizeDriveFiles({
    content: [{ text: JSON.stringify({ items: [{ id: "doc-1", name: "浮游禪光企劃" }] }) }],
  });
  assert.equal(files[0]?.id, "doc-1");
});
