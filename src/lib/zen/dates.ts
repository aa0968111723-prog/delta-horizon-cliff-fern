/** Parse loose club-schedule text into ISO date + clock time. */

export function parseEventDate(text: string, now = new Date()): string {
  const iso = text.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  const md = text.match(/(?:^|[^\d])(\d{1,2})[/-](\d{1,2})(?:[^\d]|$)/);
  if (md) {
    return `${now.getFullYear()}-${md[1].padStart(2, "0")}-${md[2].padStart(2, "0")}`;
  }
  const relative = relativeEventDate(text, now);
  if (relative) return relative;
  return formatIsoDate(now);
}

function relativeEventDate(text: string, now: Date): string | null {
  const d = new Date(now);
  if (/今天|今日/.test(text)) return formatIsoDate(d);
  if (/明天/.test(text)) {
    d.setDate(d.getDate() + 1);
    return formatIsoDate(d);
  }
  if (/後天/.test(text)) {
    d.setDate(d.getDate() + 2);
    return formatIsoDate(d);
  }
  if (/下週|下周|下星期|下個禮拜/.test(text)) {
    d.setDate(d.getDate() + 7);
    return formatIsoDate(d);
  }
  if (/這週|本週|這周|這個禮拜/.test(text)) return formatIsoDate(d);
  return null;
}

function formatIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function guessEventName(text: string): string {
  if (/浮游/.test(text)) return "浮游禪光";
  if (/茶會/.test(text)) return "茶會";
  if (/招新|招生|迎新/.test(text)) return "招新";
  if (/靜坐|坐禪/.test(text)) return "靜坐";
  if (/社課|工作坊/.test(text)) return "社課";
  return "";
}

/** Re-open「下週有一場茶會」onto the campaign that kit already made, not a leftover seed. */
export function campaignMatchingIdea<T extends { id: string; name: string; oneLiner?: string; updatedAt: number }>(
  campaigns: T[],
  idea: string,
  campaignId?: string | null,
): T | undefined {
  if (campaignId) {
    const hit = campaigns.find((row) => row.id === campaignId);
    if (hit) return hit;
  }
  const guessed = guessEventName(idea);
  const matches = campaigns.filter(
    (row) =>
      (idea && row.name === idea) ||
      (guessed && (row.name === guessed || row.name.includes(guessed))),
  );
  return matches.sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

/** 「用這個 Hook 再寫一篇」is a new piece. Drive / Canva files may reopen 茶會. */
export function shouldReopenCampaign(mode?: string | null, campaignId?: string | null): boolean {
  if (campaignId) return true;
  return mode !== "from-ig" && mode !== "from-image";
}

/** Extend modes keep the spoken Hook as the name — never guess 茶會 from a plan. */
export function campaignNameForIdea(opts: {
  mode?: string | null;
  campaignId?: string | null;
  eventName?: string;
  idea: string;
  planName?: string;
}): string {
  const typed = opts.eventName?.trim() ?? "";
  if (typed) return typed;
  if (shouldReopenCampaign(opts.mode, opts.campaignId)) {
    return guessEventName(opts.idea) || opts.planName?.trim() || opts.idea.slice(0, 20) || "未命名活動";
  }
  return opts.idea.slice(0, 20) || "未命名活動";
}

export function parseEventTime(text: string, fallback = "19:00"): string {
  const range = text.match(/(\d{1,2}:\d{2})\s*[–\-到至]\s*(\d{1,2}:\d{2})/);
  if (range) return `${range[1]}–${range[2]}`;
  const one = text.match(/(\d{1,2}:\d{2})/);
  return one?.[1] ?? fallback;
}

/** Spoken or written when/where — not a year in a filename like「2025 茶會現場」. */
export function hasScheduleCue(text: string) {
  return /今天|今日|明天|後天|下週|下周|下星期|下個禮拜|這週|本週|這周|這個禮拜/.test(text)
    || /(\d{4})[-/.年]\d{1,2}/.test(text)
    || /(?:^|[^\d])\d{1,2}[/-]\d{1,2}(?:[^\d]|$)/.test(text);
}

/** Drive / Canva 歷屆檔有活動名、沒有要辦的日子 → 當成要開一場新的，不要排今天. */
export function isArchivalEventIdea(text: string) {
  return Boolean(guessEventName(text)) && !hasScheduleCue(text);
}

/** Prefill the time field from spoken copy like「下週有一場茶會」. */
export function defaultScheduleText(idea: string, now = new Date()): string {
  const date = parseEventDate(isArchivalEventIdea(idea) ? "下週" : idea, now);
  const time = parseEventTime(idea);
  return `${date.replaceAll("-", "/")} ${time}`;
}

/**
 * Reopening 茶會 from a 2025 Drive file must not keep a leftover「today」date.
 * Opening the same campaign from Calendar keeps the date that was already set.
 */
export function preferredScheduleText(
  idea: string,
  opts?: {
    existing?: { date?: string; time?: string } | null;
    campaignId?: string | null;
    now?: Date;
  },
): string {
  const now = opts?.now ?? new Date();
  const next = defaultScheduleText(idea, now);
  const existing = opts?.existing;
  if (!existing?.date) return next;
  const keep = `${existing.date.replaceAll("-", "/")} ${existing.time ?? ""}`.trim();
  if (opts?.campaignId) return keep;
  if (hasScheduleCue(idea)) return next;
  if (isArchivalEventIdea(idea) && existing.date <= formatIsoDate(now)) return next;
  return keep;
}

/** Host-UTC 19:00 was stored as 03:00 in 淡水. Shift once; 19:00 淡水 is a no-op. */
export function shiftHostEveningToTaipei(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return ms;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Taipei",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(ms)),
  );
  if (hour > 5) return ms;
  return ms - 8 * 3_600_000;
}

export function taipeiParts(ms: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour").padStart(2, "0"),
    minute: get("minute").padStart(2, "0"),
  };
}

export function taipeiDayKey(ms: number) {
  const part = taipeiParts(ms);
  return `${part.year}-${part.month}-${part.day}`;
}

export function sameTaipeiDay(a: number, b: number) {
  return taipeiDayKey(a) === taipeiDayKey(b);
}

/** Agenda / Home clocks are 淡水 evenings, not the host timezone. */
export function formatTaipeiClock(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const part = taipeiParts(ms);
  return `${Number(part.month)}/${Number(part.day)} ${part.hour}:${part.minute}`;
}

export function datetimeLocalTaipei(ms: number) {
  const part = taipeiParts(ms);
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`;
}

/** datetime-local has no zone; the club always means 淡水. */
export function parseDatetimeLocalTaipei(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return Number.NaN;
  return Date.parse(`${match[1]}T${match[2]}:00+08:00`);
}
