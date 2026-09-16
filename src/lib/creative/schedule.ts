import { daysUntil } from "../club/season.ts";
import { uid } from "../studio/ids.ts";
import type { ContentKind, ProjectStatus } from "../studio/types.ts";
import type { CampaignType, CampaignWave, ClubCampaign } from "./types.ts";

/** 當天／回顧節奏不能被轉換格式搶走。 */
const RESERVED_WAVE_INTENTS = /當天|回顧/;

type WaveSeed = {
  offsetDays: number;
  intent: string;
  topic: string;
  contentKind: ContentKind;
};

function at(offset: number, intent: string, topic: string, kind: ContentKind): WaveSeed {
  return { offsetDays: offset, intent, topic, contentKind: kind };
}

/** 依活動類型與距離自動長節奏，避免連續活動廣告。 */
export function suggestWaves(campaign: Pick<ClubCampaign, "type" | "date" | "name" | "oneLiner">, from = new Date()): CampaignWave[] {
  const days = Math.max(1, daysUntil(campaign.date, from));
  const type: CampaignType = campaign.type;
  const seeds: WaveSeed[] = [];

  if (days >= 14 && type !== "recap") {
    seeds.push(at(-Math.min(14, days - 1), "預熱", "先讓學生覺得這週有一個晚上", "ig-post"));
  }
  if (days >= 10) {
    seeds.push(at(-Math.min(10, Math.max(8, days - 2)), "生活", "捷運、宿舍、課表的切片", "ig-post"));
  }
  seeds.push(at(-Math.min(7, Math.max(3, days - 1)), "情緒共鳴", campaign.oneLiner || "很久沒坐好", "carousel"));
  if (type !== "recruit") {
    seeds.push(at(-Math.min(5, Math.max(2, days - 1)), "互動", "問一句：你這週有真的休息嗎", "poll"));
  }
  seeds.push(at(-Math.min(4, Math.max(2, days - 1)), "主視覺", `${campaign.name} 看起來像什麼`, "ig-post"));
  seeds.push(at(-Math.min(3, Math.max(1, days - 1)), "活動內容", "燈光、熱茶、坐著就好", "carousel"));
  if (days >= 4) {
    seeds.push(at(-2, "故事", "為什麼有人會想來", "member-story"));
  }
  seeds.push(at(-1, "倒數", "明天這個時候", "countdown"));
  seeds.push(at(0, "當天", "今天晚上見", "story"));
  seeds.push(at(1, "回顧", "昨天有人真的坐下來了", "recap"));

  const seen = new Set<number>();
  return seeds
    .filter((item) => {
      if (item.offsetDays < 0 && Math.abs(item.offsetDays) >= days) return false;
      if (seen.has(item.offsetDays)) return false;
      seen.add(item.offsetDays);
      return true;
    })
    .map((item) => {
      const when = new Date(`${campaign.date}T19:00:00+08:00`);
      when.setDate(when.getDate() + item.offsetDays);
      const status: ProjectStatus = item.offsetDays < 0 && Math.abs(item.offsetDays) <= 2 ? "idea" : "idea";
      return {
        id: uid("wave"),
        offsetDays: item.offsetDays,
        intent: item.intent,
        topic: item.topic,
        contentKind: item.contentKind,
        projectId: null,
        scheduledAt: when.getTime(),
        publishedAt: null,
        status,
      };
    });
}

export function isoFromMs(ms: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** 轉換格式排進月曆時的相對活動日，Carousel 提前一週、Story 前一天。 */
export function offsetDaysForKind(kind: ContentKind): number {
  if (kind === "story" || kind === "countdown") return -1;
  if (kind === "reels") return -3;
  if (kind === "carousel") return -7;
  if (kind === "line") return -4;
  if (kind === "threads") return -5;
  if (kind === "recap") return 1;
  if (kind === "member-story") return -2;
  if (kind === "poll") return -5;
  return -10;
}

export function scheduledAtFor(kind: ContentKind, campDate?: string, now = Date.now()): number {
  if (!campDate) return now + 86400000;
  const event = Date.parse(`${campDate}T19:00:00+08:00`);
  if (Number.isNaN(event)) return now + 86400000;
  return event + offsetDaysForKind(kind) * 86400000;
}

export function waveIntentForKind(kind: ContentKind): string {
  if (kind === "carousel") return "Carousel";
  if (kind === "story") return "Story";
  if (kind === "reels") return "Reels";
  if (kind === "threads") return "Threads";
  if (kind === "line") return "LINE";
  if (kind === "countdown") return "倒數";
  if (kind === "recap") return "回顧";
  if (kind === "ig-post") return "IG";
  if (kind === "member-story") return "故事";
  if (kind === "poll") return "互動";
  return "網宣";
}

export function bindScheduledWave(
  waves: CampaignWave[],
  input: {
    kind: ContentKind;
    projectId: string;
    scheduledAt: number;
    topic: string;
    status: ProjectStatus;
    campaignDate: string;
  },
): CampaignWave[] {
  const event = Date.parse(`${input.campaignDate}T19:00:00+08:00`);
  const offsetDays = Number.isNaN(event) ? 0 : Math.round((input.scheduledAt - event) / 86400000);
  const desired = offsetDaysForKind(input.kind);
  const unused = waves.find(
    (wave) =>
      wave.contentKind === input.kind &&
      !wave.projectId &&
      !RESERVED_WAVE_INTENTS.test(wave.intent) &&
      Math.abs(wave.offsetDays - desired) <= 2,
  );
  const patch = {
    status: input.status,
    projectId: input.projectId,
    scheduledAt: input.scheduledAt,
    offsetDays,
    topic: input.topic,
  };
  if (unused) {
    return waves.map((wave) => (wave.id === unused.id ? { ...wave, ...patch } : wave));
  }
  return [
    ...waves,
    {
      id: uid("wave"),
      intent: waveIntentForKind(input.kind),
      contentKind: input.kind,
      publishedAt: null,
      ...patch,
    },
  ];
}

/** 從一句話猜活動日，給還沒建 Campaign 的創作。 */
export function inferEventDate(query: string, from = new Date()): string {
  if (/明天/.test(query)) return isoFromMs(from.getTime() + 86400000);
  if (/下週|下周/.test(query)) return isoFromMs(from.getTime() + 7 * 86400000);
  const match = query.match(/(\d{1,2})[/／月](\d{1,2})/);
  if (match) {
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    const parsed = Date.parse(`${from.getFullYear()}-${month}-${day}T12:00:00+08:00`);
    if (!Number.isNaN(parsed)) return isoFromMs(parsed);
  }
  return isoFromMs(from.getTime() + 7 * 86400000);
}

export function inferCampaignType(query: string) {
  if (/茶/.test(query)) return "tea" as const;
  if (/光|禪光|靜心/.test(query)) return "light" as const;
  if (/招|迎新/.test(query)) return "recruit" as const;
  if (/回顧/.test(query)) return "recap" as const;
  if (/課|工作坊/.test(query)) return "workshop" as const;
  return "other" as const;
}
