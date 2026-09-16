import type { CampaignWave, ContentKind, ContentStatus, WavePurpose } from "../studio/types.ts";
import { CONTENT_KIND_META } from "../studio/status.ts";
import { uid } from "../studio/ids.ts";

export type RhythmInput = {
  eventDate: string;
  eventType: string;
  leadDays?: number;
  density?: "light" | "normal" | "dense";
};

const PURPOSE_KIND: Record<WavePurpose, ContentKind> = {
  tease: "ig-post",
  emotion: "carousel",
  hero: "ig-post",
  info: "carousel",
  reason: "ig-post",
  story: "story",
  countdown: "story",
  dayof: "story",
  recap: "recap",
  life: "ig-post",
  interact: "poll",
  knowledge: "knowledge",
};

function wave(
  offsetDays: number,
  purpose: WavePurpose,
  label: string,
  topic: string,
  hook: string,
  kind?: ContentKind,
): CampaignWave {
  return {
    id: uid("wave"),
    offsetDays,
    label,
    purpose,
    contentKind: kind ?? PURPOSE_KIND[purpose],
    topic,
    hook,
  };
}

/** Compress or expand a natural rhythm so IG is not just ads. */
export function buildCampaignRhythm(input: RhythmInput): CampaignWave[] {
  const type = input.eventType.trim() || "活動";
  const lead = input.leadDays ?? Math.max(3, daysFromType(type));
  const density = input.density ?? (lead >= 12 ? "normal" : lead >= 7 ? "light" : "dense");

  const name = type;
  if (density === "dense" || lead <= 5) {
    return [
      wave(-Math.min(lead, 4), "emotion", "情緒共鳴", `為什麼現在需要${name}`, "最近是不是連休息都覺得有罪惡感？"),
      wave(-Math.min(2, lead - 1), "hero", "主視覺", `${name}長什麼樣子`, "有時候我們需要的不是答案，只是一個安靜的晚上。"),
      wave(-1, "countdown", "倒數", "時間地點", "明天這個時候，淡水會暗得比較早。"),
      wave(0, "dayof", "當日", "今天來坐一下", "人到了就好，不用準備成另一個自己。"),
      wave(1, "recap", "回顧", "現場溫度", "原來大家真的會為了一個晚上留下來。"),
    ];
  }

  const core: CampaignWave[] = [
    wave(-Math.min(lead, density === "light" ? 8 : 12), "tease", "預熱", `先讓人感覺到${name}`, "大學生活很自由，但你最近真的有比較快樂嗎？"),
    wave(-Math.min(lead - 2, density === "light" ? 6 : 10), "life", "生活", "淡江／淡水日常", "從捷運走出來的時候，風是不是都比較大？"),
    wave(-Math.min(lead - 3, 7), "emotion", "情緒共鳴", "學生此刻的卡住", "最近是不是很久沒有好好坐下來？"),
    wave(-Math.min(5, lead - 1), "hero", "主視覺", `${name}主畫面`, "不是要你變成誰，只是留一個位置。"),
    wave(-Math.min(4, lead - 1), "info", "活動介紹", "時間地點內容", "來之前你只需要知道三件事。"),
    wave(-Math.min(3, lead - 1), "interact", "互動", "問一句真話", "你比較想安靜坐著，還是跟朋友一起來？"),
    wave(-2, "reason", "參加理由", "為什麼適合淡江學生", "沒有人要你懂禪。人到了就好。"),
    wave(-1, "countdown", "倒數", "明天", "明天這個點，燈會先亮。"),
    wave(0, "dayof", "當日", "今天", "到了再找位子。不用準時到分。"),
    wave(1, "recap", "回顧", "現場", "有人是第一次來，也有人帶了認識一個月的朋友。"),
  ];

  if (density === "normal") {
    core.splice(4, 0, wave(-6, "knowledge", "輕輕認識", "把禪講成生活", "專注不一定要正坐。有時候只是把手機翻過去。"));
  }

  return core.filter((item, index, list) => list.findIndex((row) => row.offsetDays === item.offsetDays) === index);
}

function daysFromType(type: string) {
  if (/招生|迎新/.test(type)) return 14;
  if (/茶會|浮游|禪光/.test(type)) return 10;
  if (/社課|例會/.test(type)) return 5;
  return 8;
}

export function plannedTimestamp(eventDate: string, offsetDays: number, hour = 19) {
  const [y, m, d] = eventDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + offsetDays, hour, 0, 0);
  return date.getTime();
}

