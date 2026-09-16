import assert from "node:assert/strict";
import test from "node:test";
import { toBriefInput } from "./payload.ts";
import { createEmptyBrand } from "../studio/brand.ts";
import { emptyBrief } from "../studio/brief.ts";
import { migrateAsset } from "../studio/assets.ts";
import type { Campaign } from "../creative/types.ts";

test("campaign payload injects campus contexts, style refs, and attributable assets", () => {
  const brand = createEmptyBrand("淡江大學禪學社");
  brand.memory = {
    mission: "讓淡江學生在忙亂裡找到空間",
    audienceSegments: ["住宿生"],
    campusContexts: ["淡水雨天", "期中報告"],
    seasonalMoments: ["期中"],
    contentPillars: ["生活共鳴"],
    signatureElements: ["三色光"],
    learnedPatterns: ["先寫學生生活"],
    updatedAt: 1,
  };
  const brief = emptyBrief();
  brief.eventName = "浮游禪光";
  brief.audience = "剛開學的淡江學生";
  const payload = toBriefInput(brief, brand, {
    assets: [migrateAsset({
      id: "a1",
      name: "夜間茶會社員照片",
      source: "google-drive",
      tags: ["茶會"],
      analysis: {
        summary: "暖光下自然聊天",
        subjects: [],
        colors: [],
        lighting: "",
        composition: "",
        textHierarchy: "",
        brandFit: "",
        studentFit: "",
        stopPower: "",
        risks: [],
        recommendations: [],
        suggestedTags: [],
        analyzedAt: 2,
      },
      createdAt: 1,
    })],
    campaigns: [{
      id: "c1",
      name: "浮游禪光茶會",
      type: "茶會",
      eventDate: "2026-09-24",
      eventTime: "19:00",
      location: "淡江校園",
      oneLiner: "下課後喘口氣",
      description: "",
      theme: "忙亂裡留空間",
      studentPain: "期中報告很多",
      cta: "找朋友一起來",
      registrationUrl: "",
      assetIds: [],
      createdAt: 1,
      updatedAt: 3,
    } satisfies Campaign],
    styleReferences: [{ provider: "Canva", collection: "浮游禪光", title: "主視覺", notes: "夜晚三色光" }],
    instagramHashtags: ["#淡江禪學社"],
  });

  assert.match(payload.brandMemory ?? "", /淡水雨天/);
  assert.match(payload.brandMemory ?? "", /夜間茶會社員照片［Google Drive］/);
  assert.match(payload.brandMemory ?? "", /浮游禪光茶會/);
  assert.match(payload.brandMemory ?? "", /Canva／浮游禪光/);
  assert.match(payload.brandMemory ?? "", /#淡江禪學社/);
});
