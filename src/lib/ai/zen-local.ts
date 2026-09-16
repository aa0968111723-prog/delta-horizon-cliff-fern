import type {
  CampaignStrategy,
  CampaignWave,
  CarouselSlideDraft,
  ContentType,
  CopyDraft,
  CreativeDirection,
  ReelsBeat,
  StoryFrameDraft,
  ToneId,
  WaveRole,
} from "../studio/types.ts";
import { campaignTypeLabel, PAIN_POINTS } from "../zen/labels.ts";
import { formatDateLabel } from "../zen/context.ts";
import { HOOKS_BY_PAIN, pickHooks } from "../zen/voice.ts";
import type { CampaignContextInput } from "./zen-schema.ts";

/**
 * 本機生成：沒有 AI 金鑰時，用規則寫一版「像真的社團人在發文」的草案。
 * 所有文字都圍繞淡江學生情境，不是通用模板。
 */

function weekday(dateIso: string) {
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return "日一二三四五六"[d.getDay()] ?? "";
}

export function whenLine(c: Pick<CampaignContextInput, "date" | "time">) {
  if (!c.date) return c.time || "時間待定";
  const wd = weekday(c.date);
  return `${formatDateLabel(c.date)}${wd ? `（${wd}）` : ""}${c.time ? ` ${c.time}` : ""}`;
}

function firstPain(c: CampaignContextInput) {
  return c.painPoints[0] ?? "belonging";
}

function painLine(c: CampaignContextInput) {
  const p = PAIN_POINTS.find((item) => item.id === firstPain(c));
  return p?.line ?? "有時候需要的不是答案，只是一個安靜的晚上。";
}

function signupLine(c: CampaignContextInput) {
  if (c.signupUrl) return "報名連結在 bio，或直接私訊我們。";
  return "不用報名，直接來就好。";
}

function baseHashtags(c: CampaignContextInput) {
  return [
    "#淡江大學禪學社",
    "#淡江",
    "#淡江大學",
    `#${campaignTypeLabel(c.type)}`,
    "#淡水",
    "#大學生活",
    "#慢下來",
    "#喘口氣",
    c.name.replace(/\s/g, "") ? `#${c.name.replace(/\s/g, "").slice(0, 12)}` : "",
  ].filter(Boolean);
}

const HUMOR_LINES = [
  "期中考不會因為你不去而消失，但至少你去的時候是清醒的。",
  "室友已經在打電動了，你可以來這裡當個安靜的人。",
  "來這裡不會被問「畢業要幹嘛」，保證。",
  "坐不住沒關係，我們有人第一次坐五分鐘就想走，現在是社長。",
];

const LIFE_LINES = [
  "從捷運淡水站走回學校的那段路，你有沒有慢慢走過一次？",
  "宿舍的燈太亮、室友的鍵盤太響，有時候只是想找個安靜的地方。",
  "淡水的風很大，把腦袋裡的東西也吹一吹。",
  "覺生圖書館坐了六小時之後，你需要的不是咖啡，是停下來。",
];

