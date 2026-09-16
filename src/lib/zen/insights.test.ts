import assert from "node:assert/strict";
import test from "node:test";
import { awaitingFeel, hookLine, learnFromIg } from "./insights.ts";
import { nextKindAfter, offsetDaysForConvertedKind, convertedScheduledAt, convertedStoryAt, rhythmHint, skipConvertedIgPost, storyFrameIndex } from "./rhythm.ts";
import { suggestWaves } from "./schedule.ts";
import { createPkce } from "../connect/pkce.ts";
import { canvaBrief, canvaSize } from "../connect/canva-format.ts";
import { mockWaveDraft } from "../ai/wave-draft.ts";
import { driveQueryEscape } from "../connect/escape.ts";

test("learnFromIg prefers question hooks with higher saves", () => {
  const learning = learnFromIg([
    {
      id: "a",
      caption: "最近是不是很久沒有好好坐下來？",
      date: "2026-09-17",
      kind: "carousel",
      saves: 21,
      comments: 7,
      likes: 86,
      reach: 420,
      source: "local",
    },
    {
      id: "b",
      caption: "淡江大學禪學社 9/24 浮游禪光活動開始報名，地點在社團教室。",
      date: "2025-09-10",
      kind: "post",
      saves: 4,
      comments: 1,
      likes: 22,
      reach: 390,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /坐下來/);
  assert.equal(learning.bestKind, "carousel");
  assert.match(learning.promptBlock, /過去表現/);
  assert.match(learning.promptBlock, /觸及/);
  assert.ok(learning.lessons.some((l) => l.id === "hook"));
  assert.ok(learning.lessons.some((l) => l.id === "length" || l.id === "kind"));
  assert.doesNotMatch(learning.promptBlock, /Assignee|Reviewer/);
});

test("local posts without metrics do not beat real IG saves", () => {
  const learning = learnFromIg([
    {
      id: "local",
      caption: "隨便一則還沒有效果",
      date: "2026-09-16",
      kind: "post",
      source: "local",
    },
    {
      id: "a",
      caption: "最近是不是很久沒有好好坐下來？",
      date: "2026-09-17",
      kind: "carousel",
      saves: 21,
      comments: 7,
      likes: 86,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /坐下來/);
});

test("one-person 學生會停 beats a seed post with higher saves", () => {
  const learning = learnFromIg([
    {
      id: "marked",
      caption: "大學生活很自由，但你最近真的有比較快樂嗎？",
      date: "2026-09-23",
      kind: "carousel",
      source: "local",
      feel: "strong",
      saves: 8,
      likes: 20,
    },
    {
      id: "seed",
      caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      date: "2025-12-04",
      kind: "post",
      saves: 33,
      likes: 124,
      comments: 14,
      source: "local",
    },
  ]);
  assert.match(learning.bestHookShape, /快樂/);
  assert.match(learning.promptBlock, /快樂/);
  assert.ok(learning.lessons.some((l) => l.detail.includes("學生會停")));
});

test("hookLine keeps the student question and drops hashtags", () => {
  assert.equal(hookLine("可以自己來？\n2026/09/23 19:00，淡水校園\n#淡江 #茶會"), "可以自己來？");
  assert.equal(hookLine("可以自己來？ #淡江大學禪學社 #茶會"), "可以自己來？");
  assert.doesNotMatch(hookLine("可以自己來？\n來坐一下 #淡江"), /#/);
});

test("awaitingFeel is just-published local posts, not seed metrics", () => {
  const posted = awaitingFeel([
    {
      id: "ig_mem_tea",
      caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      date: "2025-12-04",
      kind: "post",
      saves: 33,
      likes: 124,
      source: "local",
    },
    {
      id: "local:tea",
      caption: "可以自己來？\n下週茶會。",
      date: "2026-09-16",
      kind: "carousel",
      source: "local",
    },
  ]);
  assert.deepEqual(
    posted.map((post) => post.id),
    ["local:tea"],
  );
});

test("learnFromIg uses the first line even when the published caption has hashtags", () => {
  const learning = learnFromIg([
    {
      id: "posted",
      caption: "可以自己來？\n2026/09/23 19:00，淡水校園\n#淡江大學禪學社 #茶會",
      date: "2026-09-16",
      kind: "carousel",
      source: "local",
      feel: "strong",
      saves: 22,
      likes: 84,
    },
    {
      id: "seed",
      caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      date: "2025-12-04",
      kind: "post",
      saves: 33,
      likes: 124,
      source: "local",
    },
  ]);
  assert.equal(learning.bestHookShape, "可以自己來？");
  assert.doesNotMatch(learning.bestHookShape, /#淡江/);
});

test("rhythm avoids consecutive promo ads", () => {
  assert.equal(nextKindAfter(["carousel", "ig-post"]), "member-story");
  assert.match(rhythmHint(["carousel", "poster"]), /生活|故事/);
});

test("converted formats land on different days so the grid is not all ads", () => {
  assert.equal(offsetDaysForConvertedKind("ig-post"), -7);
  assert.equal(offsetDaysForConvertedKind("carousel"), -5);
  assert.equal(offsetDaysForConvertedKind("story"), -2);
  assert.ok(offsetDaysForConvertedKind("carousel") !== offsetDaysForConvertedKind("story"));
});

test("converted IG Post follows 主視覺 instead of jumping ahead of 預熱", () => {
  const hero = Date.parse("2026-09-19T11:00:00.000Z");
  const warmup = Date.parse("2026-09-16T12:00:00.000Z");
  const event = Date.parse("2026-09-23T11:00:00.000Z");
  const waves = [
    { kind: "warmup", scheduledAt: warmup },
    { kind: "hero", scheduledAt: hero },
    { kind: "countdown", scheduledAt: Date.parse("2026-09-22T13:00:00.000Z") },
  ];
  const ig = convertedScheduledAt("ig-post", event, waves);
  const carousel = convertedScheduledAt("carousel", event, waves);
  assert.equal(ig, hero);
  assert.ok(ig > warmup);
  assert.ok(carousel > ig);
  assert.equal(convertedScheduledAt("ig-post", event, []), event - 7 * 86_400_000);
});

test("tea kit with 主視覺 does not also schedule a twin IG Post", () => {
  assert.equal(skipConvertedIgPost([{ kind: "hero" }, { kind: "warmup" }]), true);
  assert.equal(skipConvertedIgPost([]), false);
  assert.equal(skipConvertedIgPost([{ kind: "warmup" }]), false);
});

test("Story frames sit after 參加理由, not on 倒數 night", () => {
  const waves = suggestWaves(
    { date: "2026-09-23", type: "tea", name: "茶會" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  const event = Date.parse("2026-09-23T11:00:00.000Z");
  const reason = waves.find((wave) => wave.kind === "reason")?.scheduledAt ?? 0;
  const countdown = waves.find((wave) => wave.kind === "countdown")?.scheduledAt ?? 0;
  const story = convertedScheduledAt("story", event, waves);
  const storyLast = convertedStoryAt(3, event, waves);
  const dayTaipei = (ms: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(ms),
    );
  assert.ok(story > reason);
  assert.ok(storyLast < countdown);
  assert.notEqual(dayTaipei(story), dayTaipei(countdown));
  assert.equal(storyFrameIndex("Story 1 · 茶會"), 0);
  assert.equal(storyFrameIndex("Story 4 · 茶會"), 3);
  assert.equal(storyFrameIndex("當日提醒 · 茶會"), undefined);
});

test("LINE is the event morning, not between Threads and Reels", () => {
  const waves = suggestWaves(
    { date: "2026-09-23", type: "tea", name: "茶會" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  const event = Date.parse("2026-09-23T11:00:00.000Z");
  const threads = convertedScheduledAt("threads", event, waves);
  const reels = convertedScheduledAt("reels", event, waves);
  const line = convertedScheduledAt("line", event, waves);
  const countdown = waves.find((wave) => wave.kind === "countdown")?.scheduledAt ?? 0;
  const dayof = waves.find((wave) => wave.kind === "dayof")?.scheduledAt ?? 0;
  const hourTaipei = (ms: number) =>
    Number(
      new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", hour: "numeric", hourCycle: "h23" }).format(new Date(ms)),
    );
  assert.ok(line > countdown);
  assert.ok(line < dayof);
  assert.ok(!(line > threads && line < reels));
  assert.equal(hourTaipei(line), 10);
});

test("Threads and Reels wait until after 參加理由", () => {
  const waves = suggestWaves(
    { date: "2026-09-23", type: "tea", name: "茶會" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  const event = Date.parse("2026-09-23T11:00:00.000Z");
  const reason = waves.find((wave) => wave.kind === "reason")?.scheduledAt ?? 0;
  const hero = waves.find((wave) => wave.kind === "hero")?.scheduledAt ?? 0;
  const countdown = waves.find((wave) => wave.kind === "countdown")?.scheduledAt ?? 0;
  const threads = convertedScheduledAt("threads", event, waves);
  const reels = convertedScheduledAt("reels", event, waves);
  const carousel = convertedScheduledAt("carousel", event, waves);
  assert.ok(carousel > hero);
  assert.ok(threads > reason);
  assert.ok(reels > threads);
  assert.ok(threads < event);
  assert.ok(reels < event);
  assert.ok(threads <= countdown);
  assert.ok(reels <= countdown);
});

test("pkce verifier is not the challenge", () => {
  const pkce = createPkce();
  assert.notEqual(pkce.verifier, pkce.challenge);
  assert.ok(pkce.verifier.length > 20);
});

test("canva presets map IG formats and brief stays zen", () => {
  assert.deepEqual(canvaSize("story"), { width: 1080, height: 1920 });
  assert.deepEqual(canvaSize("feed-portrait"), { width: 1080, height: 1350 });
  const brief = canvaBrief({ title: "茶會", hook: "最近是不是很久沒坐好", body: "淡水晚上", cta: "來坐一下" });
  assert.match(brief, /不要寺廟/);
  assert.doesNotMatch(brief, /誠摯邀請/);
});

test("wave drafts have no assignee and keep student hooks", () => {
  const draft = mockWaveDraft({ kind: "hero", name: "浮游禪光", schedule: "9/24 19:00", location: "淡水校園" });
  assert.equal("assignee" in draft, false);
  assert.match(draft.hook, /坐|快樂|晚上|位子/);
  const learned = mockWaveDraft({
    kind: "hero",
    name: "茶會",
    learnedHook: "課表排滿的時候，你還記得自己喜歡什麼嗎？",
  });
  assert.match(learned.hook, /課表排滿/);
});

test("drive query escape quotes", () => {
  assert.equal(driveQueryEscape("禪學社's"), "禪學社\\'s");
});
