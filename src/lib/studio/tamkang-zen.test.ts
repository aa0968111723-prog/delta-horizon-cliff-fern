import assert from "node:assert/strict";
import test from "node:test";
import {
  generateZenVisualDirections,
  auditStudentPerspective,
  convertContentMultimodal,
} from "./zen-prompt-engine.ts";
import { analyzeZenImageVisual } from "./image-analyzer.ts";
import { DEFAULT_CAMPAIGNS, DEFAULT_SCHEDULED_POSTS, DEFAULT_CONNECTIONS } from "./campaign-seed.ts";

test("generateZenVisualDirections returns 3 distinct directions with campus context", () => {
  const directions = generateZenVisualDirections("浮游禪光 迎新茶會");
  assert.equal(directions.length, 3);
  assert.equal(directions[0].id, "direction-a");
  assert.equal(directions[1].id, "direction-b");
  assert.equal(directions[2].id, "direction-c");

  // Check visual components
  assert.ok(directions[0].imagePrompt.includes("hands holding a warm"));
  assert.ok(directions[0].colorPalette.some((c) => c.name.includes("暖宣紙")));
  assert.ok(directions[0].headline.includes("最近是不是"));
  assert.ok(directions[1].headline.includes("安靜的晚上"));
  assert.ok(directions[2].headline.includes("快樂嗎"));
});

test("auditStudentPerspective checks religious tone and student resonance", () => {
  // Good student-friendly copy
  const good = auditStudentPerspective({
    headline: "最近是不是連休息都覺得有罪惡感？",
    caption: "淡江開學第三週，待辦清單變長。週四 09/24 18:30 活動中心，來茶會放空一下。點主頁連結預約席位。",
    cta: "預約茶會席位",
  });
  assert.equal(good.isTooReligious, false);
  assert.equal(good.isTooFormal, false);
  assert.ok(good.studentScore >= 80);

  // Overly religious and formal copy
  const bad = auditStudentPerspective({
    headline: "淡江大學禪學社誠摯邀請您參與佛法大典",
    caption: "特此舉辦超度與因果業障解析講座，深度的靈性之旅，綻放生命的璀璨華章。",
    cta: "恭請蒞臨",
  });
  assert.equal(bad.isTooReligious, true);
  assert.equal(bad.isTooFormal, true);
  assert.ok(bad.studentScore < 60);
  assert.ok(bad.suggestions.some((s) => s.includes("宗教")));
});

test("convertContentMultimodal generates carousel, story and reels scripts", () => {
  const converted = convertContentMultimodal({
    topic: "浮游禪光 茶會",
    headline: "最近是不是連休息都覺得有罪惡感？",
    caption: "",
    date: "09/24 (四) 18:30",
    location: "淡江活動中心",
  });

  assert.equal(converted.carousel.pages.length, 5);
  assert.equal(converted.carousel.pages[0].role, "Hook 封面");
  assert.equal(converted.story.cards.length, 3);
  assert.ok(converted.threads.post.includes("淡江禪學社"));
  assert.ok(converted.lineMessage.text.includes("浮游禪光"));
  assert.equal(converted.reelsScript.scenes.length, 5);
  assert.ok(converted.reelsScript.scenes[0].visual.includes("克難坡"));
});

test("analyzeZenImageVisual extracts palette, hierarchy and adaptation options", () => {
  const analysis = analyzeZenImageVisual("茶會手沖陶杯.jpg", "photo");
  assert.ok(analysis.brandFitScore >= 90);
  assert.ok(analysis.colorPalette.some((c) => c.name === "淡水夜青"));
  assert.equal(analysis.adaptationActions.length, 5);
  assert.ok(analysis.adaptationActions.some((a) => a.id === "make-carousel"));
});

test("campaign-seed contains default Tamkang Zen Club campaigns and connections", () => {
  assert.ok(DEFAULT_CAMPAIGNS.length >= 2);
  assert.equal(DEFAULT_CAMPAIGNS[0].name, "09/24 浮游禪光");
  assert.equal(DEFAULT_SCHEDULED_POSTS[0].campaignId, "camp_floating_light_0924");
  assert.equal(DEFAULT_CONNECTIONS.length, 3);
  assert.ok(DEFAULT_CONNECTIONS.every((c) => c.status === "demo"));
  assert.ok(DEFAULT_CONNECTIONS.some((c) => c.id === "google-drive"));
  assert.ok(DEFAULT_CONNECTIONS.some((c) => c.id === "canva"));
  assert.ok(DEFAULT_CONNECTIONS.some((c) => c.id === "instagram"));
});
