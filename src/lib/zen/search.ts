import { driveQueryEscape } from "../connect/escape.ts";
import type { AssetMeta, ClubCampaign, IgMemoryPost, Project, RemoteFile } from "../studio/types.ts";

/** Natural-language aliases so search is not filename-only. */
const ALIASES: Array<{ keys: string[]; extra: string[] }> = [
  { keys: ["茶會", "茶"], extra: ["茶", "晚上", "杯子", "圍坐"] },
  { keys: ["龜龜", "龜"], extra: ["龜龜", "角色", "吉祥物"] },
  { keys: ["浮游禪光", "禪光", "浮游"], extra: ["浮游禪光", "燈", "三色光", "夜晚"] },
  { keys: ["晚上", "夜晚", "夜"], extra: ["晚上", "夜", "暮色", "淡水"] },
  { keys: ["主視覺", "海報", "適合 IG"], extra: ["三色光", "主視覺", "海報", "ig", "留白"] },
  { keys: ["招生", "招新"], extra: ["招新", "迎新", "新生"] },
  { keys: ["同學", "互動", "很多同學"], extra: ["同學", "互動", "朋友", "圍坐"] },
];

const FILLER =
  /^(找|幫我|以前|有|很多|的|一個|一場|下週|照片|檔案|素材|文宣|相關|請|可以|嗎|做|新的|宣傳|給我|看看)$/;

const FILLER_SPLIT =
  /找以前|幫我找|幫我|找|以前|有很多|很多同學|很多|的照片|照片|檔案|素材|文宣|相關設計|相關|請|可以嗎|可以|嗎|做新的|新的|宣傳|給我|看看|一個|一場|下週|適合 IG|適合IG|的|有/g;

export function expandQuery(query: string): string {
  const extra: string[] = [];
  for (const row of ALIASES) {
    if (row.keys.some((key) => query.includes(key))) extra.push(...row.extra);
  }
  return extra.length ? `${query} ${extra.join(" ")}` : query;
}

/** Turn「找以前晚上的茶會照片」into Drive/Canva tokens, not the whole sentence. */
export function searchTokens(query: string): string[] {
  const raw = query.trim();
  const seen = new Set<string>();
  const tokens: string[] = [];

  function add(token: string) {
    const next = token.trim();
    if (next.length < 2 || FILLER.test(next) || seen.has(next)) return;
    seen.add(next);
    tokens.push(next);
  }

  for (const row of ALIASES) {
    for (const key of row.keys) {
      if (raw.includes(key)) add(key);
    }
  }

  for (const part of raw.replace(FILLER_SPLIT, " ").split(/[\s，。？?、！!／/,]+/)) add(part);

  if (tokens.length < 4) {
    for (const row of ALIASES) {
      if (!row.keys.some((key) => raw.includes(key))) continue;
      for (const extra of row.extra) add(extra);
      if (tokens.length >= 6) break;
    }
  }

  return tokens.slice(0, 6);
}

/** Drive `q` fragment: token OR-clause, never the whole NL sentence. */
export function driveContainsQuery(query: string): string {
  const tokens = searchTokens(query).slice(0, 4);
  const terms = tokens.length ? tokens : [query.trim()].filter((token) => token.length >= 1);
  return terms
    .map((token) => {
      const q = driveQueryEscape(token);
      return `name contains '${q}' or fullText contains '${q}'`;
    })
    .join(" or ");
}

export function blobMatchesQuery(blob: string, query: string) {
  const text = blob.toLowerCase();
  const tokens = searchTokens(query).map((token) => token.toLowerCase());
  if (!tokens.length) return text.includes(query.trim().toLowerCase());
  return tokens.some((token) => text.includes(token));
}

export function remoteMatchesQuery(
  file: Pick<RemoteFile, "name" | "summary" | "tags">,
  query: string,
) {
  return blobMatchesQuery(`${file.name} ${file.summary} ${file.tags.join(" ")}`, query);
}

export type CreativeHit = {
  id: string;
  source: "drive" | "canva" | "instagram" | "generated" | "local";
  title: string;
  subtitle: string;
  kind: string;
  score: number;
  thumbnail?: string;
  assetId?: string;
  projectId?: string;
  campaignId?: string;
  remoteId?: string;
  url?: string;
};

