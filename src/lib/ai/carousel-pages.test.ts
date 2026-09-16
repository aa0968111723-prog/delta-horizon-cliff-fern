import assert from "node:assert/strict";
import test from "node:test";
import { directionPosterSvg } from "./poster.ts";
import {
  attachCarouselAssets,
  carouselPageLine,
  carouselPagesFromPlan,
  carouselPosterInput,
  encodedCarouselIds,
  studentCoverHeadline,
  zenCarouselPages,
} from "./carousel-pages.ts";
import { buildMockPlan } from "./mock.ts";

const zenBrief = {
  eventName: "浮游禪光",
  schedule: "9/24 19:00",
  location: "淡水校園",
  product: "浮游禪光",
  offer: "",
  audience: "淡江大一新生",
  goal: "traffic" as const,
  features: "三色光、坐下來",
  style: "生活感",
  notes: "",
  wantPost: true,
  wantStory: true,
  wantCarousel: true,
  wantReels: true,
  brandName: "淡江大學禪學社",
  handle: "@tamkang.zen",
  voice: "自然",
  doSay: "坐下來",
  dontSay: "誠摯邀請",
  forbiddenWords: ["誠摯邀請"],
};

test("tea-party carousel page 1 is the student hook, not the event name", () => {
  const plan = buildMockPlan({ ...zenBrief, eventName: "茶會", product: "茶會" });
  const pages = carouselPagesFromPlan(plan);
  assert.ok(pages.length >= 5 && pages.length <= 6);
  assert.equal(pages[0]?.headline, plan.hook);
  assert.notEqual(pages[0]?.headline, "茶會");
  assert.match(pages[0]?.headline ?? "", /[？?]|晚上|坐下來|快樂|休息|滿/);
  assert.match(pages.map((page) => page.role).join(), /cover|problem|detail|proof|cta/);
  assert.doesNotMatch(pages.map((page) => page.headline).join("\n"), /誠摯邀請|負責人/);
});

test("zenCarouselPages keeps Hook → 情境 → 痛點 → 活動 → CTA", () => {
  const pages = zenCarouselPages({
    hook: "可以自己來？",
    name: "茶會",
    when: "9/24 19:00",
    where: "淡水校園",
    cta: "來坐一下",
  });
  assert.equal(pages[0]?.headline, "可以自己來？");
  assert.equal(pages[3]?.headline, "茶會");
  assert.match(pages[4]?.subhead ?? "", /19:00|淡水/);
  assert.equal(carouselPageLine(pages[0]!, 0), "第 1 頁 封面 Hook：可以自己來？");
});

test("carousel posters are 4:5 and keep the page headline", () => {
  const input = carouselPosterInput(
    { headline: "可以自己來？", subhead: "封面 Hook", body: "", visualNote: "封面" },
    0,
    { title: "茶會", name: "禪光", hook: "可以自己來？" },
  );
  assert.equal(input.width, 1080);
  assert.equal(input.height, 1350);
  const svg = directionPosterSvg(input);
  assert.match(svg, /可以自己來/);
  assert.match(svg, /height="1350"/);
  assert.match(svg, /data-turtle="龜龜"/);
  assert.doesNotMatch(svg, /temple|寺廟/);
});

test("carousel posters continue a pinned Drive photo", () => {
  const tea = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350"><rect x="140" y="420" width="220" height="400" fill="#1C2422"/></svg>`;
  const input = carouselPosterInput(
    { headline: "可以自己來？", subhead: "封面 Hook", body: "", visualNote: "封面" },
    0,
    {
      title: "茶會",
      name: "禪光",
      hook: "可以自己來？",
      look: { photoEmbed: tea, sourceCredit: "Google Drive / 2025 茶會現場" },
    },
  );
  assert.equal(input.photoEmbed, tea);
  const svg = directionPosterSvg(input);
  assert.match(svg, /data-source-photo="1"/);
  assert.match(svg, /Google Drive \/ 2025 茶會現場/);
});

test("studentCoverHeadline replaces an event-name cover", () => {
  assert.equal(studentCoverHeadline("茶會", "可以自己來？", "茶會"), "可以自己來？");
  assert.equal(studentCoverHeadline("可以自己來？", "可以自己來？", "茶會"), "可以自己來？");
});

test("attachCarouselAssets writes stills onto that campaign's carousel rows", () => {
  const rows: Array<{ kind: string; campaignId: string; title?: string; imageAssetId?: string; slideAssetIds?: string[] }> = [
    { kind: "story", campaignId: "c1", imageAssetId: "hero" },
    { kind: "carousel", campaignId: "c1", title: "主視覺 · 茶會", imageAssetId: "hero" },
    { kind: "carousel", campaignId: "c1", title: "Carousel · 茶會", imageAssetId: "hero" },
    { kind: "carousel", campaignId: "c2" },
  ];
  const next = attachCarouselAssets(rows, ["p0", "p1", "p2"], "c1");
  assert.equal(next[0]?.imageAssetId, "hero");
  assert.equal(next[1]?.imageAssetId, "hero");
  assert.equal(next[1]?.slideAssetIds, undefined);
  assert.equal(next[2]?.imageAssetId, "p0");
  assert.deepEqual(next[2]?.slideAssetIds, ["p0", "p1", "p2"]);
  assert.equal(next[3]?.slideAssetIds, undefined);
});

test("encodedCarouselIds ignores a lone hero still", () => {
  assert.deepEqual(encodedCarouselIds({ slideAssetIds: ["hero"] }), []);
  assert.deepEqual(encodedCarouselIds({ slideAssetIds: ["a", "b"] }), ["a", "b"]);
});
