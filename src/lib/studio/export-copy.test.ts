import assert from "node:assert/strict";
import test from "node:test";
import { emptyBrief } from "./brief.ts";
import { emptyCopy } from "./copy.ts";
import { buildExportCopyPack } from "./export-copy.ts";
import type { Project } from "./types.ts";

function project(partial: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    name: "浮游禪光",
    createdAt: 1,
    updatedAt: 1,
    brandId: "brand-1",
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "complete",
    brief: emptyBrief(),
    copy: {
      ...emptyCopy(),
      caption: "最近是不是很久沒有好好坐下來？",
      hashtags: ["#淡江禪學社"],
      altText: "夜晚校園主視覺",
    },
    plan: null,
    artboards: {},
    slides: {},
    slideIndex: 0,
    snapshots: [],
    planVersions: [],
    exports: [],
    ...partial,
  };
}

test("export copy pack uses local caption and never claims it was posted", () => {
  const text = buildExportCopyPack(project());
  assert.match(text, /一人發佈包/);
  assert.match(text, /浮游禪光/);
  assert.match(text, /最近是不是很久沒有好好坐下來？/);
  assert.match(text, /#淡江禪學社/);
  assert.match(text, /不是 Instagram 發文/);
  assert.match(text, /夜晚校園主視覺/);
  assert.match(text, /畫面備註/);
  assert.match(text, /排程提醒/);
  assert.match(text, /還沒排進日曆/);
  assert.equal(text.includes("Insights"), true);
});

test("export copy pack prefers Copy Pack 學生版 when present", () => {
  const text = buildExportCopyPack(project({
    plan: {
      campaignName: "浮游禪光",
      concept: "",
      insight: "",
      hook: "",
      visualTheme: "",
      visualDirection: "",
      templateId: "editorial",
      colorMood: "",
      eyebrow: "",
      headline: "",
      subhead: "",
      body: "",
      cta: "",
      captions: [],
      hashtags: [],
      storyBeats: [],
      carouselPages: [],
      assetNeeds: [],
      checklist: [],
      altText: "",
      qaNotes: [],
      copyPack: {
        variants: [{
          tone: "短版",
          hook: "短",
          body: "這是短版不該成為預設輸出",
          cta: "看",
          hashtags: ["#短"],
        }, {
          tone: "學生版",
          hook: "下課了腦袋還沒下課",
          body: "課表先放一下。",
          cta: "保留這個晚上",
          hashtags: ["#淡江生活"],
        }],
        studentReview: [],
        revisedCaption: "",
        threads: "Threads 版",
        line: "LINE 版",
        storyFrames: ["限動一"],
        carouselPages: [],
        reelsScript: [{ timing: "0–3 秒", visual: "", subtitle: "坐下", voiceover: "", transition: "", assetSuggestion: "" }],
        generatedAt: 1,
        source: "mock",
      },
      generatedAt: 1,
      source: "mock",
    },
  }));
  assert.match(text, /課表先放一下/);
  assert.equal(text.includes("這是短版不該成為預設輸出"), false);
  assert.match(text, /#淡江生活/);
  assert.match(text, /Threads 版/);
  assert.match(text, /LINE 版/);
  assert.match(text, /限動|Story/);
  assert.match(text, /Reels/);
  assert.match(text, /畫面備註/);
  assert.match(text, /排程提醒/);
  assert.match(text, /學生視角/);
});
