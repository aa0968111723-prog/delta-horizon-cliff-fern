import assert from "node:assert/strict";
import test from "node:test";
import { canGraphPublish, igKindFromContent, igMemoryFromSchedule } from "./memory.ts";

test("igMemoryFromSchedule writes local caption into Creative Brain", () => {
  const memory = igMemoryFromSchedule({
    id: "sch_tea",
    projectId: "p1",
    campaignId: "c1",
    kind: "carousel",
    title: "Carousel · 茶會",
    scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
    publishedAt: Date.parse("2026-09-16T12:00:00+08:00"),
    status: "published",
    caption: "最近是不是很久沒有好好坐下來？",
    hashtags: ["#淡江禪學社"],
  });
  assert.equal(memory.kind, "carousel");
  assert.equal(memory.source, "local");
  assert.match(memory.caption, /坐下來/);
  assert.equal(memory.projectId, "p1");
  assert.equal("assignee" in memory, false);
});

test("stories are not Graph feed publishes", () => {
  assert.equal(canGraphPublish("ig-post"), true);
  assert.equal(canGraphPublish("story"), false);
  assert.equal(igKindFromContent("countdown"), "story");
});