export function localCopy(c: CampaignContextInput, tone: ToneId, seed = 0, angle?: string): CopyDraft {
  const hooks = pickHooks({ painPoints: c.painPoints, type: c.type, seed });
  const hook = angle?.trim() && angle.length < 40 ? angle : hooks[0] ?? "有時候我們需要的不是答案，只是一個安靜的晚上。";
  const when = whenLine(c);
  const where = c.location || "社辦";
  const intro = c.oneLiner || `${campaignTypeLabel(c.type)}，${c.theme || "來坐一下就好"}。`;
  const cta = c.cta || "直接來就好";
  const hashtags = baseHashtags(c);

  switch (tone) {
    case "short":
      return {
        tone,
        hook,
        body: `${when} ${where}\n${intro}`,
        cta,
        hashtags: hashtags.slice(0, 5),
      };
    case "warm":
      return {
        tone,
        hook,
        body: [
          painLine(c),
          "",
          `所以我們準備了一個晚上：${c.name}。`,
          intro,
          "不需要會什麼，也不需要準備什麼。來了，坐下來，就好。",
          "",
          `${when}｜${where}`,
          signupLine(c),
        ].join("\n"),
        cta,
        hashtags,
      };
    case "student":
      return {
        tone,
        hook,
        body: [
          "老實說我們也不太會宣傳",
          `就是 ${when} 在${where}有一場${campaignTypeLabel(c.type)}`,
          intro,
          "一個人來也 ok，帶室友來也 ok",
          "不用會打坐，不用信什麼，坐著就好",
          signupLine(c),
        ].join("\n"),
        cta,
        hashtags: hashtags.slice(0, 7),
      };
    case "life":
      return {
        tone,
        hook: LIFE_LINES[seed % LIFE_LINES.length],
        body: [
          painLine(c),
          "",
          `${when}，${where}。`,
          `${c.name}。${intro}`,
          "結束之後走回宿舍的路，可能會覺得有點不一樣。",
          signupLine(c),
        ].join("\n"),
        cta,
        hashtags,
      };
    case "humor":
      return {
        tone,
        hook,
        body: [
          HUMOR_LINES[seed % HUMOR_LINES.length],
          "",
          `${c.name}｜${when}｜${where}`,
          intro,
          "坐不住可以先走，不會有人攔你（可能會有人給你茶）。",
          signupLine(c),
        ].join("\n"),
        cta,
        hashtags,
      };
    default:
      return {
        tone: "normal",
        hook,
        body: [
          painLine(c),
          "",
          `${c.name}`,
          intro,
          c.description ? c.description.split("\n")[0]?.slice(0, 80) ?? "" : "",
          "",
          `時間：${when}`,
          `地點：${where}`,
          signupLine(c),
          "一個人來、找朋友一起來都可以。",
        ]
          .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
          .join("\n"),
        cta,
        hashtags,
      };
  }
}

export function localImagePrompt(c: CampaignContextInput, direction?: CreativeDirection) {
  const scene: Record<string, string> = {
    tea: "a quiet evening tea gathering in a small university classroom, warm lamp light, ceramic cups, a few students sitting relaxed on floor cushions",
    meditation: "students sitting quietly on cushions in a softly lit room, eyes closed, calm posture, evening light through a window",
    class: "a small weekly club meeting, students sitting in a loose circle, warm indoor light, notebooks and tea",
    lecture: "a small evening talk in a university room, a few students listening relaxed, soft light",
    welcome: "freshmen walking on Tamkang University's lantern-lined path at dusk, warm and friendly atmosphere",
    retreat: "students on a one-day retreat by the Tamsui river at golden hour, calm water, soft wind",
    showcase: "a warm end-of-semester gathering, candles and tea, students smiling softly",
    recruit: "a friendly club fair booth with a small turtle mascot illustration, students chatting, bright afternoon",
    other: "a calm campus evening scene at Tamkang University in Tamsui",
  };
  const base = scene[c.type] ?? scene.other;
  const dir = direction
    ? `${direction.concept}. Composition: ${direction.composition}. Palette: ${direction.palette.join(", ")}.`
    : "Soft gradient light in three hues (warm amber, soft teal, gentle lavender) glowing gently in the background, generous negative space at the bottom for text.";
  return `${base}. ${dir} Photographic, natural, slightly grainy film look, relaxed student vibe, no religious symbols, no text, no watermark, Instagram 4:5.`;
}

