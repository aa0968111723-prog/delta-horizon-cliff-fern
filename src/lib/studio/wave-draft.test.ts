import assert from "node:assert/strict";
import test from "node:test";
import { shouldAutofillCopy, topicForKind, waveCreateSearch, waveProjectFields } from "./wave-draft.ts";

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
