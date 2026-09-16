import assert from "node:assert/strict";
import test from "node:test";
import { mockDirections, buildZenMockPlan, mockStoryFrames, mockReels } from "../ai/pack-mock.ts";
import { alignPackToDirection } from "./pack-align.ts";

function packFor(name: string) {
  const directions = mockDirections(name);
  const plan = buildZenMockPlan(
    {
      eventName: name,
      schedule: "9/24 19:30",
      location: "圖書館前",
      product: name,
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
    },
    directions,
  );
  return {
    plan,
    directions,
    copyVariants: [
      { tone: "student" as const, hook: plan.hook, body: `${plan.hook}\n晚上來坐一下`, cta: plan.cta, hashtags: plan.hashtags },
    ],
    conversions: {
      carousel: plan.carouselPages,
      story: mockStoryFrames(name, plan.subhead, "淡江校園"),
      threads: `${plan.hook}\n${name}`,
      line: `【${name}】${plan.hook}`,
      reels: mockReels(name, plan.subhead),
    },
  };
}

test("choosing 朋友感 keeps all three directions and moves the hook off 夜間坐下", () => {
  const pack = packFor("浮游禪光");
  const next = alignPackToDirection(pack, "dir_b");
  assert.equal(next.directions[0].id, "dir_a");
  assert.equal(next.directions[1].id, "dir_b");
  assert.match(next.plan.hook, /朋友/);
  assert.equal(next.plan.hook.includes("坐下來"), false);
  assert.match(next.plan.visualDirection, /圍坐|杯子|朋友/);
  assert.match(next.copyVariants[0].body, /朋友/);
  assert.match(next.conversions.carousel[0].headline.replace(/\n/g, ""), /朋友/);
  assert.match(next.conversions.threads, /朋友/);
});

test("without a chosen direction the featured hook stays", () => {
  const pack = packFor("浮游禪光");
  const next = alignPackToDirection(pack);
  assert.equal(next.plan.hook, pack.plan.hook);
  assert.equal(next.directions[0].id, "dir_a");
});
