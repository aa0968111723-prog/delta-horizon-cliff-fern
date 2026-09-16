import type { EventKind, VisualDirection } from "../studio/types.ts";
import { HOOK_EXAMPLES, academicBeat, type AcademicBeat } from "./context.ts";
import type { IgLearning } from "./insights.ts";
import { eventKindFromText } from "./schedule.ts";

/** Abstracted visual / copy patterns — never a swipe file of other clubs. */

export type InspirationCard = {
  id: string;
  title: string;
  lens: string;
  composition: string;
  palette: string;
  layout: string;
  hookShape: string;
  form: string;
  zenUse: string;
  promptEn: string;
  headlineHint: string;
};

export type InspirationResearch = {
  beat: AcademicBeat;
  eventKind: EventKind;
  cards: InspirationCard[];
  composition: string;
  palette: string;
  layout: string;
  hookShape: string;
  form: string;
  zenUse: string;
  fromOwnIg: string;
  promptBlock: string;
};

export const INSPIRATION: InspirationCard[] = [
  {
    id: "night-pause",
    title: "夜晚停一下",
    lens: "大學生社群常見：把『忙』拍成空氣，而不是行程表。",
    composition: "上半留空、下半一句人話，主體偏角落。",
    palette: "低飽和夜色 + 一點暖光。",
    layout: "下三分之一放問句，上方給光，不要標題牆。",
    hookShape: "先問身體狀態，再提活動。",
    form: "單張 4:5 或限動第一則。",
    zenUse: "轉成淡水晚上、坐下來、三色光，而不是寺廟圖。",
    promptEn:
      "Quiet Tamsui night near Tamkang campus, three soft orbs of amber teal and dusk-violet light, airy photographic, young students implied not posed, no temple, no incense, no monk robes",
    headlineHint: "最近是不是很久沒有好好坐下來？",
  },
  {
    id: "friend-seat",
    title: "空一個位子",
    lens: "校園活動海報裡，『可以找人一起來』比 Logo 更能停滑。",
    composition: "兩到三人局部、臉不一定清楚，留座位或杯子。",
    palette: "暖紙色 + 水色。",
    layout: "主體偏一側，空位當成 CTA。",
    hookShape: "用『要不要一起』代替『誠摯邀請』。",
    form: "Carousel 第 5 頁 CTA。",
    zenUse: "茶會、社員故事，龜龜可當安靜吉祥物。",
    promptEn:
      "two students sitting with tea, empty seat beside, Tamkang campus interior, soft window light, calm documentary, not stock-photo smile",
    headlineHint: "可以自己來？",
  },
  {
    id: "carousel-breath",
    title: "輪播要會呼吸",
    lens: "有效的校園 Carousel 通常 5–6 頁，每頁只做一件事。",
    composition: "封面一句話 → 情境 → 痛點 → 內容 → CTA，不要每頁都是海報。",
    palette: "全輯同一底色，只換層級。",
    layout: "封面幾乎無字以外的資訊，內頁才給時間地點。",
    hookShape: "封面不要活動全名堆上去。",
    form: "IG Carousel。",
    zenUse: "浮游禪光、茶會、招生都走這條骨架，文案換學生生活。",
    promptEn:
      "editorial carousel cover, one spoken line in the lower third, Tamkang night air, paper texture, three-color light, not a poster dump",
    headlineHint: "大學生活很自由，但你最近真的有比較快樂嗎？",
  },
  {
    id: "reels-first-seconds",
    title: "前三秒是身體",
    lens: "Reels Cover 先讓人感到光線或呼吸，而不是標題牆。",
    composition: "中心一個光源或一個坐姿剪影，字極少。",
    palette: "深底 + 三色光點。",
    layout: "9:16 中心光，字幕晚一點出現。",
    hookShape: "旁白先講感覺，3 秒後才報活動名。",
    form: "Reels 0–3s + 封面。",
    zenUse: "避免木魚特寫開場。",
    promptEn:
      "Reels cover, one sitting silhouette and a small light, Tamkang night, almost no type, not wooden fish, not temple",
    headlineHint: "有時候我們需要的不是答案，只是一個安靜的晚上。",
  },
  {
    id: "midterm-breath",
    title: "期中先允許喘",
    lens: "期中前後校園內容常太勵志。有效的是『你可以停一下』，不是『你要更努力』。",
    composition: "圖書館窗外、捷運座位、一句不責備的話。",
    palette: "冷一點的靜水，暖光只留一點。",
    layout: "字少、留白多，不要清單。",
    hookShape: "先承認累，再給一個晚上。",
    form: "單張或限動投票。",
    zenUse: "轉成淡江圖書館、宿舍書桌，不是心靈雞湯。",
    promptEn:
      "Tamkang library window at dusk, one warm desk lamp, empty chair, quiet, not motivational poster, not stock study grind",
    headlineHint: "最近是不是連休息都覺得有罪惡感？",
  },
  {
    id: "dorm-night",
    title: "宿舍的晚上",
    lens: "住宿生內容要具體：走廊燈、室友、要不要出門。",
    composition: "門縫光線或窗台，人不必正臉。",
    palette: "暖燈 + 外面的淡水濕氣。",
    layout: "Story 三則：房間 → 走廊 → 門口。",
    hookShape: "問要不要離開房間一下。",
    form: "Story 3 則或 Threads。",
    zenUse: "茶會、浮游禪光都可當『今晚有地方去』。",
    promptEn:
      "dorm hallway light through a door gap, Tamsui humidity outside the window, Tamkang student night, documentary, no posed group photo",
    headlineHint: "今晚要不要離開房間一下？",
  },
  {
    id: "turtle",
    title: "龜龜在角落",
    lens: "吉祥物當安靜同伴比當 Logo 更像社團自己的。",
    composition: "主視覺留白，角色只佔一角。",
    palette: "霧園紙、墨松、一點三色光。",
    layout: "問句在中下，龜龜不搶 Hook。",
    hookShape: "標題先問生活，角色不當吉祥物吶喊。",
    form: "單張 4:5 或 Carousel 結尾。",
    zenUse: "龜龜陪伴，不是宗教符號。",
    promptEn:
      "small geometric turtle mascot in the corner of a quiet poster, three colored light orbs, paper-like mist, Tamkang Zen Club, not religious, not luxury",
    headlineHint: "先坐下來？",
  },
];

