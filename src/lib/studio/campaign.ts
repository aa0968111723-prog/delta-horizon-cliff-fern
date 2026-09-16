import { eventKindLabel } from "@/lib/zen/club";
import { uid } from "./ids";
import type { Campaign, CampaignWave, ContentKind, PlanSource } from "./types";

export function emptyCampaign(): Campaign {
  return {
    id: uid("camp"),
    name: "",
    kind: "class",
    date: "",
    time: "",
    location: "",
    oneLiner: "",
    intro: "",
    theme: "",
    painPoint: "",
    cta: "來坐一下",
    signupUrl: "",
    coverAssetId: null,
    assetIds: [],
    audienceIds: [],
    axis: "",
    directions: [],
    waves: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    planSource: null,
  };
}

export function migrateCampaign(raw: Partial<Campaign> | null | undefined): Campaign {
  const base = emptyCampaign();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    assetIds: Array.isArray(raw.assetIds) ? raw.assetIds : [],
    audienceIds: Array.isArray(raw.audienceIds) ? raw.audienceIds : [],
    directions: Array.isArray(raw.directions) ? raw.directions : [],
    waves: Array.isArray(raw.waves) ? raw.waves.map(migrateWave) : [],
    createdAt: raw.createdAt ?? base.createdAt,
    updatedAt: raw.updatedAt ?? base.updatedAt,
    planSource: raw.planSource ?? null,
  };
}

function migrateWave(raw: Partial<CampaignWave>): CampaignWave {
  return {
    id: raw.id || uid("wave"),
    offsetDays: typeof raw.offsetDays === "number" ? raw.offsetDays : 0,
    stage: raw.stage ?? "",
    title: raw.title ?? "",
    kind: (raw.kind as ContentKind) ?? "ig-post",
    hook: raw.hook ?? "",
    note: raw.note ?? "",
    contentId: raw.contentId ?? null,
  };
}

export function campaignTitle(campaign: Campaign): string {
  return campaign.name.trim() || `未命名${eventKindLabel(campaign.kind)}`;
}

/** 活動日的當地午夜時間戳，沒填日期回 null。 */
export function campaignDateMs(campaign: Campaign): number | null {
  if (!campaign.date) return null;
  const parsed = Date.parse(`${campaign.date}T00:00:00`);
  return Number.isNaN(parsed) ? null : parsed;
}

const DAY = 86_400_000;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 距離活動還有幾天。負數代表已經過去。 */
export function daysUntil(campaign: Campaign, now: number = Date.now()): number | null {
  const target = campaignDateMs(campaign);
  if (target == null) return null;
  return Math.round((startOfDay(target) - startOfDay(now)) / DAY);
}

export function countdownLabel(campaign: Campaign, now: number = Date.now()): string {
  const days = daysUntil(campaign, now);
  if (days == null) return "還沒定日期";
  if (days === 0) return "就是今天";
  if (days === 1) return "明天";
  if (days > 0) return `還有 ${days} 天`;
  if (days === -1) return "昨天結束";
  return `已結束 ${Math.abs(days)} 天`;
}

export function formatCampaignDate(campaign: Campaign): string {
  if (!campaign.date) return "未定";
  const [, m, d] = campaign.date.split("-");
  if (!m || !d) return campaign.date;
  return `${Number(m)}/${Number(d)}`;
}

/** 排序：即將到來的優先，接著是最近結束的。 */
export function sortByUpcoming(list: Campaign[], now: number = Date.now()): Campaign[] {
  return [...list].sort((a, b) => {
    const da = daysUntil(a, now);
    const db = daysUntil(b, now);
    if (da == null && db == null) return b.updatedAt - a.updatedAt;
    if (da == null) return 1;
    if (db == null) return -1;
    const wa = da >= 0 ? da : 1000 - da;
    const wb = db >= 0 ? db : 1000 - db;
    return wa - wb;
  });
}

export function nextCampaign(list: Campaign[], now: number = Date.now()): Campaign | null {
  const upcoming = sortByUpcoming(list, now).filter((c) => {
    const days = daysUntil(c, now);
    return days == null || days >= 0;
  });
  return upcoming[0] ?? null;
}

