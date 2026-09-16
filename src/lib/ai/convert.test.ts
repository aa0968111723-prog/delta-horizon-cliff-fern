import assert from "node:assert/strict";
import test from "node:test";
import { convertPlan } from "./convert.ts";
import { buildMockPlan } from "./mock.ts";

test("convertPlan expands carousel and reels without assignee fields", () => {
  const plan = buildMockPlan({
    eventName: "浮游禪光",
    schedule: "9/24 19:00",
    location: "淡水校園",
    product: "浮游禪光",
    offer: "",
    audience: "淡江大一新生",
    goal: "traffic",
    features: "三色光、坐下來",
    style: "生活感",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tamkang.zen",
    voice: "自然",
    doSay: "坐下來",
    dontSay: "誠摯邀請",
    forbiddenWords: ["誠摯邀請"],
  });
  const carousel = convertPlan(plan, "carousel");
  assert.ok(carousel.items.length >= 5);
  const reels = convertPlan(plan, "reels");
  assert.match(reels.items[0] ?? "", /0–3|Hook|秒/);
  assert.ok(plan.hook.length > 0);
  assert.equal("assignee" in plan, false);
});
