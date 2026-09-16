import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand } from "../studio/brand.ts";
import { hashtagsFromOutcomes, lessonsFromInsights, lessonsFromLocalWork, lessonsFromOutcomes, learnedHookFromMemory, learnedRememberFromMemory, mergeHashtagMemory, mergeLearnedPatterns, stripOutcomeLessons } from "./learning.ts";
import type { Campaign, ContentItem, PostOutcome } from "./types.ts";

const campaign: Campaign = {
  id: "c1",
  name: "浮游禪光",
  type: "茶會",
  eventDate: "2026-09-24",
  eventTime: "19:00",
  location: "淡江校園",
  oneLiner: "下課後喘口氣",
  description: "",
  theme: "",
  studentPain: "剛開學課表很滿",
  cta: "保留這個晚上",
  registrationUrl: "",
  assetIds: [],
  createdAt: 1,
  updatedAt: 1,
};

const story: ContentItem = {
  id: "i1",
  campaignId: "c1",
  title: "社員故事",
  angle: "真實聲音",
  type: "社員故事",
  status: "complete",
  plannedAt: "2026-09-20",
  publishedAt: null,
  projectId: null,
  createdAt: 1,
  updatedAt: 1,
};

test("insights lessons stay empty when Instagram returned no rows", () => {
  assert.deepEqual(lessonsFromInsights([]), []);
  assert.deepEqual(lessonsFromInsights(undefined), []);
});

test("insights lessons only quote official numbers", () => {
  const lessons = lessonsFromInsights([
    { metric: "reach", label: "觸及", value: 128, period: "day" },
  ]);
  assert.match(lessons[0] ?? "", /觸及：128/);
  assert.match(lessons[0] ?? "", /不是模擬成效/);
});

test("local learning records student context and completed story types without inventing IG metrics", () => {
  const brand = createEmptyBrand("淡江大學禪學社");
  const lessons = lessonsFromLocalWork({
    brand,
    assets: [],
    campaigns: [campaign],
    contentItems: [story],
    insights: null,
  });
  assert.equal(lessons.some((item) => /課表很滿/.test(item)), true);
  assert.equal(lessons.some((item) => /社員故事/.test(item)), true);
  assert.equal(lessons.some((item) => /Insights/.test(item)), false);
});

test("outcome lessons write what actually happened, never fake Insights", () => {
  const outcome: PostOutcome = {
    id: "o1",
    contentItemId: "i1",
    campaignId: "c1",
    title: "浮游禪光主視覺",
    whoShowedUp: "住宿生比較多，有兩個新生問要不要帶坐墊",
    hookThatFeltTamkang: "最近是不是連休息都覺得有罪惡感？",
    remember: "時間放 Caption 最上面，宿舍同學才找得到",
    hashtags: ["#淡江禪學社"],
    createdAt: 1,
  };
  const lessons = lessonsFromOutcomes([outcome]);
  assert.equal(lessons.every((item) => item.startsWith("現場：")), true);
  assert.equal(lessons.some((item) => /罪惡感/.test(item)), true);
  assert.equal(lessons.some((item) => /住宿生/.test(item)), true);
  assert.equal(lessons.some((item) => /Insights|觸及|觀看次數|假讚/.test(item)), false);
});

test("empty outcome fields do not invent attendance or reach", () => {
  assert.deepEqual(lessonsFromOutcomes([{
    id: "o2",
    contentItemId: null,
    campaignId: null,
    title: " ",
    whoShowedUp: "   ",
    hookThatFeltTamkang: "",
    remember: "",
    hashtags: [],
    createdAt: 1,
  }]), []);
});

test("local learning prefers field notes over inferred copy lessons", () => {
  const brand = createEmptyBrand("淡江大學禪學社");
  const lessons = lessonsFromLocalWork({
    brand,
    assets: [],
    campaigns: [campaign],
    contentItems: [story],
    outcomes: [{
      id: "o1",
      contentItemId: "i1",
      campaignId: "c1",
      title: "浮游禪光",
      whoShowedUp: "商管的同學來了幾位",
      hookThatFeltTamkang: "下課後先不要急著回完所有訊息",
      remember: "別把報名連結藏在最後一行",
      hashtags: ["#浮游禪光"],
      createdAt: 1,
    }],
    insights: null,
  });
  assert.equal(lessons[0]?.startsWith("現場："), true);
  assert.equal(lessons.some((item) => /Insights/.test(item)), false);
});

test("mergeLearnedPatterns keeps newest unique lines", () => {
  assert.deepEqual(
    mergeLearnedPatterns(["先說學生生活"], ["先說學生生活", "時間地點集中"]),
    ["先說學生生活", "時間地點集中"],
  );
});

test("field-note memory parser reads hook and remember from the joined Brand Memory line", () => {
  const memory = "已學到的規律：現場：「浮游禪光」覺得像淡江的 Hook「下課後先不要急著回完所有訊息」、現場：「浮游禪光」下次要記得：時間放 Caption 最上面";
  assert.equal(learnedHookFromMemory(memory), "下課後先不要急著回完所有訊息");
  assert.equal(learnedRememberFromMemory(memory), "時間放 Caption 最上面");
});

test("removing a field note also drops its Brand Memory lines", () => {
  const outcome: PostOutcome = {
    id: "o3",
    contentItemId: "i1",
    campaignId: "c1",
    title: "浮游禪光",
    whoShowedUp: "住宿生",
    hookThatFeltTamkang: "下課後先不要急著回完所有訊息",
    remember: "時間放 Caption 最上面",
    hashtags: ["#淡江生活"],
    createdAt: 1,
  };
  const existing = [...lessonsFromOutcomes([outcome]), "先說學生生活"];
  assert.deepEqual(stripOutcomeLessons(existing, outcome), ["先說學生生活"]);
});

test("hashtags from outcomes rank field-note tags ahead of unused ones", () => {
  const tags = hashtagsFromOutcomes([
    {
      id: "o4",
      contentItemId: "i1",
      campaignId: "c1",
      title: "浮游禪光",
      whoShowedUp: "",
      hookThatFeltTamkang: "",
      remember: "",
      hashtags: ["#淡江禪學社", "#浮游禪光"],
      createdAt: 1,
    },
    {
      id: "o5",
      contentItemId: null,
      campaignId: "c1",
      title: "招生",
      whoShowedUp: "",
      hookThatFeltTamkang: "",
      remember: "下次加 #淡江禪學社",
      hashtags: [],
      createdAt: 2,
    },
  ]);
  assert.equal(tags[0], "#淡江禪學社");
  assert.ok(tags.includes("#浮游禪光"));
  assert.deepEqual(mergeHashtagMemory(["#浮游禪光"], ["#淡江禪學社", "#浮游禪光"]), ["#浮游禪光", "#淡江禪學社"]);
});
