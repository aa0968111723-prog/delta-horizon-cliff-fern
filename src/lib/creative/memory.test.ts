import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyBrand } from "../studio/brand.ts";
import { migrateAsset } from "../studio/assets.ts";
import { buildCreativeMemoryContext, creativeMemoryStats, searchCreativeMemory, styleReferencePrompt } from "./memory.ts";
import type { Campaign, ContentItem } from "./types.ts";

const brand = createEmptyBrand("淡江大學禪學社");
brand.memory = {
  mission: "讓淡江學生在忙亂裡找到空間",
  audienceSegments: ["住宿生", "通勤生"],
  campusContexts: ["淡水雨天", "期中報告"],
  seasonalMoments: ["期中"],
  contentPillars: ["生活共鳴", "活動宣傳"],
  signatureElements: ["三色光", "龜龜"],
  learnedPatterns: ["先寫學生生活"],
  updatedAt: 1,
};

const asset = migrateAsset({
  id: "asset-tea",
  name: "夜間茶會社員照片",
  source: "google-drive",
  category: "people",
  tags: ["茶會", "社員互動"],
  analysis: {
    summary: "同學在暖光下自然聊天，適合晚間茶會宣傳。",
    subjects: ["三位學生", "茶杯"],
    colors: ["暖金"],
    lighting: "暖光",
    composition: "橫向群像",
    textHierarchy: "無文字",
    brandFit: "符合",
    studentFit: "有真實社團生活感",
    stopPower: "人物互動清楚",
    risks: [],
    recommendations: ["裁成 Story"],
    suggestedTags: ["夜間"],
    analyzedAt: 2,
  },
  createdAt: 1,
});

const campaign: Campaign = {
  id: "campaign-tea",
  name: "浮游禪光茶會",
  type: "茶會",
  eventDate: "2026-09-24",
  eventTime: "19:00",
  location: "淡江校園",
  oneLiner: "下課後喘口氣",
  description: "一起坐坐",
  theme: "忙亂裡留空間",
  studentPain: "期中報告很多",
  cta: "找朋友一起來",
  registrationUrl: "",
  assetIds: [],
  createdAt: 1,
  updatedAt: 3,
};

const content: ContentItem = {
  id: "content-tea",
  campaignId: campaign.id,
  title: "期中情緒共鳴",
  angle: "通勤後先喘口氣",
  type: "Carousel",
  status: "complete",
  plannedAt: "2026-09-20",
  publishedAt: null,
  projectId: null,
  createdAt: 1,
  updatedAt: 1,
};

test("searchCreativeMemory searches assets, campaigns and content together", () => {
  const results = searchCreativeMemory("期中 茶會", {
    assets: [asset],
    campaigns: [campaign],
    contentItems: [content],
  });
  assert.deepEqual(new Set(results.map((item) => item.kind)), new Set(["asset", "campaign", "content"]));
  assert.equal(results[0]?.matchedBy.length, 2);
  assert.equal(results.find((item) => item.kind === "asset")?.provider, "Google Drive");
});

test("buildCreativeMemoryContext includes brand lessons and attributable assets", () => {
  const context = buildCreativeMemoryContext({ brand, assets: [asset], campaigns: [campaign] });
  assert.match(context, /住宿生、通勤生/);
  assert.match(context, /先寫學生生活/);
  assert.match(context, /夜間茶會社員照片［Google Drive］/);
  assert.match(context, /浮游禪光茶會/);
});

test("creativeMemoryStats counts analyzed and reusable memory", () => {
  assert.deepEqual(
    creativeMemoryStats({ assets: [asset], campaigns: [campaign], contentItems: [content] }),
    { sources: 1, assets: 1, analyzedAssets: 1, campaigns: 1, reusableContent: 1, externalItems: 0 },
  );
});

test("searchCreativeMemory includes Canva designs with provenance", () => {
  const results = searchCreativeMemory("茶會 Canva", {
    assets: [],
    campaigns: [],
    contentItems: [],
    externalItems: [{
      id: "DAFtea",
      provider: "canva",
      title: "歷屆茶會主視覺",
      mimeType: "canva/design",
      isFolder: false,
      modifiedAt: "",
      webUrl: "https://www.canva.com/design/DAFtea/edit",
      thumbnailUrl: "",
      parentId: "canva",
      snippet: "夜間茶會",
      syncedAt: 1,
      collection: "茶會",
    }],
  });
  assert.equal(results[0]?.provider, "Canva");
  assert.equal(results[0]?.providerKind, "canva");
  assert.equal(results[0]?.webUrl?.includes("canva.com"), true);
});

