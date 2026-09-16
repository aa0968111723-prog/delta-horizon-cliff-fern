import type { CampaignContextInput } from "../ai/zen-schema.ts";
import { addDaysIso, daysUntil, studentContextPrompt, todayIso } from "../zen/context.ts";
import { brandMemoryContext } from "./brand.ts";
import type {
  BrandKit,
  Campaign,
  CampaignPainPoint,
  CampaignStrategy,
  CampaignType,
  CampaignWave,
  ContentItem,
  ContentSource,
  ContentStatus,
  ContentType,
  CopyDraft,
  ToneId,
} from "./types.ts";

const CAMPAIGN_TYPES: CampaignType[] = ["tea", "meditation", "lecture", "class", "welcome", "retreat", "showcase", "recruit", "other"];
const PAIN: CampaignPainPoint[] = ["stress", "lonely", "lost", "sleep", "focus", "friends", "curious", "belonging"];
const CONTENT_TYPES: ContentType[] = ["ig-post", "carousel", "story", "reels", "threads", "line", "poster", "recap", "member-story", "countdown", "qa", "poll", "knowledge"];
const STATUSES: ContentStatus[] = ["idea", "drafting", "done", "scheduled", "published"];
const TONES: ToneId[] = ["short", "normal", "warm", "student", "life", "humor"];

const strList = (v: unknown, max = 20) =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, max) : [];

export function emptyCopyDraft(tone: ToneId = "normal"): CopyDraft {
  return { hook: "", body: "", cta: "", hashtags: [], tone };
}

export function migrateCopyDraft(raw: unknown): CopyDraft {
  if (!raw || typeof raw !== "object") return emptyCopyDraft();
  const r = raw as Partial<CopyDraft>;
  return {
    hook: r.hook ?? "",
    body: r.body ?? "",
    cta: r.cta ?? "",
    hashtags: strList(r.hashtags),
    tone: TONES.includes(r.tone as ToneId) ? (r.tone as ToneId) : "normal",
  };
}

export function migrateStrategy(raw: unknown): CampaignStrategy | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<CampaignStrategy>;
  const waves: CampaignWave[] = Array.isArray(r.waves)
    ? r.waves
        .map((w, i) => {
          const row = w as Partial<CampaignWave>;
          if (!row.role) return null;
          return {
            id: row.id || `wave_${i}`,
            role: row.role,
            offsetDays: typeof row.offsetDays === "number" ? row.offsetDays : -7,
            contentType: CONTENT_TYPES.includes(row.contentType as ContentType) ? (row.contentType as ContentType) : "ig-post",
            title: row.title ?? "",
            hook: row.hook ?? "",
            angle: row.angle ?? "",
            contentId: row.contentId ?? null,
          };
        })
        .filter((w): w is CampaignWave => Boolean(w))
    : [];
  return {
    axis: r.axis ?? "",
    directions: Array.isArray(r.directions) ? r.directions : [],
    chosenDirectionId: r.chosenDirectionId ?? null,
    waves,
    rhythmNote: r.rhythmNote ?? "",
    generatedAt: r.generatedAt ?? Date.now(),
    source: r.source === "live" ? "live" : "mock",
  };
}

export function migrateCampaign(raw: Partial<Campaign> & { id: string }): Campaign {
  const now = Date.now();
  return {
    id: raw.id,
    name: (raw.name ?? "").trim() || "未命名活動",
    type: CAMPAIGN_TYPES.includes(raw.type as CampaignType) ? (raw.type as CampaignType) : "other",
    date: raw.date ?? "",
    time: raw.time ?? "",
    location: raw.location ?? "",
    oneLiner: raw.oneLiner ?? "",
    description: raw.description ?? "",
    theme: raw.theme ?? "",
    painPoints: strList(raw.painPoints).filter((p): p is CampaignPainPoint => PAIN.includes(p as CampaignPainPoint)),
    cta: raw.cta ?? "",
    signupUrl: raw.signupUrl ?? "",
    coverAssetId: raw.coverAssetId ?? null,
    assetIds: strList(raw.assetIds, 60),
    strategy: migrateStrategy(raw.strategy),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
  };
}

