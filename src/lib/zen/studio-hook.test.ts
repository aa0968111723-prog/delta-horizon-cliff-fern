import assert from "node:assert/strict";
import test from "node:test";
import { ideaStudioHook } from "./studio-hook.ts";

const seed = {
  id: "ig_mem_tea",
  caption: "有時候我們需要的不是答案，只是一個安靜的晚上。",
  date: "2025-12-04",
  kind: "post" as const,
  saves: 33,
  likes: 124,
  source: "local" as const,
};

test("tea-party kit banner follows 可以自己來, not leftover seed IG metrics", () => {
  assert.equal(ideaStudioHook([seed], "下週有一場茶會", "茶會"), "可以自己來？");
});

test("from-ig with the tea Hook keeps that line, not leftover seed 有時候", () => {
  assert.equal(
    ideaStudioHook(
      [
        seed,
        {
          id: "local:tea",
          caption: "可以自己來？\n2026/09/23 19:00，淡水校園\n#淡江 #茶會",
          date: "2026-09-16",
          kind: "carousel",
          source: "local",
          feel: "strong",
          saves: 22,
          likes: 84,
        },
      ],
      "可以自己來？",
    ),
    "可以自己來？",
  );
});

test("a 學生會停 mark beats inspiration so the next kit learns it", () => {
  const hook = ideaStudioHook(
    [
      seed,
      {
        id: "local:tea",
        caption: "課表排滿的時候，你還記得自己喜歡什麼嗎？",
        date: "2026-09-16",
        kind: "carousel",
        source: "local",
        feel: "strong",
        saves: 22,
        likes: 84,
      },
    ],
    "招新",
    "招新",
  );
  assert.equal(hook, "課表排滿的時候，你還記得自己喜歡什麼嗎？");
});
