import assert from "node:assert/strict";
import test from "node:test";
import { localImageAnalysis } from "./image-local.ts";

test("淡水河傍晚 reads as a Tamkang-fit campus hero, labeled as local rules", () => {
  const analysis = localImageAnalysis({
    name: "淡水河傍晚",
    category: "campus",
    tags: ["淡水", "夕陽", "背景", "主視覺"],
    licenseNotes: "社團自製底圖，可作主視覺或背景。",
    source: "seed",
  });
  assert.match(analysis.summary, /本機規則/);
  assert.equal(analysis.fitsTku, true);
  assert.equal(analysis.tooReligious, false);
  assert.equal(analysis.tooAi, false);
  assert.equal(analysis.tooOld, false);
  assert.match(analysis.studentFit, /淡江|淡水/);
  assert.match(analysis.captionIdea, /坡|晚上|想什麼/);
  assert.match(analysis.stylePrompt, /Tamsui|dusk/i);
  assert.equal(analysis.nextSteps.some((step) => step.includes("主視覺")), true);
});

test("窗邊光 is a classroom scene, not a religious hall", () => {
  const analysis = localImageAnalysis({
    name: "窗邊光與坐墊",
    category: "photo",
    tags: ["社課", "坐墊", "窗邊", "白天"],
    source: "seed",
  });
  assert.equal(analysis.tooReligious, false);
  assert.equal(analysis.fitsTku, true);
  assert.match(analysis.content, /坐墊|窗邊/);
  assert.match(analysis.captionIdea, /坐下來/);
});

test("龜龜 and 三色光 are stamps, not full-bleed heroes", () => {
  const gugu = localImageAnalysis({ name: "龜龜", category: "mascot", tags: ["龜龜"], source: "seed" });
  assert.match(gugu.summary, /龜龜/);
  assert.equal(gugu.nextSteps.some((step) => /標誌|主視覺|限動/.test(step)), true);

  const logo = localImageAnalysis({ name: "三色光標誌", category: "logo", tags: ["logo", "三色光"], source: "seed" });
  assert.match(logo.summary, /標誌/);
  assert.equal(logo.nextSteps.some((step) => step.includes("不要當主視覺")), true);
});

test("蓮花／佛像 posters are flagged too religious", () => {
  const analysis = localImageAnalysis({
    name: "法會海報",
    category: "poster",
    tags: ["蓮花", "佛像", "金身"],
  });
  assert.equal(analysis.tooReligious, true);
  assert.equal(analysis.fitsTku, false);
  assert.match(analysis.brandFit, /宗教/);
});

test("generated images pick up the AI-feel flag without inventing pixels", () => {
  const analysis = localImageAnalysis({
    name: "對稱光暈人像",
    category: "illustration",
    tags: ["對稱光暈"],
    source: "generated",
  });
  assert.equal(analysis.tooAi, true);
  assert.match(analysis.summary, /本機規則|沒有真的看像素/);
});

test("untitled uploads admit the rules cannot see pixels", () => {
  const analysis = localImageAnalysis({});
  assert.match(analysis.summary, /本機規則/);
  assert.match(analysis.summary, /沒有真的看像素|還沒有素材名稱/);
  assert.equal(analysis.nextSteps.some((step) => step.includes("標分類")), true);
});
