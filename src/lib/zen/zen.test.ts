import assert from "node:assert/strict";
import test from "node:test";
import { computeIgDna, performanceInsights } from "./ig-dna.ts";
import { inspirationForToday } from "./inspiration.ts";
import { semesterPhase, studentContext } from "./context.ts";
import { detectAiSmell, deformalize, localStudentReview } from "./voice.ts";
import type { ContentItem } from "../studio/types.ts";

function post(partial: Partial<ContentItem> & { id: string; hook: string; saves?: number; likes?: number }): ContentItem {
  return {
    id: partial.id,
    campaignId: null,
    type: partial.type ?? "ig-post",
    status: "published",
    title: partial.title ?? partial.hook,
    copy: { hook: partial.hook, body: "週三晚上 B302。", cta: "直接來就好", hashtags: ["#淡江大學禪學社", "#淡江"], tone: "normal" },
    variants: [],
    imagePrompt: "",
    visualDirection: partial.visualDirection ?? "夜晚一盞燈",
    carousel: [],
    storyFrames: [],
    reels: [],
    threads: "",
    line: "",
    review: null,
    sources: [{ kind: "instagram", label: "Instagram / 2026-09-01" }],
    projectId: null,
    coverAssetId: null,
    scheduledAt: 1,
    publishedAt: 1,
    metrics: {
      reach: 1000,
      likes: partial.likes ?? 10,
      comments: 2,
      saves: partial.saves ?? 5,
      shares: 1,
      views: 0,
      clicks: 1,
      syncedAt: 1,
    },
    createdAt: 1,
    updatedAt: 1,
    generatedBy: "mock",
  };
}

test("detectAiSmell flags 誠摯邀請 and em-dashes", () => {
  const bad = detectAiSmell("淡江大學禪學社誠摯邀請您——在這殊勝的夜晚。");
  assert.ok(bad.flags.length >= 1);
  const good = detectAiSmell("最近是不是很久沒有好好坐下來？週三晚上見。");
  assert.equal(good.flags.length, 0);
});

test("deformalize rewrites 誠摯邀請您", () => {
  assert.match(deformalize("我們誠摯邀請您來坐坐"), /歡迎你/);
});

test("localStudentReview flags missing time/place and religious tone", () => {
  const r = localStudentReview({
    hook: "禪修法會殊勝因緣",
    body: "歡迎蒞臨指導。",
    cta: "",
    when: "",
    where: "",
    signupUrl: "",
  });
  assert.equal(r.tooReligious, true);
  assert.equal(r.knowsWhenWhere, false);
  assert.ok(r.rewriteHook.length > 0);
});

test("semesterPhase around mid-September is orientation or early-fall", () => {
  const p = semesterPhase(new Date("2026-09-16T00:00:00+08:00"));
  assert.ok(p === "orientation" || p === "early-fall");
  const ctx = studentContext(new Date("2026-09-16T00:00:00+08:00"));
  assert.ok(ctx.phaseLabel.length > 0);
  assert.ok(ctx.suggestedTopics.length > 0);
});

test("computeIgDna prefers high-save hooks and writes a summary", () => {
  const dna = computeIgDna([
    post({ id: "a", hook: "最近是不是很久沒有好好坐下來？", saves: 80, likes: 40 }),
    post({ id: "b", hook: "誠摯邀請您", saves: 2, likes: 90, visualDirection: "海報" }),
  ]);
  assert.equal(dna.hooks[0], "最近是不是很久沒有好好坐下來？");
  assert.ok(dna.summary.includes("Hashtag") || dna.summary.includes("#淡江"));
  assert.equal(dna.sample >= 2, true);
});

test("performanceInsights answers the five product questions", () => {
  const cards = performanceInsights([
    post({ id: "a", hook: "先給自己五分鐘", saves: 90, likes: 20, type: "knowledge" }),
  ]);
  assert.equal(cards.length, 5);
  assert.ok(cards[0].answer.includes("先給自己五分鐘"));
});

test("inspirationForToday never names a competitor account", () => {
  const rows = inspirationForToday(new Date("2026-09-16"));
  const blob = JSON.stringify(rows);
  assert.equal(/instagram.com|@[\w.]+/.test(blob), false);
  assert.ok(rows.every((r) => r.zenUse.length > 8));
});
