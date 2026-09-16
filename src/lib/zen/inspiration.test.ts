import assert from "node:assert/strict";
import test from "node:test";
import { abstractInspiration, INSPIRATION_SEEDS } from "./inspiration.ts";

test("inspiration abstracts form instead of copying a campaign name", () => {
  assert.ok(INSPIRATION_SEEDS.length >= 3);
  for (const seed of INSPIRATION_SEEDS) {
    const abs = abstractInspiration(seed);
    assert.ok(abs.composition.length > 8);
    assert.ok(seed.zenClub.hook.length > 6);
    assert.equal(seed.zenClub.hook.includes("誠摯邀請"), false);
  }
});
