import assert from "node:assert/strict";
import test from "node:test";
import { crc32, zipStore } from "./zip-store.ts";
import { publishPackManifest, safePackStem } from "./export-pack.ts";

test("zip store writes a PK archive that keeps the original bytes", () => {
  const payload = new TextEncoder().encode("禪作所畫面");
  const zip = zipStore([{ name: "note.txt", data: payload }]);
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
  const name = new TextDecoder().decode(zip);
  assert.match(name, /note\.txt/);
  assert.equal(crc32(payload) > 0, true);
});

test("publish pack names include canvas PNG and a notes file", () => {
  assert.equal(safePackStem('浮游禪光:*?'), "浮游禪光");
  const pack = publishPackManifest("茶會", "4:5", 3);
  assert.equal(pack.noteName, "茶會-publish.txt");
  assert.deepEqual(pack.imageNames, ["茶會-4-5-p1.png", "茶會-4-5-p2.png", "茶會-4-5-p3.png"]);
  assert.match(pack.zipName, /publish-pack\.zip/);
});
