import assert from "node:assert/strict";
import test from "node:test";
import { convertPlan, allConvertedPacks, reelsVideoPrompt } from "./pack.ts";
import { buildZenMockPlan } from "../club/mock-plan.ts";

const plan = buildZenMockPlan({
  eventName: "浮游禪光",
  schedule: "2026-09-24 19:30",
  location: "淡江校園",
  product: "浮游禪光",
  offer: "",
  audience: "淡江大學學生",
  goal: "awareness",
  features: "燈會先亮",
  style: "",
  notes: "",
  wantPost: true,
  wantStory: true,
  wantCarousel: true,
  wantReels: true,
  brandName: "淡江大學禪學社",
  handle: "@tku.zen",
  voice: "",
  doSay: "",
  dontSay: "",
  forbiddenWords: [],
  slogans: "最近是不是很久沒有好好坐下來？",
  preferredCtas: "來坐一下",
});

test("convert to carousel has hook then CTA", () => {
  const pack = convertPlan(plan, "carousel");
  assert.equal(pack.title.includes("Carousel"), true);
  assert.ok(pack.items.length >= 5);
  assert.ok(pack.items[0].heading.toLowerCase().includes("hook") || pack.items[0].body.includes("？"));
});

test("convert to reels keeps timed beats", () => {
  const pack = convertPlan(plan, "reels");
  assert.ok(pack.items[0].heading.includes("0"));
  assert.ok(pack.items.some((item) => item.heading.includes("17")));
});

test("allConvertedPacks keeps every IG size for one pack", () => {
  const packs = allConvertedPacks(plan);
  assert.ok((packs.story?.length ?? 0) >= 3);
  assert.ok((packs.reels?.length ?? 0) >= 5);
  assert.ok((packs.carousel?.length ?? 0) >= 5);
  assert.ok((packs.threads?.[0]?.body.length ?? 0) > 8);
  assert.ok((packs.line?.[0]?.body.length ?? 0) > 4);
});

test("reels video prompt keeps the student hook and timed beats", () => {
  const items = convertPlan(plan, "reels").items;
  const prompt = reelsVideoPrompt(plan.hook, items);
  assert.match(prompt, /9:16/);
  assert.match(prompt, /Tamkang/);
  assert.match(prompt, /not a temple poster/);
  assert.match(prompt, /好好坐下來/);
  assert.ok(prompt.length <= 800);
});
