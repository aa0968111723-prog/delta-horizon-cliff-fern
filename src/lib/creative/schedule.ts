import { daysUntil } from "../club/season.ts";
import { uid } from "../studio/ids.ts";
import type { ContentKind, ProjectStatus } from "../studio/types.ts";
import type { CampaignType, CampaignWave, ClubCampaign } from "./types.ts";

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