test("searchCreativeMemory includes Instagram content memory", () => {
  const results = searchCreativeMemory("淡江禪學社", {
    assets: [],
    campaigns: [],
    contentItems: [],
    externalItems: [{
      id: "ig-1",
      provider: "instagram",
      title: "最近是不是很久沒有好好坐下來？",
      mimeType: "IMAGE",
      isFolder: false,
      modifiedAt: "",
      webUrl: "https://www.instagram.com/p/abc/",
      thumbnailUrl: "",
      parentId: "instagram",
      snippet: "#淡江禪學社 夜間茶會",
      syncedAt: 1,
      collection: "IG 內容記憶",
    }],
  });
  assert.equal(results[0]?.provider, "Instagram");
  assert.equal(results[0]?.providerKind, "instagram");
});

test("style references are appended to Brand Memory prompts", () => {
  assert.match(
    styleReferencePrompt([{ provider: "Canva", collection: "浮游禪光", title: "主視覺", notes: "夜晚三色光" }]),
    /Canva／浮游禪光/,
  );
});

test("searchCreativeMemory finds campus context like 淡水雨天 in Brand Memory", () => {
  const results = searchCreativeMemory("淡水雨天", {
    assets: [],
    campaigns: [],
    contentItems: [],
    brand,
  });
  assert.equal(results.some((item) => item.kind === "memory" && item.title === "淡水雨天"), true);
  assert.equal(results[0]?.provider, "Brand Memory");
});

test("searchCreativeMemory includes Brand Memory lessons and Copy Pack hooks", () => {
  const results = searchCreativeMemory("先寫學生生活 坐下來 三色光", {
    assets: [],
    campaigns: [],
    contentItems: [],
    brand,
    projects: [{
      id: "proj-copy",
      name: "浮游禪光",
      createdAt: 1,
      updatedAt: 1,
      brandId: "b1",
      templateId: "editorial",
      activeFormatId: "feed-portrait",
      status: "creating",
      brief: {
        product: "",
        eventName: "",
        schedule: "",
        location: "",
        offer: "",
        audience: "",
        goal: "awareness",
        features: "",
        style: "",
        notes: "",
        deliverables: { post: true, story: false, carousel: false, reels: false },
      },
      copy: {
        eyebrow: "",
        headline: "",
        subhead: "",
        body: "",
        cta: "",
        handle: "",
        caption: "",
        hashtags: [],
        altText: "",
      },
      plan: {
        campaignName: "浮游禪光",
        concept: "",
        insight: "",
        hook: "最近是不是很久沒有好好坐下來？",
        visualTheme: "",
        visualDirection: "",
        templateId: "editorial",
        colorMood: "",
        eyebrow: "",
        headline: "",
        subhead: "",
        body: "",
        cta: "",
        captions: [],
        hashtags: [],
        storyBeats: [],
        carouselPages: [],
        assetNeeds: [],
        checklist: [],
        altText: "",
        qaNotes: [],
        copyPack: {
          variants: [{
            tone: "學生版",
            hook: "最近是不是很久沒有好好坐下來？",
            body: "課表先放一下",
            cta: "保留這個晚上",
            hashtags: ["#淡江禪學社"],
          }],
          studentReview: [],
          revisedCaption: "",
          threads: "",
          line: "",
          storyFrames: [],
          carouselPages: [],
          reelsScript: [],
          generatedAt: 1,
          source: "mock",
        },
        generatedAt: 1,
        source: "mock",
      },
      artboards: {},
      slides: {},
      slideIndex: 0,
      snapshots: [],
      planVersions: [],
      exports: [],
    }],
    styleReferences: [{
      id: "canva:1",
      provider: "Canva",
      collection: "浮游禪光",
      title: "歷屆茶會主視覺",
      notes: "夜晚三色光",
    }],
  });
  assert.equal(results.some((item) => item.kind === "memory" && item.title.includes("先寫學生生活")), true);
  assert.equal(results.some((item) => item.kind === "copy"), true);
  assert.equal(results.some((item) => item.kind === "style"), true);
});

test("searchCreativeMemory includes synced external references with attribution", () => {
  const results = searchCreativeMemory("歷屆 茶會", {
    assets: [],
    campaigns: [],
    contentItems: [],
    externalItems: [{
      id: "drive-1",
      provider: "google-drive",
      title: "歷屆茶會企劃",
      mimeType: "application/vnd.google-apps.document",
      isFolder: false,
      modifiedAt: "",
      webUrl: "",
      thumbnailUrl: "",
      parentId: "root",
      snippet: "夜間茶會流程",
      syncedAt: 1,
    }],
  });
  assert.equal(results[0]?.provider, "Google Drive");
  assert.equal(results[0]?.kind, "external");
  assert.equal(results[0]?.externalId, "drive-1");
});
