import assert from "node:assert/strict";
import test from "node:test";
import { mockDirections } from "../ai/pack-mock.ts";
import { eventNameFromQuery, posterKindFromAspect, posterPackFromDirection } from "./poster-pack.ts";

test("我要宣傳茶會 becomes a tea-night name, not the whole sentence", () => {
  assert.equal(eventNameFromQuery("我要宣傳茶會"), "茶會");
  assert.equal(eventNameFromQuery("下週有一場茶會"), "茶會");
  assert.equal(eventNameFromQuery("幫我做浮游禪光完整宣傳"), "浮游禪光");
});

test("9:16 posters schedule as Story, feed ratios as a single IG post", () => {
  assert.equal(posterKindFromAspect("9:16"), "story");
  assert.equal(posterKindFromAspect("4:5"), "ig-post");
  assert.equal(posterKindFromAspect("1:1"), "ig-post");
});

test("choosing 朋友感 keeps that hook so Canva and calendar do not snap back to 夜間坐下", () => {
  const directions = mockDirections("茶會");
  const pack = posterPackFromDirection({
    query: "我要宣傳茶會",
    direction: directions[1]!,
    directions,
  });
  assert.equal(pack.plan.campaignName, "茶會");
  assert.match(pack.plan.hook, /朋友/);
  assert.equal(pack.plan.hook.includes("坐好"), false);
  assert.equal(pack.directions.map((item) => item.id).join(","), "dir_a,dir_b,dir_c");
  assert.match(pack.copyVariants[0]?.body ?? "", /朋友/);
  assert.match(pack.plan.scheduleNotes ?? "", /單篇/);
});
