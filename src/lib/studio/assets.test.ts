import assert from "node:assert/strict";
import test from "node:test";
import {
  inferAssetSource,
  isDisplayableImageBlob,
  migrateAsset,
  mimeForAssetSrc,
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

test("HTML error pages stored in IndexedDB are not treated as previews", () => {
  assert.equal(isDisplayableImageBlob(new Blob(["<html>not an image</html>"], { type: "text/html" })), false);
  assert.equal(isDisplayableImageBlob(new Blob(["<svg xmlns='http://www.w3.org/2000/svg'></svg>"], { type: "image/svg+xml" })), true);
  assert.equal(isDisplayableImageBlob(new Blob([])), false);
});