export function ideaFromInspiration(card: InspirationCard): string {
  return [
    card.hookShape,
    `構圖：${card.composition}`,
    `配色：${card.palette}`,
    `排版：${card.layout}`,
    `形式：${card.form}`,
    `轉成淡江禪學社：${card.zenUse}`,
  ].join("\n");
}

const BEAT_ORDER: Record<AcademicBeat, string[]> = {
  orientation: ["friend-seat", "dorm-night", "night-pause", "carousel-breath", "reels-first-seconds", "midterm-breath", "turtle"],
  midterm: ["midterm-breath", "night-pause", "carousel-breath", "reels-first-seconds", "friend-seat", "dorm-night", "turtle"],
  finals: ["midterm-breath", "night-pause", "reels-first-seconds", "dorm-night", "friend-seat", "carousel-breath", "turtle"],
  break: ["dorm-night", "friend-seat", "night-pause", "carousel-breath", "reels-first-seconds", "midterm-breath", "turtle"],
  summer: ["friend-seat", "night-pause", "carousel-breath", "dorm-night", "reels-first-seconds", "midterm-breath", "turtle"],
  winter: ["night-pause", "dorm-night", "friend-seat", "reels-first-seconds", "carousel-breath", "midterm-breath", "turtle"],
  ordinary: ["night-pause", "carousel-breath", "friend-seat", "reels-first-seconds", "dorm-night", "midterm-breath", "turtle"],
};

const EVENT_ORDER: Record<EventKind, string[]> = {
  tea: ["friend-seat", "night-pause", "turtle"],
  sitting: ["night-pause", "midterm-breath", "turtle"],
  light: ["night-pause", "reels-first-seconds", "carousel-breath"],
  workshop: ["carousel-breath", "friend-seat", "night-pause"],
  recruit: ["friend-seat", "carousel-breath", "dorm-night"],
  talk: ["carousel-breath", "night-pause", "friend-seat"],
  other: [],
};

