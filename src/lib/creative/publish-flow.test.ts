import assert from "node:assert/strict";
import test from "node:test";
import { applyMarkPublished } from "./publish-flow.ts";
import { SEED_CAMPAIGNS } from "./memory-seed.ts";

test("marking published updates the wave and feeds IG memory", () => {
  const result = applyMarkPublished({
    campaigns: SEED_CAMPAIGNS,
    campaignId: "camp_float_light",
    waveId: "wave_visual",
    title: "浮游禪光 Carousel",
    caption: "最近是不是很久沒有好好坐下來？\n9/24 圖書館前",
    kind: "carousel",
    now: 1_700_000_000_000,
  });
  assert.ok(result);
  const wave = result.campaigns
    .find((campaign) => campaign.id === "camp_float_light")
    ?.waves.find((item) => item.id === "wave_visual");
  assert.equal(wave?.status, "published");
  assert.equal(wave?.publishedAt, 1_700_000_000_000);
  assert.equal(result.post.source, "seed");
  assert.equal("assignee" in result.post, false);
  assert.equal("reviewer" in result.post, false);
  assert.ok(result.post.analysis?.direction.includes("Content Memory"));
});

test("project-only publish still writes a memory post", () => {
  const result = applyMarkPublished({
    campaigns: SEED_CAMPAIGNS,
    projectId: "proj_float_light",
    title: "下週茶會",
    caption: "大學生活很自由，但你最近真的有比較快樂嗎？",
    kind: "reels",
    now: 42,
  });
  assert.ok(result);
  assert.equal(result.waveId, "wave_visual");
  assert.equal(result.post.mediaType, "reels");
  assert.equal(result.post.analysis?.hook.includes("誠摯邀請"), false);
});

test("campaign without wave id marks the scheduled visual wave", () => {
  const result = applyMarkPublished({
    campaigns: SEED_CAMPAIGNS,
    campaignId: "camp_float_light",
    title: "浮游禪光",
    caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
    now: 99,
  });
  assert.ok(result);
  const wave = result.campaigns
    .find((campaign) => campaign.id === "camp_float_light")
    ?.waves.find((item) => item.id === "wave_visual");
  assert.equal(wave?.status, "published");
  assert.equal(wave?.publishedAt, 99);
});
