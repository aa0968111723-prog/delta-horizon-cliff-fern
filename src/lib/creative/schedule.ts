import { daysUntil } from "../club/season.ts";
import { contentKindLabel } from "../studio/content.ts";
import { uid } from "../studio/ids.ts";
import type { ContentKind, ProjectStatus } from "../studio/types.ts";
import type { CalendarItem, CampaignType, CampaignWave, ClubCampaign } from "./types.ts";

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

/** 依活動類型、距離、最近 IG 節奏自動長波次，避免連續活動廣告。 */
export function suggestWaves(
  campaign: Pick<ClubCampaign, "type" | "date" | "name" | "oneLiner">,
  from = new Date(),
  mixLesson?: string,
): CampaignWave[] {
  const days = Math.max(1, daysUntil(campaign.date, from));
  const type: CampaignType = campaign.type;
  const adsHeavy = Boolean(mixLesson && /活動廣告偏多|一直在招生/.test(mixLesson));
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
  if (!adsHeavy) {
    seeds.push(at(-Math.min(4, Math.max(2, days - 1)), "主視覺", `${campaign.name} 看起來像什麼`, "ig-post"));
  }
  seeds.push(
    adsHeavy
      ? at(-Math.min(3, Math.max(1, days - 1)), "知識", "先講一件這週會卡關的小事", "ig-post")
      : at(-Math.min(3, Math.max(1, days - 1)), "活動內容", "燈光、熱茶、坐著就好", "carousel"),
  );
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
        scheduledAt: ensureFutureSlot(when.getTime(), from.getTime()),
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

export function campaignNameFromTitle(title: string) {
  const name = title.split("·")[0]?.trim() || title.trim();
  return name.slice(0, 40) || "淡江禪學社";
}

type PreviewProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  scheduledAt: number | null;
  campaignId: string | null;
  contentKind: ContentKind;
  copy: { headline: string; body: string; cta: string };
  visualTheme?: string;
  location?: string;
};

/** IG Grid 上未排程的完成稿，算出要建哪個活動、排在哪一天。 */
export function planPreviewSchedule(input: {
  project: PreviewProject;
  campaigns: Array<Pick<ClubCampaign, "id" | "date" | "waves">>;
  caption: string;
  now?: Date;
}) {
  if (input.project.scheduledAt) {
    return {
      action: "open" as const,
      day: isoFromMs(input.project.scheduledAt),
      campaignId: input.project.campaignId,
    };
  }
  const existing = input.project.campaignId
    ? input.campaigns.find((item) => item.id === input.project.campaignId)
    : undefined;
  const hint = `${input.project.name} ${input.caption}`;
  const date = existing?.date ?? inferEventDate(hint, input.now);
  const scheduledAt = scheduledAtFor(input.project.contentKind, date, input.now?.getTime());
  return {
    action: "schedule" as const,
    campaignId: existing?.id ?? null,
    needWaves: Boolean(existing && existing.waves.length === 0),
    campaignDraft: existing
      ? null
      : {
          name: campaignNameFromTitle(input.project.name),
          date,
          type: inferCampaignType(hint),
          oneLiner: input.project.copy.headline || input.caption.split("\n")[0] || "",
          fullIntro: input.project.copy.body || input.caption,
          cta: input.project.copy.cta || "晚上來坐一下",
          theme: input.project.visualTheme || "",
          location: input.project.location || "淡江校園",
        },
    scheduledAt,
    day: isoFromMs(scheduledAt),
    topic: input.project.copy.headline || input.caption.split("\n")[0] || input.project.name,
  };
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

const DAY_MS = 86400000;

/** 今天 19:00 已過就改明天晚上，避免一排進月曆就被到期發布吃掉。 */
export function nextTaipeiEvening(now: number) {
  const today = isoFromMs(now);
  const tonight = Date.parse(`${today}T19:00:00+08:00`);
  if (Number.isNaN(tonight)) return now + DAY_MS;
  return tonight > now ? tonight : tonight + DAY_MS;
}

export function ensureFutureSlot(scheduledAt: number, now = Date.now()) {
  if (scheduledAt > now) return scheduledAt;
  return nextTaipeiEvening(now);
}

export function scheduledAtFor(kind: ContentKind, campDate?: string, now = Date.now()): number {
  if (!campDate) return nextTaipeiEvening(now);
  const event = Date.parse(`${campDate}T19:00:00+08:00`);
  if (Number.isNaN(event)) return nextTaipeiEvening(now);
  return ensureFutureSlot(event + offsetDaysForKind(kind) * DAY_MS, now);
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

/** 月曆空波次進創作台時，對上 Create Studio 的 mode。 */
export function createModeForKind(kind: ContentKind | "event"): string | undefined {
  if (kind === "event") return undefined;
  if (kind === "carousel") return "carousel";
  if (kind === "story" || kind === "countdown") return "story";
  if (kind === "reels") return "reels";
  if (kind === "poster") return "image";
  return "post";
}

export type CreateFromCalendarSearch = {
  q: string;
  go: "1";
  campaign?: string;
  mode?: string;
};

/** 還沒有稿的波次直接生成；活動列與已有專案回 null。 */
export function createSearchForCalendarItem(
  item: Pick<CalendarItem, "title" | "kind"> & Partial<Pick<CalendarItem, "campaignId" | "projectId" | "status">>,
  campaignName?: string,
): CreateFromCalendarSearch | null {
  if (item.kind === "event" || item.projectId || item.status === "published") return null;
  const mode = createModeForKind(item.kind);
  const label = contentKindLabel(item.kind);
  const head = campaignName?.trim() ? `${campaignName.trim()} ` : "";
  return {
    q: `${head}${item.title}。做一則${label}。`.trim(),
    go: "1",
    campaign: item.campaignId,
    mode,
  };
}

export function createSearchForWave(
  campaign: Pick<ClubCampaign, "id" | "name">,
  wave: Pick<CampaignWave, "topic" | "intent" | "contentKind">,
): CreateFromCalendarSearch {
  return (
    createSearchForCalendarItem(
      {
        title: `${wave.intent} · ${wave.topic}`,
        kind: wave.contentKind,
        campaignId: campaign.id,
      },
      campaign.name,
    ) ?? {
      q: `幫我做 ${campaign.name} ${wave.topic}`,
      go: "1",
      campaign: campaign.id,
      mode: createModeForKind(wave.contentKind),
    }
  );
}
