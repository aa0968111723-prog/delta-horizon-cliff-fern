import assert from "node:assert/strict";
import test from "node:test";
import { academicBeat, daysUntil, studentSituation, zenSystemPrompt } from "./context.ts";
import { parseEventDate, parseEventTime, defaultScheduleText } from "./dates.ts";
import { studentReviewOf } from "./review.ts";
import { searchCreative } from "./search.ts";
import { ideaFromInspiration, INSPIRATION, inspirationForBeat } from "./inspiration.ts";
import { eventKindFromText, suggestWaves } from "./schedule.ts";

test("September mid-month is orientation season for Tamkang", () => {
  const now = new Date("2026-09-16T10:00:00+08:00");
  assert.equal(academicBeat(now), "orientation");
  assert.match(studentSituation(now), /大一/);
});

test("zen system prompt stays student-lived and not religious-first", () => {
  const prompt = zenSystemPrompt(new Date("2026-09-16T10:00:00+08:00"));
  assert.match(prompt, /淡江大學禪學社/);
  assert.match(prompt, /慢下來/);
  assert.match(prompt, /不要一開始就用/);
  assert.match(prompt, /不要寫「年輕人／Z 世代」/);
  assert.doesNotMatch(prompt, /Z世代目標客群/);
});

test("daysUntil 浮游禪光 from 9/16 is 8", () => {
  assert.equal(daysUntil("2026-09-24", new Date("2026-09-16T10:00:00+08:00")), 8);
});

test("suggestWaves includes recap after the event and avoids owner fields", () => {
  const waves = suggestWaves(
    { date: "2026-09-24", type: "light", name: "浮游禪光" },
    new Date("2026-09-16T10:00:00+08:00"),
  );
  assert.ok(waves.some((w) => w.kind === "hero"));
  assert.ok(waves.some((w) => w.kind === "warmup"));
  assert.ok(waves.some((w) => w.kind === "recap"));
  assert.equal(
    waves.every((w) => !("assignee" in w) && !("reviewer" in w)),
    true,
  );
});

test("eventKindFromText maps tea and light", () => {
  assert.equal(eventKindFromText("下週有一場茶會"), "tea");
  assert.equal(eventKindFromText("浮游禪光"), "light");
});

test("searchCreative finds 龜龜 across assets and campaigns", () => {
  const hits = searchCreative({
    query: "龜龜",
    assets: [
      {
        id: "a1",
        name: "龜龜角色",
        kind: "image",
        category: "mascot",
        mime: "image/svg+xml",
        width: 80,
        height: 80,
        tags: ["龜龜"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed",
        licenseNotes: "",
        licenseOwner: "淡江禪學社",
        favorite: true,
        lastUsedAt: null,
        useCount: 0,
      },
    ],
    projects: [],
    campaigns: [
      {
        id: "c1",
        name: "浮游禪光",
        type: "light",
        date: "2026-09-24",
        time: "19:00",
        location: "淡水校園",
        oneLiner: "晚上坐下來",
        description: "",
        theme: "光",
        studentPain: "",
        cta: "來坐一下",
        signupUrl: "",
        imageAssetId: null,
        assetIds: [],
        waves: [],
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    igMemory: [],
    remoteFiles: [],
  });
  assert.ok(hits.some((h) => h.title.includes("龜龜")));
});

test("searchCreative understands 晚上的茶會 without the filename", () => {
  const hits = searchCreative({
    query: "晚上的茶會",
    assets: [
      {
        id: "a2",
        name: "淡水暮色",
        kind: "image",
        category: "tamsui",
        mime: "image/svg+xml",
        width: 80,
        height: 80,
        tags: ["淡水", "河岸", "晚上"],
        createdAt: 1,
        updatedAt: 1,
        source: "seed",
        licenseNotes: "",
        licenseOwner: "淡江禪學社",
        favorite: false,
        lastUsedAt: null,
        useCount: 0,
      },
    ],
    projects: [],
    campaigns: [],
    igMemory: [],
    remoteFiles: [
      {
        id: "drv_tea",
        provider: "drive",
        name: "2025 茶會現場",
        mime: "image/jpeg",
        tags: ["茶會", "晚上"],
        summary: "歷屆晚上茶會",
      },
    ],
  });
  assert.ok(hits.some((h) => h.title.includes("茶會")));
  assert.ok(hits.some((h) => h.source === "drive"));
});

test("searchCreative understands 適合 IG 主視覺 and 很多同學", () => {
  const hits = searchCreative({
    query: "適合 IG 主視覺",
    assets: [],
    projects: [],
    campaigns: [],
    igMemory: [],
    remoteFiles: [
      {
        id: "canva_hero",
        provider: "canva",
        name: "茶會 IG 主視覺",
        mime: "application/canva",
        tags: ["茶會", "主視覺", "三色光"],
        summary: "Canva / 浮游禪光",
        url: "https://www.canva.com",
      },
    ],
  });
  assert.ok(hits.some((h) => h.source === "canva"));
  assert.ok(hits.some((h) => h.url));

  const people = searchCreative({
    query: "找有很多同學互動的照片",
    assets: [],
    projects: [],
    campaigns: [],
    igMemory: [],
    remoteFiles: [
      {
        id: "drv_people",
        provider: "drive",
        name: "2025 茶會現場",
        mime: "image/jpeg",
        tags: ["同學", "互動", "圍坐"],
        summary: "很多人圍坐",
      },
    ],
  });
  assert.ok(people.some((h) => h.source === "drive"));
});

test("inspiration idea carries composition not a swipe file", () => {
  const idea = ideaFromInspiration(INSPIRATION[0]);
  assert.match(idea, /構圖/);
  assert.match(idea, /淡江禪學社/);
  assert.doesNotMatch(idea, /抄/);
});

test("inspirationForBeat puts 開學季 friend-seat first, not a random swipe", () => {
  const cards = inspirationForBeat("orientation");
  assert.equal(cards[0]?.id, "friend-seat");
  assert.ok(cards.length >= 4);
});

test("parseEventDate reads 2026/09/24 19:00", () => {
  assert.equal(parseEventDate("2026/09/24 19:00"), "2026-09-24");
  assert.equal(parseEventTime("2026/09/24 19:00"), "19:00");
});

test("parseEventDate reads 下週 as seven days later, not today", () => {
  const now = new Date("2026-09-16T10:00:00+08:00");
  assert.equal(parseEventDate("下週有一場茶會", now), "2026-09-23");
  assert.equal(defaultScheduleText("下週有一場茶會", now), "2026/09/23 19:00");
});

test("studentReview flags 誠摯邀請 as too formal", () => {
  const review = studentReviewOf("淡江大學禪學社誠摯邀請您蒞臨法會");
  assert.match(review.tooReligious, /宗教/);
  assert.match(review.tooSerious, /正式/);
  assert.match(review.rewriteHook, /？/);
  assert.doesNotMatch(review.rewriteHook, /誠摯/);
});
