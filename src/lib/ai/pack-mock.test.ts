import assert from "node:assert/strict";
import test from "node:test";
import { looksEnglish } from "./zh.ts";
import { buildZenMockPlan, mockDirections, applyStudentRevisions, mockStudentSim } from "./pack-mock.ts";
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
  assert.equal(looksEnglish(plan.directions?.[0]?.imagePrompt ?? ""), false);
  assert.ok(plan.directions?.[0]?.imagePrompt.includes("三色光"));
});

test("student-sim revisions add time and a way to come", () => {
  const sim = mockStudentSim({ hook: "最近是不是很久沒坐好？", caption: "坐一下就好。", when: "", where: "", cta: "" });
  const next = applyStudentRevisions(
    { tone: "student", hook: "最近是不是很久沒坐好？", body: "坐一下就好。", cta: "晚上來坐一下", hashtags: ["#淡江禪學社"] },
    sim,
    "9/24 19:30",
    "圖書館前",
  );
  assert.ok(next.body.includes("9/24"));
  assert.ok(/留言|連結/.test(next.body));
});