export function localDirections(c: CampaignContextInput): CreativeDirection[] {
  const when = whenLine(c);
  const hooks = pickHooks({ painPoints: c.painPoints, type: c.type });
  return [
    {
      id: "dir_a",
      title: "A · 夜晚的一盞燈",
      concept: "深藍夜色裡的一盞暖燈與三色光暈，像期中考深夜宿舍走廊盡頭還亮著的地方。安靜、有人在。",
      palette: ["#1F2A44", "#F2B56B", "#7FB7A8", "#C9B8E8"],
      composition: "上 2/3 是夜景與光暈，下 1/3 留白放兩行標題；龜龜小小地坐在光裡。",
      typography: "圓潤黑體大標，細字副標；字不超過兩行。",
      imagePrompt: localImagePrompt(c, {
        id: "dir_a",
        title: "",
        concept: "night blue tones with one warm lamp and a soft three-color glow (amber, teal, lavender), quiet and inviting",
        palette: ["night blue", "amber", "teal", "lavender"],
        composition: "upper two thirds scene, lower third empty for text",
        typography: "",
        imagePrompt: "",
        headline: "",
        subhead: "",
        mood: "",
      }),
      headline: hooks[0]?.slice(0, 18) ?? "先坐下來",
      subhead: `${c.name}｜${when}`,
      mood: "安靜、被接住",
    },
    {
      id: "dir_b",
      title: "B · 淡水的風",
      concept: "淡水河傍晚的光與風，學生背影，什麼都沒做。把「慢下來」放在真實的淡水場景裡。",
      palette: ["#F6EBDD", "#E8A87C", "#8FB8C9", "#6B6B7B"],
      composition: "橫向地平線在畫面中線，人物很小，標題壓在天空留白處。",
      typography: "細明體大標 + 小黑體時間地點，帶一點雜誌感。",
      imagePrompt: localImagePrompt(c, {
        id: "dir_b",
        title: "",
        concept: "Tamsui riverside at golden hour, a student's back facing the water, wind in hair, warm and airy",
        palette: ["warm beige", "sunset orange", "river blue"],
        composition: "horizon at the middle, small figure, large sky for text",
        typography: "",
        imagePrompt: "",
        headline: "",
        subhead: "",
        mood: "",
      }),
      headline: "慢一點也可以",
      subhead: `${c.name}｜${when}`,
      mood: "空氣感、生活感",
    },
    {
      id: "dir_c",
      title: "C · 龜龜的一句話",
      concept: "純色底 + 龜龜插畫 + 一句像同學說的話。不用照片，靠文字和角色停住學生。",
      palette: ["#FFF6E9", "#F2B56B", "#3E7C6F", "#2B2B36"],
      composition: "大字置中，龜龜在右下角探頭，三色光做成小小的圓點裝飾。",
      typography: "手寫感圓體大標，最多 12 字。",
      imagePrompt:
        "a minimal illustration poster: cream background, a small friendly cartoon turtle mascot peeking from the bottom right, three small soft glowing dots in amber, teal and lavender, lots of empty space in the center, flat vector style, no text, Instagram 4:5",
      headline: hooks[1]?.slice(0, 14) ?? "一個人也可以來",
      subhead: `${c.name}｜${when}`,
      mood: "親切、有點可愛",
    },
  ];
}

/** 依活動類型決定宣傳期長度與節奏；不硬寫死。 */
function waveTemplate(type: CampaignContextInput["type"]): { role: WaveRole; offset: number; ct: ContentType }[] {
  const long: { role: WaveRole; offset: number; ct: ContentType }[] = [
    { role: "teaser", offset: -14, ct: "ig-post" },
    { role: "empathy", offset: -11, ct: "carousel" },
    { role: "life", offset: -9, ct: "ig-post" },
    { role: "keyvisual", offset: -7, ct: "ig-post" },
    { role: "interactive", offset: -6, ct: "poll" },
    { role: "info", offset: -5, ct: "carousel" },
    { role: "knowledge", offset: -4, ct: "knowledge" },
    { role: "reason", offset: -3, ct: "reels" },
    { role: "story", offset: -2, ct: "member-story" },
    { role: "countdown", offset: -1, ct: "story" },
    { role: "dayof", offset: 0, ct: "story" },
    { role: "recap", offset: 1, ct: "recap" },
  ];
  const short: { role: WaveRole; offset: number; ct: ContentType }[] = [
    { role: "empathy", offset: -6, ct: "ig-post" },
    { role: "keyvisual", offset: -4, ct: "ig-post" },
    { role: "info", offset: -2, ct: "story" },
    { role: "countdown", offset: -1, ct: "story" },
    { role: "dayof", offset: 0, ct: "story" },
    { role: "recap", offset: 1, ct: "recap" },
  ];
  if (type === "class") return short;
  if (type === "welcome" || type === "recruit" || type === "retreat" || type === "showcase") return long;
  return long.filter((w) => w.role !== "knowledge");
}

