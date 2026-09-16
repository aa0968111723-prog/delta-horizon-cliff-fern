import { CLUB } from "./identity.ts";

export type ParsedIdea = {
  raw: string;
  eventName: string;
  eventType: string;
  searchQuery: string;
  date: string;
  time: string;
  location: string;
  audience: string;
};

const NAMED_EVENTS = [
  { keys: ["浮游禪光", "禪光", "三色光", "燈會"], name: "浮游禪光", type: "夜間沈浸／三色光", search: "浮游禪光" },
  { keys: ["茶會"], name: "茶會", type: "夜間茶會", search: "茶會" },
  { keys: ["社課"], name: "社課", type: "社課", search: "社課" },
  { keys: ["迎新"], name: "迎新", type: "迎新", search: "迎新" },
  { keys: ["靜坐"], name: "夜間靜坐體驗", type: "靜坐體驗", search: "靜坐" },
] as const;

const SEARCH_HINTS = ["龜龜", "三色光", "主視覺", "招生", "互動", "淡水", "校園", "晚上", "夜間", "海報", "同學"];

const WEEKDAYS: Record<string, number> = {
  日: 0,
  天: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

function taipei(date: Date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  return new Date(utc + 8 * 3600_000);
}

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function nextWeekday(from: Date, weekday: number, weeksAhead: number) {
  const delta = (weekday - from.getDay() + 7) % 7 || (weeksAhead > 0 ? 7 : 0);
  const extra = weeksAhead > 1 ? (weeksAhead - 1) * 7 : weeksAhead === 1 && delta === 0 ? 7 : 0;
  return addDays(from, delta + extra);
}

export function ideaSearchTerms(text: string) {
  const named = NAMED_EVENTS.filter((event) => event.keys.some((key) => text.includes(key))).map((event) => event.search);
  const hints = SEARCH_HINTS.filter((item) => text.includes(item) && !named.some((term) => term === item));
  return [...new Set([...named, ...hints])];
}

export function parseIdea(raw: string, from: Date = new Date()): ParsedIdea {
  const text = raw.trim() || "下週有一場茶會";
  const local = taipei(from);
  const named = NAMED_EVENTS.find((event) => event.keys.some((key) => text.includes(key)));
  const searchQuery = ideaSearchTerms(text).join(" ") || text.slice(0, 24);

  let date = addDays(local, 7);
  const iso = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  const md = text.match(/(\d{1,2})[./月](\d{1,2})/);
  const weekday = text.match(/下?週([一二三四五六日天])/);
  if (iso) {
    date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  } else if (md) {
    date = new Date(local.getFullYear(), Number(md[1]) - 1, Number(md[2]));
    if (date < addDays(local, -1)) date = new Date(local.getFullYear() + 1, Number(md[1]) - 1, Number(md[2]));
  } else if (/今晚|今天/.test(text)) {
    date = local;
  } else if (/明天/.test(text)) {
    date = addDays(local, 1);
  } else if (/這週|本週/.test(text)) {
    date = weekday ? nextWeekday(local, WEEKDAYS[weekday[1]] ?? 3, 0) : addDays(local, 2);
  } else if (/下週|下星期/.test(text)) {
    date = weekday ? nextWeekday(local, WEEKDAYS[weekday[1]] ?? 3, 1) : addDays(local, 7);
  }

  return {
    raw: text,
    eventName: named?.name || text.replace(/[。！？\s]/g, "").slice(0, 16) || "未命名活動",
    eventType: named?.type || "活動",
    searchQuery,
    date: isoDate(date),
    time: /上午|早上/.test(text) ? "10:00" : "19:30",
    location: /淡水河|河邊/.test(text) ? "淡水河邊" : `${CLUB.campus}・活動教室`,
    audience: "淡江大學學生，尤其剛到淡水、想找一個能坐下的晚上的人",
  };
}
