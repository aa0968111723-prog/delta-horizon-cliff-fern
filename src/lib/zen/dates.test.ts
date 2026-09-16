import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignMatchingIdea,
  campaignNameForIdea,
  defaultScheduleText,
  guessEventName,
  hasScheduleCue,
  isArchivalEventIdea,
  preferredScheduleText,
  datetimeLocalTaipei,
  formatTaipeiClock,
  parseDatetimeLocalTaipei,
  shiftHostEveningToTaipei,
  shouldReopenCampaign,
} from "./dates.ts";

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

test("a 2025 Drive tea file is archival, not a date to hold the event today", () => {
  const now = new Date("2026-09-16T10:00:00+08:00");
  assert.equal(hasScheduleCue("2025 茶會現場"), false);
  assert.equal(isArchivalEventIdea("2025 茶會現場"), true);
  assert.equal(isArchivalEventIdea("可以自己來？"), false);
  assert.equal(hasScheduleCue("下週有一場茶會"), true);
  assert.equal(defaultScheduleText("2025 茶會現場", now), "2026/09/23 19:00");
  assert.equal(defaultScheduleText("可以自己來？", now), "2026/09/16 19:00");
  assert.equal(defaultScheduleText("下週有一場茶會", now), "2026/09/23 19:00");
});

test("reopening 茶會 from an archival Drive file bumps a leftover today date to 下週", () => {
  const now = new Date("2026-09-16T10:00:00+08:00");
  assert.equal(
    preferredScheduleText("2025 茶會現場", {
      existing: { date: "2026-09-16", time: "19:00" },
      now,
    }),
    "2026/09/23 19:00",
  );
  assert.equal(
    preferredScheduleText("2025 茶會現場", {
      existing: { date: "2026-09-23", time: "19:00" },
      now,
    }),
    "2026/09/23 19:00",
  );
  assert.equal(
    preferredScheduleText("2025 茶會現場", {
      existing: { date: "2026-09-16", time: "19:00" },
      campaignId: "camp_tea",
      now,
    }),
    "2026/09/16 19:00",
  );
});

test("a leftover UTC 19:00 stamp becomes 19:00 in 淡水, once", () => {
  const utcEvening = Date.parse("2026-09-17T19:00:00.000Z");
  const shifted = shiftHostEveningToTaipei(utcEvening);
  assert.equal(new Date(shifted).toISOString(), "2026-09-17T11:00:00.000Z");
  assert.equal(shiftHostEveningToTaipei(shifted), shifted);
  assert.equal(shiftHostEveningToTaipei(Date.parse("2026-09-23T11:00:00.000Z")), Date.parse("2026-09-23T11:00:00.000Z"));
});

test("calendar clocks print 淡水 evening, not host UTC noon", () => {
  const warmup = Date.parse("2026-09-16T12:00:00.000Z");
  assert.equal(formatTaipeiClock(warmup), "9/16 20:00");
  assert.equal(datetimeLocalTaipei(warmup), "2026-09-16T20:00");
  assert.equal(parseDatetimeLocalTaipei("2026-09-16T20:00"), Date.parse("2026-09-16T20:00:00+08:00"));
});
