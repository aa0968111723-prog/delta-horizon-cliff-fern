import type { Campaign, Project } from "./types.ts";

export type ScheduleSuggestion = {
  projectId: string;
  at: number;
  reason: string;
};

const DEFAULT_HOUR = 19;
const DAY = 86_400_000;

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function atLocalTime(dayMs: number, hour = DEFAULT_HOUR, minute = 0): number {
  const d = new Date(dayMs);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

/** 把節奏拖到某天時，算出相對活動日的 offsetDays。 */
export function offsetDaysFromEventDate(eventDate: string, dayMs: number): number | null {
  if (!eventDate) return null;
  const parsed = Date.parse(`${eventDate}T00:00:00`);
  if (Number.isNaN(parsed)) return null;
  return Math.round((startOfLocalDay(dayMs) - startOfLocalDay(parsed)) / DAY);
}

/** 活動時間字串（19:00、晚上七點）→ 當天發文時刻。解不出來就晚上七點。 */
export function postingTime(campaign?: Pick<Campaign, "time"> | null): { hour: number; minute: number } {
  const raw = campaign?.time?.trim() ?? "";
  const match = raw.match(/(\d{1,2})\s*[:：]\s*(\d{2})/);
  if (match) {
    return { hour: Math.min(23, Number(match[1])), minute: Number(match[2]) };
  }
  return { hour: DEFAULT_HOUR, minute: 0 };
}

function waveDateMs(campaign: Campaign, wave: { offsetDays: number }): number | null {
  if (!campaign.date) return null;
  const parsed = Date.parse(`${campaign.date}T00:00:00`);
  if (Number.isNaN(parsed)) return null;
  return parsed + wave.offsetDays * DAY;
}

function nextFreeEvening(now: number, occupied: Set<number>, hour = DEFAULT_HOUR, minute = 0): number | null {
  const first = new Date(now);
  first.setHours(hour, minute, 0, 0);
  if (first.getTime() <= now) first.setTime(first.getTime() + DAY);
  for (let i = 0; i < 60; i++) {
    const at = first.getTime() + i * DAY;
    if (!occupied.has(startOfLocalDay(atLocalTime(at, hour, minute)))) return at;
  }
  return null;
}

function waveLinkedIds(campaigns: Campaign[]): Set<string> {
  const ids = new Set<string>();
  for (const campaign of campaigns) {
    for (const wave of campaign.waves) {
      if (wave.contentId) ids.add(wave.contentId);
    }
  }
  return ids;
}

/**
 * 依宣傳節奏排出建議發文時間。
 * 1. 已掛上波次的內容對齊活動日 ± offset，用活動時間（預設 19:00）。
 * 2. 還沒排程、狀態是創作中／完成的內容，補到沒有稿的晚上。
 * 已發布的不動；已排程但沒掛波次的也不改。
 */
export function suggestSchedule(
  projects: Project[],
  campaigns: Campaign[],
  now: number = Date.now(),
): ScheduleSuggestion[] {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const linked = waveLinkedIds(campaigns);
  const suggestions: ScheduleSuggestion[] = [];
  const claimed = new Set<string>();
  const occupied = new Set<number>();

  for (const project of projects) {
    if (project.status === "published") {
      const stamp = project.publishedAt ?? project.scheduledAt;
      if (stamp) occupied.add(startOfLocalDay(stamp));
      continue;
    }
    if (project.scheduledAt && !linked.has(project.id)) {
      occupied.add(startOfLocalDay(project.scheduledAt));
    }
  }

  for (const campaign of campaigns) {
    const { hour, minute } = postingTime(campaign);
    for (const wave of campaign.waves) {
      if (!wave.contentId) continue;
      const project = byId.get(wave.contentId);
      if (!project || project.status === "published") continue;
      const waveMs = waveDateMs(campaign, wave);
      if (waveMs == null) continue;
      let at = atLocalTime(waveMs, hour, minute);
      let reason = `${campaign.name} · ${wave.stage}`;
      if (at < now) {
        const shifted = nextFreeEvening(now, occupied, hour, minute);
        if (shifted == null) continue;
        at = shifted;
        reason = `${campaign.name} · ${wave.stage}（活動日已過，改到最近空檔）`;
      }
      occupied.add(startOfLocalDay(at));
      claimed.add(project.id);
      suggestions.push({ projectId: project.id, at, reason });
    }
  }

  const leftovers = projects
    .filter(
      (project) =>
        (project.status === "making" || project.status === "done") &&
        !project.scheduledAt &&
        !claimed.has(project.id),
    )
    .sort((a, b) => a.updatedAt - b.updatedAt);

  for (const project of leftovers) {
    const at = nextFreeEvening(now, occupied);
    if (at == null) break;
    occupied.add(startOfLocalDay(at));
    suggestions.push({ projectId: project.id, at, reason: "空檔晚上" });
  }

  return suggestions;
}
