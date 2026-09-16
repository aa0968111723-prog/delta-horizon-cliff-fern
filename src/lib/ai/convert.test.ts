import assert from "node:assert/strict";
import test from "node:test";
import { convertPlan, captionFromCopyPack, rewriteCopyPack } from "./convert.ts";
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

test("rewriteCopyPack drops the previous opening line so 快速修改 replaces it", () => {
  const rewritten = rewriteCopyPack(
    {
      hook: "可以自己來？",
      body: "有時候我們需要的不是答案，只是一個安靜的晚上。\n2026/09/23 19:00，淡江大學淡水校園 · 禪學社\n想找人一起的話，把這則傳給他。",
      cta: "來坐一下",
      hashtags: ["#淡江禪學社"],
    },
    "有時候我們需要的不是答案，只是一個安靜的晚上。",
  );
  assert.match(rewritten.caption, /^可以自己來？/);
  assert.doesNotMatch(rewritten.caption, /有時候我們需要的不是答案/);
  assert.match(rewritten.caption, /想找人一起/);
  assert.doesNotMatch(rewritten.body, /有時候我們需要的不是答案/);
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
