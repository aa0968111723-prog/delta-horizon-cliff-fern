import assert from "node:assert/strict";
import test from "node:test";
import { applyDuePublished, duePublishTargets, dueTodayTargets } from "./due-publish.ts";
import { SEED_CAMPAIGNS } from "./memory-seed.ts";
import type { ClubCampaign } from "./types.ts";

const visualProject = {
  id: "proj_float_light",
  name: "浮游禪光 · 主視覺 Carousel",
  status: "done" as const,
  contentKind: "carousel" as const,
  campaignId: "camp_float_light",
  scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
  publishedAt: null,
  sourceRefs: [{ source: "generated" as const, label: "主視覺", id: "https://cdn.example.com/float.png" }],
  copy: {
    eyebrow: "",
    headline: "",
    subhead: "",
    body: "",
    cta: "",
    handle: "",
    caption: "最近是不是很久沒有好好坐下來？",
    hashtags: [],
    altText: "",
  },
};

test("due publish ignores idea waves even if the date has passed", () => {
  const due = duePublishTargets({
    campaigns: SEED_CAMPAIGNS,
    projects: [visualProject],
    now: Date.parse("2026-09-16T12:00:00+08:00"),
  });
  assert.equal(due.length, 0);
});

test("scheduled visual wave becomes due after its wall-clock time", () => {
  const due = duePublishTargets({
    campaigns: SEED_CAMPAIGNS,
    projects: [visualProject],
    now: Date.parse("2026-09-17T19:05:00+08:00"),
  });
  assert.equal(due.length, 1);
  assert.equal(due[0].waveId, "wave_visual");
  assert.equal(due[0].projectId, "proj_float_light");
  assert.equal(due[0].imageUrl, "https://cdn.example.com/float.png");
  assert.ok(due[0].caption.includes("坐下來"));
});

test("due publish keeps a Canva-returned asset for Content Memory", () => {
  const due = duePublishTargets({
    campaigns: [],
    projects: [
      {
        ...visualProject,
        id: "proj_canva",
        campaignId: null,
        status: "scheduled",
        scheduledAt: Date.parse("2026-09-16T08:00:00+08:00"),
        sourceRefs: [{ source: "canva", label: "Canva 微調後", id: "asset_canva_1" }],
      },
    ],
    now: Date.parse("2026-09-16T09:00:00+08:00"),
  });
  assert.deepEqual(due[0]?.assetIds, ["asset_canva_1"]);
  const result = applyDuePublished({
    campaigns: [],
    targets: due,
    now: Date.parse("2026-09-16T09:00:00+08:00"),
  });
  assert.deepEqual(result.posts[0]?.assetIds, ["asset_canva_1"]);
});

test("same-day flush can send tonight's slot before 19:00", () => {
  const today = dueTodayTargets({
    campaigns: SEED_CAMPAIGNS,
    projects: [visualProject],
    now: Date.parse("2026-09-17T11:00:00+08:00"),
  });
  assert.equal(today[0]?.waveId, "wave_visual");
});

test("applying due publish marks the wave and writes Content Memory", () => {
  const now = Date.parse("2026-09-17T19:05:00+08:00");
  const targets = duePublishTargets({
    campaigns: SEED_CAMPAIGNS,
    projects: [visualProject],
    now,
  });
  const result = applyDuePublished({ campaigns: SEED_CAMPAIGNS, targets, now });
  const wave = result.campaigns
    .find((campaign) => campaign.id === "camp_float_light")
    ?.waves.find((item) => item.id === "wave_visual");
  assert.equal(wave?.status, "published");
  assert.equal(wave?.publishedAt, now);
  assert.equal(result.posts.length, 1);
  assert.equal("assignee" in result.posts[0], false);
  assert.equal(duePublishTargets({ campaigns: result.campaigns, projects: [visualProject], now }).length, 0);
});

test("standalone scheduled project is due without a campaign wave", () => {
  const campaigns: ClubCampaign[] = [];
  const due = duePublishTargets({
    campaigns,
    projects: [
      {
        ...visualProject,
        id: "proj_solo",
        campaignId: null,
        status: "scheduled",
        scheduledAt: Date.parse("2026-09-16T08:00:00+08:00"),
      },
    ],
    now: Date.parse("2026-09-16T09:00:00+08:00"),
  });
  assert.equal(due.length, 1);
  assert.equal(due[0].projectId, "proj_solo");
});

test("a dragged wave's old project date does not auto-publish", () => {
  const campaigns: ClubCampaign[] = [
    {
      ...SEED_CAMPAIGNS[0],
      waves: [
        {
          id: "wave_tea_visual",
          offsetDays: -5,
          intent: "主視覺",
          topic: "茶會 Carousel",
          contentKind: "carousel",
          projectId: "proj_float_light",
          scheduledAt: Date.parse("2026-09-18T19:00:00+08:00"),
          status: "scheduled",
        },
      ],
    },
  ];
  const due = duePublishTargets({
    campaigns,
    projects: [{ ...visualProject, status: "scheduled", scheduledAt: Date.parse("2026-09-16T19:00:00+08:00") }],
    now: Date.parse("2026-09-16T20:30:00+08:00"),
  });
  assert.equal(due.length, 0);
});