export type CampaignScheduleDraft = {
  campaignId: string;
  projectId: string | null;
  title: string;
  contentKind: ContentKind;
  status: ContentStatus;
  plannedAt: number;
  publishedAt: null;
  sourceLabel: string;
};

export function scheduleDraftsFromCampaign(
  campaign: {
    id: string;
    name: string;
    date: string;
    waves: CampaignWave[];
    projectIds: string[];
  },
  now = Date.now(),
): CampaignScheduleDraft[] {
  const projectId = campaign.projectIds[0] ?? null;
  return campaign.waves.map((wave) => {
    const plannedAt = plannedTimestamp(campaign.date, wave.offsetDays);
    return {
      campaignId: campaign.id,
      projectId,
      title: `${wave.label} · ${campaign.name}`,
      contentKind: wave.contentKind,
      status: plannedAt > now - 60_000 ? "scheduled" : "idea",
      plannedAt,
      publishedAt: null,
      sourceLabel: "AI 節奏建議",
    };
  });
}

export function offsetDaysForKind(kind: ContentKind) {
  if (kind === "story") return -1;
  if (kind === "reels") return -2;
  if (kind === "carousel") return -5;
  if (kind === "threads") return -4;
  if (kind === "line") return -3;
  if (kind === "countdown") return -1;
  if (kind === "recap") return 1;
  return -7;
}

export function convertedScheduleInput(input: {
  eventDate: string;
  eventName: string;
  kind: ContentKind;
  hook?: string;
  campaignId: string | null;
  projectId: string | null;
}) {
  return {
    campaignId: input.campaignId,
    projectId: input.projectId,
    title: `${CONTENT_KIND_META[input.kind].label} · ${input.eventName}`,
    contentKind: input.kind,
    status: "scheduled" as const,
    plannedAt: plannedTimestamp(input.eventDate, offsetDaysForKind(input.kind)),
    sourceLabel: input.hook ? `AI 轉換 / ${input.hook.slice(0, 24)}` : "AI 轉換",
  };
}

export function convertedScheduleDrafts(input: {
  eventDate: string;
  eventName: string;
  kinds: ContentKind[];
  hook?: string;
  campaignId: string | null;
  projectId: string | null;
}) {
  return input.kinds.map((kind) => convertedScheduleInput({ ...input, kind }));
}

export function convertedScheduleUpserts<
  T extends {
    id: string;
    campaignId: string | null;
    contentKind: ContentKind;
    plannedAt: number;
    status: ContentStatus;
  },
>(
  rows: T[],
  input: {
    eventDate: string;
    eventName: string;
    kinds: ContentKind[];
    hook?: string;
    campaignId: string | null;
    projectId: string | null;
  },
) {
  return convertedScheduleDrafts(input).map((draft) => {
    const existing = matchingScheduleRow(rows, {
      campaignId: input.campaignId,
      kind: draft.contentKind,
      plannedAt: draft.plannedAt,
    });
    return { ...draft, id: existing?.id };
  });
}

export function isSameScheduleDay(a: number, b: number) {
  const left = new Date(a);
  const right = new Date(b);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

/** Reuse the same-day slot of this format. Never steal another day's Story / Reels. */
export function matchingScheduleRow<
  T extends {
    campaignId: string | null;
    contentKind: ContentKind;
    plannedAt: number;
    status: ContentStatus;
  },
>(
  rows: T[],
  input: { campaignId: string | null; kind: ContentKind; plannedAt: number },
): T | undefined {
  return rows.find((row) => {
    if (row.contentKind !== input.kind) return false;
    if (row.status === "published") return false;
    if (!isSameScheduleDay(row.plannedAt, input.plannedAt)) return false;
    if (input.campaignId) return row.campaignId === input.campaignId;
    return !row.campaignId;
  });
}

export function scheduleChipLabel(row: { contentKind: ContentKind; title: string }) {
  const kind = CONTENT_KIND_META[row.contentKind].label;
  const title = row.title.trim();
  if (title === kind || title.startsWith(`${kind} `) || title.startsWith(`${kind}·`) || title.startsWith(`${kind} ·`)) {
    return title;
  }
  return `${kind} ${title}`;
}

/** Unpublished rows that are already due, or belong to today — so one person can publish when ready. */
export function publishableScheduleRows<
  T extends { status: ContentStatus; plannedAt: number },
>(rows: T[], now = Date.now()) {
  return rows
    .filter((row) => row.status !== "published" && (row.plannedAt <= now || isSameScheduleDay(row.plannedAt, now)))
    .sort((a, b) => a.plannedAt - b.plannedAt);
}
