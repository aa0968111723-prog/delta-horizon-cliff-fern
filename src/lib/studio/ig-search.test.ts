import assert from "node:assert/strict";
import test from "node:test";
import { scheduleForCampaign } from "./calendar-search.ts";
import { igSearchParams } from "./ig-search.ts";
import { igNextReels, igStoryStrip, soonestScheduled } from "../zen/schedule.ts";

test("igSearchParams omits empty posted and campaign keys", () => {
  assert.deepEqual(igSearchParams({}), {});
  assert.deepEqual(igSearchParams({ posted: "", campaign: "" }), {});
  assert.deepEqual(igSearchParams({ posted: "mem_1", campaign: "camp_tea" }), {
    posted: "mem_1",
    campaign: "camp_tea",
  });
});

test("IG preview of a tea-party kit does not surface seed 浮游禪光", () => {
  const rows = [
    {
      id: "seed-c",
      campaignId: "camp_light",
      status: "scheduled",
      scheduledAt: 1,
      kind: "carousel",
      title: "Carousel · 浮游禪光",
    },
    {
      id: "tea-c",
      campaignId: "camp_tea",
      status: "scheduled",
      scheduledAt: 20,
      kind: "carousel",
      title: "Carousel · 茶會",
    },
    {
      id: "tea-s",
      campaignId: "camp_tea",
      status: "scheduled",
      scheduledAt: 30,
      kind: "story",
      title: "Story 1 · 茶會",
    },
    {
      id: "tea-r",
      campaignId: "camp_tea",
      status: "scheduled",
      scheduledAt: 40,
      kind: "reels",
      title: "Reels · 茶會",
    },
    {
      id: "seed-s",
      campaignId: "camp_light",
      status: "scheduled",
      scheduledAt: 5,
      kind: "story",
      title: "Story · 浮游禪光",
    },
  ];
  const focused = scheduleForCampaign(rows, "camp_tea");
  assert.deepEqual(
    soonestScheduled(focused, 12).map((row) => row.id),
    ["tea-c", "tea-s", "tea-r"],
  );
  assert.deepEqual(
    igStoryStrip(focused, 8).map((row) => row.id),
    ["tea-s"],
  );
  assert.deepEqual(
    igNextReels(focused).map((row) => row.id),
    ["tea-r"],
  );
});
