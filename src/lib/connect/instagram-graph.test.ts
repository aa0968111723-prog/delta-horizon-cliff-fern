import assert from "node:assert/strict";
import test from "node:test";
import {
  containerParams,
  graphContainerParams,
  isPublicImageUrl,
  isStoryGraphFormat,
  reelsParams,
  storyParams,
  mediaContainerUrl,
  mediaPermalinkUrl,
  mediaPublishUrl,
  parseIgUser,
  parseContainerId,
  parsePermalink,
  mediaInsightsUrl,
  parseIgInsights,
  containerStatusUrl,
  parseContainerStatus,
  carouselItemParams,
  carouselAlbumParams,
  longLivedTokenUrl,
  containerPhase,
  waitUntilContainerReady,
  shouldPublishCarousel,
} from "./instagram-graph.ts";

test("Graph URLs and public image check stay official and non-local", () => {
  assert.equal(mediaContainerUrl("123"), "https://graph.facebook.com/v21.0/123/media");
  assert.equal(mediaPublishUrl("123"), "https://graph.facebook.com/v21.0/123/media_publish");
  assert.equal(isPublicImageUrl("https://lh3.googleusercontent.com/d/abc=w1080"), true);
  assert.equal(isPublicImageUrl("https://export-download.canva.com/tea.png"), true);
  assert.equal(isPublicImageUrl("http://127.0.0.1:8080/og.jpg"), false);
  assert.equal(isPublicImageUrl("https://localhost/x.jpg"), false);
  const params = containerParams({ imageUrl: "https://cdn.example.com/tea.jpg", caption: "來坐一下" });
  assert.equal(params.image_url, "https://cdn.example.com/tea.jpg");
  assert.doesNotMatch(JSON.stringify(params), /access_token/);
  const story = storyParams("https://cdn.example.com/tea-story.jpg");
  assert.equal(story.media_type, "STORIES");
  assert.equal(story.image_url, "https://cdn.example.com/tea-story.jpg");
  assert.equal("caption" in story, false);
  assert.doesNotMatch(JSON.stringify(story), /access_token/);
  const feed = graphContainerParams({
    imageUrl: "https://cdn.example.com/tea.jpg",
    caption: "來坐一下",
    format: "feed-portrait",
  });
  assert.equal("caption" in feed, true);
  const storyGraph = graphContainerParams({
    imageUrl: "https://cdn.example.com/tea-story.jpg",
    caption: "倒數文案不進 Graph 限動欄位",
    format: "story",
  });
  assert.equal(isStoryGraphFormat("story"), true);
  assert.equal(isStoryGraphFormat("feed-portrait"), false);
  assert.equal(storyGraph.media_type, "STORIES");
  assert.equal("caption" in storyGraph, false);
  const reels = reelsParams({
    videoUrl: "https://drive.google.com/uc?export=download&id=tea",
    caption: "最近是不是很久沒有好好坐下來？",
  });
  assert.equal(reels.media_type, "REELS");
  assert.equal(reels.video_url, "https://drive.google.com/uc?export=download&id=tea");
  assert.equal(reels.share_to_feed, "true");
  assert.doesNotMatch(JSON.stringify(reels), /access_token/);
});

test("parseIgUser reads professional account without tokens in payload", () => {
  const ig = parseIgUser({
    data: [{ instagram_business_account: { id: "ig1", username: "tamkang.zen" } }],
  });
  assert.equal(ig?.id, "ig1");
  assert.equal(parseContainerId({ id: "cont_1" }), "cont_1");
  assert.equal(mediaPermalinkUrl("1789"), "https://graph.facebook.com/v21.0/1789?fields=permalink");
  assert.equal(parsePermalink({ permalink: "https://www.instagram.com/p/tea1/" }), "https://www.instagram.com/p/tea1/");
  assert.equal(parsePermalink({ permalink: "not-a-url" }), null);
  assert.equal(
    mediaInsightsUrl("1789"),
    "https://graph.facebook.com/v21.0/1789/insights?metric=impressions,reach,saved,shares,plays",
  );
  assert.doesNotMatch(mediaInsightsUrl("1789"), /access_token/);
  assert.deepEqual(
    parseIgInsights({
      data: [
        { name: "saved", values: [{ value: 21 }] },
        { name: "reach", values: [{ value: 420 }] },
      ],
    }),
    { saved: 21, reach: 420 },
  );
  assert.equal(containerStatusUrl("cont_1"), "https://graph.facebook.com/v21.0/cont_1?fields=status_code");
  assert.equal(parseContainerStatus({ status_code: "FINISHED" }), "FINISHED");
  assert.deepEqual(carouselItemParams("https://cdn.example.com/a.jpg"), {
    image_url: "https://cdn.example.com/a.jpg",
    is_carousel_item: "true",
  });
  const album = carouselAlbumParams(["c1", "c2"], "最近是不是很久沒有好好坐下來？");
  assert.equal(album.media_type, "CAROUSEL");
  assert.equal(album.children, "c1,c2");
  assert.doesNotMatch(JSON.stringify(album), /access_token/);
  const longLived = longLivedTokenUrl({ clientId: "app", clientSecret: "sec", token: "short" });
  assert.match(longLived, /grant_type=fb_exchange_token/);
  assert.match(longLived, /graph\.facebook.com/);
  assert.equal(containerPhase("FINISHED"), "ready");
  assert.equal(containerPhase("IN_PROGRESS"), "wait");
  assert.equal(containerPhase("ERROR"), "error");
  assert.equal(shouldPublishCarousel("carousel", 6), true);
});

test("waitUntilContainerReady publishes only after FINISHED", async () => {
  let n = 0;
  const result = await waitUntilContainerReady({
    containerId: "cont_1",
    token: "tok",
    attempts: 4,
    delayMs: 1,
    sleep: async () => undefined,
    fetchJson: async (url) => {
      n += 1;
      assert.match(url, /fields=status_code/);
      assert.match(url, /graph\.facebook.com/);
      return { status_code: n >= 2 ? "FINISHED" : "IN_PROGRESS" };
    },
  });
  assert.equal(result.ok, true);
  assert.equal(n, 2);
  const failed = await waitUntilContainerReady({
    containerId: "cont_bad",
    token: "tok",
    attempts: 2,
    delayMs: 1,
    sleep: async () => undefined,
    fetchJson: async () => ({ status_code: "ERROR" }),
  });
  assert.equal(failed.ok, false);
});
