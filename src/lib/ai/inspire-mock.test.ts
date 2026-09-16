import assert from "node:assert/strict";
import test from "node:test";
import { mockInspirationResearch } from "./inspire-mock.ts";

test("inspiration abstracts patterns into Tamkang club turns without copying accounts", () => {
  const items = mockInspirationResearch("下週有一場茶會");
  assert.equal(items.length, 3);
  for (const item of items) {
    assert.ok(item.clubTurn.includes("淡江") || item.clubTurn.includes("課表") || item.clubTurn.includes("坐好"));
    assert.equal(/instagram\.com|@nike|小紅書爆款/.test(`${item.pattern}${item.clubTurn}`), false);
    assert.ok(item.composition.length > 4);
    assert.ok(item.hookShape.length > 2);
  }
  assert.ok(items[0]?.clubTurn.includes("茶會") || items[0]?.clubTurn.includes("第三頁"));
});
