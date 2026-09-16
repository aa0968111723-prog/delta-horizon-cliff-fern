import type { Campaign, CampaignWave, ContentItem, ContentType, WaveRole } from "./types.ts";
import { addDaysIso, todayIso } from "../zen/context.ts";
import { HOOKS_BY_PAIN } from "../zen/voice.ts";
import { waveDateIso } from "./campaigns.ts";

/** 內容的「節奏角色」：宣傳 / 生活 / 互動 / 知識 / 故事 / 倒數。 */
export type RhythmKind = "promo" | "life" | "interactive" | "knowledge" | "story" | "countdown" | "recap";

const TYPE_TO_RHYTHM: Record<ContentType, RhythmKind> = {
  "ig-post": "promo",
  carousel: "promo",
  story: "promo",
  reels: "promo",
  threads: "life",
  line: "promo",
  poster: "promo",
  recap: "recap",
  "member-story": "story",
  countdown: "countdown",
  qa: "interactive",
  poll: "interactive",
  knowledge: "knowledge",
};

const ROLE_TO_RHYTHM: Partial<Record<WaveRole, RhythmKind>> = {
  life: "life",
  interactive: "interactive",
  knowledge: "knowledge",
  story: "story",
  countdown: "countdown",
  recap: "recap",
  empathy: "life",
};

export const RHYTHM_LABEL: Record<RhythmKind, string> = {
  promo: "宣傳",
  life: "生活",
  interactive: "互動",
  knowledge: "知識",
  story: "故事",
  countdown: "倒數",
  recap: "回顧",
};

export function rhythmOf(content: ContentItem, campaigns: Campaign[]): RhythmKind {
  const wave = campaigns.flatMap((c) => c.strategy?.waves ?? []).find((w) => w.contentId === content.id);
  if (wave && ROLE_TO_RHYTHM[wave.role]) return ROLE_TO_RHYTHM[wave.role]!;
  if (!content.campaignId && (content.type === "ig-post" || content.type === "carousel" || content.type === "story")) return "life";
  return TYPE_TO_RHYTHM[content.type];
}

export type RhythmWarning = { afterContentId: string; dateIso: string; message: string; suggestType: ContentType; suggestHook: string };

/** 連續三篇以上都是宣傳 → 建議在中間插一篇生活 / 互動。 */
export function rhythmWarnings(contents: ContentItem[], campaigns: Campaign[]): RhythmWarning[] {
  const scheduled = contents
    .filter((c) => c.scheduledAt && c.status !== "published")
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0));
  const out: RhythmWarning[] = [];
  let run: ContentItem[] = [];
  for (const c of scheduled) {
    const k = rhythmOf(c, campaigns);
    if (k === "promo" || k === "countdown") {
      run.push(c);
      if (run.length === 3) {
        const mid = run[1];
        const date = new Date(mid.scheduledAt!);
        const iso = todayIso(date);
        out.push({
          afterContentId: mid.id,
          dateIso: addDaysIso(iso, 1),
          message: "連續三篇都是活動宣傳，IG 會像一直在招生。建議中間插一篇生活或互動內容。",
          suggestType: run.length % 2 ? "poll" : "knowledge",
          suggestHook: HOOKS_BY_PAIN.stress[0],
        });
      }
    } else {
      run = [];
    }
  }
  return out;
}

/** AI 自動排程建議：依活動類型決定宣傳期長度，避開同日、優先晚上 20:00–21:30。 */
export function suggestScheduleForCampaign(campaign: Campaign, existing: ContentItem[]): { wave: CampaignWave; at: number }[] {
  if (!campaign.strategy) return [];
  const busyDays = new Set(existing.filter((c) => c.scheduledAt).map((c) => todayIso(new Date(c.scheduledAt!))));
  const out: { wave: CampaignWave; at: number }[] = [];
  const sorted = [...campaign.strategy.waves].sort((a, b) => a.offsetDays - b.offsetDays);
  for (const wave of sorted) {
    if (wave.contentId) continue;
    let iso = waveDateIso(campaign, wave);
    let guard = 0;
    while (busyDays.has(iso) && guard < 3 && wave.offsetDays < 0) {
      iso = addDaysIso(iso, -1);
      guard += 1;
    }
    busyDays.add(iso);
    const hour = wave.contentType === "story" || wave.role === "dayof" ? 12 : wave.role === "countdown" ? 21 : 20;
    out.push({ wave, at: new Date(`${iso}T${String(hour).padStart(2, "0")}:00:00`).getTime() });
  }
  return out;
}

/** 下一個空的晚上（給快速新增用）。 */
export function nextFreeEvening(existing: ContentItem[], fromIso = todayIso()): number {
  const busy = new Set(existing.filter((c) => c.scheduledAt).map((c) => todayIso(new Date(c.scheduledAt!))));
  let iso = fromIso;
  for (let i = 0; i < 30 && busy.has(iso); i += 1) iso = addDaysIso(iso, 1);
  return new Date(`${iso}T20:00:00`).getTime();
}
