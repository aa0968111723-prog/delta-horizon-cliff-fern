import assert from "node:assert/strict";
import test from "node:test";
import { applyPickedDirection, briefFromIdea, mergePlanSources, notesFromHits, summarizeFound } from "./compose.ts";
import { parseIdea } from "./idea.ts";
import { searchMemory } from "./memory.ts";
import { buildZenMockPlan } from "./mock-plan.ts";
import type { BriefInput } from "../ai/schema.ts";

const FROM = new Date("2026-09-16T12:00:00+08:00");

test("tea idea becomes a full campaign brief and sourced plan", () => {
  const parsed = parseIdea("下週有一場茶會", FROM);
  const hits = searchMemory(parsed.searchQuery);
  const summary = summarizeFound({
    drive: hits.filter((item) => item.source === "drive"),
    canva: hits.filter((item) => item.source === "canva"),
    instagram: hits.filter((item) => item.source === "instagram"),
    generated: hits.filter((item) => item.source === "generated"),
  });
  assert.ok(summary.found >= 3);
  assert.match(summary.line, /找到 \d+ 個相關素材/);

  const brief = briefFromIdea(parsed, notesFromHits(parsed, hits));
  assert.equal(brief.eventName, "茶會");
  assert.equal(brief.deliverables.carousel, true);
  assert.match(brief.notes, /Google Drive|Canva|Instagram/);
  assert.match(brief.notes, /Canva 風格/);
  assert.match(brief.notes, /IG DNA/);

  const withStyle = briefFromIdea(parsed, notesFromHits(parsed, hits, ["Canva / 茶會：延續配色與留白。不要複製舊作品。"]));
  assert.match(withStyle.notes, /記住的風格/);

  const input: BriefInput = {
    eventName: brief.eventName,
    schedule: brief.schedule,
    location: brief.location,
    product: brief.product,
    offer: brief.offer,
    audience: brief.audience,
    goal: brief.goal,
    features: brief.features,
    style: brief.style,
    notes: brief.notes,
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    brandName: "淡江大學禪學社",
    handle: "@tku.zen",
    voice: "學生感",
    doSay: "淡江學生生活",
    dontSay: "宗教廣告",
    forbiddenWords: ["誠摯邀請您"],
    slogans: "最近是不是很久沒有好好坐下來？",
    preferredCtas: "來坐一下",
  };
  const plan = mergePlanSources(buildZenMockPlan(input), hits);
  assert.equal(plan.directions?.length, 3);
  assert.ok(plan.reelsScript && plan.reelsScript.length === 5);
  assert.ok(plan.sources?.some((item) => item.kind === "drive"));
  assert.ok(plan.sources?.some((item) => item.kind === "canva"));
  assert.ok(plan.captions[0]?.text.includes("？") || plan.hook.includes("？"));
  assert.equal(`${plan.hook}${plan.captions[0]?.text}`.includes("誠摯邀請您"), false);

  const picked = applyPickedDirection(plan, plan.directions![1]);
  assert.equal(picked.headline, plan.directions![1].headline);
  assert.match(picked.visualDirection, /Prompt/);
});
