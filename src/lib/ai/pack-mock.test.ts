import assert from "node:assert/strict";
import test from "node:test";
import { looksEnglish } from "./zh.ts";
import { buildZenMockPlan, mockDirections, applyStudentRevisions, mockStudentSim, reviseCopiesForStudent, stampEventWhen } from "./pack-mock.ts";
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
  assert.equal(plan.hook.includes("期末"), false);
  assert.match(plan.hook, /坐|最近|淡水|朋友|課表|休息/);
  assert.equal(plan.directions?.length, 3);
  assert.ok(plan.studentSim);
  assert.equal(plan.carouselPages.length, 6);
  assert.ok(plan.reelsScript?.length);
  assert.equal(looksEnglish(plan.directions?.[0]?.imagePrompt ?? ""), false);
  assert.ok(plan.directions?.[0]?.imagePrompt.includes("三色光"));
});

test("next-week tea captions name the night, not a vague evening", () => {
  const data: BriefInput = {
    eventName: "茶會",
    schedule: "9/23 19:30",
    location: "淡江校園",
    product: "茶會",
    offer: "",
    audience: "淡江大一新生、住宿生",
    goal: "traffic",
    features: "燈光、熱茶、坐著就好",
    style: "生活",
    notes: "下週有一場茶會",
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
  const plan = buildZenMockPlan(data, mockDirections("茶會"));
  assert.equal(plan.campaignName, "茶會");
  assert.match(plan.captions[0]?.text ?? "", /9\/23/);
  assert.match(plan.captions[2]?.text ?? "", /茶會/);
  assert.equal((plan.captions[0]?.text ?? "").includes("近期晚上"), false);
  assert.equal(plan.studentSim?.knowsWhenWhere, true);
  assert.match(plan.subhead, /9\/23/);
});

test("近期晚上 is not knowing when the night is", () => {
  const sim = mockStudentSim({
    hook: "最近是不是很久沒坐好？",
    caption: "坐一下就好。",
    when: "近期晚上",
    where: "淡江校園",
    cta: "晚上來坐一下",
  });
  assert.equal(sim.knowsWhenWhere, false);
});

test("stampEventWhen writes the night if the model skipped it", () => {
  const next = stampEventWhen(
    [{ tone: "student", hook: "先坐。", body: "不用先懂禪。", cta: "來坐", hashtags: [] }],
    "9/23 19:30",
    "淡江校園",
  );
  assert.match(next[0]?.body ?? "", /9\/23/);
  assert.match(next[0]?.body ?? "", /淡江校園/);
  const kept = stampEventWhen(next, "9/23 19:30", "淡江校園");
  assert.equal(kept[0]?.body.split("9/23").length, 2);
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
  const batch = reviseCopiesForStudent(
    [
      { tone: "student", hook: "最近是不是很久沒坐好？", body: "坐一下就好。", cta: "晚上來坐一下", hashtags: ["#淡江禪學社"] },
      { tone: "short", hook: "先坐。", body: "不用先懂禪。", cta: "來坐", hashtags: ["#淡江禪學社"] },
    ],
    sim,
    "9/24 19:30",
    "圖書館前",
  );
  assert.equal(batch.applied, true);
  assert.ok(batch.copies.every((item) => item.body.includes("9/24")));
});

test("after publishing 坐好 the mock pack opens on a different hook", () => {
  const data: BriefInput = {
    eventName: "茶會",
    schedule: "9/23 19:30",
    location: "淡江校園",
    product: "茶會",
    offer: "",
    audience: "淡江大一新生、住宿生",
    goal: "traffic",
    features: "燈光、熱茶、坐著就好",
    style: "生活",
    notes: "下週有一場茶會",
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
    avoidHook: "最近是不是很久沒有好好坐下來？",
  };
  const plan = buildZenMockPlan(data, mockDirections("茶會", [data.avoidHook!]));
  assert.equal(plan.hook.includes("坐好"), false);
  assert.equal(plan.hook.includes("坐下來"), false);
  assert.match(plan.hook, /淡水|朋友|課表|休息|風|快樂|捷運/);
  assert.equal((plan.directions?.[0]?.headline ?? "").includes("坐好"), false);
  assert.equal((plan.reelsScript?.[0]?.caption ?? "").includes("坐好"), false);
});
