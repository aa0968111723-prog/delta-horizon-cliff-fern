import assert from "node:assert/strict";
import test from "node:test";
import { convertPlan } from "./pack.ts";
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

test("convert to threads and line", () => {
  assert.ok(convertPlan(plan, "threads").items[0].body.length > 8);
  assert.equal(convertPlan(plan, "line").title, "LINE");
});
