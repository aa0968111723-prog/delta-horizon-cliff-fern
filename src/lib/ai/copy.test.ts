import assert from "node:assert/strict";
import test from "node:test";
import { buildMockCopyPack, describeCopyAdapter, type CopyRequest } from "./copy.ts";

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
  brandMemory: undefined,
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

test("mock copy weaves Brand Memory campus context into the student voice", () => {
  const pack = buildMockCopyPack({
    ...request,
    brandMemory: "校園情境：淡水雨天、期中報告\n已學到的規律：先寫學生生活",
  });
  assert.match(pack.variants.find((item) => item.tone === "學生版")?.body ?? "", /淡水雨天/);
  assert.match(pack.variants[0].hook, /下雨|淡水/);
});

test("mock copy skips a generic 課表 token and uses the next campus beat", () => {
  const pack = buildMockCopyPack({
    ...request,
    studentPain: "最近有點滿",
    hook: "",
    brandMemory: "校園情境：課表、通勤、宿舍、人際與淡水天氣",
  });
  assert.match(pack.variants.find((item) => item.tone === "學生版")?.body ?? "", /通勤/);
});

test("copy avoids a formal invitation hook and includes club-specific hashtags", () => {
  const pack = buildMockCopyPack({ ...request, hook: "淡江大學禪學社誠摯邀請您" });
  assert.doesNotMatch(pack.variants[0].hook, /誠摯邀請/);
  assert.ok(pack.variants.every((item) => item.hashtags.includes("#淡江禪學社")));
});

test("unavailable copy adapter never pretends Grok wrote the draft", () => {
  const status = describeCopyAdapter(false);
  assert.equal(status.available, false);
  assert.equal(status.adapter, "mock");
  assert.match(status.detail, /不是 Grok 寫的/);
});

test("mock copy prefers a field-note hook over a generic campus line", () => {
  const pack = buildMockCopyPack({
    ...request,
    hook: "最近是不是很久沒有好好坐下來？",
    brandMemory: "校園情境：淡水雨天\n已學到的規律：現場：「浮游禪光」覺得像淡江的 Hook「下課後先不要急著回完所有訊息」、現場：「浮游禪光」下次要記得：時間放 Caption 最上面",
  });
  assert.equal(pack.variants[0].hook, "下課後先不要急著回完所有訊息");
  assert.match(pack.revisedCaption, /^時間｜/);
  assert.equal(pack.studentReview.some((item) => /現場筆記/.test(item.feedback)), true);
  assert.equal(pack.source, "mock");
});
