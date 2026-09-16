import assert from "node:assert/strict";
import test from "node:test";
import { localCopy, localDirections, localStrategy, whenLine } from "./zen-local.ts";
import type { CampaignContextInput } from "./zen-schema.ts";

const ctx: CampaignContextInput = {
  name: "浮游禪光",
  type: "tea",
  date: "2026-09-24",
  time: "19:00–21:00",
  location: "B302",
  oneLiner: "一個晚上，一杯茶，什麼都不用做。",
  description: "燈調暗，坐墊放好。",
  theme: "開學第二週",
  painPoints: ["belonging", "stress"],
  cta: "直接來就好",
  signupUrl: "",
  brandContext: "龜龜、三色光、不要宗教詞",
  studentContext: "開學 / 新生週",
};

test("whenLine includes weekday and time", () => {
  const line = whenLine(ctx);
  assert.match(line, /9\/24/);
  assert.match(line, /19:00/);
});

test("localCopy hook does not start with the club name", () => {
  const copy = localCopy(ctx, "normal", 0);
  assert.ok(copy.hook.length > 0);
  assert.equal(/^淡江大學禪學社/.test(copy.hook), false);
  assert.ok(copy.hashtags.some((h) => h.includes("淡江")));
  assert.ok(copy.body.includes("B302") || copy.body.includes("19:00"));
});

test("localCopy six tones all produce a hook", () => {
  for (const tone of ["short", "normal", "warm", "student", "life", "humor"] as const) {
    const c = localCopy(ctx, tone, 1);
    assert.ok(c.hook.length > 4, tone);
    assert.equal(c.tone, tone);
  }
});

test("localDirections returns three distinct directions with prompts", () => {
  const dirs = localDirections(ctx);
  assert.equal(dirs.length, 3);
  assert.ok(dirs.every((d) => d.imagePrompt.length > 20));
  assert.ok(new Set(dirs.map((d) => d.title)).size >= 2);
});

test("localStrategy mixes life/interactive into the wave rhythm", () => {
  const s = localStrategy(ctx);
  assert.ok(s.axis.length > 8);
  assert.ok(s.waves.length >= 6);
  const roles = s.waves.map((w) => w.role);
  assert.ok(roles.includes("recap"));
  assert.ok(roles.some((r) => r === "life" || r === "interactive" || r === "knowledge" || r === "story"));
  const promoRun = roles.filter((r) => r === "teaser" || r === "keyvisual" || r === "info" || r === "reason").length;
  assert.ok(promoRun < s.waves.length);
});
