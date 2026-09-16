import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultImageRatio,
  pickArrivalWave,
  shouldAutofillCopy,
  shouldAutofillReels,
  shouldAutofillVisuals,
  topicForKind,
  visualIntent,
  wantsArrivalAutofill,
  waveCreateSearch,
  waveProjectFields,
} from "./wave-draft.ts";
import type { Campaign, CampaignWave } from "./types.ts";

test("topicForKind maps content types to copy topics", () => {
  assert.equal(topicForKind("countdown", true), "countdown");
  assert.equal(topicForKind("recap", true), "recap");
  assert.equal(topicForKind("knowledge", false), "knowledge");
  assert.equal(topicForKind("qa", true), "knowledge");
  assert.equal(topicForKind("member-story", false), "member");
  assert.equal(topicForKind("ig-post", true), "event");
  assert.equal(topicForKind("ig-post", false), "emotion");
  assert.equal(topicForKind("story", true), "event");
  assert.equal(topicForKind("reels", false), "emotion");
});

test("shouldAutofillCopy only runs when arriving with a seed or campaign, after hydrate", () => {
  assert.equal(
    shouldAutofillCopy({ seed: "第一次來" }, { hydrated: true, hasDrafts: false, hasPrompt: true }),
    true,
  );
  assert.equal(
    shouldAutofillCopy(
      { contentId: "proj_1", campaignId: "camp_1" },
      { hydrated: true, hasDrafts: false, hasPrompt: true },
    ),
    true,
  );
  assert.equal(
    shouldAutofillCopy({ seed: "x", from: "image" }, { hydrated: true, hasDrafts: false, hasPrompt: true }),
    false,
  );
  assert.equal(
    shouldAutofillCopy({ seed: "x", asset: "asset_1" }, { hydrated: true, hasDrafts: false, hasPrompt: true }),
    false,
  );
  assert.equal(
    shouldAutofillCopy({ seed: "x" }, { hydrated: false, hasDrafts: false, hasPrompt: true }),
    false,
  );
  assert.equal(
    shouldAutofillCopy({ seed: "x" }, { hydrated: true, hasDrafts: true, hasPrompt: true }),
    false,
  );
  assert.equal(
    shouldAutofillCopy({ seed: "x" }, { hydrated: true, hasDrafts: false, hasPrompt: false }),
    false,
  );
  assert.equal(shouldAutofillCopy({}, { hydrated: true, hasDrafts: false, hasPrompt: true }), false);
  assert.equal(
    shouldAutofillCopy({ kind: "ig-post" }, { hydrated: true, hasDrafts: false, hasPrompt: true }),
    true,
  );
  assert.equal(
    shouldAutofillCopy({ step: "visual" }, { hydrated: true, hasDrafts: false, hasPrompt: true }),
    true,
  );
  assert.equal(
    shouldAutofillCopy({ from: "idea", kind: "ig-post" }, { hydrated: true, hasDrafts: false, hasPrompt: true }),
    false,
  );
});

test("wantsArrivalAutofill skips blank create and image-first flows", () => {
  assert.equal(wantsArrivalAutofill({}), false);
  assert.equal(wantsArrivalAutofill({ from: "idea" }), false);
  assert.equal(wantsArrivalAutofill({ from: "image", kind: "story" }), false);
  assert.equal(wantsArrivalAutofill({ kind: "story" }), true);
});

test("shouldAutofillVisuals and Reels follow the same arrival rules", () => {
  assert.equal(
    shouldAutofillVisuals({ kind: "ig-post" }, { hydrated: true, hasDirections: false, hasIntent: true }),
    true,
  );
  assert.equal(
    shouldAutofillVisuals({ kind: "ig-post" }, { hydrated: true, hasDirections: true, hasIntent: true }),
    false,
  );
  assert.equal(
    shouldAutofillReels({ kind: "reels" }, "reels", { hydrated: true, hasReels: false, hasPrompt: true }),
    true,
  );
  assert.equal(
    shouldAutofillReels({ kind: "ig-post" }, "ig-post", { hydrated: true, hasReels: false, hasPrompt: true }),
    false,
  );
});

