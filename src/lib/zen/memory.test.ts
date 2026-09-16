import assert from "node:assert/strict";
import test from "node:test";
import {
  canGraphPublish,
  graphPublishFormat,
  igKindFromContent,
  igMemoryFromSchedule,
  isFeedGraphKind,
  isStoryGraphKind,
} from "./memory.ts";

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

test("official permalink turns published tea-party into Instagram memory", () => {
  const memory = igMemoryFromSchedule({
    id: "sch_tea",
    projectId: "p1",
    campaignId: "c1",
    kind: "ig-post",
    title: "茶會",
    scheduledAt: Date.parse("2026-09-17T19:00:00+08:00"),
    publishedAt: Date.parse("2026-09-16T12:00:00+08:00"),
    status: "published",
    caption: "最近是不是很久沒有好好坐下來？",
    permalink: "https://www.instagram.com/p/tea1/",
    igMediaId: "1789",
  });
  assert.equal(memory.source, "instagram");
  assert.equal(memory.id, "ig:1789");
  assert.equal(memory.permalink, "https://www.instagram.com/p/tea1/");
});

test("stories and countdown publish as official Graph STORIES, Reels as REELS", () => {
  assert.equal(canGraphPublish("ig-post"), true);
  assert.equal(canGraphPublish("carousel"), true);
  assert.equal(canGraphPublish("story"), true);
  assert.equal(canGraphPublish("countdown"), true);
  assert.equal(canGraphPublish("reels"), true);
  assert.equal(canGraphPublish("threads"), false);
  assert.equal(canGraphPublish("line"), false);
  assert.equal(isFeedGraphKind("carousel"), true);
  assert.equal(isStoryGraphKind("countdown"), true);
  assert.equal(isStoryGraphKind("member-story"), false);
  assert.equal(igKindFromContent("countdown"), "story");
  assert.equal(graphPublishFormat("story"), "story");
  assert.equal(graphPublishFormat("countdown"), "story");
  assert.equal(graphPublishFormat("ig-post"), "feed-portrait");
  assert.equal(graphPublishFormat("reels"), "reels");
  assert.equal(graphPublishFormat("threads"), null);
});
