import type { AssetMeta, Project, SourceRef } from "../studio/types.ts";
import type { ClubCampaign, IgMemoryPost, MemoryItem, MemorySource, SearchHit } from "./types.ts";

function blobOf(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

/** 把口語問句展開成可對到記憶的詞，不靠檔名。 */
export function expandQuery(query: string) {
  const extras: string[] = [];
  if (/茶會|喝茶/.test(query)) extras.push("茶會", "杯子", "夜間");
  if (/晚上|夜間/.test(query)) extras.push("夜間", "茶會", "三色光");
  if (/龜/.test(query)) extras.push("龜龜", "吉祥物");
  if (/浮游|禪光/.test(query)) extras.push("浮游禪光", "三色光");
  if (/主視覺|適合 ig|停留/.test(query)) extras.push("海報", "三色光", "夜間", "茶會");
  if (/同學|互動/.test(query)) extras.push("互動", "茶會", "社員");
  if (/淡水|河岸|通勤/.test(query)) extras.push("淡水", "黃昏", "捷運");
  if (/校園|圖書館/.test(query)) extras.push("淡江校園", "圖書館");
  if (/招生/.test(query)) extras.push("招生", "Carousel");
  return [query, ...extras].join(" ");
}

function score(text: string, query: string) {
  const expanded = expandQuery(query).toLowerCase();
  const tokens = [...new Set(expanded.split(/\s+/).filter(Boolean))];
  let n = 0;
  for (const token of tokens) {
    if (text.includes(token)) n += 3;
  }
  const raw = query.trim().toLowerCase();
  if (raw && text.includes(raw)) n += 8;
  return n;
}

type Ranked = SearchHit & { rank: number };

export function searchCreative(input: {
  query: string;
  memory: MemoryItem[];
  assets: AssetMeta[];
  campaigns: ClubCampaign[];
  igPosts: IgMemoryPost[];
  projects: Project[];
}): SearchHit[] {
  const q = input.query.trim();
  if (!q) return [];
  const hits: Ranked[] = [];

  for (const item of input.memory) {
    const text = blobOf([item.title, item.summary, item.sourceLabel, item.kind, ...(item.tags ?? [])]);
    const s = score(text, q);
    if (s <= 0) continue;
    hits.push({
      id: item.id,
      title: item.title,
      summary: item.summary,
      source: item.source,
      sourceLabel: item.sourceLabel,
      kind: item.kind,
      assetId: item.assetId,
      thumbUrl: item.thumbUrl,
      href: item.openUrl,
      rank: s,
    });
  }

  for (const post of input.igPosts) {
    const text = blobOf([post.caption, post.mediaType, post.analysis?.theme, post.analysis?.hook]);
    const s = score(text, q) + (post.saves && post.saves > 30 ? 4 : 0);
    if (s <= 0) continue;
    hits.push({
      id: post.id,
      title: post.caption.split("\n")[0] ?? "IG 貼文",
      summary: post.analysis?.direction ?? post.caption.slice(0, 80),
      source: "instagram",
      sourceLabel: `Instagram / ${new Date(post.takenAt).toISOString().slice(0, 10)}`,
      kind: post.mediaType,
      assetId: post.assetIds[0],
      href: "/ig",
      thumbUrl: post.mediaUrl,
      rank: s,
    });
  }

  for (const campaign of input.campaigns) {
    const text = blobOf([
      campaign.name,
      campaign.oneLiner,
      campaign.fullIntro,
      campaign.theme,
      campaign.location,
      campaign.studentPain,
    ]);
    const s = score(text, q);
    if (s <= 0) continue;
    hits.push({
      id: campaign.id,
      title: campaign.name,
      summary: campaign.oneLiner,
      source: "brand",
      sourceLabel: "活動",
      kind: "campaign",
      assetId: campaign.coverAssetId ?? undefined,
      href: `/campaigns/${campaign.id}`,
      rank: s,
    });
  }

  for (const project of input.projects) {
    const text = blobOf([project.name, project.copy.headline, project.copy.caption, project.brief.eventName]);
    const s = score(text, q);
    if (s <= 0) continue;
    hits.push({
      id: project.id,
      title: project.name,
      summary: project.copy.headline.replace(/\n/g, " "),
      source: "generated",
      sourceLabel: "AI / 作品",
      kind: project.contentKind,
      href: `/studio/${project.id}`,
      rank: s,
    });
  }

  for (const asset of input.assets) {
    const text = blobOf([asset.name, asset.category, ...(asset.tags ?? []), asset.licenseNotes]);
    const s = score(text, q);
    if (s <= 0) continue;
    if (hits.some((hit) => hit.assetId === asset.id)) continue;
    hits.push({
      id: asset.id,
      title: asset.name,
      summary: asset.tags.join(" · "),
      source: asset.source === "generated" ? "generated" : asset.source === "canva" ? "canva" : asset.source === "drive" ? "drive" : asset.source === "instagram" ? "instagram" : asset.source === "upload" ? "upload" : "brand",
      sourceLabel: asset.source === "seed" ? "社團記憶" : asset.source,
      kind: asset.category,
      assetId: asset.id,
      href: "/assets",
      rank: s,
    });
  }

  return hits
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 36)
    .map(({ rank: _rank, ...hit }) => hit);
}

const SOURCE_ORDER: MemorySource[] = ["drive", "canva", "instagram", "generated", "brand", "upload"];

export function groupHits(hits: SearchHit[]) {
  return SOURCE_ORDER.map((source) => ({ source, items: hits.filter((hit) => hit.source === source) })).filter(
    (group) => group.items.length,
  );
}

export function gatherStatusLine(hitCount: number, liveSources: string[]) {
  const labels = liveSources.map((id) =>
    id === "google-drive" ? "Drive" : id === "canva" ? "Canva" : id === "instagram" ? "Instagram" : id,
  );
  if (labels.length) return `已搜 ${labels.join("、")}，找到 ${hitCount} 個相關素材`;
  if (hitCount) return `找到 ${hitCount} 個相關素材。根據過去內容生成 3 個方向`;
  return "先用品牌記憶生成 3 個方向";
}

export function sourceGroupLabel(source: MemorySource) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI 生成";
  if (source === "brand") return "品牌／活動";
  return "本機上傳";
}

export function selectSourcesForPack(
  picked: Array<Pick<SearchHit, "id" | "title" | "source" | "sourceLabel">>,
  live: Array<Pick<SearchHit, "id" | "title" | "source" | "sourceLabel">>,
  extra: SourceRef[] = [],
): SourceRef[] {
  const out: SourceRef[] = [];
  const seen = new Set<string>();
  const push = (item: SourceRef) => {
    const key = `${item.source}:${item.id ?? item.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };
  extra.forEach(push);
  for (const hit of picked) {
    push({ source: hit.source, label: hit.sourceLabel || hit.title, id: hit.id.slice(0, 160) });
  }
  for (const hit of live.slice(0, 12)) {
    push({ source: hit.source, label: hit.sourceLabel || hit.title, id: hit.id.slice(0, 160) });
  }
  return out.slice(0, 24);
}
