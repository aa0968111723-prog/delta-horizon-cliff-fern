import assert from "node:assert/strict";
import test from "node:test";
import { inferContentKind, kindFromFormat, statusFromLegacy, contentStatusLabel } from "./content.ts";

test("kindFromFormat maps story and carousel", () => {
  assert.equal(kindFromFormat("story", false), "story");
  assert.equal(kindFromFormat("feed-portrait", true), "carousel");
  assert.equal(kindFromFormat("threads", false), "threads");
});

test("statusFromLegacy maps exported to published and scheduled wins", () => {
  assert.equal(statusFromLegacy("exported"), "published");
  assert.equal(statusFromLegacy("draft", Date.now()), "scheduled");
  assert.equal(statusFromLegacy("ready"), "done");
});

test("contentStatusLabel stays in the one-person status set", () => {
  assert.equal(contentStatusLabel("scheduled"), "已排程");
  assert.equal(contentStatusLabel("published"), "已發布");
  assert.doesNotMatch(contentStatusLabel("idea"), /審核|Rejected/);
});

test("inferContentKind uses slides length", () => {
  const kind = inferContentKind({
    activeFormatId: "feed-portrait",
    brief: {
      product: "",
      eventName: "",
      schedule: "",
      location: "",
      offer: "",
      audience: "",
      goal: "awareness",
      features: "",
      style: "",
      notes: "",
      deliverables: { post: true, story: false, carousel: false, reels: false },
    },
    slides: {
      "feed-portrait": [
        { formatId: "feed-portrait", background: { type: "solid", color: "#000" }, layers: [] },
        { formatId: "feed-portrait", background: { type: "solid", color: "#000" }, layers: [] },
      ],
    },
  });
  assert.equal(kind, "carousel");
});
