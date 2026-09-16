import assert from "node:assert/strict";
import test from "node:test";
import { convertPlan, captionFromCopyPack, rewriteCopyPack, packCaption } from "./convert.ts";
import { buildMockPlan } from "./mock.ts";

const zenBrief = {
  eventName: "浮游禪光",
  schedule: "9/24 19:00",
  location: "淡水校園",
  product: "浮游禪光",
  offer: "",
  audience: "淡江大一新生",
  goal: "traffic" as const,
  features: "三色光、坐下來",
  style: "生活感",
  notes: "",
  wantPost: true,
  wantStory: true,
  wantCarousel: true,
  wantReels: true,
  brandName: "淡江大學禪學社",
  handle: "@tamkang.zen",
  voice: "自然",
  doSay: "坐下來",
  dontSay: "誠摯邀請",
  forbiddenWords: ["誠摯邀請"],
};

test("convertPlan expands carousel and reels without assignee fields", () => {
  const plan = buildMockPlan(zenBrief);
  const carousel = convertPlan(plan, "carousel");
  assert.ok(carousel.items.length >= 5);
  assert.match(carousel.items[0] ?? "", /第 1 頁/);
  assert.match(carousel.items[0] ?? "", /[？?]|坐下來|晚上|快樂|休息/);
  assert.doesNotMatch(carousel.items[0] ?? "", /第 1 頁 封面 Hook：浮游禪光/);
  assert.doesNotMatch(carousel.items.join(" "), /Page \d/);
  assert.match(plan.directions?.[0]?.name ?? "", /方向 A/);
  assert.match(plan.directions?.[1]?.name ?? "", /方向 B/);
  const reels = convertPlan(plan, "reels");
  assert.match(reels.items[0] ?? "", /0–3|Hook|秒/);
  assert.ok(plan.reelsScript?.beats.length);
  assert.ok(plan.hook.length > 0);
  assert.equal("assignee" in plan, false);
});

test("zen campaign directions put a student hook on the poster, not the event name", () => {
  const plan = buildMockPlan({ ...zenBrief, eventName: "茶會", product: "茶會" });
  assert.match(plan.directions?.[0]?.headline ?? "", /[？?]|晚上|坐下來|快樂|休息/);
  assert.notEqual(plan.directions?.[0]?.headline, "茶會");
});

test("captionFromCopyPack is what Calendar and Canva should send after 快速修改", () => {
  const caption = captionFromCopyPack({
    hook: "可以自己來？",
    body: "下週茶會，不用一次認識完。",
    cta: "來坐一下",
    hashtags: ["#淡江禪學社"],
  });
  assert.match(caption, /^可以自己來？/);
  assert.match(caption, /來坐一下/);
  assert.match(caption, /#淡江禪學社/);
});

test("rewriteCopyPack keeps a short humor body", () => {
  const rewritten = rewriteCopyPack(
    {
      hook: "可以自己來？",
      body: "不是要你頓悟，就是來坐一下。\n2026/09/23 19:00 淡江大學淡水校園",
      cta: "來坐一下",
      hashtags: ["#淡江禪學社"],
    },
    "可以自己來？",
  );
  assert.match(rewritten.caption, /不是要你頓悟/);
});

test("rewriteCopyPack drops a leftover opening even when realize already updated the hook", () => {
  const rewritten = rewriteCopyPack(
    {
      hook: "可以自己來？",
      body: "有時候我們需要的不是答案，只是一個安靜的晚上。\n2026/09/23 19:00，淡江大學淡水校園 · 禪學社\n想找人一起的話，把這則傳給他。",
      cta: "來坐一下",
      hashtags: ["#淡江禪學社"],
    },
    "可以自己來？",
  );
  assert.match(rewritten.caption, /^可以自己來？/);
  assert.doesNotMatch(rewritten.caption, /有時候我們需要的不是答案/);
  assert.match(rewritten.caption, /想找人一起/);
});

test("captionFromCopyPack does not leak brief form labels into the calendar", () => {
  const caption = captionFromCopyPack({
    hook: "可以自己來？",
    body: "可以自己來？\n下週茶會\n一句介紹：\n學生痛點：開學後很滿\n主題：\n這次看點：下週有一場茶會",
    cta: "來坐一下",
    hashtags: ["#淡江禪學社"],
  });
  assert.match(caption, /^可以自己來？/);
  assert.equal(caption.match(/可以自己來？/g)?.length, 1);
  assert.doesNotMatch(caption, /一句介紹|學生痛點|主題：|這次看點/);
});

test("convertPlan threads and line stay copy-to-app posts, not a campaign dump", () => {
  const plan = buildMockPlan(zenBrief);
  const threads = convertPlan(plan, "threads");
  const line = convertPlan(plan, "line");
  assert.match(threads.items[0] ?? "", /[？?]|坐下來|晚上/);
  assert.doesNotMatch(threads.items[0] ?? "", /誠摯邀請|負責人|審核|Assignee/);
  assert.match(line.items[0] ?? "", /浮游禪光/);
  assert.doesNotMatch(line.items[0] ?? "", /誠摯邀請|審核人/);
});

test("packCaption for reels keeps one student hook", () => {
  const plan = {
    ...buildMockPlan(zenBrief),
    hook: "有時候我們需要的不是答案，只是一個安靜的晚上。",
    body: "可以自己來？\n2026/09/23 19:00 淡江大學淡水校園 · 禪學社\n想找人一起的話，把這則傳給他。",
    cta: "來坐一下",
    hashtags: ["#淡江禪學社"],
  };
  const caption = packCaption(plan, convertPlan(plan, "reels"));
  assert.match(caption, /^有時候我們需要的不是答案/);
  assert.doesNotMatch(caption, /可以自己來/);
  assert.match(caption, /19:00|淡水/);
  assert.match(caption, /想找人一起/);
});

test("tea-party captions keep when and where after a mock plan", () => {
  const plan = buildMockPlan(zenBrief);
  const caption = packCaption(plan, convertPlan(plan, "reels"));
  assert.match(caption, /19:00|9\/24/);
  assert.match(caption, /淡水|淡江/);
  assert.match(caption, /想找人一起/);
});

test("convertPlan story is 3–5 frames with a hook then time", () => {
  const plan = buildMockPlan(zenBrief);
  const story = convertPlan(plan, "story");
  assert.ok(story.items.length >= 3 && story.items.length <= 5);
  assert.match(story.items[0] ?? "", /[？?]|坐下來|晚上/);
  assert.match(story.items.join("\n"), /19:00|淡水|浮游禪光|來坐一下/);
});