const WEIGHT: Record<CreativeHit["source"], number> = {
  instagram: 8,
  canva: 7,
  drive: 6,
  generated: 5,
  local: 4,
};

function blobOf(parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function scoreText(query: string, text: string, extra = 0) {
  const q = query.trim().toLowerCase();
  if (!q) return extra;
  const tokens = searchTokens(query).map((token) => token.toLowerCase());
  const use = tokens.length ? tokens : q.split(/\s+/).filter(Boolean);
  let score = extra;
  for (const token of use) {
    if (text.includes(token)) score += 6;
    else if (token.length >= 2 && text.includes(token.slice(0, 2))) score += 1;
  }
  if (text.includes(q)) score += 8;
  return score;
}

export function searchCreative(input: {
  query: string;
  assets: AssetMeta[];
  projects: Project[];
  campaigns: ClubCampaign[];
  igMemory: IgMemoryPost[];
  remoteFiles: RemoteFile[];
}): CreativeHit[] {
  const q = expandQuery(input.query.trim());
  const hits: CreativeHit[] = [];

  for (const asset of input.assets) {
    const text = blobOf([asset.name, asset.category, ...(asset.tags ?? []), asset.licenseNotes]);
    const source =
      asset.source === "generated"
        ? "generated"
        : asset.source === "drive" || asset.source === "canva" || asset.source === "instagram"
          ? asset.source
          : "local";
    const score = scoreText(q, text, WEIGHT[source]);
    if (!q || score > WEIGHT[source]) {
      hits.push({
        id: `asset:${asset.id}`,
        source,
        title: asset.name,
        subtitle: asset.tags.slice(0, 4).join(" · ") || asset.category,
        kind: "素材",
        score,
        assetId: asset.id,
        thumbnail: asset.seedSrc,
      });
    }
  }

  for (const project of input.projects) {
    const text = blobOf([
      project.name,
      project.copy.headline,
      project.copy.caption,
      project.plan?.hook,
      project.brief.eventName,
    ]);
    const score = scoreText(q, text, WEIGHT.local + 2);
    if (!q || score > WEIGHT.local) {
      hits.push({
        id: `project:${project.id}`,
        source: "local",
        title: project.name,
        subtitle: project.plan?.hook || project.copy.headline,
        kind: "創作",
        score,
        projectId: project.id,
      });
    }
  }

  for (const campaign of input.campaigns) {
    const text = blobOf([campaign.name, campaign.oneLiner, campaign.theme, campaign.location]);
    const score = scoreText(q, text, 9);
    if (!q || score > 9) {
      hits.push({
        id: `campaign:${campaign.id}`,
        source: "local",
        title: campaign.name,
        subtitle: `${campaign.date} · ${campaign.location}`,
        kind: "活動",
        score,
        campaignId: campaign.id,
      });
    }
  }

  for (const post of input.igMemory) {
    const text = blobOf([post.caption, post.kind, post.date]);
    const score = scoreText(q, text, WEIGHT.instagram);
    if (!q || score > WEIGHT.instagram) {
      const seed = input.assets.find((asset) => asset.id === post.assetId)?.seedSrc;
      hits.push({
        id: `ig:${post.id}`,
        source: "instagram",
        title: post.caption.slice(0, 36) || "IG 貼文",
        subtitle: `${post.date} · ${post.kind}`,
        kind: "過去 IG",
        score,
        projectId: post.projectId,
        assetId: post.assetId,
        thumbnail: post.mediaUrl || seed,
        url: post.permalink,
      });
    }
  }

  for (const file of input.remoteFiles) {
    const text = blobOf([file.name, file.summary, file.provider, ...file.tags]);
    const source = file.provider;
    const score = scoreText(q, text, WEIGHT[source]);
    if (!q || score > WEIGHT[source]) {
      hits.push({
        id: `remote:${file.id}`,
        source,
        title: file.name,
        subtitle: file.summary || file.provider,
        kind: source === "drive" ? "Google Drive" : source === "canva" ? "Canva" : "Instagram",
        score,
        remoteId: file.id,
        thumbnail: file.thumbnail,
        url: file.url,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, 48);
}

export function groupCreativeHits(hits: CreativeHit[]): Record<string, CreativeHit[]> {
  const map: Record<string, CreativeHit[]> = {};
  for (const hit of hits) {
    (map[hit.source] ??= []).push(hit);
  }
  return map;
}
