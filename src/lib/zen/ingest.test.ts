import assert from "node:assert/strict";
import test from "node:test";
import {
  composeMemoryNotes,
  excerptFromDriveRead,
  isAllowedIngestHost,
  isAllowedIngestUrl,
  isPrivateHostname,
  isPublicHttpsUrl,
  isRasterImageMime,
  mergeCitedSources,
  parseDataUrl,
  rasterB64FromSrc,
  sourcesFromMemoryNotes,
} from "./ingest.ts";

test("allowlist blocks localhost and private IPs", () => {
  assert.equal(isPrivateHostname("127.0.0.1"), true);
  assert.equal(isPrivateHostname("10.0.0.8"), true);
  assert.equal(isPrivateHostname("192.168.1.1"), true);
  assert.equal(isPrivateHostname("169.254.169.254"), true);
  assert.equal(isPrivateHostname("localhost"), true);
  assert.equal(isAllowedIngestUrl("https://scontent.cdninstagram.com/v/t51.1/x.jpg"), true);
  assert.equal(isAllowedIngestUrl("https://lh3.googleusercontent.com/a"), true);
  assert.equal(isAllowedIngestUrl("https://drive.google.com/uc?id=1"), true);
  assert.equal(isAllowedIngestHost("document-export.canva.com"), true);
  assert.equal(isAllowedIngestUrl("http://drive.google.com/file"), false);
  assert.equal(isAllowedIngestUrl("https://evil.example/x.jpg"), false);
  assert.equal(isAllowedIngestUrl("https://127.0.0.1/secret"), false);
  assert.equal(isPublicHttpsUrl("https://example.com/public.jpg"), true);
  assert.equal(isPublicHttpsUrl("https://127.0.0.1/x"), false);
});

test("excerptFromDriveRead pulls text and image payloads", () => {
  const text = excerptFromDriveRead({ name: "茶會企劃", mimeType: "text/plain", text: "晚上茶會，同學圍坐。" });
  assert.equal(text.name, "茶會企劃");
  assert.match(text.excerpt ?? "", /晚上茶會/);
  const image = excerptFromDriveRead({
    filename: "tea.jpg",
    mimeType: "image/jpeg",
    base64: "abc123",
    thumbnailLink: "https://lh3.googleusercontent.com/tea",
  });
  assert.equal(image.imageB64, "abc123");
  assert.equal(image.imageUrl, "https://lh3.googleusercontent.com/tea");
  const dataUrl = excerptFromDriveRead("data:image/png;base64,AAAA");
  assert.equal(dataUrl.imageMime, "image/png");
  assert.equal(parseDataUrl("data:image/svg+xml;base64,AAAA"), null);
});

test("composeMemoryNotes dedupes and stays within cap", () => {
  const notes = composeMemoryNotes(["Google Drive / 2025 茶會", "Google Drive / 2025 茶會\nCanva / 浮游禪光"]);
  assert.equal(notes.split("\n").length, 2);
  assert.match(notes, /Canva/);
  const sources = sourcesFromMemoryNotes("Google Drive / 2025 茶會\nCanva / 浮游禪光\nInstagram / 2025-09-18");
  assert.equal(sources[0]?.source, "drive");
  assert.equal(sources[1]?.source, "canva");
  assert.equal(sources[2]?.source, "instagram");
  const merged = mergeCitedSources(sources, [{ source: "drive", label: "Google Drive / 2025 茶會", detail: "dup" }]);
  assert.equal(merged.filter((item) => item.source === "drive").length, 1);
});

test("raster mime rejects svg", () => {
  assert.equal(isRasterImageMime("image/jpeg"), true);
  assert.equal(isRasterImageMime("image/svg+xml"), false);
});

test("rasterB64FromSrc only accepts raster data urls", async () => {
  assert.equal(await rasterB64FromSrc(""), null);
  assert.equal(await rasterB64FromSrc("data:image/svg+xml;base64,AAAA"), null);
  const png = await rasterB64FromSrc("data:image/png;base64,AAAA");
  assert.equal(png?.mime, "image/png");
  assert.equal(png?.b64, "AAAA");
});
