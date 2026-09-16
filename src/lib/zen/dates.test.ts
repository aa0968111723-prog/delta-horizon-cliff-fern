import assert from "node:assert/strict";
import test from "node:test";
import { campaignMatchingIdea, campaignNameForIdea, guessEventName, shouldReopenCampaign } from "./dates.ts";

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

test("a learned Hook does not reopen last week's 茶會", () => {
  const hit = campaignMatchingIdea(
    [
      { id: "seed", name: "浮游禪光", oneLiner: "最近是不是很久沒有好好坐下來？", updatedAt: 1 },
      { id: "tea", name: "茶會", oneLiner: "可以自己來？", updatedAt: 9 },
    ],
    "可以自己來？",
  );
  assert.equal(hit, undefined);
});

test("from-ig / from-image do not reopen a campaign unless the URL names it", () => {
  assert.equal(shouldReopenCampaign("from-ig"), false);
  assert.equal(shouldReopenCampaign("from-image"), false);
  assert.equal(shouldReopenCampaign("idea"), true);
  assert.equal(shouldReopenCampaign("from-ig", "camp_tea"), true);
});

test("Drive / Canva tea files reopen 茶會 instead of becoming a Hook-named piece", () => {
  assert.equal(shouldReopenCampaign("from-drive"), true);
  assert.equal(shouldReopenCampaign("from-canva"), true);
  assert.equal(campaignNameForIdea({ mode: "from-drive", idea: "2025 茶會現場" }), "茶會");
  assert.equal(campaignNameForIdea({ mode: "from-canva", idea: "茶會 IG 主視覺" }), "茶會");
});

test("from-ig keeps the learned Hook as the name, not last week's 茶會", () => {
  assert.equal(
    campaignNameForIdea({ mode: "from-ig", idea: "可以自己來？", planName: "茶會" }),
    "可以自己來？",
  );
  assert.equal(campaignNameForIdea({ mode: "idea", idea: "下週有一場茶會" }), "茶會");
  assert.equal(
    campaignNameForIdea({ mode: "from-ig", campaignId: "camp_tea", idea: "可以自己來？", eventName: "茶會" }),
    "茶會",
  );
});
