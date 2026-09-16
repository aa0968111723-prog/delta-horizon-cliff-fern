import assert from "node:assert/strict";
import test from "node:test";
import { FEATURED_EVENT, featuredCampaignIdea, featuredHookFor, pickFeaturedCampaign, searchMemory } from "./memory.ts";
import { parseIdea } from "./idea.ts";

test("natural language memory search finds tea, turtle, floating light", () => {
  assert.ok(searchMemory("晚上的茶會照片").some((item) => item.title.includes("茶會")));
  assert.ok(searchMemory("龜龜").some((item) => item.tags.includes("龜龜")));
  assert.ok(searchMemory("浮游禪光文宣").some((item) => item.title.includes("浮游")));
  assert.ok(searchMemory("找適合 IG 主視覺的照片").length >= 1);
});

test("search results keep source labels", () => {
  const hit = searchMemory("茶會").find((item) => item.source === "canva");
  assert.ok(hit?.subtitle.includes("Canva"));
});

test("campaign handoff for a tea event still searches tea, not a generic youth brief", () => {
  const idea = featuredCampaignIdea({
    ...FEATURED_EVENT,
    name: "茶會",
    oneLiner: "最近是不是很久沒有好好坐下來？",
  });
  assert.equal(parseIdea(idea).eventName, "茶會");
  assert.match(idea, /最近是不是/);
});

test("homepage featured picks the soonest upcoming campaign, not a hardcoded 浮游禪光", () => {
  const tea = { id: "camp_tea", date: "2026-09-23", updatedAt: 2, oneLiner: "最近是不是連休息都覺得有罪惡感？" };
  const floating = { id: FEATURED_EVENT.id, date: "2026-09-24", updatedAt: 9, oneLiner: FEATURED_EVENT.oneLiner };
  const today = "2026-09-16";
  const picked = pickFeaturedCampaign([floating, tea], { today, lastCampaignId: FEATURED_EVENT.id });
  assert.equal(picked?.id, "camp_tea");
  assert.equal(
    featuredHookFor(picked, { campaignId: "camp_tea", hook: tea.oneLiner }),
    "最近是不是連休息都覺得有罪惡感？",
  );
});

test("same-day featured prefers the last packed campaign", () => {
  const teaA = { id: "camp_tea_a", date: "2026-09-23", updatedAt: 1 };
  const teaB = { id: "camp_tea_b", date: "2026-09-23", updatedAt: 8 };
  const picked = pickFeaturedCampaign([teaA, teaB], { today: "2026-09-16", lastCampaignId: "camp_tea_a" });
  assert.equal(picked?.id, "camp_tea_a");
});
