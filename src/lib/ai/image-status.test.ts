import assert from "node:assert/strict";
import test from "node:test";
import { createImageQuota, describeImageAdapter } from "./image-status.ts";

test("unavailable image status never claims Grok already drew anything", () => {
  const status = describeImageAdapter(false);
  assert.equal(status.available, false);
  assert.match(status.detail, /不會假裝 Grok/);
  assert.match(status.generateBlockedMessage, /沒有生成任何畫面/);
  assert.doesNotMatch(status.detail, /已為你生成/);
});

test("available image status still stays user-initiated and capped", () => {
  const status = describeImageAdapter(true);
  assert.equal(status.available, true);
  assert.match(status.detail, /按下生成/);
  assert.match(status.detail, /四張/);
});

test("image quota caps then refunds a failed attempt", () => {
  const quota = createImageQuota(2, 60_000);
  assert.equal(quota.consume().ok, true);
  assert.equal(quota.consume().ok, true);
  const blocked = quota.consume();
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.match(blocked.error, /上限/);
  quota.refund();
  assert.equal(quota.consume().ok, true);
});
