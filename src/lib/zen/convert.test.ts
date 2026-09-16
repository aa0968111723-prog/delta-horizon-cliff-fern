import assert from "node:assert/strict";
import test from "node:test";
import { buildMockPlan } from "../ai/mock.ts";
import { convertFromPlan, formatScript, formatScriptClipboard, sequenceBeats } from "./convert.ts";

const converted = convertFromPlan(
  buildMockPlan({
    eventName: "茶會",
    schedule: "2026-09-23 19:30",
    location: "淡江大學淡水校園",
    product: "茶會",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "坐下來",
    style: "",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "",
    doSay: "",
    dontSay: "",
    forbiddenWords: [],
  }),
);

test("reels script is five beats with hook in the first 3 seconds", () => {
  const script = formatScript(converted, "reels-cover");
  assert.equal(script.kind, "reels");
  assert.equal(script.rows.length, 5);
  assert.ok(script.rows[0]?.kicker.includes("0–3"));
  assert.ok(script.rows[0]?.body.includes("畫面"));
  assert.ok(script.rows[0]?.body.includes("旁白"));
  assert.ok(script.rows[4]?.kicker.includes("17"));
  assert.ok(formatScriptClipboard(script).includes("字幕"));
});

test("story script splits into frames instead of a poster", () => {
  const script = formatScript(converted, "story");
  assert.equal(script.kind, "story");
  assert.ok(script.rows.length >= 3);
  assert.ok(script.rows[0]?.kicker.includes("第 1"));
  assert.ok(script.rows.some((row) => row.body.includes("畫面")));
});

test("carousel uses contentKind even on a 4:5 board", () => {
  const script = formatScript(converted, "feed-portrait", "carousel");
  assert.equal(script.kind, "carousel");
  assert.ok(script.rows.length >= 5);
  assert.ok(script.rows[0]?.kicker.includes("cover") || script.rows[0]?.kicker.includes("Page 1"));
});

test("carousel sequence is five pages, story is at least three frames", () => {
  const carousel = sequenceBeats(converted, "feed-portrait", "carousel");
  assert.equal(carousel.length, 5);
  assert.ok(carousel[0]?.kicker.includes("cover") || carousel[0]?.kicker.includes("Page 1"));
  const story = sequenceBeats(converted, "story");
  assert.ok(story.length >= 3);
  assert.ok(story.length <= 5);
  const reels = sequenceBeats(converted, "reels-cover");
  assert.equal(reels.length, 5);
});