function cardById(id: string) {
  return INSPIRATION.find((card) => card.id === id);
}

function uniqueIds(lists: string[][]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const id of list) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function igBoostIds(learning?: Pick<IgLearning, "bestHookShape" | "avoid" | "bestKind">) {
  if (!learning) return [];
  const ids: string[] = [];
  if (learning.bestKind === "carousel") ids.push("carousel-breath");
  if (learning.bestKind === "reels") ids.push("reels-first-seconds");
  if (learning.bestKind === "story") ids.push("dorm-night");
  if ((learning.bestHookShape || "").includes("？")) ids.push("night-pause");
  if (/誠摯|社團全名/.test(learning.avoid || "")) ids.push("night-pause", "friend-seat");
  return ids;
}

/** Rank inspiration for this week's 淡江節奏 — composition, not a swipe file. */
export function inspirationForBeat(beat: AcademicBeat): InspirationCard[] {
  const ids = BEAT_ORDER[beat];
  return ids.map((id) => cardById(id)).filter((card): card is InspirationCard => Boolean(card));
}

/** Research campus + own IG patterns, then translate — never copy another club. */
export function researchInspiration(opts: {
  idea?: string;
  eventName?: string;
  beat?: AcademicBeat;
  now?: Date;
  learning?: Pick<IgLearning, "bestHookShape" | "avoid" | "bestKind" | "captionLengthBest">;
}): InspirationResearch {
  const idea = `${opts.idea ?? ""} ${opts.eventName ?? ""}`.trim();
  const beat = opts.beat ?? academicBeat(opts.now);
  const eventKind = eventKindFromText(idea || opts.eventName || "");
  const rankedIds = uniqueIds([EVENT_ORDER[eventKind], igBoostIds(opts.learning), BEAT_ORDER[beat]]);
  const cards = rankedIds.map((id) => cardById(id)).filter((card): card is InspirationCard => Boolean(card));
  const top = cards[0] ?? INSPIRATION[0]!;
  const fromOwnIg = opts.learning
    ? `自己的 IG：Hook 學「${opts.learning.bestHookShape}」。${opts.learning.avoid}${
        opts.learning.captionLengthBest ? ` Caption 約 ${opts.learning.captionLengthBest} 字。` : ""
      }`
    : "還沒有自己的成效時，先用問句與生活語氣。";
  const promptBlock = [
    `靈感研究（抽象，禁止抄其他社團）：構圖「${top.composition}」；排版「${top.layout}」；配色「${top.palette}」；Hook「${opts.learning?.bestHookShape || top.hookShape}」；形式「${top.form}」`,
    `轉成淡江禪學社：${top.zenUse}`,
    fromOwnIg,
    "不要寺廟、不要宗教海報、不要勵志雞湯。",
  ].join("。");
  return {
    beat,
    eventKind,
    cards,
    composition: top.composition,
    palette: top.palette,
    layout: top.layout,
    hookShape: opts.learning?.bestHookShape || top.hookShape,
    form: top.form,
    zenUse: top.zenUse,
    fromOwnIg,
    promptBlock,
  };
}

export function directionsFromResearch(
  research: InspirationResearch,
  opts: { eventName: string; hook?: string },
): VisualDirection[] {
  const subject = opts.eventName || "淡江禪學社";
  const fallbackHook = opts.hook || HOOK_EXAMPLES[subject.length % HOOK_EXAMPLES.length]!;
  return research.cards.slice(0, 3).map((card, index) => {
    const headline = index === 0 && /[？?]/.test(fallbackHook) ? fallbackHook : card.headlineHint;
    return {
      id: `dir_${card.id}`,
      name: card.title,
      concept: card.zenUse,
      palette: card.palette,
      composition: card.composition,
      typeDirection: card.hookShape,
      prompt: `${card.promptEn}, ${subject}`,
      headline,
      subhead: index === 1 ? "也可以揪人" : subject,
    };
  });
}
