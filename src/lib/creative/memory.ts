import { sourceLabel } from "../studio/assets.ts";
import type { AssetMeta, BrandKit, Project } from "../studio/types.ts";
import type { ExternalMemoryItem } from "../connections/types.ts";
import type { Campaign, ContentItem } from "./types";

export type CreativeMemoryKind = "asset" | "campaign" | "content" | "external" | "memory" | "copy" | "style";

export type CreativeMemoryResult = {
  id: string;
  kind: CreativeMemoryKind;
  title: string;
  subtitle: string;
  provider: string;
  matchedBy: string[];
  assetId?: string;
  campaignId?: string;
  contentId?: string;
  projectId?: string;
  externalId?: string;
  webUrl?: string;
  copyText?: string;
  providerKind?: "google-drive" | "canva" | "instagram";
};

export type StyleMemoryRef = {
  id: string;
  provider: string;
  collection: string;
  title: string;
  notes: string;
  webUrl?: string;
};

function terms(query: string) {
  return [...new Set(query.trim().toLowerCase().split(/[\s,，。／/]+/).filter(Boolean))];
}

function matches(haystack: string, needles: string[]) {
  const text = haystack.toLowerCase();
  return needles.filter((term) => text.includes(term));
}

function rank(results: CreativeMemoryResult[], query: string) {
  const phrase = query.trim().toLowerCase();
  return results.sort((a, b) => {
    const aPhrase = Number(a.title.toLowerCase().includes(phrase) || a.subtitle.toLowerCase().includes(phrase));
    const bPhrase = Number(b.title.toLowerCase().includes(phrase) || b.subtitle.toLowerCase().includes(phrase));
    return bPhrase - aPhrase || b.matchedBy.length - a.matchedBy.length || a.title.localeCompare(b.title, "zh-TW");
  });
}

export function searchCreativeMemory(
  query: string,
  input: {
    assets: AssetMeta[];
    campaigns: Campaign[];
    contentItems: ContentItem[];
    externalItems?: ExternalMemoryItem[];
    brand?: BrandKit;
    projects?: Project[];
    styleReferences?: StyleMemoryRef[];
  },
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

  const externalItems = (input.externalItems ?? []).flatMap((item) => {
    const provider = item.provider === "google-drive"
      ? "Google Drive"
      : item.provider === "canva"
        ? "Canva"
        : "Instagram";
    const fields = [
      item.title,
      item.mimeType,
      item.snippet,
      item.collection,
      item.sourceDate,
      item.parentId,
      provider,
      item.provider,
    ].join(" ");
    const found = matches(fields, needles);
    if (!found.length) return [];
    return [{
      id: `external:${item.provider}:${item.id}`,
      kind: "external" as const,
      title: item.title,
      subtitle: item.snippet || item.collection || item.mimeType || "外部來源",
      provider,
      matchedBy: found,
      externalId: item.id,
      webUrl: item.webUrl,
      providerKind: item.provider,
    }];
  });

  const memoryItems = (() => {
    const brand = input.brand;
    if (!brand?.memory) return [] as CreativeMemoryResult[];
    const rows: { title: string; subtitle: string }[] = [
      { title: brand.memory.mission, subtitle: "Brand Memory・使命" },
      { title: brand.voice, subtitle: "Brand Memory・語氣" },
      ...brand.slogans.map((item) => ({ title: item, subtitle: "Brand Memory・標語" })),
      ...brand.memory.audienceSegments.map((item) => ({ title: item, subtitle: "Brand Memory・核心學生" })),
      ...brand.memory.campusContexts.map((item) => ({ title: item, subtitle: "Brand Memory・校園情境" })),
      ...brand.memory.seasonalMoments.map((item) => ({ title: item, subtitle: "Brand Memory・時機" })),
      ...brand.memory.contentPillars.map((item) => ({ title: item, subtitle: "Brand Memory・內容支柱" })),
      ...brand.memory.signatureElements.map((item) => ({ title: item, subtitle: "Brand Memory・辨識元素" })),
      ...brand.memory.learnedPatterns.map((item) => ({ title: item, subtitle: "Brand Memory・已學到" })),
      { title: brand.imageStyle?.mood, subtitle: "Brand Memory・畫面情緒" },
      { title: brand.imageStyle?.do, subtitle: "Brand Memory・畫面該有" },
      { title: brand.imageStyle?.dont, subtitle: "Brand Memory・畫面不要" },
    ];
    return rows.flatMap((row, index) => {
      const found = matches(`${row.title} ${row.subtitle} Brand Memory`, needles);
      if (!found.length || !row.title) return [];
      return [{
        id: `memory:${index}:${row.title}`,
        kind: "memory" as const,
        title: row.title,
        subtitle: row.subtitle,
        provider: "Brand Memory",
        matchedBy: found,
      }];
    });
  })();

  const copyItems = (input.projects ?? []).flatMap((project) => {
    const pack = project.plan?.copyPack;
    const variants = pack?.variants ?? [];
    const captions = project.plan?.captions ?? [];
    const rows = [
      ...variants.map((variant) => ({
        title: variant.hook,
        subtitle: `${project.name}・${variant.tone}`,
        copyText: `${variant.body}\n\n${variant.cta}\n\n${variant.hashtags.join(" ")}`,
      })),
      ...captions.map((caption) => ({
        title: caption.text.split("\n")[0] || project.name,
        subtitle: `${project.name}・${caption.style}`,
        copyText: caption.text,
      })),
    ];
    return rows.flatMap((row, index) => {
      const found = matches(`${row.title} ${row.subtitle} ${row.copyText} Copy`, needles);
      if (!found.length) return [];
      return [{
        id: `copy:${project.id}:${index}`,
        kind: "copy" as const,
        title: row.title,
        subtitle: row.subtitle,
        provider: "Copy Pack",
        matchedBy: found,
        projectId: project.id,
        copyText: row.copyText,
      }];
    });
  });

  const styleItems = (input.styleReferences ?? []).flatMap((item) => {
    const found = matches(`${item.title} ${item.collection} ${item.notes} ${item.provider} 風格`, needles);
    if (!found.length) return [];
    return [{
      id: `style:${item.id}`,
      kind: "style" as const,
      title: item.title,
      subtitle: `${item.provider}／${item.collection}｜${item.notes}`,
      provider: item.provider,
      matchedBy: found,
      webUrl: item.webUrl,
    }];
  });

  return rank([...assets, ...campaigns, ...contentItems, ...externalItems, ...memoryItems, ...copyItems, ...styleItems], query)
    .slice(0, 36);
}