/**
 * 本機的宣傳節奏草稿。AI 會依活動類型與宣傳期長度自己調，
 * 這份只是沒有 AI 時也能動的預設，並且刻意穿插生活／互動內容，
 * 避免 IG 看起來一直在招生。
 */
export function defaultWavePlan(campaign: Campaign): CampaignWave[] {
  const name = campaignTitle(campaign);
  const pain = campaign.painPoint.trim() || "最近很累，卻說不出為什麼";
  const one = campaign.oneLiner.trim() || `${name}，一個可以慢下來的晚上`;
  const rows: Omit<CampaignWave, "id" | "contentId">[] = [
    {
      offsetDays: -14,
      stage: "預熱",
      title: "先丟一個問題，不提活動",
      kind: "ig-post",
      hook: `${pain}？`,
      note: "只講狀態，不放活動資訊。目的是讓人覺得被說中。",
    },
    {
      offsetDays: -10,
      stage: "情緒共鳴",
      title: "把那個狀態講得更具體",
      kind: "carousel",
      hook: "你不是懶，只是很久沒有真正休息了",
      note: "輪播四到五頁，最後一頁才輕輕提到有這樣一個活動。",
    },
    {
      offsetDays: -7,
      stage: "主視覺",
      title: `${name} 主視覺公開`,
      kind: "ig-post",
      hook: one,
      note: "第一次完整露出時間、地點。主視覺要能單獨被看懂。",
    },
    {
      offsetDays: -5,
      stage: "活動介紹",
      title: "當天會發生什麼事",
      kind: "carousel",
      hook: "第一次來，會經歷什麼？",
      note: "一頁一件事：到場、坐下、做什麼、幾點結束。降低不確定感。",
    },
    {
      offsetDays: -4,
      stage: "生活",
      title: "穿插一則和活動無關的生活內容",
      kind: "knowledge",
      hook: "三分鐘的呼吸練習，考前也可以用",
      note: "刻意不推活動，讓版面不要一直像在招生。",
    },
    {
      offsetDays: -3,
      stage: "參加理由",
      title: "社員說一句真的話",
      kind: "member-story",
      hook: "我第一次來的時候也很尬",
      note: "真人視角比社團自我介紹有效。",
    },
    {
      offsetDays: -2,
      stage: "互動",
      title: "限動投票",
      kind: "poll",
      hook: "你最近最需要的是？",
      note: "投票貼圖，兩到三個選項，順便看學生狀態。",
    },
    {
      offsetDays: -1,
      stage: "倒數",
      title: "明天見",
      kind: "countdown",
      hook: "明天晚上，位子留著",
      note: "限動，一張圖講完時間地點。",
    },
    {
      offsetDays: 0,
      stage: "當日",
      title: "當天現場限動",
      kind: "story",
      hook: "現在開始",
      note: "開始前一小時提醒，活動中拍兩三張現場。",
    },
    {
      offsetDays: 2,
      stage: "回顧",
      title: `${name} 回顧`,
      kind: "recap",
      hook: "昨天有人說，這是這週唯一沒有滑手機的一小時",
      note: "回顧要放人的反應，順便接下一次的時間。",
    },
  ];

  const days = daysUntil(campaign) ?? 14;
  const window = days >= 0 ? days : 14;
  return rows
    .filter((row) => row.offsetDays >= 0 || Math.abs(row.offsetDays) <= Math.max(3, window))
    .map((row) => ({ ...row, id: uid("wave"), contentId: null }));
}

export function waveDateMs(campaign: Campaign, wave: CampaignWave): number | null {
  const base = campaignDateMs(campaign);
  if (base == null) return null;
  return base + wave.offsetDays * DAY;
}

export function waveDateLabel(campaign: Campaign, wave: CampaignWave): string {
  const ms = waveDateMs(campaign, wave);
  if (ms == null) return wave.offsetDays === 0 ? "活動當天" : `活動${wave.offsetDays < 0 ? "前" : "後"} ${Math.abs(wave.offsetDays)} 天`;
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function withPlanSource(campaign: Campaign, source: PlanSource): Campaign {
  return { ...campaign, planSource: source, updatedAt: Date.now() };
}
