import assert from "node:assert/strict";
import test from "node:test";
import { buildZenMockPlan } from "../club/mock-plan.ts";
import { applyStudentReviewToPack, applyStudentReviewToPlan } from "./review.ts";
import { buildCopyPack } from "./pack.ts";

test("student review moves time beside CTA and strips formal invite", () => {
  const plan = buildZenMockPlan({
    eventName: "茶會",
    schedule: "下週三 19:30",
    location: "淡江校園",
    product: "茶會",
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: "晚上喝茶",
    style: "學生生活感",
    notes: "",
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tku.zen",
    voice: "學生感",
    doSay: "坐下",
    dontSay: "宗教",
    forbiddenWords: ["誠摯邀請您"],
    slogans: "最近是不是很久沒有好好坐下來？",
    preferredCtas: "來坐一下",
  });
  const poisoned = {
    ...plan,
    hook: `${plan.hook}誠摯邀請您`,
    captions: plan.captions.map((item) => ({ ...item, text: `${item.text}\n誠摯邀請您——開啟人生新篇章` })),
  };
  const { plan: next, applied } = applyStudentReviewToPlan(poisoned);
  assert.equal(next.hook.includes("誠摯邀請您"), false);
  assert.equal(next.captions[0]?.text.includes("誠摯邀請您"), false);
  assert.equal(next.captions[0]?.text.includes("開啟人生新篇章"), false);
  assert.match(next.captions[0]?.text ?? "", /來坐一下/);
  const caption = next.captions[0]?.text ?? "";
  assert.ok(caption.lastIndexOf("來坐一下") >= caption.length - 8);
  assert.ok(applied.length >= 1);
  assert.ok(next.studentReview?.revisions.every((item) => item.startsWith("已套用")));
});

test("copy pack review is idempotent enough to keep the student hook", () => {
  const pack = buildCopyPack("最近是不是連休息都覺得有罪惡感？", "學生版", {
    eventName: "茶會",
    schedule: "9/24 19:30",
    location: "淡江校園",
  });
  const once = applyStudentReviewToPack(pack).pack;
  const twice = applyStudentReviewToPack(once).pack;
  assert.match(twice.hook, /？/);
  assert.equal(twice.hook.includes("誠摯邀請您"), false);
  assert.match(twice.body, /來坐一下/);
});
