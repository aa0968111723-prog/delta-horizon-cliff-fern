import assert from "node:assert/strict";
import test from "node:test";
import { localAltText } from "./copy-alt.ts";
import { copyFromDraft } from "./copy-draft.ts";
import type { CopyDeck, CopyDraft } from "./types.ts";

test("localAltText describes the frame, not a pitch", () => {
  const text = localAltText({
    hook: "很久沒有好好坐下來了吧",
    eventName: "浮游禪光",
    schedule: "9/24 19:00",
    location: "商管 B302",
  });
  assert.match(text, /淡江大學禪學社/);
  assert.match(text, /很久沒有好好坐下來了吧/);
  assert.match(text, /9\/24/);
  assert.match(text, /商管 B302/);
  assert.doesNotMatch(text, /誠摯邀請|踴躍參加|療癒靈魂/);
});

test("copyFromDraft carries caption, hashtags and alt", () => {
  const current: CopyDeck = {
    eyebrow: "",
    headline: "舊標題",
    subhead: "",
    body: "",
    cta: "了解更多",
    handle: "@tku.zen",
    caption: "",
    hashtags: ["#舊"],
    altText: "",
  };
  const draft: CopyDraft = {
    id: "copy_1",
    tone: "student",
    hook: "講真的，最近你有好好休息嗎？",
    body: "9/24 晚上七點，商管 B302。",
    cta: "來坐一下",
    hashtags: ["#淡江大學", "#淡江禪學社"],
    altText: "淡水河傍晚，標題寫著休息。",
    createdAt: 1,
    source: "mock",
  };
  const next = copyFromDraft(current, draft);
  assert.match(next.caption, /好好休息/);
  assert.match(next.caption, /來坐一下/);
  assert.deepEqual(next.hashtags, ["#淡江大學", "#淡江禪學社"]);
  assert.equal(next.altText, "淡水河傍晚，標題寫著休息。");
  assert.equal(next.headline, "講真的，最近你有好好休息嗎？".slice(0, 24));
});

test("copyFromDraft fills alt from the hook when the draft has none", () => {
  const current: CopyDeck = {
    eyebrow: "",
    headline: "新的網宣",
    subhead: "",
    body: "",
    cta: "了解更多",
    handle: "@tku.zen",
    caption: "",
    hashtags: [],
    altText: "",
  };
  const draft: CopyDraft = {
    id: "copy_2",
    tone: "short",
    hook: "先坐一下再說。",
    body: "社課見。",
    cta: "來坐一下",
    hashtags: ["#淡江禪學社"],
    createdAt: 1,
    source: "mock",
  };
  const next = copyFromDraft(current, draft);
  assert.match(next.altText, /先坐一下再說/);
  assert.match(next.altText, /淡江大學禪學社/);
});
