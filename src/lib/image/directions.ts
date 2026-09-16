import type { CreativeDirection, FormatId } from "../studio/types.ts";

export type DirectionExtra = {
  formatId?: FormatId;
  styleMemory?: string;
  relatedNotes?: string;
};

const FORMAT_HINT: Record<string, { composition: string; typeDirection: string; prompt: string }> = {
  "feed-portrait": {
    composition: "上半畫面、下半字卡",
    typeDirection: "兩行大標",
    prompt: "4:5 Instagram feed, headline in lower third, stay space at top",
  },
  "feed-square": {
    composition: "置中主體，字在下緣",
    typeDirection: "一句短標",
    prompt: "1:1 Instagram feed, centered subject, short Chinese headline",
  },
  "story": {
    composition: "上下安全區留空，字偏中下",
    typeDirection: "一句大字",
    prompt: "9:16 Instagram story, keep top and bottom UI safe zones empty, large type",
  },
  "reels-cover": {
    composition: "中間主體，上下給 Reels UI",
    typeDirection: "超短標",
    prompt: "9:16 Reels cover, subject in center, no tiny text, UI safe zones empty",
  },
  threads: {
    composition: "一句字＋簡單畫面",
    typeDirection: "口語一句",
    prompt: "1:1 Threads image, one spoken Chinese line, simple campus night",
  },
  "line-promo": {
    composition: "時間地點很大、活動名清楚",
    typeDirection: "活動名＋時間",
    prompt: "square LINE promo, event name and time readable at a glance",
  },
};

function formatHint(formatId?: FormatId) {
  return FORMAT_HINT[formatId || "feed-portrait"] ?? FORMAT_HINT["feed-portrait"]!;
}

function promptTail(idea: string, title: string, extra: DirectionExtra) {
  const format = formatHint(extra.formatId);
  const memory = extra.styleMemory ? `learned club style: ${extra.styleMemory}` : "";
  const related = extra.relatedNotes
    ? `extend these sources, do not copy layouts: ${extra.relatedNotes}`
    : "extend Brand Memory / turtle motif and tricolor lights, do not copy old posters";
  return `${format.prompt}. ${memory} ${related}. idea: ${idea}, event: ${title}`.replace(/\s+/g, " ").trim();
}

export function mockDirections(idea: string, eventName = "", learnedHook = "", extra: DirectionExtra = {}): CreativeDirection[] {
  const title = eventName || idea.slice(0, 10);
  const hook = learnedHook.includes("？") ? learnedHook : "";
  const format = formatHint(extra.formatId);
  const tail = promptTail(idea, title, extra);
  return [
    {
      id: "dir_a",
      name: "坐下",
      concept: "學生生活問句＋室內暖光。",
      palette: "宣紙、苔綠",
      composition: format.composition,
      typeDirection: format.typeDirection,
      imagePrompt: `Quiet Tamkang university evening, student sitting, warm paper light, soft cyan amber rose glow, not temple, not golden, editorial photo, ${tail}`,
      headline: hook || "最近是不是很久沒坐下來？",
      subhead: title,
    },
    {
      id: "dir_b",
      name: "淡水晚上",
      concept: "捷運風 → 教室燈。",
      palette: "水光、暖光",
      composition: `${format.composition}；深色上緣`,
      typeDirection: format.typeDirection,
      imagePrompt: `Tamsui night after MRT, wind, then indoor club lights, naturalistic Taiwan campus, no cyberpunk neon, ${tail}`,
      headline: "風比較大的晚上",
      subhead: title,
    },
    {
      id: "dir_c",
      name: "帶朋友",
      concept: "兩人側影，降低第一次壓力。",
      palette: "玫瑰光、宣紙",
      composition: `${format.composition}；人物不要正臉網紅`,
      typeDirection: "口語一句",
      imagePrompt: `two college students sitting together in a dim campus room, small turtle motif, candid, photoreal, not AI-smooth skin, ${tail}`,
      headline: "帶朋友來也可以",
      subhead: title,
    },
  ];
}

export function directionsOrMock(
  idea: string,
  eventName = "",
  parsed?: CreativeDirection[] | null,
  learnedHook = "",
  extra: DirectionExtra = {},
) {
  const directions = parsed?.filter((row) => row.imagePrompt && row.headline) ?? [];
  return directions.length ? directions : mockDirections(idea, eventName, learnedHook, extra);
}
