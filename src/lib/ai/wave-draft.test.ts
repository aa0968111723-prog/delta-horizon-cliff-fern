import assert from "node:assert/strict";
import test from "node:test";
import { captionFromWave, mockWaveDraft } from "./wave-draft.ts";

test("warmup copy is life, not the tea-party filename or a stacked ad", () => {
  const warmup = mockWaveDraft({
    kind: "warmup",
    name: "茶會",
    schedule: "2026/09/23 19:00",
    location: "淡水校園",
    idea: "2025 茶會現場",
    learnedHook: "可以自己來？",
  });
  const hero = mockWaveDraft({
    kind: "hero",
    name: "茶會",
    schedule: "2026/09/23 19:00",
    location: "淡水校園",
    learnedHook: "可以自己來？",
    body: "不需要會禪，來坐一下就好。",
  });
  assert.match(warmup.hook, /罪惡感/);
  assert.doesNotMatch(warmup.hook, /茶會|2025/);
  assert.doesNotMatch(warmup.body, /2025 茶會現場|誠摯邀請/);
  assert.notEqual(captionFromWave(warmup), captionFromWave(hero));
  assert.match(captionFromWave(hero), /可以自己來/);
  assert.match(captionFromWave(mockWaveDraft({ kind: "detail", name: "茶會", schedule: "2026/09/23 19:00", location: "淡水校園" })), /2026\/09\/23|淡水/);
});
