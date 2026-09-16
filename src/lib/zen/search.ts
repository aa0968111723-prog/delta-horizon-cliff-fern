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

export function sourceLabelOf(source: string) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "本機／品牌記憶";
}

export function hitFromRemote(file: RemoteFile, score = 99): CreativeHit {
  const source = file.provider;
  return {
    id: `remote:${file.id}`,
    source,
    title: file.name,
    subtitle: file.summary || file.provider,
    kind: source === "drive" ? "Google Drive" : source === "canva" ? "Canva" : "Instagram",
    score,
    remoteId: file.id,
    thumbnail: file.thumbnail,
    url: file.url,
  };
}

export type GatherPreferred = { remoteId?: string | null; assetId?: string | null };

/** Keep the file the user tapped at the front, even if the live query ranked it lower. */
export function pinPreferredHits(
  hits: CreativeHit[],
  preferred: GatherPreferred | undefined,
  remotes: RemoteFile[],
  assets: AssetMeta[],
): CreativeHit[] {
  const next = [...hits];
  if (preferred?.remoteId) {
    const remote = remotes.find((file) => file.id === preferred.remoteId);
    if (remote && !next.some((hit) => hit.remoteId === remote.id)) {
      next.unshift(hitFromRemote(remote));
    }
  }
  if (preferred?.assetId) {
    const asset = assets.find((item) => item.id === preferred.assetId);
    if (asset && !next.some((hit) => hit.assetId === asset.id)) {
      const source =
        asset.source === "generated"
          ? "generated"
          : asset.source === "drive" || asset.source === "canva" || asset.source === "instagram"
            ? asset.source
            : "local";
      next.unshift({
        id: `asset:${asset.id}`,
        source,
        title: asset.name,
        subtitle: "來源素材",
        kind: "素材",
        score: 99,
        assetId: asset.id,
        thumbnail: asset.seedSrc,
      });
    }
  }
  return next;
}

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
      hits.push(hitFromRemote(file, score));
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

/** Live IG search must teach this kit, not only fill a file list. */
export function igPostsMatchingQuery(posts: IgMemoryPost[], query: string): IgMemoryPost[] {
  return posts.filter((post) => blobMatchesQuery(`${post.caption} ${post.date} ${post.kind}`, query));
}

/** Matching IG captions go first so seed metrics cannot bury this kit's hook. */
export function igSearchHookBlock(posts: IgMemoryPost[], query: string): string | undefined {
  const hooks = igPostsMatchingQuery(posts, query)
    .map((post) => post.caption.trim().split(/\n/)[0]?.trim())
    .filter((line): line is string => Boolean(line && line.length >= 4))
    .slice(0, 3);
  if (!hooks.length) return undefined;
  return `過去表現較好的 Hook：「${hooks[0]}」。這次搜到的 IG：${hooks.join("／")}`;
}
