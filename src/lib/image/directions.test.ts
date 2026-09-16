import assert from "node:assert/strict";
import test from "node:test";
import { directionsOrMock, mockDirections } from "./directions.ts";

test("mock image directions stay student-life, not temple posters", () => {
  const dirs = mockDirections("我要宣傳茶會", "茶會");
  assert.equal(dirs.length, 3);
  assert.match(dirs.map((row) => row.headline).join(" "), /坐|晚上|朋友/);
  assert.doesNotMatch(dirs.map((row) => row.imagePrompt).join(" "), /temple poster|golden Buddha/);
});

test("learned IG hook becomes the first visual headline", () => {
  const dirs = mockDirections("我要宣傳茶會", "茶會", "我不會禪也可以嗎？");
  assert.equal(dirs[0]?.headline, "我不會禪也可以嗎？");
  assert.match(dirs[1]?.headline ?? "", /晚上|朋友|風/);
});

test("empty live parse falls back to three mock directions", () => {
  const dirs = directionsOrMock("我要宣傳茶會", "茶會", []);
  assert.equal(dirs.length, 3);
  assert.equal(dirs[0]?.id, "dir_a");
});
