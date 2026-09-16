import { CLUB, DEFAULT_CTAS, DEFAULT_HASHTAGS } from "./identity.ts";
import type { ContentKind, CreativeSourceKind } from "../studio/types.ts";

export type MemoryItem = {
  id: string;
  source: CreativeSourceKind;
  title: string;
  subtitle: string;
  tags: string[];
  kind: ContentKind | "asset";
  date: string;
  thumb: string;
  caption?: string;
  notes: string;
};

export const FEATURED_EVENT = {
  id: "camp_floating_light",
  name: "浮游禪光",
  type: "夜間沈浸／三色光",
  date: "2026-09-24",
  time: "19:30–21:30",
  location: "淡江校園・活動教室",
  oneLiner: "最近是不是很久沒有好好坐下來？",
  description: "一個給淡江學生的晚上：燈先亮，人慢慢到。沒有人要你懂禪，帶朋友來也可以。",
  theme: "在人際和壓力裡，找到一個可以坐下的位置",
  studentPain: "開學後行程被填滿，連休息都有點罪惡感",
  cta: "來坐一下",
  signupUrl: "",
};

export function featuredCampaignIdea(event = FEATURED_EVENT) {
  return `${event.oneLiner}\n${event.name}｜${event.date} ${event.time}｜${event.location}`;
}

export const IG_DNA = {
  palette: ["亞麻紙色", "苔綠", "淡水暮光", "三色光（青／暖／玫瑰）"],
  activities: ["茶會", "社課", "浮游禪光", "迎新", "夜間靜坐體驗"],
  voice: "先講學生生活，再帶活動。短句可以，但不要每句都像金句。",
  captionLength: "80–160 字，Hook 獨立成行",
  hashtags: DEFAULT_HASHTAGS,
  visuals: ["夜間室內暖光", "龜龜", "三色光", "學生側臉或手", "淡水不是明信片風"],
  imageTypes: ["現場照片", "主視覺海報", "限動色塊", "社員互動"],
  ctas: DEFAULT_CTAS,
  studentPreference: "停得下來的第一句、清楚的時間地點、可以找朋友一起來",
};

export const BRAND_MEMORY = {
  logo: "圓角苔綠底，禪字與小龜",
  mascot: CLUB.mascot,
  lights: CLUB.lights,
  colors: ["#2F5F56", "#F6F1E8", "#7EB8C9", "#E0B07A", "#D9A3A3"],
  fonts: ["Noto Serif TC 標題", "Noto Sans TC 內文"],
  likes: ["留白", "夜間暖光", "學生生活感", "手寫感的短句"],
  dislikes: ["廟宇廣告", "金色佛光", "過度 AI 皮膚", "堆滿勵志詞"],
  idea: "讓一個人，也能像一個完整創意團隊，穩定經營淡江禪學社的 IG。",
};

