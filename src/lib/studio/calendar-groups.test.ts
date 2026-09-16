import assert from "node:assert/strict";
import test from "node:test";
import { groupSameNightPacks, sameNightPacks } from "./calendar-groups.ts";

const NIGHT = Date.parse("2026-09-19T19:00:00+08:00");
const OTHER = Date.parse("2026-09-20T19:00:00+08:00");

function item(id: string, at: number, convertedFromId?: string) {
  return { project: { id, convertedFromId }, at };
}

test("a convert pack on one night is one group", () => {
  const items = [
    item("origin", NIGHT),
    item("line", NIGHT, "origin"),
    item("story", NIGHT, "origin"),
  ];
  const groups = sameNightPacks(items);
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.members.length, 3);
  assert.equal(groups[0]?.rootId, "origin");
});

test("a pack member on another night stays its own group", () => {
  const items = [item("origin", NIGHT), item("line", OTHER, "origin")];
  const groups = sameNightPacks(items);
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.members.length, 1);
  assert.equal(groups[1]?.members.length, 1);
});

test("unrelated content on the same night does not join the pack", () => {
  const items = [item("origin", NIGHT), item("line", NIGHT, "origin"), item("other", NIGHT)];
  const grouped = groupSameNightPacks(items);
  assert.equal(grouped.length, 2);
  const pack = grouped.find((row) => row.type === "pack");
  const extra = grouped.find((row) => row.type === "content");
  assert.ok(pack);
  assert.equal(pack.members.length, 2);
  assert.equal(extra?.project.id, "other");
});

test("a lone scheduled post stays a single content chip", () => {
  const grouped = groupSameNightPacks([item("solo", NIGHT)]);
  assert.deepEqual(grouped, [{ type: "content", project: { id: "solo", convertedFromId: undefined }, at: NIGHT }]);
});
