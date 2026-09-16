import { uid } from "../studio/ids.ts";
import type { ContentKind, ProjectStatus } from "../studio/types.ts";
import type { ClubCampaign, CampaignType, CampaignWave, ScheduleItem, WaveKind } from "./types.ts";

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

export function suggestWaves(input: {
  date: string;
  type: CampaignType;
  name: string;
}): CampaignWave[] {
  const span = input.type === "recruit" ? 18 : input.type === "light" || input.type === "tea" ? 14 : 10;
  const kinds: WaveKind[] = ["tease", "emotion", "key-visual", "info", "reason", "countdown", "day-of", "recap"];
  return kinds.map((kind) => {
    let offset = DEFAULT_OFFSETS[kind];
    if (span < 12 && kind === "tease") offset = -9;
    if (span < 12 && kind === "emotion") offset = -6;
    const hour = kind === "day-of" ? 17 : kind === "recap" ? 21 : 20;
    const status: ProjectStatus = offset > 0 ? "idea" : "idea";
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

export function rhythmHint(items: { contentKind: string }[]) {
  const ads = items.filter((i) => i.contentKind === "ig-post" || i.contentKind === "carousel").length;
  if (ads >= 3) {
    return "連續活動廣告會讓帳號看起來一直在招生。下一則改生活、互動或社員故事。";
  }
  return "宣傳 → 生活 → 互動 → 活動 → 知識 → 故事 → 倒數，讓節奏自然。";
}

export function contentKindForWave(kind: WaveKind): ContentKind {
  if (kind === "day-of") return "story";
  if (kind === "key-visual") return "carousel";
  if (kind === "recap") return "recap";
  if (kind === "countdown") return "countdown";
  return "ig-post";
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
