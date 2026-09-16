import { proposeVisualDirections } from "../ai/image-directions.ts";
import { uid } from "../studio/ids.ts";
import type { ContentKind, ProjectStatus } from "../studio/types.ts";
import { convertFromPlan } from "./convert.ts";
import { applyStudentRewrite } from "./review.ts";
import { daysUntil } from "./season.ts";
import type { ClubCampaign, CampaignType, CampaignWave, CreativePack, ScheduleItem, WaveKind } from "./types.ts";

const DEFAULT_OFFSETS: Record<WaveKind, number> = {
  tease: -14,
  emotion: -10,
  "key-visual": -7,
  info: -5,
  reason: -3,
  countdown: -1,
  "day-of": 0,
  recap: 1,
};

function atDate(iso: string, offsetDays: number, hour: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + offsetDays, hour, 0, 0);
  return dt.getTime();
}

export function waveOffsets(input: { date: string; type: CampaignType; now?: Date }): Record<WaveKind, number> {
  const days = daysUntil(input.date, input.now);
  const base = { ...DEFAULT_OFFSETS };
  if (input.type === "recruit") {
    base.tease = -18;
    base.emotion = -14;
    base["key-visual"] = -10;
  }
  if (days < 6) {
    return {
      tease: -5,
      emotion: -4,
      "key-visual": -3,
      info: -2,
      reason: -2,
      countdown: -1,
      "day-of": 0,
      recap: 1,
    };
  }
  if (days < 10 || (input.type !== "tea" && input.type !== "light" && input.type !== "recruit")) {
    base.tease = -9;
    base.emotion = -6;
  }
  return base;
}

export function suggestWaves(input: {
  date: string;
  type: CampaignType;
  name: string;
  now?: Date;
}): CampaignWave[] {
  const offsets = waveOffsets({ date: input.date, type: input.type, now: input.now });
  const kinds: WaveKind[] = ["tease", "emotion", "key-visual", "info", "reason", "countdown", "day-of", "recap"];
  return kinds.map((kind) => {
    const offset = offsets[kind];
    const hour = kind === "day-of" ? 17 : kind === "recap" ? 21 : 20;
    const status: ProjectStatus = "idea";
    return {
      id: uid("wave"),
      kind,
      title: waveTitle(kind, input.name),
      scheduledAt: atDate(input.date, offset, hour),
      projectId: null,
      status,
      notes: "",
    };
  });
}

export function waveTitle(kind: WaveKind, name: string) {
  const map: Record<WaveKind, string> = {
    tease: `預告 · ${name}`,
    emotion: `先被看見 · ${name}`,
    "key-visual": `主視覺 · ${name}`,
    info: `活動介紹 · ${name}`,
    reason: `為什麼來 · ${name}`,
    countdown: `倒數 · ${name}`,
    "day-of": `今晚 · ${name}`,
    recap: `昨天晚上 · ${name}`,
  };
  return map[kind];
}

