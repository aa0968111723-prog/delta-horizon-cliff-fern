import assert from "node:assert/strict";
import test from "node:test";
import { graphImageUrl, memoryPostFromPublish, publicPublishUrl, publishCaption, publishNeedsVideo } from "./publish.ts";
import { lastPackFromPlan } from "./last-pack.ts";
import { lessonsFromIg, nextCreateIdeaFromLessons } from "./insights.ts";

const pack = lastPackFromPlan({
  projectId: "proj_tea",
  campaignId: "camp_tea",
  eventName: "茶會",
  plan: {
    hook: "最近是不是連休息都覺得有罪惡感？",
    captions: [{ style: "學生版", text: "下週茶會。人到了就好。" }],
    hashtags: ["#淡江禪學社", "#淡江"],
  },
  kind: "ig-post",
  updatedAt: 1,
});

test("graphImageUrl only accepts public raster urls for official Graph", () => {
  assert.equal(graphImageUrl("data:image/svg+xml;charset=utf-8,x"), "");
  assert.equal(graphImageUrl("blob:http://127.0.0.1/abc"), "");
  assert.equal(graphImageUrl("/seed/tea.svg", "https://zen.example"), "");
  assert.equal(graphImageUrl("https://cdn.example/hero.png"), "https://cdn.example/hero.png");
  assert.equal(graphImageUrl("/og.jpg", "https://zen.example"), "https://zen.example/og.jpg");
  assert.equal(graphImageUrl("https://imgen.x.ai/hero"), "https://imgen.x.ai/hero");
});

test("publicPublishUrl prefers Canva export over a blob preview", () => {
  const packed = lastPackFromPlan({
    projectId: "proj_tea",
    campaignId: "camp_tea",
    eventName: "茶會",
    plan: { hook: "坐一下", captions: [{ style: "學生版", text: "下週茶會。" }], hashtags: [] },
    kind: "ig-post",
    formatPublicUrls: { "ig-post": "https://export-download.canva.com/tea.jpg" },
    canvaExportUrl: "https://export-download.canva.com/tea.jpg",
    updatedAt: 1,
  });
  assert.equal(publicPublishUrl(packed, "blob:http://127.0.0.1/hero"), "https://export-download.canva.com/tea.jpg");
  assert.equal(publicPublishUrl(pack, "data:image/svg+xml;charset=utf-8,x"), "");
});

test("publish caption keeps the student hook and club hashtags", () => {
  const caption = publishCaption(pack);
  assert.match(caption, /連休息都覺得有罪惡感/);
  assert.match(caption, /下週茶會/);
  assert.match(caption, /#淡江禪學社/);
  assert.equal(caption.includes("誠摯邀請"), false);
  assert.equal(publishNeedsVideo("reels"), true);
  assert.equal(publishNeedsVideo("story"), false);
  assert.equal(publishNeedsVideo("reels", "https://imgen.x.ai/clip.mp4"), false);
  assert.equal(publishNeedsVideo("reels", "data:video/mp4;base64,xx"), true);
});

test("published packs enter IG memory so the next generate can learn the hook", () => {
  const post = memoryPostFromPublish({ pack, thumb: "/seed/tea.svg", live: false });
  assert.match(post.analysis, /剛發布/);
  assert.equal(post.metricsSource, "memory");
  assert.equal("metrics" in post, false);
  const lessons = lessonsFromIg([post]);
  assert.match(lessons.hook, /連休息都覺得有罪惡感/);
  assert.match(nextCreateIdeaFromLessons([post], "茶會"), /連休息都覺得有罪惡感/);
});
