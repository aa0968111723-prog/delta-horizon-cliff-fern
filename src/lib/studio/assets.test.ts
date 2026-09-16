import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import {
  inferAssetSource,
  isDisplayableImageBlob,
  isStampAsset,
  isSvgPreviewSrc,
  assetPreviewFitClass,
  migrateAsset,
  mimeForAssetSrc,
  pickExportImageSource,
  previewUrlForAsset,
} from "./assets.ts";

test("seed assets keep a public preview path so the library does not wait on IndexedDB", () => {
  const asset = migrateAsset({
    id: "asset_gugu",
    name: "龜龜",
    seedSrc: "/seed/gugu.svg",
    source: "seed",
  });
  assert.equal(asset.source, "seed");
  assert.equal(previewUrlForAsset(asset), "/seed/gugu.svg");
  assert.equal(previewUrlForAsset(asset, "blob:http://local/1"), "/seed/gugu.svg");
});

test("Drive / Canva / IG tags are restored as source instead of 本機上傳", () => {
  assert.equal(
    inferAssetSource({
      tags: ["Google Drive", "遠端"],
      licenseOwner: "Google Drive",
    }),
    "drive",
  );
  assert.equal(inferAssetSource({ tags: ["Canva"], licenseOwner: "Canva" }), "canva");
  assert.equal(inferAssetSource({ tags: ["Instagram"], licenseOwner: "Instagram" }), "instagram");
  assert.equal(inferAssetSource({ source: "upload" }), "upload");
  assert.equal(inferAssetSource({ source: "generated" }), "generated");
});

test("SVG seed paths get an image MIME so blob URLs can render", () => {
  assert.equal(mimeForAssetSrc("/seed/gugu.svg"), "image/svg+xml");
  assert.equal(mimeForAssetSrc("/seed/night-lamp.svg?v=2"), "image/svg+xml");
  assert.equal(mimeForAssetSrc("/photo.png"), "image/png");
});

test("SVG previews use object-fill so Chromium does not crop them to blank", () => {
  assert.equal(assetPreviewFitClass({ mime: "image/svg+xml", seedSrc: "/seed/gugu.svg" }), "object-fill");
  assert.equal(assetPreviewFitClass({ mime: "image/jpeg" }), "object-cover");
  assert.equal(isSvgPreviewSrc("/seed/zen-mark.svg"), true);
});

test("HTML error pages stored in IndexedDB are not treated as previews", () => {
  assert.equal(isDisplayableImageBlob(new Blob(["<html>not an image</html>"], { type: "text/html" })), false);
  assert.equal(isDisplayableImageBlob(new Blob(["<svg xmlns='http://www.w3.org/2000/svg'></svg>"], { type: "image/svg+xml" })), true);
  assert.equal(isDisplayableImageBlob(new Blob([])), false);
});

test("seed SVGs in public/ are valid UTF-8 so Chromium can paint them", () => {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../../../public/seed");
  for (const name of ["gugu.svg", "zen-mark.svg", "tamsui-dusk.svg", "window-light.svg", "night-lamp.svg"]) {
    const text = readFileSync(join(dir, name), "utf8");
    assert.match(text, /<svg /);
    assert.doesNotMatch(text, /\uFFFD/);
  }
});

test("export falls back to seedSrc when IndexedDB has no displayable image", () => {
  const html = new Blob(["<html>error</html>"], { type: "text/html" });
  assert.deepEqual(pickExportImageSource(html, "/seed/gugu.svg"), { kind: "url", url: "/seed/gugu.svg" });
  const png = new Blob([new Uint8Array(32)], { type: "image/png" });
  assert.equal(pickExportImageSource(png)?.kind, "blob");
  assert.equal(pickExportImageSource(undefined), null);
});
