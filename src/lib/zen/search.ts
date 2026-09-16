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

function expandQuery(query: string): string {
  const extra: string[] = [];
  for (const row of ALIASES) {
    if (row.keys.some((key) => query.includes(key))) extra.push(...row.extra);
  }
  return extra.length ? `${query} ${extra.join(" ")}` : query;
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
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = extra;
  for (const token of tokens) {
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
      hits.push({
        id: `ig:${post.id}`,
        source: "instagram",
        title: post.caption.slice(0, 36) || "IG 貼文",
        subtitle: `${post.date} · ${post.kind}`,
        kind: "過去 IG",
        score,
        projectId: post.projectId,
        assetId: post.assetId,
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
