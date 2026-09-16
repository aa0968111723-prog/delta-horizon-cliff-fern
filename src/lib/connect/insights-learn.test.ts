import assert from "node:assert/strict";
import test from "node:test";
import { extraFromIgMemory, insightsLearnPatch } from "./insights-learn.ts";
import type { IgMemoryPost } from "../studio/types.ts";

const post = (id: string, extras: Partial<IgMemoryPost> = {}): IgMemoryPost => ({
  id,
  caption: "可以自己來？",
  date: "2026-09-16",
  kind: "post",
  source: "instagram",
  ...extras,
});

test("insightsLearnPatch does not wipe memory when IG is disconnected", () => {
  const patch = insightsLearnPatch({ connected: false, igPosts: [] }, 9);
  assert.equal(patch.posts, null);
  assert.equal(patch.connection, null);
});

test("insightsLearnPatch keeps connection lastSync when connected with empty media", () => {
  const patch = insightsLearnPatch({ connected: true, igPosts: [], accountLabel: "@tamkang.zen" }, 11);
  assert.equal(patch.posts, null);
  assert.deepEqual(patch.connection, { lastSyncAt: 11, status: "connected", accountLabel: "@tamkang.zen" });
});

test("insightsLearnPatch upserts Graph posts so the next kit can learn", () => {
  const posts = [post("ig:1", { saves: 22, reach: 400 })];
  const patch = insightsLearnPatch({ connected: true, igPosts: posts }, 12);
  assert.equal(patch.posts?.[0]?.saves, 22);
  assert.equal(patch.connection?.status, "connected");
});

test("extraFromIgMemory fills saves after Graph insights lag", () => {
  const extra = extraFromIgMemory(
    { igMediaId: "99", permalink: "https://instagram.com/p/abc", saves: undefined, reach: undefined },
    [post("ig:99", { permalink: "https://instagram.com/p/abc", saves: 18, reach: 210 })],
  );
  assert.equal(extra?.saves, 18);
  assert.equal(extra?.reach, 210);
});
