import assert from "node:assert/strict";
import test from "node:test";
import { atLocalTime, offsetDaysFromEventDate, postingTime, startOfLocalDay, suggestSchedule } from "./schedule.ts";
import type { Brief, Campaign, CampaignWave, CopyDeck, Project } from "./types.ts";

const NOW = Date.parse("2026-09-16T10:00:00+08:00");

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
    headline: "",
    subhead: "",
    body: "",
    cta: "",
    handle: "@tku.zen",
    caption: "",
    hashtags: [],
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

function wave(patch: Partial<CampaignWave> & { id: string }): CampaignWave {
  return {
    offsetDays: 0,
    stage: "預熱",
    title: "預熱",
    kind: "ig-post",
    hook: "",
    note: "",
    contentId: null,
    ...patch,
  };
}

function campaign(patch: Partial<Campaign> & { id: string }): Campaign {
  return {
    name: "浮游禪光",
    kind: "sit",
    date: "2026-09-24",
    time: "19:00",
    location: "",
    oneLiner: "",
    intro: "",
    theme: "",
    painPoint: "",
    cta: "",
    signupUrl: "",
    coverAssetId: null,
    assetIds: [],
    audienceIds: [],
    axis: "",
    directions: [],
    waves: [],
    createdAt: 1,
    updatedAt: 1,
    planSource: "live",
    ...patch,
  };
}

test("postingTime reads 19:00 and falls back to 19:00", () => {
  assert.deepEqual(postingTime({ time: "19:00" }), { hour: 19, minute: 0 });
  assert.deepEqual(postingTime({ time: "18:30" }), { hour: 18, minute: 30 });
  assert.deepEqual(postingTime({ time: "" }), { hour: 19, minute: 0 });
});

test("wave-linked content lands on campaign day plus offset at 19:00", () => {
  const cover = project({ id: "cover", status: "done", campaignId: "camp" });
  const camp = campaign({
    id: "camp",
    waves: [wave({ id: "w1", offsetDays: -7, stage: "主視覺", contentId: "cover" })],
  });
  const [hit] = suggestSchedule([cover], [camp], NOW);
  assert.ok(hit);
  assert.equal(hit.projectId, "cover");
  assert.equal(hit.reason, "浮游禪光 · 主視覺");
  const expected = atLocalTime(Date.parse("2026-09-17T00:00:00"), 19, 0);
  assert.equal(hit.at, expected);
});

test("past wave dates move to the next free evening instead of the past", () => {
  const recap = project({ id: "recap", status: "making", campaignId: "camp" });
  const camp = campaign({
    id: "camp",
    date: "2026-09-10",
    waves: [wave({ id: "w1", offsetDays: 0, stage: "當日", contentId: "recap" })],
  });
  const [hit] = suggestSchedule([recap], [camp], NOW);
  assert.ok(hit);
  assert.ok(hit.at >= NOW);
  assert.match(hit.reason, /活動日已過/);
});

test("unscheduled making/done fill free evenings and skip occupied days", () => {
  const kept = project({
    id: "kept",
    status: "scheduled",
    scheduledAt: atLocalTime(Date.parse("2026-09-17T00:00:00"), 19),
  });
  const extra = project({ id: "extra", status: "done", updatedAt: 2 });
  const suggestions = suggestSchedule([kept, extra], [], NOW);
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].projectId, "extra");
  assert.equal(suggestions[0].reason, "空檔晚上");
  assert.notEqual(startOfLocalDay(suggestions[0].at), startOfLocalDay(kept.scheduledAt!));
});

test("published and idea drafts are not auto-scheduled", () => {
  const live = project({
    id: "live",
    status: "published",
    publishedAt: NOW,
  });
  const idea = project({ id: "idea", status: "idea" });
  assert.deepEqual(suggestSchedule([live, idea], [], NOW), []);
});

test("offsetDaysFromEventDate is relative to the campaign day", () => {
  assert.equal(offsetDaysFromEventDate("2026-09-24", Date.parse("2026-09-17T12:00:00")), -7);
  assert.equal(offsetDaysFromEventDate("2026-09-24", Date.parse("2026-09-24T08:00:00")), 0);
  assert.equal(offsetDaysFromEventDate("2026-09-24", Date.parse("2026-09-26T08:00:00")), 2);
  assert.equal(offsetDaysFromEventDate("", Date.now()), null);
});
