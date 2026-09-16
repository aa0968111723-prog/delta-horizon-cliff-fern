import assert from "node:assert/strict";
import test from "node:test";
import { readyPacks, readyPostLabel, readyToPost, unscheduledDone, unscheduledDonePacks } from "./today-post.ts";
import type { Brief, CopyDeck, Project } from "./types.ts";

function brief(): Brief {
  return {
    product: "",
    eventName: "",
    schedule: "",
    location: "",
    offer: "",
    audience: "",
    goal: "awareness",
    features: "",
    style: "",
    notes: "",
    deliverables: { post: true, story: false, carousel: false, reels: false },
  };
}

function copy(): CopyDeck {
  return {
    eyebrow: "",
    headline: "很久沒有好好坐下來了吧",
    subhead: "",
    body: "",
    cta: "來坐一下",
    handle: "@tku.zen",
    caption: "最近是不是連休息都覺得有罪惡感？",
    hashtags: ["#淡江禪學社"],
    altText: "",
  };
}

function project(patch: Partial<Project> & { id: string }): Project {
  return {
    name: patch.id,
    createdAt: 1,
    updatedAt: 1,
    brandId: "brand",
    templateId: "editorial",
    activeFormatId: "feed-portrait",
    status: "making",
    contentKind: "ig-post",
    campaignId: null,
    scheduledAt: null,
    publishedAt: null,
    brief: brief(),
    copy: copy(),
    plan: null,
    copyDrafts: [],
    studentReview: null,
    reels: null,
    sources: [],
    artboards: {},
    slides: {},
    slideIndex: 0,
    snapshots: [],
    planVersions: [],
    exports: [],
    ...patch,
  };
}

test("readyToPost lists done work and today's scheduled posts", () => {
  const now = Date.parse("2026-09-16T10:00:00");
  const rows = readyToPost(
    [
      project({ id: "done", status: "done", name: "主視覺" }),
      project({ id: "today", status: "scheduled", scheduledAt: Date.parse("2026-09-16T19:00:00"), name: "限動" }),
      project({ id: "later", status: "scheduled", scheduledAt: Date.parse("2026-09-20T19:00:00") }),
      project({ id: "idea", status: "idea" }),
      project({ id: "out", status: "published" }),
    ],
    now,
  );
  assert.deepEqual(
    rows.map((row) => `${row.reason}:${row.project.id}`),
    ["today:today", "done:done"],
  );
  assert.equal(readyPostLabel("done"), "可以發了");
  assert.equal(readyPostLabel("today"), "今天要發");
});

test("readyToPost surfaces overdue scheduled posts so they are not forgotten", () => {
  const now = Date.parse("2026-09-16T10:00:00");
  const rows = readyToPost(
    [project({ id: "missed", status: "scheduled", scheduledAt: Date.parse("2026-09-15T19:00:00") })],
    now,
  );
  assert.equal(rows[0]?.project.id, "missed");
  assert.equal(rows[0]?.reason, "today");
});

test("unscheduledDone lists finished work that is not on the calendar yet", () => {
  const rows = unscheduledDone([
    project({ id: "done", status: "done", updatedAt: 2 }),
    project({ id: "old", status: "done", updatedAt: 1 }),
    project({ id: "set", status: "done", scheduledAt: 9 }),
    project({ id: "idea", status: "idea" }),
  ]);
  assert.deepEqual(
    rows.map((row) => row.id),
    ["done", "old"],
  );
});

test("readyPacks groups convert siblings so one pack does not fill the home", () => {
  const now = Date.parse("2026-09-16T10:00:00");
  const origin = project({ id: "origin", status: "done", contentKind: "ig-post", updatedAt: 3 });
  const line = project({
    id: "line",
    status: "done",
    contentKind: "line",
    convertedFromId: "origin",
    updatedAt: 4,
  });
  const story = project({
    id: "story",
    status: "done",
    contentKind: "story",
    convertedFromId: "origin",
    updatedAt: 5,
  });
  const other = project({ id: "other", status: "done", name: "另一則", updatedAt: 2 });
  const packs = readyPacks([origin, line, story, other], now);
  assert.equal(packs.length, 2);
  const grouped = packs.find((item) => item.rootId === "origin");
  assert.ok(grouped);
  assert.deepEqual(
    grouped.pack.map((item) => item.contentKind),
    ["ig-post", "story", "line"],
  );
  assert.equal(packs.some((item) => item.primary.id === "other"), true);
  assert.equal(grouped.ready.length, 3);
});

test("unscheduledDonePacks collapses a convert pack into one waiting row", () => {
  const origin = project({ id: "origin", status: "done", contentKind: "ig-post", updatedAt: 3 });
  const line = project({
    id: "line",
    status: "done",
    contentKind: "line",
    convertedFromId: "origin",
    updatedAt: 4,
  });
  const other = project({ id: "other", status: "done", updatedAt: 1 });
  const packs = unscheduledDonePacks([origin, line, other]);
  assert.equal(packs.length, 2);
  assert.equal(packs[0]?.waiting.length, 2);
  assert.equal(packs[1]?.primary.id, "other");
});
