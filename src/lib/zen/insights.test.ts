import assert from "node:assert/strict";
import test from "node:test";
import { dnaPromptIdea, igDnaBlock, learnFromPosts, nextCreateHint, recentPostedNotes, scorePost, whyPostWorked } from "./insights.ts";
import { SEED_IG_POSTS } from "./memory.ts";
import { systemPrompt } from "./voice.ts";

test("learnFromPosts ranks high-save reels above announcement posts", () => {
  const learned = learnFromPosts(SEED_IG_POSTS);
  assert.equal(learned.winning[0]?.id, "ig_20251120");
  assert.ok(learned.winningHooks.some((h) => h.includes("淡水的晚上")));
  assert.ok(learned.losingHooks.some((h) => h.includes("本週社課")));
  assert.ok(scorePost(learned.winning[0]!) > scorePost(learned.losing[0]!));
});

test("igDnaBlock tells the model to use club IG not generic brand templates", () => {
  const block = igDnaBlock(SEED_IG_POSTS);
  assert.match(block, /IG DNA/);
  assert.match(block, /不要套一般品牌模板/);
  assert.match(block, /晚上見/);
  assert.match(block, /最近發過/);
});

test("systemPrompt injects IG DNA for copy campaign and image", () => {
  for (const kind of ["copy", "campaign", "image", "inspire"] as const) {
    const prompt = systemPrompt(kind);
    assert.match(prompt, /Zen Club IG DNA/);
    assert.match(prompt, /連休息都覺得有罪惡感|淡水的晚上/);
  }
});

test("systemPrompt injects Creative Memory notes for copy", () => {
  const prompt = systemPrompt("copy", { memoryNotes: "Google Drive / 2025 茶會：晚上同學圍坐" });
  assert.match(prompt, /Creative Memory/);
  assert.match(prompt, /2025 茶會/);
});

test("dnaPromptIdea asks for a new post not a copy", () => {
  assert.match(dnaPromptIdea(), /不要複製舊文/);
  assert.match(dnaPromptIdea(), /最近發過/);
});

test("learnFromPosts compares question hooks against announcements", () => {
  const learned = learnFromPosts(SEED_IG_POSTS);
  assert.ok(learned.questionSaveRate > learned.announceSaveRate);
  assert.match(learned.whatWorks, /問句 Hook/);
  assert.match(learned.whatFails, /本週社課/);
});

test("nextCreateHint answers what to make next from own IG", () => {
  const hint = nextCreateHint(SEED_IG_POSTS);
  assert.match(hint.line, /做一篇/);
  assert.match(hint.line, /這好像在講我/);
  assert.ok(hint.line.length < 80);
  assert.match(hint.why, /問句 Hook|Carousel|Reels/);
  assert.match(hint.rates, /問句收藏率/);
  assert.match(igDnaBlock(SEED_IG_POSTS), /下一則建議/);
  const top = learnFromPosts(SEED_IG_POSTS).winning[0]!;
  assert.match(whyPostWorked(top), /問句 Hook|生活語氣|Reels|Carousel/);
});

test("nextCreateHint switches off promo after a studio-published knowledge post", async () => {
  const { publishedToMemory } = await import("./publish-memory.ts");
  const now = Date.parse("2026-09-16T21:00:00+08:00");
  const { post } = publishedToMemory({
    now,
    campaigns: [],
    item: {
      id: "wave_tea_tease",
      title: "預告 · 開學茶會",
      contentKind: "knowledge",
      status: "published",
      scheduledAt: now - 86_400_000,
      publishedAt: now,
      projectId: null,
      campaignId: "camp_tea",
      captionPreview: "來坐一下，不用先懂禪。",
    },
  });
  assert.equal(post.contentKind, "knowledge");
  assert.match(recentPostedNotes([post, ...SEED_IG_POSTS], now), /剛發過活動向/);
  const hint = nextCreateHint([post, ...SEED_IG_POSTS], now);
  assert.match(hint.line, /剛發過/);
  assert.match(hint.line, /生活或互動/);
  assert.doesNotMatch(hint.line, /Carousel/);
});

test("nextCreateHint asks for event info after a studio-published life post", async () => {
  const { publishedToMemory } = await import("./publish-memory.ts");
  const now = Date.parse("2026-09-16T21:00:00+08:00");
  const { post } = publishedToMemory({
    now,
    campaigns: [],
    item: {
      id: "wave_tea_emotion",
      title: "先被看見 · 開學茶會",
      contentKind: "member-story",
      status: "published",
      scheduledAt: now - 3_600_000,
      publishedAt: now,
      projectId: null,
      campaignId: "camp_tea",
      captionPreview: "大學生活很自由，但你最近真的有比較快樂嗎？",
    },
  });
  const hint = nextCreateHint([post, ...SEED_IG_POSTS], now);
  assert.match(hint.line, /剛發過/);
  assert.match(hint.line, /活動內容或倒數/);
});
