import assert from "node:assert/strict";
import test from "node:test";
import { buildCopyPack } from "./pack.ts";
import { FORBIDDEN_CLUB_PHRASES } from "../club/identity.ts";

test("copy pack opens with a student hook not a formal invite", () => {
  const pack = buildCopyPack("最近是不是連休息都覺得有罪惡感？", "學生版", {
    eventName: "浮游禪光",
    schedule: "9/24 19:30",
    location: "淡江校園",
  });
  assert.ok(pack.hook.includes("？") || pack.hook.includes("晚上"));
  const blob = `${pack.hook}\n${pack.body}`;
  for (const phrase of FORBIDDEN_CLUB_PHRASES) {
    assert.equal(blob.includes(phrase), false, phrase);
  }
  assert.ok(pack.studentReview.revisions.length >= 1);
  assert.equal(pack.variants.length, 6);
});

test("copy pack can learn a hook from IG lessons when the idea has no question", () => {
  const pack = buildCopyPack("下週茶會", "學生版", {
    eventName: "茶會",
    igLessons: "Hook：比較有效的 Hook 像是「最近是不是連休息都覺得有罪惡感？」。",
  });
  assert.equal(pack.hook, "最近是不是連休息都覺得有罪惡感？");
});

test("copy pack can learn a hook from remembered style when lessons are empty", () => {
  const pack = buildCopyPack("下週茶會", "學生版", {
    eventName: "茶會",
    styleMemory: "剛發布 · ig-post · 茶會。Hook：「大學生活很自由，但你最近真的有比較快樂嗎？」",
  });
  assert.equal(pack.hook, "大學生活很自由，但你最近真的有比較快樂嗎？");
});
