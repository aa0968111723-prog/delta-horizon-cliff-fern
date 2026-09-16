import { driveSearchQuery, canvaPresetFor, folderSearchInput } from "./presets.ts";
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
