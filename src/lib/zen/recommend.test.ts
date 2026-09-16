import assert from "node:assert/strict";
import test from "node:test";
import { HOOK_EXAMPLES } from "./context.ts";
import { recommendCampaign, recommendHook } from "./recommend.ts";

const SEED_TIME = Date.parse("2026-09-10T00:00:00+08:00");
const NOW = new Date("2026-09-16T10:00:00+08:00");
const TEA_UPDATED = Date.parse("2026-09-16T12:00:00+08:00");

const seed = {
  id: "camp_light",
  name: "浮游禪光",
  date: "2026-09-24",
  oneLiner: "最近是不是很久沒有好好坐下來？",
  updatedAt: SEED_TIME,
};

const tea = {
  id: "camp_tea",
  name: "茶會",
  date: "2026-09-23",
  oneLiner: "可以自己來？",
  updatedAt: TEA_UPDATED,
};

test("just-made tea-party beats seed 浮游禪光 inside the 21-day window", () => {
  const hit = recommendCampaign([seed, tea], NOW);
  assert.equal(hit?.id, "camp_tea");
  assert.equal(hit?.name, "茶會");
});

test("seed still recommends when it is the only campaign in the window", () => {
  assert.equal(recommendCampaign([seed], NOW)?.id, "camp_light");
});

test("soonest later date wins when nothing is in the window", () => {
  const laterTea = { ...tea, date: "2026-10-20", updatedAt: 1 };
  const laterSeed = { ...seed, date: "2026-11-01", updatedAt: 9 };
  assert.equal(recommendCampaign([laterSeed, laterTea], NOW)?.id, "camp_tea");
});

test("latest past event is the fallback after the window", () => {
  const after = new Date("2026-10-01T10:00:00+08:00");
  assert.equal(recommendCampaign([seed, tea], after)?.id, "camp_light");
});

test("empty list has nothing to recommend", () => {
  assert.equal(recommendCampaign([], NOW), undefined);
});

test("recommendHook prefers the campaign one-liner over a leftover seed IG hook", () => {
  assert.equal(
    recommendHook(tea, "有時候我們需要的不是答案，只是一個安靜的晚上。"),
    "可以自己來？",
  );
});

test("empty one-liner falls back to the learned hook", () => {
  assert.equal(
    recommendHook({ oneLiner: "   " }, "大學生活很自由，但你最近真的有比較快樂嗎？"),
    "大學生活很自由，但你最近真的有比較快樂嗎？",
  );
});

test("formal invitations never become the home hook", () => {
  const hook = recommendHook(
    { oneLiner: "淡江大學禪學社誠摯邀請您參加茶會" },
    "最近是不是連休息都覺得有罪惡感？",
  );
  assert.equal(hook, "最近是不是連休息都覺得有罪惡感？");
  assert.doesNotMatch(hook, /誠摯邀請/);
  assert.equal(recommendHook({ oneLiner: "敬邀蒞臨" }, "誠摯邀請您"), HOOK_EXAMPLES[0]);
});

test("a learned-Hook piece does not steal 今天推薦 from the tea-party", () => {
  const piece = {
    id: "camp_hook",
    name: "可以自己來？",
    type: "other",
    date: "2026-09-16",
    oneLiner: "可以自己來？",
    updatedAt: TEA_UPDATED + 9_000,
  };
  const hit = recommendCampaign([seed, tea, piece], NOW);
  assert.equal(hit?.id, "camp_tea");
  assert.equal(hit?.name, "茶會");
});
