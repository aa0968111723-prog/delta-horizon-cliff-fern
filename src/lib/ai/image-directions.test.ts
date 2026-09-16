import assert from "node:assert/strict";
import test from "node:test";
import { applyImageTweak, proposeVisualDirections, promptFromVisionAction, VISION_ACTIONS } from "./image-directions.ts";

test("proposeVisualDirections always returns A/B/C with prompts", () => {
  const dirs = proposeVisualDirections("我要宣傳茶會", "4:5");
  assert.equal(dirs.length, 3);
  assert.ok(dirs.every((d) => d.imagePrompt.length > 20));
  assert.ok(dirs.every((d) => d.concept.length > 8));
  assert.ok(dirs[0]?.imagePrompt.includes("tea") || dirs[0]?.concept.includes("茶"));
  assert.ok(dirs.some((d) => /龜龜|turtle/i.test(`${d.title}${d.imagePrompt}`)));
});

test("applyImageTweak changes composition without dropping the base prompt", () => {
  const base = "tea gathering at Tamkang";
  const next = applyImageTweak(base, "mood-night");
  assert.ok(next.startsWith(base));
  assert.ok(next.includes("Tamsui night"));
});

test("vision actions cover story carousel reels", () => {
  const labels = VISION_ACTIONS.map((a) => a.label).join(" ");
  assert.ok(labels.includes("限動"));
  assert.ok(labels.includes("Carousel"));
  assert.ok(labels.includes("Reels"));
  const analysis = {
    content: "night tea",
    color: "sage",
    composition: "side face",
    brand: "turtle",
  };
  const similar = promptFromVisionAction("similar", analysis);
  assert.ok(similar.includes("sibling"));
  const story = promptFromVisionAction("story", analysis);
  assert.ok(story.includes("9:16"));
  assert.ok(/story/i.test(story));
  const carousel = promptFromVisionAction("carousel", analysis);
  assert.ok(/carousel/i.test(carousel));
  assert.ok(carousel.includes("4:5"));
});
