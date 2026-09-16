import assert from "node:assert/strict";
import test from "node:test";
import { directionsFromResearch, ideaFromInspiration, INSPIRATION, inspirationForBeat, researchInspiration } from "./inspiration.ts";

test("inspiration idea carries composition not a swipe file", () => {
  const idea = ideaFromInspiration(INSPIRATION[0]!);
  assert.match(idea, /構圖/);
  assert.match(idea, /排版/);
  assert.match(idea, /淡江禪學社/);
  assert.doesNotMatch(idea, /抄/);
});

test("inspirationForBeat puts 開學季 friend-seat first, not a random swipe", () => {
  const cards = inspirationForBeat("orientation");
  assert.equal(cards[0]?.id, "friend-seat");
  assert.ok(cards.length >= 4);
});

test("tea-party research ranks 空一個位子 first and abstracts, never copies other clubs", () => {
  const research = researchInspiration({
    idea: "下週有一場茶會",
    eventName: "茶會",
    beat: "ordinary",
    learning: {
      bestHookShape: "最近是不是很久沒有好好坐下來？",
      avoid: "不要用社團全名或誠摯邀請當第一句。",
      bestKind: "carousel",
      captionLengthBest: 86,
    },
  });
  assert.equal(research.eventKind, "tea");
  assert.equal(research.cards[0]?.id, "friend-seat");
  assert.ok(research.cards.some((card) => card.id === "carousel-breath"));
  assert.match(research.promptBlock, /構圖/);
  assert.match(research.promptBlock, /禁止抄/);
  assert.doesNotMatch(research.promptBlock, /其他學校|某社團貼文|Assignee/);
  const dirs = directionsFromResearch(research, {
    eventName: "茶會",
    hook: "最近是不是很久沒有好好坐下來？",
  });
  assert.equal(dirs.length, 3);
  assert.match(dirs[0]?.headline ?? "", /[？?]|坐下來|晚上|快樂|休息/);
  assert.notEqual(dirs[0]?.headline, "茶會");
  assert.match(dirs[0]?.prompt ?? "", /Tamkang|Tamsui|turtle|tea/i);
  assert.match(dirs.map((d) => d.prompt).join(" "), /no temple|not religious/i);
});

test("Drive and Canva hits reshape tea-party directions instead of a generic template", () => {
  const research = researchInspiration({
    idea: "下週有一場茶會 Google Drive/2025 茶會現場 Canva/茶會 IG 主視覺",
    eventName: "茶會",
    beat: "ordinary",
    sources: [
      { source: "drive", title: "2025 茶會現場" },
      { source: "canva", title: "茶會 IG 主視覺" },
      { source: "instagram", title: "最近是不是很久沒有好好坐下來？" },
    ],
  });
  assert.ok(research.foundSources.some((row) => row.source === "drive"));
  assert.ok(research.foundSources.some((row) => row.source === "canva"));
  assert.match(research.promptBlock, /Google Drive／2025 茶會現場/);
  assert.match(research.promptBlock, /不要複製/);
  assert.doesNotMatch(research.promptBlock, /Assignee|抄別人的貼文/);
  const dirs = directionsFromResearch(research, { eventName: "茶會", hook: "可以自己來？" });
  assert.match(dirs.map((dir) => dir.concept).join(" "), /Google Drive|Canva|Instagram/);
  assert.match(dirs.map((dir) => dir.concept).join(" "), /不要複製/);
});
