import assert from "node:assert/strict";
import test from "node:test";
import {
  containerParams,
  isPublicImageUrl,
  mediaContainerUrl,
  mediaPermalinkUrl,
  mediaPublishUrl,
  parseIgUser,
  parseContainerId,
  parsePermalink,
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
});