const WAVE_ANGLES: Record<WaveRole, (c: CampaignContextInput) => { title: string; angle: string; hookIdx: number }> = {
  teaser: () => ({ title: "先丟一個問題", angle: "不提活動名稱，只問學生最近好不好。留言區收集狀態。", hookIdx: 0 }),
  empathy: (c) => ({ title: "這好像在講我", angle: `圍繞「${PAIN_POINTS.find((p) => p.id === firstPain(c))?.label ?? "歸屬感"}」寫一篇同學會轉發的內容，最後一頁才輕輕帶到活動。`, hookIdx: 1 }),
  life: () => ({ title: "淡水生活", angle: "宿舍 / 捷運 / 圖書館 / 河邊，一段日常觀察，不宣傳。", hookIdx: 2 }),
  keyvisual: (c) => ({ title: `${c.name} 主視覺`, angle: "活動正式登場。一張圖、一句 Hook、時間地點。", hookIdx: 0 }),
  interactive: () => ({ title: "限動投票", angle: "「你最近最需要的是：A 睡覺 B 安靜 C 有人聊 D 都要」，順帶說活動。", hookIdx: 3 }),
  info: (c) => ({ title: "活動怎麼參加", angle: `Carousel：Hook → 情境 → 痛點 → ${c.name}內容 → 怎麼來。`, hookIdx: 1 }),
  knowledge: () => ({ title: "禪其實是什麼", angle: "用一個生活例子解釋「專注 / 慢下來」，不講宗教。", hookIdx: 2 }),
  reason: () => ({ title: "三個來的理由", angle: "Reels 20 秒：三個很實際的理由（有茶、不用說話、可以早走）。", hookIdx: 0 }),
  story: () => ({ title: "一個社員為什麼來", angle: "一位社員第一次來的故事，第一人稱，短。", hookIdx: 1 }),
  countdown: (c) => ({ title: "明天見", angle: `限動倒數：明天 ${whenLine(c)}，${c.location || "社辦"}。`, hookIdx: 2 }),
  dayof: (c) => ({ title: "今天晚上", angle: `當日限動 2–3 張：今天 ${c.time || "晚上"}、路怎麼走、現場一張照片。`, hookIdx: 0 }),
  recap: (c) => ({ title: `${c.name} 回顧`, angle: "隔天：三到五張現場照片、一句謝謝、下一次什麼時候。", hookIdx: 1 }),
};

export function localStrategy(c: CampaignContextInput): CampaignStrategy {
  const hooks = pickHooks({ painPoints: c.painPoints, type: c.type });
  const tmpl = waveTemplate(c.type);
  const waves: CampaignWave[] = tmpl.map((w, i) => {
    const meta = WAVE_ANGLES[w.role](c);
    return {
      id: `wave_${i}_${w.role}`,
      role: w.role,
      offsetDays: w.offset,
      contentType: w.ct,
      title: meta.title,
      hook: hooks[meta.hookIdx % hooks.length] ?? hooks[0] ?? "",
      angle: meta.angle,
      contentId: null,
    };
  });
  const pain = PAIN_POINTS.find((p) => p.id === firstPain(c));
  return {
    axis: `先讓學生覺得「${pain?.label ?? "想找一個地方"}」被看見，再讓 ${c.name} 成為那個「可以去的地方」。禪不出現在第一句，安靜和陪伴先出現。`,
    directions: localDirections(c),
    chosenDirectionId: null,
    waves,
    rhythmNote: "宣傳 → 生活 → 互動 → 活動 → 知識 → 故事 → 倒數。中間插生活內容，避免 IG 看起來一直在招生。",
    generatedAt: Date.now(),
    source: "mock",
  };
}

/* ------------------------------------------------------------------ */
/* 一鍵轉換                                                             */
/* ------------------------------------------------------------------ */

