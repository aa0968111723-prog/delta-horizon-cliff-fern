import assert from "node:assert/strict";
import test from "node:test";
import {
  decodePublishImageB64,
  igMediaPublicUrl,
  instagramCanFetchUrl,
  isIgMediaId,
  looksLikePublishImage,
  publishHostMessage,
} from "./ig-media.ts";

const TINY_JPEG =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAdB/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPwB//9k=";

test("instagram cannot fetch localhost hosted frames", () => {
  const local = igMediaPublicUrl("http://127.0.0.1:8080", "abc_media_token_1");
  assert.equal(local, "http://127.0.0.1:8080/api/ig-media/abc_media_token_1");
  assert.equal(instagramCanFetchUrl(local), false);
  const live = igMediaPublicUrl("https://zen.example.com", "abc_media_token_1");
  assert.equal(instagramCanFetchUrl(live), true);
});

test("publish host copy does not ask to paste a token", () => {
  const local = publishHostMessage({ hosted: true, canFetch: false });
  assert.match(local, /目前畫面已備好/);
  assert.equal(local.includes("token"), false);
  assert.equal(local.includes("Token"), false);
  assert.match(publishHostMessage({ hosted: false, canFetch: false }), /生成主視覺/);
});

test("media ids reject path traversal", () => {
  assert.equal(isIgMediaId("abc_media_token_1"), true);
  assert.equal(isIgMediaId("../secret"), false);
  assert.equal(isIgMediaId("a"), false);
});

test("decodePublishImageB64 accepts jpeg and rejects junk", () => {
  const decoded = decodePublishImageB64(TINY_JPEG, "image/jpeg");
  assert.ok(decoded);
  assert.equal(decoded?.mime, "image/jpeg");
  assert.equal(looksLikePublishImage(decoded?.bytes ?? new Uint8Array()), true);
  assert.equal(decodePublishImageB64("not-image"), null);
  assert.equal(decodePublishImageB64("data:image/svg+xml;base64,AAAA"), null);
});
