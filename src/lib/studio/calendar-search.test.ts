import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarSearchFromScheduled,
  calendarSearchParams,
  campaignsForCalendar,
  canvaHeroAssetId,
  hasLiveEventCampaign,
  scheduleForCampaign,
} from "./calendar-search.ts";

test("calendarSearchParams omits an empty campaign so the URL stays clean", () => {
  assert.deepEqual(calendarSearchParams({}), {});
  assert.deepEqual(calendarSearchParams({ campaign: "" }), {});
  assert.deepEqual(calendarSearchParams({ campaign: "camp_tea" }), { campaign: "camp_tea" });
});

test("calendarSearchFromScheduled uses 看全部 when 已排程 mixes a piece and a tea-party", () => {
  assert.deepEqual(
    calendarSearchFromScheduled([
      { campaignId: "camp_hook" },
      { campaignId: "camp_tea" },
    ]),
    {},
  );
  assert.deepEqual(calendarSearchFromScheduled([{ campaignId: "camp_hook" }]), { campaign: "camp_hook" });
});

test("scheduleForCampaign keeps only that tea-party kit", () => {
  const rows = [
    { id: "seed", campaignId: "camp_floating_light", title: "主視覺 · 浮游禪光" },
    { id: "tea", campaignId: "camp_tea", title: "Carousel · 茶會" },
    { id: "story", campaignId: "camp_tea", title: "Story 1 · 茶會" },
  ];
  assert.deepEqual(
    scheduleForCampaign(rows, "camp_tea").map((row) => row.id),
    ["tea", "story"],
  );
  assert.equal(scheduleForCampaign(rows).length, 3);
  assert.deepEqual(
    scheduleForCampaign(rows, undefined, { hideSeed: true }).map((row) => row.id),
    ["tea", "story"],
  );
});

test("campaignsForCalendar hides the seed 浮游禪光 when a tea-party is focused", () => {
  const rows = [
    { id: "camp_floating_light", name: "浮游禪光", type: "light" },
    { id: "camp_tea", name: "茶會", type: "tea" },
    { id: "camp_hook", name: "可以自己來？", type: "other" },
  ];
  assert.deepEqual(
    campaignsForCalendar(rows, "camp_tea").map((row) => row.name),
    ["茶會"],
  );
  assert.deepEqual(
    campaignsForCalendar(rows).map((row) => row.name),
    ["茶會"],
  );
  assert.equal(hasLiveEventCampaign(rows), true);
});

test("canvaHeroAssetId prefers the live still, then the campaign, then the scheduled hero", () => {
  assert.equal(
    canvaHeroAssetId({ lastAssetId: "live", campaignAssetId: "camp", heroAssetId: "hero" }),
    "live",
  );
  assert.equal(canvaHeroAssetId({ campaignAssetId: "camp", heroAssetId: "hero" }), "camp");
  assert.equal(canvaHeroAssetId({ heroAssetId: "hero" }), "hero");
  assert.equal(canvaHeroAssetId({}), undefined);
});