export function localCarousel(c: CampaignContextInput, copy: CopyDraft): CarouselSlideDraft[] {
  const when = whenLine(c);
  return [
    { index: 0, role: "hook", title: copy.hook, text: "", visualNote: "大字置中，背景三色光暈，龜龜小小的。" },
    { index: 1, role: "scene", title: "你可能也這樣", text: painLine(c), visualNote: "淡水 / 宿舍 / 圖書館的一個場景照。" },
    { index: 2, role: "pain", title: "不是你的問題", text: "只是還沒有一個地方，讓你什麼都不用做。", visualNote: "留白多，一行字。" },
    { index: 3, role: "event", title: c.name, text: c.oneLiner || `${campaignTypeLabel(c.type)}。${c.theme}`, visualNote: "活動主視覺，時間地點小字。" },
    { index: 4, role: "cta", title: `${when}｜${c.location || "社辦"}`, text: `${signupLine(c)} 一個人來也可以。`, visualNote: "CTA 頁只留時間、地點、怎麼來。" },
  ];
}

export function localStory(c: CampaignContextInput, copy: CopyDraft): StoryFrameDraft[] {
  const when = whenLine(c);
  return [
    { index: 0, text: copy.hook, sticker: "投票：是 / 超是", visualNote: "純色底 + 大字，加投票貼圖。" },
    { index: 1, text: painLine(c), sticker: "", visualNote: "一張真實照片（宿舍 / 河邊）。" },
    { index: 2, text: `${c.name}\n${when}`, sticker: "倒數貼圖", visualNote: "主視覺 + 倒數。" },
    { index: 3, text: `${c.location || "社辦"}\n${signupLine(c)}`, sticker: c.signupUrl ? "連結貼圖" : "問答：想問什麼", visualNote: "地圖或教室門口照。" },
  ];
}

export function localReels(c: CampaignContextInput, copy: CopyDraft): ReelsBeat[] {
  const when = whenLine(c);
  return [
    { from: 0, to: 3, visual: "手機畫面：凌晨 1:47，滑 IG。", caption: copy.hook, voiceover: "", transition: "硬切", assetHint: "自拍手機畫面" },
    { from: 3, to: 7, visual: "宿舍走廊 / 圖書館空鏡，很安靜。", caption: painLine(c).slice(0, 24), voiceover: "有時候不是想睡，是停不下來。", transition: "慢推", assetHint: "校園夜景素材" },
    { from: 7, to: 12, visual: "社辦門口，燈亮著，有人推門。", caption: `${c.name}`, voiceover: "有一個地方，去了不用做什麼。", transition: "跟拍", assetHint: "社辦 / 教室照片" },
    { from: 12, to: 17, visual: "茶杯、坐墊、學生放鬆的側臉。", caption: c.oneLiner || "坐著就好", voiceover: "不用會打坐，不用信什麼。", transition: "疊化", assetHint: "歷屆活動照片" },
    { from: 17, to: 20, visual: "純色卡：時間地點 + 龜龜。", caption: `${when}｜${c.location || "社辦"}`, voiceover: signupLine(c), transition: "定格", assetHint: "龜龜 + 三色光" },
  ];
}

export function localThreads(c: CampaignContextInput, copy: CopyDraft) {
  return `${copy.hook}\n\n${painLine(c)}\n\n${whenLine(c)} ${c.location || "社辦"}，${c.name}。${signupLine(c)}`;
}

export function localLine(c: CampaignContextInput, copy: CopyDraft) {
  return [
    `【${c.name}】`,
    copy.hook,
    "",
    c.oneLiner || `${campaignTypeLabel(c.type)}，來坐一下就好。`,
    `🗓 ${whenLine(c)}`,
    `📍 ${c.location || "社辦"}`,
    c.signupUrl ? `報名：${c.signupUrl}` : "不用報名，直接來。",
    "可以找朋友一起～",
  ].join("\n");
}

export function localCaptionFromCarousel(slides: CarouselSlideDraft[], copy: CopyDraft) {
  return [copy.hook, "", ...slides.slice(1).map((s) => s.text).filter(Boolean), "", copy.cta].join("\n");
}

export const LOCAL_FALLBACK_HOOK = HOOKS_BY_PAIN.belonging[1];
