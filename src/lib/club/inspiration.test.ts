import assert from "node:assert/strict";
import test from "node:test";
import { INSPIRATION, inspirationFromIg, studioInspiration } from "./inspiration.ts";

test("own IG lessons become studio inspiration before generic patterns", () => {
  const posts = [
    {
      mediaType: "carousel",
      caption: "最近是不是連休息都覺得有罪惡感？\n下週茶會。",
      metrics: { reach: 1800, likes: 90, comments: 12, saves: 40 },
    },
  ];
  const own = inspirationFromIg(posts);
  assert.ok(own.some((card) => card.id === "from-ig-hook"));
  assert.match(own[0]?.clubUse ?? "", /連休息都覺得有罪惡感/);
  const cards = studioInspiration(posts);
  assert.equal(cards[0]?.id, "from-ig-hook");
  assert.ok(cards.length > INSPIRATION.length);
  assert.equal(studioInspiration([]).length, INSPIRATION.length);
});
