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
      (idea && (row.name === idea || row.oneLiner === idea)) ||
      (guessed && (row.name === guessed || row.name.includes(guessed))),
  );
  return matches.sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

export function parseEventTime(text: string, fallback = "19:00"): string {
  const range = text.match(/(\d{1,2}:\d{2})\s*[–\-到至]\s*(\d{1,2}:\d{2})/);
  if (range) return `${range[1]}–${range[2]}`;
  const one = text.match(/(\d{1,2}:\d{2})/);
  return one?.[1] ?? fallback;
}

/** Prefill the time field from spoken copy like「下週有一場茶會」. */
export function defaultScheduleText(idea: string, now = new Date()): string {
  const date = parseEventDate(idea, now);
  const time = parseEventTime(idea);
  return `${date.replaceAll("-", "/")} ${time}`;
}