export function migrateContent(raw: Partial<ContentItem> & { id: string }): ContentItem {
  const now = Date.now();
  const type = CONTENT_TYPES.includes(raw.type as ContentType) ? (raw.type as ContentType) : "ig-post";
  return {
    id: raw.id,
    campaignId: raw.campaignId ?? null,
    type,
    status: STATUSES.includes(raw.status as ContentStatus) ? (raw.status as ContentStatus) : "idea",
    title: (raw.title ?? "").trim() || "未命名內容",
    copy: migrateCopyDraft(raw.copy),
    variants: Array.isArray(raw.variants) ? raw.variants.map(migrateCopyDraft) : [],
    imagePrompt: raw.imagePrompt ?? "",
    visualDirection: raw.visualDirection ?? "",
    carousel: Array.isArray(raw.carousel) ? raw.carousel : [],
    storyFrames: Array.isArray(raw.storyFrames) ? raw.storyFrames : [],
    reels: Array.isArray(raw.reels) ? raw.reels : [],
    threads: raw.threads ?? "",
    line: raw.line ?? "",
    review: raw.review ?? null,
    sources: Array.isArray(raw.sources) ? (raw.sources as ContentSource[]) : [],
    projectId: raw.projectId ?? null,
    coverAssetId: raw.coverAssetId ?? null,
    scheduledAt: raw.scheduledAt ?? null,
    publishedAt: raw.publishedAt ?? null,
    metrics: raw.metrics ?? null,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
    generatedBy: raw.generatedBy ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Derived helpers                                                     */
/* ------------------------------------------------------------------ */

export function upcomingCampaigns(campaigns: Campaign[], from = new Date()): Campaign[] {
  const today = todayIso(from);
  return [...campaigns]
    .filter((c) => c.date && c.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function pastCampaigns(campaigns: Campaign[], from = new Date()): Campaign[] {
  const today = todayIso(from);
  return [...campaigns].filter((c) => !c.date || c.date < today).sort((a, b) => b.date.localeCompare(a.date));
}

export function nextCampaign(campaigns: Campaign[], from = new Date()): Campaign | null {
  return upcomingCampaigns(campaigns, from)[0] ?? null;
}

export function campaignDaysLeft(campaign: Campaign, from = new Date()): number | null {
  if (!campaign.date) return null;
  return daysUntil(campaign.date, from);
}

export function waveDateIso(campaign: Campaign, wave: CampaignWave): string {
  if (!campaign.date) return todayIso();
  return addDaysIso(campaign.date, wave.offsetDays);
}

/** 建議的下一波：今天之後最近、還沒有內容的那一波。 */
export function nextWave(campaign: Campaign, from = new Date()): CampaignWave | null {
  if (!campaign.strategy) return null;
  const today = todayIso(from);
  const pending = campaign.strategy.waves
    .filter((w) => !w.contentId)
    .map((w) => ({ w, date: waveDateIso(campaign, w) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return pending.find((p) => p.date >= today)?.w ?? pending[0]?.w ?? null;
}

export function campaignToContext(
  campaign: Campaign,
  brand: BrandKit,
  extra?: { igDna?: string; sourceNotes?: string; now?: Date },
): CampaignContextInput {
  return {
    name: campaign.name,
    type: campaign.type,
    date: campaign.date,
    time: campaign.time,
    location: campaign.location,
    oneLiner: campaign.oneLiner,
    description: campaign.description,
    theme: campaign.theme,
    painPoints: campaign.painPoints.slice(0, 4),
    cta: campaign.cta,
    signupUrl: campaign.signupUrl,
    brandContext: brandMemoryContext(brand).slice(0, 3000),
    studentContext: studentContextPrompt(extra?.now ?? new Date()).slice(0, 1500),
    igDna: (extra?.igDna ?? brand.memory?.igDna)?.slice(0, 1500),
    sourceNotes: extra?.sourceNotes?.slice(0, 1500),
  };
}

/** 沒有活動時，用「一句想法」建立臨時活動情境。 */
export function ideaToContext(idea: string, brand: BrandKit, now = new Date()): CampaignContextInput {
  return {
    name: idea.trim().slice(0, 40) || "一則日常內容",
    type: "other",
    date: "",
    time: "",
    location: "",
    oneLiner: idea.trim().slice(0, 120),
    description: "",
    theme: idea.trim().slice(0, 80),
    painPoints: ["belonging", "stress"],
    cta: brand.boilerplate.cta || "直接來就好",
    signupUrl: "",
    brandContext: brandMemoryContext(brand).slice(0, 3000),
    studentContext: studentContextPrompt(now).slice(0, 1500),
    igDna: brand.memory?.igDna?.slice(0, 1500) || undefined,
  };
}

export function scheduledContents(contents: ContentItem[]): ContentItem[] {
  return [...contents]
    .filter((c) => c.scheduledAt && c.status !== "published")
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
}

export function recentGenerated(contents: ContentItem[], limit = 6): ContentItem[] {
  return [...contents]
    .filter((c) => c.generatedBy)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

export function topPerforming(contents: ContentItem[], limit = 3): ContentItem[] {
  return [...contents]
    .filter((c) => c.metrics)
    .sort((a, b) => {
      const score = (m: NonNullable<ContentItem["metrics"]>) => m.saves * 4 + m.shares * 3 + m.comments * 2 + m.likes;
      return score(b.metrics!) - score(a.metrics!);
    })
    .slice(0, limit);
}

export function sourceLabelFor(source: ContentSource) {
  return source.label;
}
