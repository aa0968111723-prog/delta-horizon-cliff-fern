import assert from "node:assert/strict";
import test from "node:test";
import { localTodayIdeas } from "./ideas.ts";

test("local today ideas follow the semester and stay in everyday language", () => {
  const midterm = localTodayIdeas(Date.parse("2026-11-10T12:00:00+08:00"));
  assert.equal(midterm.length, 4);
  assert.ok(midterm.some((idea) => idea.kind === "story" || idea.kind === "knowledge"));
  const blob = midterm.map((idea) => `${idea.title} ${idea.hook} ${idea.why}`).join(" ");
  assert.doesNotMatch(blob, /洗滌心靈|法喜|開悟/);
  assert.match(blob, /期中/);
});

test("orientation ideas lower the first-visit barrier", () => {
  const ideas = localTodayIdeas(Date.parse("2026-09-12T12:00:00+08:00"));
  assert.ok(ideas.some((idea) => idea.kind === "ig-post" || idea.kind === "story"));
  assert.match(ideas.map((idea) => idea.why).join(" "), /迎新/);
});