function list(values: string[] | undefined, fallback: string) {
  return values?.length ? values.join("、") : fallback;
}

export function styleReferencePrompt(
  references: { provider: string; collection: string; title: string; notes: string }[] | undefined,
) {
  if (!references?.length) return "";
  return `風格參考：${references.slice(0, 6).map((item) => `${item.provider}／${item.collection}「${item.title}」${item.notes}`).join("；")}`;
}

export function buildBrandMemoryPrompt(
  brand: BrandKit,
  styleReferences?: { provider: string; collection: string; title: string; notes: string }[],
) {
  const memory = brand.memory;
  return [
    memory?.mission ? `使命：${memory.mission}` : "",
    `核心學生：${list(memory?.audienceSegments, "淡江新生、住宿生、通勤生與最近感到壓力的學生")}`,
    `校園情境：${list(memory?.campusContexts, "課表、通勤、宿舍、人際與淡水天氣")}`,
    `時機：${list(memory?.seasonalMoments, "開學、期中、期末與社團活動期")}`,
    `內容支柱：${list(memory?.contentPillars, "活動、生活共鳴、社員故事與禪生活")}`,
    `辨識元素：${list(memory?.signatureElements, "三色光、龜龜與真實活動照片")}`,
    `已學到：${list(memory?.learnedPatterns, "先說學生生活，再介紹活動")}`,
    styleReferencePrompt(styleReferences),
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
  externalItems?: ExternalMemoryItem[];
}) {
  return {
    sources: new Set([
      ...input.assets.map((asset) => asset.source),
      ...(input.externalItems ?? []).map((item) => item.provider),
    ]).size,
    assets: input.assets.length,
    analyzedAssets: input.assets.filter((asset) => asset.analysis).length,
    campaigns: input.campaigns.length,
    reusableContent: input.contentItems.filter((item) => item.status === "complete" || item.status === "published").length,
    externalItems: input.externalItems?.length ?? 0,
  };
}
