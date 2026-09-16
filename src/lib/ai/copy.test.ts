import assert from "node:assert/strict";
import test from "node:test";
import { buildMockCopyPack, type CopyRequest } from "./copy.ts";

const request: CopyRequest = {
  campaignName: "期中喘口氣茶會",
  hook: "",
  concept: "一起喝杯茶，讓腦袋休息一下。",
  schedule: "10/22 19:00–20:30",
  location: "淡江大學商管大樓",
  audience: "正在準備期中的淡江學生",
  studentPain: "報告和考試一起來，回到宿舍還停不下來。",
  cta: "找朋友一起來",
  registrationUrl: "",
  brandVoice: "像真的社團同學，自然、不說教。",
  hashtags: ["#期中"],
};

test("copy pack provides six tones and complete cross-format drafts", () => {
  const pack = buildMockCopyPack(request);
  assert.deepEqual(pack.variants.map((item) => item.tone), [
    "短版",
    "一般版",
    "感性版",
    "學生版",
    "生活版",
    "幽默版",
  ]);
  assert.equal(pack.storyFrames.length, 4);
  assert.equal(pack.carouselPages.length, 5);
  assert.equal(pack.reelsScript.length, 5);
  assert.match(pack.threads, /10\/22/);
  assert.match(pack.line, /淡江大學商管大樓/);
});

test("student review does not pretend missing registration information is complete", () => {
  const pack = buildMockCopyPack(request);
  const registration = pack.studentReview.find((item) => item.question.includes("報名"));
  assert.equal(registration?.pass, false);
  assert.match(registration?.feedback ?? "", /尚未提供/);
});

test("copy avoids a formal invitation hook and includes club-specific hashtags", () => {
  const pack = buildMockCopyPack({ ...request, hook: "淡江大學禪學社誠摯邀請您" });
  assert.doesNotMatch(pack.variants[0].hook, /誠摯邀請/);
  assert.ok(pack.variants.every((item) => item.hashtags.includes("#淡江禪學社")));
});
