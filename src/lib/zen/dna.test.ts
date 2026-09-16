import assert from "node:assert/strict";
import test from "node:test";
import { clubCreativeDna } from "./dna.ts";
import { tagsFromVision, ideaFromVision } from "./vision-tags.ts";
import { guessEventName } from "./dates.ts";
import { proposedHook, studentReviewOf, tidyCopy } from "./review.ts";

test("clubCreativeDna prefers own IG and motifs, not generic youth", () => {
  const dna = clubCreativeDna({
    brand: {
      id: "b",
      name: "淡江大學禪學社",
      handle: "@tamkang.zen",
      website: "",
      voice: "像同學傳訊息",
      doSay: "坐下來",
      dontSay: "誠摯邀請",
      forbiddenWords: ["誠摯邀請"],
      colors: [
        { id: "c1", hex: "#6B7F6A", role: "primary", label: "霧園" },
        { id: "c2", hex: "#4A6B73", role: "secondary", label: "靜水" },
      ],
      fontDisplay: "serif",
      fontBody: "sans",
      logoAssetId: null,
      logos: [],
      slogans: [],
      ctas: ["來坐一下"],
      imageStyle: {
        mood: "夜晚空氣",
        lighting: "三色光",
        paletteHint: "霧園",
        composition: "下半問句",
        do: "留白",
        dont: "寺廟",
      },
      rules: { noCompetitorMarks: true, noWatermark: true, noLowRes: true, notes: "" },
      boilerplate: { cta: "來坐一下", disclaimer: "", hashtags: ["#淡江"], captionClose: "" },
      mascot: "龜龜",
      motifs: ["龜龜", "三色光"],
      likes: ["問句 Hook"],
      dislikes: ["寺廟海報"],
      audienceNotes: "淡江學生",
      updatedAt: 1,
    },
    igMemory: [
      {
        id: "1",
        caption: "最近是不是很久沒有好好坐下來？\n#淡江禪學社 #淡水",
        date: "2026-09-17",
        kind: "carousel",
        saves: 20,
        source: "local",
      },
    ],
    campaigns: [
      {
        id: "c",
        name: "浮游禪光",
        type: "light",
        date: "2026-09-24",
        time: "19:00",
        location: "淡水校園",
        oneLiner: "最近是不是很久沒有好好坐下來？",
        description: "",
        theme: "光",
        studentPain: "",
        cta: "來坐一下",
        signupUrl: "",
        imageAssetId: null,
        assetIds: [],
        waves: [],
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  });
  assert.match(dna.promptBlock, /龜龜/);
  assert.match(dna.promptBlock, /浮游禪光/);
  assert.match(dna.promptBlock, /來坐一下/);
  assert.doesNotMatch(dna.promptBlock, /Z 世代|年輕人目標/);
  assert.ok(dna.hashtags.includes("#淡江禪學社") || dna.hashtags.includes("#淡水"));
});

test("tagsFromVision maps turtle night photos to searchable tags", () => {
  const tags = tagsFromVision({
    content: "角落有龜龜，淡水夜色與三色光。",
    colors: "琥珀",
    tooReligious: false,
    tooOld: false,
    tooAi: false,
    fitsTamkang: true,
    suggestions: ["延續這個風格", "做成限動"],
  });
  assert.ok(tags.includes("龜龜"));
  assert.ok(tags.includes("夜晚"));
  assert.ok(tags.includes("學生感"));
  assert.ok(tags.includes("可做限動"));
});

test("ideaFromVision keeps the image as style, not a copy job", () => {
  const idea = ideaFromVision({ content: "茶會現場圍坐", colors: "暖紙色" }, "下週有一場茶會");
  assert.match(idea, /茶會/);
  assert.match(idea, /不要複製/);
});

test("guessEventName does not use a long hook as the campaign title", () => {
  assert.equal(guessEventName("下週有一場茶會"), "茶會");
  assert.equal(guessEventName("浮游禪光倒數"), "浮游禪光");
  assert.equal(guessEventName("最近是不是很久沒有好好坐下來？"), "");
});

test("proposedHook never keeps 誠摯邀請", () => {
  const hook = proposedHook("淡江大學禪學社誠摯邀請您蒞臨茶會");
  assert.match(hook, /？/);
  assert.doesNotMatch(hook, /誠摯/);
  const review = studentReviewOf("淡江大學禪學社誠摯邀請您蒞臨法會");
  assert.doesNotMatch(review.rewriteHook, /誠摯/);
});

test("tidyCopy collapses doubled periods", () => {
  assert.equal(tidyCopy("休息會心虛。。今晚來坐。"), "休息會心虛。今晚來坐。");
});