export function isPromoKind(kind: string) {
  return kind === "ig-post" || kind === "carousel" || kind === "poster";
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function placeScheduleItems(existing: ScheduleItem[], pending: ScheduleItem[]): ScheduleItem[] {
  const taken = new Map<string, string[]>();
  for (const row of existing) {
    if (row.status === "published") continue;
    const key = dayKey(row.scheduledAt);
    taken.set(key, [...(taken.get(key) ?? []), row.contentKind]);
  }
  const placed: ScheduleItem[] = [];
  for (const item of pending) {
    let ts = item.scheduledAt;
    for (let step = 0; step < 14; step += 1) {
      const kinds = taken.get(dayKey(ts)) ?? [];
      const promoClash = isPromoKind(item.contentKind) && kinds.some(isPromoKind);
      const sameKind = kinds.includes(item.contentKind);
      if (!promoClash && !sameKind) break;
      ts += 86_400_000;
    }
    placed.push({ ...item, scheduledAt: ts });
    const key = dayKey(ts);
    taken.set(key, [...(taken.get(key) ?? []), item.contentKind]);
  }
  return placed;
}

export function rhythmHint(items: { contentKind: string }[]) {
  const ads = items.filter((i) => isPromoKind(i.contentKind)).length;
  if (ads >= 3) {
    return "連續活動廣告會讓帳號看起來一直在招生。下一則改生活、互動或社員故事。";
  }
  return "宣傳 → 生活 → 互動 → 活動 → 知識 → 故事 → 倒數，讓節奏自然。";
}

export function isWaveScheduleItem(item: { id: string; sequence?: { assetIds: string[] } | null }) {
  return item.id.startsWith("sch_wave") && !item.sequence;
}

export function suiteCoversWave(campaignId: string, waveKind: WaveKind, items: ScheduleItem[]): boolean {
  const kind = contentKindForWave(waveKind);
  return items.some(
    (item) => item.campaignId === campaignId && !isWaveScheduleItem(item) && item.contentKind === kind,
  );
}

export function preferSuiteSchedule(items: ScheduleItem[]): ScheduleItem[] {
  const groups = new Map<string, ScheduleItem[]>();
  const loose: ScheduleItem[] = [];
  for (const item of items) {
    if (!item.campaignId) {
      loose.push(item);
      continue;
    }
    const rows = groups.get(item.campaignId) ?? [];
    rows.push(item);
    groups.set(item.campaignId, rows);
  }
  const next: ScheduleItem[] = [...loose];
  for (const rows of groups.values()) {
    const suite = rows.filter((item) => !isWaveScheduleItem(item));
    if (!suite.length) {
      next.push(...rows);
      continue;
    }
    const suiteKinds = new Set(suite.map((item) => item.contentKind));
    const keptWaves = rows.filter((item) => {
      if (!isWaveScheduleItem(item)) return true;
      if (item.status === "published") return true;
      return !suiteKinds.has(item.contentKind);
    });
    next.push(...keptWaves);
  }
  return next;
}

export function mergeSuiteIntoSchedule(existing: ScheduleItem[], pending: ScheduleItem[]): ScheduleItem[] {
  const pendingIds = new Set(pending.map((item) => item.id));
  const preview = preferSuiteSchedule([...pending, ...existing.filter((row) => !pendingIds.has(row.id))]);
  const remaining = preview.filter((row) => !pendingIds.has(row.id));
  return [...placeScheduleItems(remaining, pending), ...remaining];
}

export function spreadSchedule(items: ScheduleItem[]): ScheduleItem[] {
  const out: ScheduleItem[] = [];
  for (const item of items) {
    const [placed] = placeScheduleItems(out, [item]);
    if (placed) out.push(placed);
  }
  return out;
}

export function mergeCampaignSchedule(existing: ScheduleItem[], waveItems: ScheduleItem[]): ScheduleItem[] {
  const extraIds = new Set(waveItems.map((item) => item.id));
  const others = existing.filter((item) => !extraIds.has(item.id));
  const merged = preferSuiteSchedule([...waveItems, ...others]);
  const keptWaves = merged.filter((item) => extraIds.has(item.id));
  const keptOthers = merged.filter((item) => !extraIds.has(item.id));
  const placed = spreadScheduleAgainst(keptOthers, keptWaves);
  return [...placed, ...keptOthers];
}

function spreadScheduleAgainst(existing: ScheduleItem[], pending: ScheduleItem[]): ScheduleItem[] {
  const out: ScheduleItem[] = [];
  for (const item of pending) {
    const [placed] = placeScheduleItems([...existing, ...out], [item]);
    if (placed) out.push(placed);
  }
  return out;
}

export const WAVE_ANGLES: Record<WaveKind, string[]> = {
  tease: ["先講生活，還沒講活動名", "用淡水晚上當入口", "用開學課表當入口"],
  emotion: ["連休息都有罪惡感", "大學很自由但快樂嗎", "需要的不是答案只是一個晚上"],
  "key-visual": ["大 Hook 夜色留白", "同學側臉", "龜龜與三色光"],
  info: ["時間地點先講清楚", "來了會做什麼", "不用先懂禪"],
  reason: ["找朋友一起來", "剛到淡水需要一個地方", "報告先放旁邊"],
  countdown: ["明天只是坐一下", "今晚真的可以什麼都不做", "剩一天"],
  "day-of": ["今晚見", "現場怎麼走", "帶一個朋友"],
  recap: ["昨天晚上坐下來的感覺", "光還在", "下次還可以來"],
};

export function nextWaveAngle(kind: WaveKind, currentIndex = 0) {
  const list = WAVE_ANGLES[kind];
  const index = (currentIndex + 1) % list.length;
  return { index, angle: list[index]! };
}

export function nextWaveVisual(prompt: string, currentIndex = 0) {
  const dirs = proposeVisualDirections(prompt);
  const index = (currentIndex + 1) % dirs.length;
  return { index, direction: dirs[index]! };
}

export function copyKindForWave(kind: WaveKind) {
  if (kind === "tease") return "knowledge" as const;
  if (kind === "emotion") return "emotion" as const;
  if (kind === "reason") return "member" as const;
  if (kind === "countdown") return "countdown" as const;
  if (kind === "day-of") return "story" as const;
  if (kind === "recap") return "recap" as const;
  if (kind === "key-visual") return "carousel" as const;
  return "event" as const;
}

export function contentKindForWave(kind: WaveKind): ContentKind {
  if (kind === "tease") return "knowledge";
  if (kind === "reason") return "member-story";
  if (kind === "day-of") return "story";
  if (kind === "key-visual") return "carousel";
  if (kind === "recap") return "recap";
  if (kind === "countdown") return "countdown";
  return "ig-post";
}

export function previewForWave(kind: WaveKind, pack: CreativePack): string {
  const copy = applyStudentRewrite(pack.copy);
  const converted = convertFromPlan(pack.plan);
  const direction = pack.directions?.[0];
  if (kind === "tease") return copy.hook;
  if (kind === "emotion") return copy.body;
  if (kind === "key-visual") {
    return direction
      ? `${direction.headline}\n${direction.concept}\nPrompt：${direction.imagePrompt}`
      : converted.carousel[0]?.headline ?? copy.hook;
  }
  if (kind === "info") return `${pack.plan.campaignName}\n${pack.plan.subhead}\n${copy.cta}`;
  if (kind === "reason") return copy.studentReview.wouldBringFriend || converted.carousel.find((page) => page.role === "proof")?.body || copy.body;
  if (kind === "countdown") return `倒數。${pack.plan.subhead}\n${copy.cta}`;
  if (kind === "day-of") return converted.story.map((beat) => beat.headline).join(" → ");
  return `昨天晚上。${copy.hook}`;
}

export function applyPackToWaves(campaign: ClubCampaign, pack: CreativePack): ClubCampaign {
  const copy = applyStudentRewrite(pack.copy);
  return {
    ...campaign,
    updatedAt: Date.now(),
    tagline: copy.hook || campaign.tagline,
    waves: campaign.waves.map((wave) => ({
      ...wave,
      copyPreview: previewForWave(wave.kind, { ...pack, copy }),
      status: wave.status === "published" || wave.status === "done" ? wave.status : "creating",
      notes: wave.kind === "key-visual" ? pack.directions?.[0]?.imagePrompt || wave.notes : wave.notes,
    })),
  };
}

export function scheduleItemsFromCampaign(
  campaign: ClubCampaign,
  statusOverride?: ProjectStatus,
): ScheduleItem[] {
  return campaign.waves.map((wave) => ({
    id: `sch_${wave.id}`,
    title: wave.title,
    contentKind: contentKindForWave(wave.kind),
    status: statusOverride ?? wave.status,
    scheduledAt: wave.scheduledAt,
    publishedAt: null,
    projectId: wave.projectId,
    campaignId: campaign.id,
    captionPreview: wave.copyPreview || campaign.tagline,
  }));
}

export function schedulePreviewAssetId(
  item: { campaignId: string | null; contentKind: string; sequence?: { assetIds: string[] } | null },
  campaigns: ClubCampaign[],
): string | null {
  const fromSequence = item.sequence?.assetIds[0];
  if (fromSequence) return fromSequence;
  if (!item.campaignId) return null;
  const campaign = campaigns.find((row) => row.id === item.campaignId);
  if (!campaign) return null;
  if (item.contentKind === "story" || item.contentKind === "reels") {
    return campaign.relatedAssetIds.find((id) => id !== campaign.coverAssetId) ?? campaign.coverAssetId;
  }
  return campaign.coverAssetId;
}

export function emptyCampaign(partial?: Partial<ClubCampaign>): ClubCampaign {
  const now = Date.now();
  return {
    id: uid("camp"),
    name: "",
    type: "tea",
    date: "",
    time: "",
    location: "淡江大學淡水校園",
    tagline: "",
    description: "",
    theme: "",
    studentPain: "",
    cta: "晚上見",
    signupUrl: "",
    coverAssetId: null,
    relatedAssetIds: [],
    projectIds: [],
    waves: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}
