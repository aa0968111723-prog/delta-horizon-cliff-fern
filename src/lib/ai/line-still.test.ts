import assert from "node:assert/strict";
import test from "node:test";
import { directionPosterSvg } from "./poster.ts";
import { attachLineStill, linePosterInput } from "./line-still.ts";

test("LINE still is 1:1 and keeps the student hook, not the event name", () => {
  const input = linePosterInput({
    hook: "可以自己來？",
    campaignName: "茶會",
    subhead: "9/24 19:00 · 淡水校園",
    cta: "來坐一下",
  });
  assert.equal(input.width, 1040);
  assert.equal(input.height, 1040);
  assert.equal(input.headline, "可以自己來？");
  const svg = directionPosterSvg(input);
  assert.match(svg, /可以自己來/);
  assert.match(svg, /width="1040"/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.doesNotMatch(svg, /temple|寺廟|誠摯邀請/);
});

test("attachLineStill only writes onto that campaign's LINE row", () => {
  const next = attachLineStill(
    [
      { kind: "carousel", campaignId: "c1", imageAssetId: "hero" },
      { kind: "line", campaignId: "c1" },
      { kind: "line", campaignId: "c2" },
    ],
    "line_1",
    "c1",
  );
  assert.equal(next[0]?.imageAssetId, "hero");
  assert.equal(next[1]?.imageAssetId, "line_1");
  assert.equal(next[2]?.imageAssetId, undefined);
});
