import assert from "node:assert/strict";
import test from "node:test";
import { buildConvertKit } from "./convert-kit.ts";

test("convert kit turns one brief into carousel, story, reels, threads, line", () => {
  const kit = buildConvertKit({
    title: "浮游禪光",
    hook: "最近是不是很久沒有好好坐下來？",
    body: "燈光、熱茶、坐著就好。",
    when: "9/24 19:30",
    where: "圖書館前",
    cta: "晚上來坐一下",
  });
  assert.equal(kit.carousel.length, 5);
  assert.equal(kit.carousel[0]?.role, "hook");
  assert.equal(kit.carousel[0]?.title.includes("誠摯邀請"), false);
  assert.ok(kit.carousel[0]?.title.includes("坐"));
  assert.equal(kit.carousel[3]?.title, "浮游禪光");
  assert.ok(kit.carousel[4]?.body.includes("9/24"));
  assert.ok(kit.carousel[4]?.body.includes("圖書館前"));
  assert.equal(kit.story.length, 4);
  assert.ok(kit.story[0]?.headline.includes("坐"));
  assert.equal(kit.reels.length, 5);
  assert.equal(kit.reels[0]?.start, "0s");
  assert.equal(kit.reels[4]?.end, "20s");
  assert.ok(kit.reels[0]?.caption.includes("坐"));
  assert.ok(kit.reels[0]?.visual);
  assert.ok(kit.reels[0]?.voice);
  assert.ok(kit.threads.includes("浮游禪光"));
  assert.ok(kit.line.startsWith("【浮游禪光】"));
  assert.equal(kit.line.includes("年輕人"), false);
});
