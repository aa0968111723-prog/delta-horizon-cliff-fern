import assert from "node:assert/strict";
import test from "node:test";
import { buildZenMockPlan, mockDirections } from "./pack-mock.ts";
import type { BriefInput } from "./schema.ts";

test("zen mock plan opens with a lived hook not a formal invitation", () => {
  const data: BriefInput = {
    eventName: "浮游禪光",
    schedule: "9/24 19:30",
    location: "圖書館前",
    product: "夜間靜心",
    offer: "",
    audience: "淡江大一新生",
    goal: "traffic",
    features: "燈光、熱茶",
    style: "生活",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "自然",
    doSay: "淡江",
    dontSay: "誠摯邀請",
    forbiddenWords: ["誠摯邀請"],
  };
  const plan = buildZenMockPlan(data, mockDirections("浮游禪光"));
  assert.equal(plan.hook.includes("誠摯邀請"), false);
  assert.ok(plan.hook.includes("坐") || plan.hook.includes("最近"));
  assert.equal(plan.directions?.length, 3);
  assert.ok(plan.studentSim);
  assert.equal(plan.carouselPages.length, 6);
  assert.ok(plan.reelsScript?.length);
});