export const MEMORY_ITEMS: MemoryItem[] = [
  {
    id: "drv_tea_2025",
    source: "drive",
    title: "2025 夜間茶會照片",
    subtitle: "Google Drive / 2025 茶會",
    tags: ["茶會", "晚上", "同學互動", "室內"],
    kind: "asset",
    date: "2025-11-12",
    thumb: "/seed/tea.svg",
    notes: "很多人圍坐、燈光偏暖，適合當主視覺參考而不是直接重貼。",
  },
  {
    id: "drv_turtle",
    source: "drive",
    title: "龜龜角色素材",
    subtitle: "Google Drive / 品牌",
    tags: ["龜龜", "logo", "吉祥物"],
    kind: "asset",
    date: "2025-08-01",
    thumb: "/seed/turtle.svg",
    notes: "品牌記憶核心。新主視覺可入鏡，但不要變成兒童卡通。",
  },
  {
    id: "drv_floating_pack",
    source: "drive",
    title: "浮游禪光文宣資料",
    subtitle: "Google Drive / 2025 浮游禪光",
    tags: ["浮游禪光", "三色光", "企劃"],
    kind: "poster",
    date: "2025-09-20",
    thumb: "/seed/tricolor.svg",
    notes: "歷屆文案偏正式，新的一版要更學生。",
  },
  {
    id: "cnv_tea_poster",
    source: "canva",
    title: "茶會海報",
    subtitle: "Canva / 茶會",
    tags: ["茶會", "海報", "招生版型"],
    kind: "poster",
    date: "2025-10-02",
    thumb: "/seed/tea.svg",
    notes: "文字層級清楚，配色偏深。可延續留白，不要複製排版。",
  },
  {
    id: "cnv_recruit",
    source: "canva",
    title: "招生活動版型",
    subtitle: "Canva / 招生",
    tags: ["招生", "版型", "IG"],
    kind: "ig-post",
    date: "2026-02-18",
    thumb: "/seed/campus.svg",
    notes: "適合改成「找一個可以坐下的社團」而不是招生簡章。",
  },
  {
    id: "cnv_lights",
    source: "canva",
    title: "三色光限動模板",
    subtitle: "Canva / 三色光",
    tags: ["三色光", "Story", "夜間"],
    kind: "story",
    date: "2025-09-18",
    thumb: "/seed/tricolor.svg",
    notes: "三色光是氣氛，不是科幻霓虹。",
  },
  {
    id: "ig_20250918",
    source: "instagram",
    title: "有時候只是想有人陪著坐",
    subtitle: "Instagram / 2025-09-18",
    tags: ["情緒", "夜間", "Hook"],
    kind: "ig-post",
    date: "2025-09-18",
    thumb: "/seed/tamsui.svg",
    caption: "有時候我們需要的不是答案，只是一個安靜的晚上。\n下週三，浮游禪光。人到了就好。",
    notes: "收藏數相對高。Hook 有效，活動資訊可以再早一點出現。",
  },
  {
    id: "ig_tea_recap",
    source: "instagram",
    title: "茶會回顧輪播",
    subtitle: "Instagram / 2025-11-13",
    tags: ["茶會", "Carousel", "回顧"],
    kind: "carousel",
    date: "2025-11-13",
    thumb: "/seed/tea.svg",
    caption: "來的人比想像中多。有人問「我不會禪也可以嗎？」\n可以。",
    notes: "回顧比預告更有停留。新活動可先用舊現場感覺，再換主視覺。",
  },
  {
    id: "gen_sit_down",
    source: "generated",
    title: "坐下來主視覺草稿",
    subtitle: "AI Generated",
    tags: ["AI生成", "主視覺"],
    kind: "ig-post",
    date: "2026-09-10",
    thumb: "/seed/campus.svg",
    notes: "構圖可用，人物皮膚偏 AI，實務上要混現場照片。",
  },
];

export function searchMemory(query: string): MemoryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return MEMORY_ITEMS;
  const cleaned = q.replace(/的照片|照片|素材|檔案|文宣|幫我|一下|找/g, " ");
  const parts = cleaned.split(/\s+/).filter((part) => part.length >= 1 && !["適合", "相關", "以前"].includes(part));
  const keys = parts.length ? parts : [q];
  return MEMORY_ITEMS.filter((item) => {
    const blob = [item.title, item.subtitle, item.notes, item.caption, ...item.tags].join(" ").toLowerCase();
    return keys.some((part) => blob.includes(part) || fuzzyMatch(blob, part));
  }).sort((a, b) => score(b, q) - score(a, q) + rank(b, keys) - rank(a, keys));
}

function rank(item: MemoryItem, keys: string[]) {
  const blob = [item.title, item.subtitle, item.notes, item.caption, ...item.tags].join(" ").toLowerCase();
  return keys.reduce((n, part) => n + (blob.includes(part) || fuzzyMatch(blob, part) ? 2 : 0), 0);
}

function fuzzyMatch(blob: string, part: string) {
  if (part.includes("茶") && blob.includes("茶")) return true;
  if ((part.includes("龜") || part.includes("turtle")) && blob.includes("龜")) return true;
  if (part.includes("浮游") && blob.includes("浮游")) return true;
  if (part.includes("光") && blob.includes("三色")) return true;
  if (part.includes("晚上") && (blob.includes("夜") || blob.includes("晚"))) return true;
  if (part.includes("互動") && blob.includes("互動")) return true;
  if (part.includes("主視覺") && blob.includes("主視覺")) return true;
  return false;
}

function score(item: MemoryItem, q: string) {
  let n = 0;
  if (item.title.includes(q)) n += 5;
  if (item.tags.some((tag) => q.includes(tag) || tag.includes(q))) n += 3;
  if (item.notes.includes(q)) n += 1;
  return n;
}
