import assert from "node:assert/strict";
import test from "node:test";
import { migrateAsset } from "./assets.ts";
import { sourceFromAsset, sourceFromRemote } from "./sources.ts";

test("sourceFromAsset keeps Drive / Canva / Instagram instead of flattening to 本機", () => {
  const drive = migrateAsset({
    id: "a1",
    name: "茶會照片",
    tags: ["Google Drive", "遠端"],
    licenseOwner: "Google Drive",
  });
  assert.equal(sourceFromAsset(drive).kind, "drive");
  const canva = migrateAsset({
    id: "a2",
    name: "主視覺",
    tags: ["Canva"],
    licenseOwner: "Canva",
  });
  assert.equal(sourceFromAsset(canva).kind, "canva");
  const ig = migrateAsset({
    id: "a3",
    name: "過去貼文",
    tags: ["Instagram"],
    licenseOwner: "Instagram",
  });
  assert.equal(sourceFromAsset(ig).kind, "instagram");
  const generated = migrateAsset({
    id: "a4",
    name: "生成圖",
    source: "generated",
  });
  assert.equal(sourceFromAsset(generated).kind, "generated");
});

test("sourceFromRemote labels the provider in everyday language", () => {
  const ref = sourceFromRemote({
    provider: "instagram",
    title: "社課現場",
    href: "https://instagram.com/p/x",
  });
  assert.equal(ref.kind, "instagram");
  assert.match(ref.label, /Instagram/);
  assert.equal(ref.href, "https://instagram.com/p/x");
});
