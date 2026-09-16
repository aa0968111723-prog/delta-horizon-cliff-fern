import assert from "node:assert/strict";
import test from "node:test";
import { searchMemory } from "./memory.ts";

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
