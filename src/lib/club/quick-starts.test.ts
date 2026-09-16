import assert from "node:assert/strict";
import test from "node:test";
import { handoffFromQuickStart, QUICK_STARTS } from "./quick-starts.ts";

test("IG / Story / Carousel / Reels quick starts land on campaign IdeaFlow", () => {
  const byId = Object.fromEntries(QUICK_STARTS.map((item) => [item.id, item]));
  assert.equal(byId.post?.to, "/create");
  assert.equal(byId.post?.tab, "campaign");
  assert.equal(byId.story?.tab, "campaign");
  assert.equal(byId.carousel?.tab, "campaign");
  assert.equal(byId.reels?.tab, "campaign");
  assert.equal(byId.photo?.tab, "vision");

  const post = handoffFromQuickStart(byId.post!);
  assert.equal(post.autoRun, true);
  assert.equal(post.tab, "campaign");
  assert.match(post.idea ?? "", /？/);

  const carousel = handoffFromQuickStart(byId.carousel!);
  assert.equal(carousel.convertKind, "carousel");
  assert.equal(carousel.autoRun, true);

  const image = handoffFromQuickStart(byId.image!);
  assert.equal(image.autoRun, true);
  assert.equal(image.tab, "image");
  assert.match(image.idea ?? "", /茶會/);
});
