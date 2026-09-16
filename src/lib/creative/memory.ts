import { sourceLabel } from "@/lib/studio/assets";
import type { AssetMeta, BrandKit } from "@/lib/studio/types";
import type { Campaign, ContentItem } from "./types";

export type CreativeMemoryResult = {
  id: string;
  kind: "asset" | "campaign" | "content";
  title: string;
  subtitle: string;
  provider: string;
  matchedBy: string[];
  assetId?: string;
  campaignId?: string;
  contentId?: string;
};

function terms(query: string) {
  return [...new Set(query.trim().toLowerCase().split(/[\s,，。／/]+/).filter(Boolean))];
}

function matches(haystack: string, needles: string[]) {
  const text = haystack.toLowerCase();
  return needles.filter((term) => text.includes(term));
}

export function searchCreativeMemory(
  query: string,
  input: { assets: AssetMeta[]; campaigns: Campaign[]; contentItems: ContentItem[] },
): CreativeMemoryResult[] {
  const needles = terms(query);
  if (!needles.length) return [];

  const assets = input.assets.flatMap((asset) => {
    const fields = [
      asset.name,
      asset.provenance?.label,
      asset.provenance?.collection,
      asset.analysis?.summary,
      asset.analysis?.studentFit,
      ...asset.tags,
      ...(asset.analysis?.subjects ?? []),
    ].filter(Boolean).join(" ");
    const found = matches(fields, needles);
    if (!found.length) return [];
    return [{
      id: `asset:${asset.id}`,
      kind: "asset" as const,
      title: asset.name,
      subtitle: asset.analysis?.summary || asset.tags.slice(0, 4).join("・") || "素材",
      provider: sourceLabel(asset.source),
      matchedBy: found,
      assetId: asset.id,
    }];
  });

  const campaigns = input.campaigns.flatMap((campaign) => {
    const fields = [
      campaign.name,
      campaign.type,
      campaign.oneLiner,
      campaign.description,
      campaign.theme,
      campaign.studentPain,
      campaign.location,
    ].join(" ");
    const found = matches(fields, needles);
    if (!found.length) return [];
    return [{
      id: `campaign:${campaign.id}`,
      kind: "campaign" as const,
      title: campaign.name,
      subtitle: `${campaign.type}・${campaign.eventDate}・${campaign.oneLiner}`,
      provider: "Campaign",
      matchedBy: found,
      campaignId: campaign.id,
    }];
  });

  const contentItems = input.contentItems.flatMap((item) => {
    const fields = [item.title, item.angle, item.type, item.status].join(" ");
    const found = matches(fields, needles);
    if (!found.length) return [];
    return [{
      id: `content:${item.id}`,
      kind: "content" as const,
      title: item.title,
      subtitle: `${item.type}・${item.angle}`,
      provider: "內容節奏",
      matchedBy: found,
      campaignId: item.campaignId,
      contentId: item.id,
    }];
  });

  return [...assets, ...campaigns, ...contentItems]
    .sort((a, b) => b.matchedBy.length - a.matchedBy.length || a.title.localeCompare(b.title, "zh-TW"))
    .slice(0, 30);
}

function list(values: string[] | undefined, fallback: string) {
  return values?.length ? values.join("、") : fallback;
}

export function buildBrandMemoryPrompt(brand: BrandKit) {
  const memory = brand.memory;
  return [
    memory?.mission ? `使命：${memory.mission}` : "",
    `核心學生：${list(memory?.audienceSegments, "淡江新生、住宿生、通勤生與最近感到壓力的學生")}`,
    `校園情境：${list(memory?.campusContexts, "課表、通勤、宿舍、人際與淡水天氣")}`,
    `時機：${list(memory?.seasonalMoments, "開學、期中、期末與社團活動期")}`,
    `內容支柱：${list(memory?.contentPillars, "活動、生活共鳴、社員故事與禪生活")}`,
    `辨識元素：${list(memory?.signatureElements, "三色光、龜龜與真實活動照片")}`,
    `已學到：${list(memory?.learnedPatterns, "先說學生生活，再介紹活動")}`,
  ].filter(Boolean).join("\n");
}

export function buildCreativeMemoryContext(input: {
  brand: BrandKit;
  assets: AssetMeta[];
  campaigns: Campaign[];
}) {
  const { brand, assets, campaigns } = input;
  const memory = brand.memory;
  const analyzed = assets.filter((asset) => asset.analysis);
  const recentCampaigns = [...campaigns]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5)
    .map((campaign) => `${campaign.name}（${campaign.type}；${campaign.theme || campaign.oneLiner}）`);
  const usefulAssets = [...analyzed]
    .sort((a, b) => (b.analysis?.analyzedAt ?? 0) - (a.analysis?.analyzedAt ?? 0))
    .slice(0, 6)
    .map((asset) => `${asset.name}［${sourceLabel(asset.source)}］：${asset.analysis?.summary}`);

  return [
    `社團使命：${memory?.mission || "把禪轉成淡江學生能理解的安定、陪伴與自我探索"}`,
    `核心學生：${list(memory?.audienceSegments, "淡江新生、住宿生、通勤生與最近感到壓力的學生")}`,
    `校園情境：${list(memory?.campusContexts, "課表、通勤、宿舍、人際與淡水天氣")}`,
    `重要時機：${list(memory?.seasonalMoments, "開學、期中、期末與社團活動期")}`,
    `內容支柱：${list(memory?.contentPillars, "活動、生活共鳴、社員故事與禪生活")}`,
    `品牌元素：${list(memory?.signatureElements, "三色光、龜龜與真實活動照片")}`,
    `已學到的規律：${list(memory?.learnedPatterns, "先說學生生活，再介紹活動")}`,
    `近期 Campaign：${recentCampaigns.length ? recentCampaigns.join("；") : "尚無"}`,
    `可參考素材：${usefulAssets.length ? usefulAssets.join("；") : "目前沒有完成 AI 分析的素材"}`,
  ].join("\n");
}

export function creativeMemoryStats(input: {
  assets: AssetMeta[];
  campaigns: Campaign[];
  contentItems: ContentItem[];
}) {
  return {
    sources: new Set(input.assets.map((asset) => asset.source)).size,
    assets: input.assets.length,
    analyzedAssets: input.assets.filter((asset) => asset.analysis).length,
    campaigns: input.campaigns.length,
    reusableContent: input.contentItems.filter((item) => item.status === "complete" || item.status === "published").length,
  };
}
