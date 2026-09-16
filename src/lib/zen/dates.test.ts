import assert from "node:assert/strict";
import test from "node:test";
import { campaignMatchingIdea, guessEventName } from "./dates.ts";

test("下週有一場茶會 maps to 茶會, not an abstract youth label", () => {
  assert.equal(guessEventName("下週有一場茶會"), "茶會");
});

test("campaignMatchingIdea reopens the tea-party kit from the spoken idea", () => {
  const hit = campaignMatchingIdea(
    [
      { id: "seed", name: "浮游禪光", oneLiner: "最近是不是很久沒有好好坐下來？", updatedAt: 1 },
      { id: "tea", name: "茶會", oneLiner: "可以自己來？", updatedAt: 9 },
    ],
    "下週有一場茶會",
  );
  assert.equal(hit?.id, "tea");
});

test("campaignMatchingIdea prefers the campaign id when opening from Calendar", () => {
  const hit = campaignMatchingIdea(
    [
      { id: "a", name: "茶會", updatedAt: 2 },
      { id: "b", name: "茶會", updatedAt: 9 },
    ],
    "下週有一場茶會",
    "a",
  );
  assert.equal(hit?.id, "a");
});