test("defaultImageRatio follows the content format", () => {
  assert.equal(defaultImageRatio("ig-post"), "4:5");
  assert.equal(defaultImageRatio("story"), "9:16");
  assert.equal(defaultImageRatio("reels"), "9:16");
  assert.equal(defaultImageRatio("line"), "1.91:1");
  assert.equal(defaultImageRatio("threads"), "1:1");
});

test("visualIntent falls back to the club, not an empty prompt", () => {
  assert.equal(visualIntent({ idea: "第一次來" }), "第一次來");
  assert.equal(visualIntent({ eventName: "浮游禪光" }), "活動：浮游禪光");
  assert.match(visualIntent({}), /禪學社/);
});

test("waveProjectFields uses the wave format instead of always feed-portrait", () => {
  const fields = waveProjectFields({
    brandId: "brand",
    campaign: {
      id: "camp_1",
      name: "浮游禪光",
      date: "2026-09-24",
      time: "19:00",
      location: "商管 B302",
      oneLiner: "一個可以慢下來的晚上",
      intro: "社課",
      audienceIds: ["freshman"],
    },
    wave: {
      title: "明天見",
      kind: "countdown",
      hook: "明天晚上，位子留著",
      note: "限動，一張圖講完時間地點。",
      stage: "倒數",
    },
  });
  assert.equal(fields.formatId, "story");
  assert.equal(fields.contentKind, "countdown");
  assert.equal(fields.brief.deliverables.story, true);
  assert.equal(fields.brief.deliverables.post, false);
  assert.equal(fields.brief.features, "明天晚上，位子留著");
  assert.deepEqual(waveCreateSearch("proj_1", { kind: "countdown", hook: "明天晚上，位子留著" }, "camp_1"), {
    from: "idea",
    contentId: "proj_1",
    kind: "countdown",
    campaignId: "camp_1",
    seed: "明天晚上，位子留著",
  });
});

test("waveProjectFields for reels uses the cover format", () => {
  const fields = waveProjectFields({
    brandId: "brand",
    campaign: {
      id: "camp_1",
      name: "浮游禪光",
      date: "2026-09-24",
      time: "19:00",
      location: "商管 B302",
      oneLiner: "",
      intro: "",
      audienceIds: [],
    },
    wave: {
      title: "主視覺",
      kind: "reels",
      hook: "很久沒有好好坐下來了吧",
      note: "",
      stage: "主視覺",
    },
  });
  assert.equal(fields.formatId, "reels-cover");
  assert.equal(fields.brief.deliverables.reels, true);
});

function wave(patch: Partial<CampaignWave> & { id: string }): CampaignWave {
  return {
    offsetDays: 0,
    stage: "預熱",
    title: "預熱",
    kind: "ig-post",
    hook: "先問一句",
    note: "",
    contentId: null,
    ...patch,
  };
}

function campaign(patch: Partial<Campaign> & { id: string; waves: CampaignWave[] }): Campaign {
  return {
    name: "浮游禪光",
    kind: "sit",
    date: "2026-09-24",
    time: "19:00",
    location: "商管 B302",
    oneLiner: "一個可以慢下來的晚上",
    intro: "社課",
    theme: "",
    painPoint: "很累",
    cta: "來坐一下",
    signupUrl: "",
    coverAssetId: null,
    assetIds: [],
    audienceIds: ["freshman"],
    axis: "",
    directions: [],
    createdAt: 1,
    updatedAt: 1,
    planSource: "live",
    ...patch,
  };
}

test("pickArrivalWave prefers a pending wave of the requested kind", () => {
  const camp = campaign({
    id: "camp_1",
    waves: [
      wave({ id: "w1", kind: "ig-post", hook: "已做的貼文", contentId: "proj_old" }),
      wave({ id: "w2", kind: "story", hook: "限動鉤子", contentId: null }),
      wave({ id: "w3", kind: "ig-post", hook: "下一則貼文", contentId: null }),
    ],
  });
  const hit = pickArrivalWave([camp], "ig-post");
  assert.equal(hit?.wave.id, "w3");
  assert.equal(hit?.wave.hook, "下一則貼文");
  const story = pickArrivalWave([camp], "story");
  assert.equal(story?.wave.id, "w2");
});
