import assert from "node:assert/strict";
import test from "node:test";
import { buildMockCopyPack } from "../ai/copy.ts";
import {
  captionMeter,
  convertCopyForSurface,
  formatIdForSurface,
  reviewIgSurface,
  reviewStudentCaption,
  copyPatchForSurface,
  scheduleReminder,
} from "./ig-surfaces.ts";

const pack = buildMockCopyPack({
  campaignName: "期中喘口氣茶會",
  hook: "最近是不是連休息都覺得有罪惡感？",
  concept: "一起喝杯茶，讓腦袋休息一下。",
  schedule: "10/22 19:00–20:30",
  location: "淡江大學商管大樓",
  audience: "正在準備期中的淡江學生",
  studentPain: "報告和考試一起來。",
  cta: "找朋友一起來",
  registrationUrl: "",
  brandVoice: "像真的社團同學。",
  hashtags: ["#淡江禪學社", "#淡江生活"],
});

test("Feed / Story / Reels / Carousel map to the right Studio size", () => {
  assert.equal(formatIdForSurface("feed"), "feed-portrait");
  assert.equal(formatIdForSurface("carousel"), "feed-portrait");
  assert.equal(formatIdForSurface("story"), "story");
  assert.equal(formatIdForSurface("reels"), "reels-cover");
});

test("surface conversion keeps a student caption and does not invent Insights", () => {
  const feed = convertCopyForSurface(pack, "feed");
  const story = convertCopyForSurface(pack, "story");
  const reels = convertCopyForSurface(pack, "reels");
  const carousel = convertCopyForSurface(pack, "carousel");
  assert.match(feed.caption, /找朋友一起來/);
  assert.ok(story.overlay.length >= 3);
  assert.ok(story.overlay.every((frame) => !/Insights|觀看次數/.test(frame)));
  assert.match(reels.overlay[0] ?? reels.caption, /罪惡感|休息/);
  assert.ok(carousel.overlay.length >= 4);
  assert.match(carousel.imageNote, /末頁/);
});

test("caption meter flags Instagram limits without inventing reach", () => {
  const ok = captionMeter("下課後先坐一下。\n\n找朋友一起來\n\n#淡江禪學社", ["#淡江禪學社"]);
  assert.equal(ok.overCharLimit, false);
  assert.equal(ok.hashtags, 1);
  const long = captionMeter(`${"啊".repeat(130)}\n後面才是時間`, []);
  assert.equal(long.overPreview, true);
  assert.equal(long.previewChars, 130);
});

test("Story reverse-check fails a single long frame", () => {
  const converted = {
    surface: "story" as const,
    formatId: "story" as const,
    caption: "一",
    overlay: ["這是一句短的", "a".repeat(80), "來坐坐"],
    hashtags: [],
    imageNote: "",
  };
  const review = reviewIgSurface("story", converted);
  assert.equal(review.some((item) => !item.pass && /48 字/.test(item.feedback)), true);
});

test("Carousel reverse-check does not pretend a single page is a carousel", () => {
  const review = reviewIgSurface("carousel", {
    surface: "carousel",
    formatId: "feed-portrait",
    caption: "來",
    overlay: ["封面"],
    hashtags: [],
    imageNote: "",
  }, { pageCount: 1 });
  assert.equal(review.some((item) => !item.pass && /不會假裝已有 6 頁/.test(item.feedback)), true);
});

test("surface conversion writes Story overlay onto the canvas headline and CTA", () => {
  const story = convertCopyForSurface(pack, "story");
  const patch = copyPatchForSurface(story, {
    headline: "舊標題",
    subhead: "",
    body: "",
    cta: "了解更多",
  });
  assert.equal(patch.headline, story.overlay[0]);
  assert.equal(patch.cta, story.overlay.at(-1));
  assert.deepEqual(patch.hashtags, story.hashtags);
  assert.match(patch.hashtags?.join(" ") ?? "", /淡江/);
});

test("student caption review catches missing registration and literary tone", () => {
  const review = reviewStudentCaption({
    caption: "在這個快節奏的時代，與自己和解。",
    hook: "淡江大學禪學社誠摯邀請您",
    cta: "了解更多",
    schedule: "",
    location: "",
    registrationUrl: "",
    hashtags: ["#淡江禪學社"],
  });
  assert.equal(review.find((item) => item.question.includes("停下來"))?.pass, false);
  assert.equal(review.find((item) => item.question.includes("文青"))?.pass, false);
  assert.equal(review.find((item) => item.question.includes("報名"))?.pass, false);
  assert.equal(review.find((item) => item.question.includes("時間地點"))?.pass, false);
});

test("schedule reminder stays honest when nothing is on the calendar", () => {
  const text = scheduleReminder({ schedule: "9/24 19:00", location: "淡江校園" });
  assert.match(text, /9\/24/);
  assert.match(text, /還沒排進日曆/);
  assert.match(text, /不要填假讚數/);
});
