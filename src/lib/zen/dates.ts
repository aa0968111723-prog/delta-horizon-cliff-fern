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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function parseEventTime(text: string, fallback = "19:00"): string {
  const range = text.match(/(\d{1,2}:\d{2})\s*[–\-到至]\s*(\d{1,2}:\d{2})/);
  if (range) return `${range[1]}–${range[2]}`;
  const one = text.match(/(\d{1,2}:\d{2})/);
  return one?.[1] ?? fallback;
}
