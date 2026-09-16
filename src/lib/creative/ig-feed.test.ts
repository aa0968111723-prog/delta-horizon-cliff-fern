import assert from "node:assert/strict";
import test from "node:test";
import { igGridSlots, upcomingSlotId } from "./ig-feed.ts";
import type { CopyDeck } from "../studio/types.ts";

const copy: CopyDeck = {
  eyebrow: "",
  headline: "最近是不是很久沒坐好？",
  subhead: "",
  body: "",
  cta: "晚上來坐一下",
  handle: "@tkuzen",
  caption: "最近是不是很久沒坐好？\n9/16 發。",
  hashtags: [],
  altText: "",
};

test("scheduled carousel sits at the front of the IG grid", () => {
  const slots = igGridSlots({
    projects: [
      {
        id: "proj_old",
        name: "舊的",
        status: "creating",
        contentKind: "carousel",
        scheduledAt: Date.parse("2026-09-10T19:00:00+08:00"),
        copy,
      },
      {
        id: "proj_tea",
        name: "下週有一場茶會 · Carousel",
        status: "scheduled",
        contentKind: "carousel",
        scheduledAt: Date.parse("2026-09-16T19:00:00+08:00"),
        copy,
      },
      {
        id: "proj_line",
        name: "LINE 圖",
        status: "scheduled",
        contentKind: "line",
        scheduledAt: Date.parse("2026-09-15T19:00:00+08:00"),
        copy,
      },
    ],
    posts: [
      {
        id: "ig_old",
        source: "seed",
        mediaType: "image",
        caption: "龜龜今天也在。",
        takenAt: Date.parse("2026-03-04T12:00:00+08:00"),
        assetIds: [],
      },
    ],
  });
  assert.equal(slots[0]?.id, upcomingSlotId("proj_tea"));
  assert.equal(slots[0]?.origin, "upcoming");
  assert.equal(slots[0]?.mediaType, "carousel");
  assert.match(slots[0]?.caption ?? "", /很久沒坐好/);
  assert.equal(slots.some((slot) => slot.projectId === "proj_line"), false);
  assert.equal(slots.some((slot) => slot.projectId === "proj_old"), false);
  assert.equal(slots[1]?.postId, "ig_old");
});

test("earlier scheduled date comes first among upcoming", () => {
  const slots = igGridSlots({
    projects: [
      {
        id: "later",
        name: "倒數",
        status: "scheduled",
        contentKind: "story",
        scheduledAt: Date.parse("2026-09-22T19:00:00+08:00"),
        copy,
      },
      {
        id: "sooner",
        name: "Carousel",
        status: "scheduled",
        contentKind: "carousel",
        scheduledAt: Date.parse("2026-09-16T19:00:00+08:00"),
        copy,
      },
    ],
    posts: [],
  });
  assert.deepEqual(
    slots.map((slot) => slot.projectId),
    ["sooner", "later"],
  );
});
