import assert from "node:assert/strict";
import test from "node:test";
import { calendarCoverOf, calendarFrom } from "./calendar.ts";
import { SEED_CAMPAIGNS } from "./memory-seed.ts";
import { SEED_LIGHT_ID } from "../studio/seed-ids.ts";

test("calendar cover prefers a Canva-returned asset over the campaign poster", () => {
  const cover = calendarCoverOf({
    refs: [{ source: "canva", label: "Canva 微調後", id: "asset_canva_1" }],
    campaign: { coverAssetId: SEED_LIGHT_ID, relatedAssetIds: [SEED_LIGHT_ID] },
  });
  assert.equal(cover.coverAssetId, "asset_canva_1");
  assert.equal(cover.coverFromCanva, true);
  assert.equal(cover.coverUrl, undefined);
});

test("calendar cover keeps a public generated URL next to a Canva asset", () => {
  const cover = calendarCoverOf({
    refs: [
      { source: "canva", label: "Canva 微調後", id: "asset_canva_1" },
      { source: "canva", label: "匯出", id: "https://export.canva.com/zen.png" },
    ],
  });
  assert.equal(cover.coverAssetId, "asset_canva_1");
  assert.equal(cover.coverUrl, "https://export.canva.com/zen.png");
  assert.equal(cover.coverFromCanva, true);
});

test("seed campaign days show the club cover when a wave has no project yet", () => {
  const items = calendarFrom(SEED_CAMPAIGNS, []);
  const event = items.find((item) => item.id === "event-camp_float_light");
  const emotion = items.find((item) => item.id === "wave_emotion");
  assert.equal(event?.coverAssetId, SEED_LIGHT_ID);
  assert.equal(emotion?.coverAssetId, SEED_LIGHT_ID);
  assert.equal(event?.coverFromCanva, false);
});

test("排進月曆 keeps the Canva visual on the scheduled day", () => {
  const items = calendarFrom(
    [
      {
        ...SEED_CAMPAIGNS[0],
        waves: [
          {
            id: "wave_tea_visual",
            offsetDays: -7,
            intent: "主視覺",
            topic: "茶會 Carousel",
            contentKind: "carousel",
            projectId: "proj_canva_tea",
            scheduledAt: Date.parse("2026-09-16T19:00:00+08:00"),
            status: "scheduled",
          },
        ],
      },
    ],
    [
      {
        id: "proj_canva_tea",
        name: "下週有一場茶會 · Carousel",
        status: "scheduled",
        contentKind: "carousel",
        campaignId: "camp_float_light",
        scheduledAt: Date.parse("2026-09-16T19:00:00+08:00"),
        publishedAt: null,
        sourceRefs: [{ source: "canva", label: "Canva 微調後", id: "asset_canva_1" }],
      },
    ],
  );
  const chip = items.find((item) => item.projectId === "proj_canva_tea");
  assert.equal(chip?.date, "2026-09-16");
  assert.equal(chip?.coverAssetId, "asset_canva_1");
  assert.equal(chip?.coverFromCanva, true);
});

test("a standalone scheduled project still carries its Canva asset", () => {
  const items = calendarFrom(
    [],
    [
      {
        id: "proj_solo_canva",
        name: "茶會 · Story",
        status: "scheduled",
        contentKind: "story",
        campaignId: null,
        scheduledAt: Date.parse("2026-09-18T19:00:00+08:00"),
        publishedAt: null,
        sourceRefs: [{ source: "canva", label: "Canva 微調後", id: "asset_canva_story" }],
      },
    ],
  );
  assert.equal(items[0]?.coverAssetId, "asset_canva_story");
  assert.equal(items[0]?.coverFromCanva, true);
});
