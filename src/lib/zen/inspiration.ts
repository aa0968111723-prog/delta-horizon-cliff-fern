import { seasonContext, type SeasonBeat } from "./season.ts";

export type InspirationSeed = {
  id: string;
  watch: string;
  composition: string;
  palette: string;
  layout: string;
  hookShape: string;
  form: string;
  zenClub: {
    title: string;
    hook: string;
    visual: string;
    why: string;
  };
};

export const INSPIRATION_SEEDS: InspirationSeed[] = [
  {
    id: "campus-night-carousel",
    watch: "大學生社群：夜晚校園 Carousel",
    composition: "封面只有一句生活話，活動名放到第 3 頁",
    palette: "低飽和夜色 + 一點暖燈",
    layout: "上半畫面、下半短句，資訊不進封面",
    hookShape: "問句，像在講課表與疲勞",
    form: "Carousel 6 頁：Hook → 情境 → 痛點 → 內容 → CTA → 收束",
    zenClub: {
      title: "開學後的晚上",
      hook: "最近是不是連休息都覺得有罪惡感？",
      visual: "淡水校園夜色，燈很遠，人很小",
      why: "學生會停是因為被說中，不是因為海報完整。",
    },
  },
  {
    id: "reels-cover-face",
    watch: "校園 Reels Cover：側臉 + 一行字",
    composition: "臉在上 1/2，字在下，不要滿版 Logo",
    palette: "皮膚暖光對上暮藍",
    layout: "垂直 9:16，字少到可以一秒讀完",
    hookShape: "口語、不工整",
    form: "Reels Cover → 0–3 秒同句旁白",
    zenClub: {
      title: "先被看見的臉",
      hook: "大學生活很自由，但你最近真的有比較快樂嗎？",
      visual: "同學側臉、淡水風，龜龜不要搶戲",
      why: "封面不是招生海報。先讓人覺得這篇在講我。",
    },
  },
  {
    id: "poster-to-story",
    watch: "活動海報改成限動節奏",
    composition: "海報資訊拆成 4 張，一張一件事",
    palette: "沿用原海報主色，但提高留白",
    layout: "Story 安全區，底部 CTA",
    hookShape: "第一張沒有時間地點",
    form: "3–5 張 Story：感覺 → 畫面 → 內容 → 時間地點 → 找朋友",
    zenClub: {
      title: "舊海報變限動",
      hook: "有時候我們需要的不是答案，只是一個安靜的晚上。",
      visual: "沿用三色光，拿掉廟宇符號",
      why: "歷屆海報可以當 DNA，不要整張重貼到 IG。",
    },
  },
  {
    id: "tea-friends",
    watch: "社團茶會：互動照片當主視覺",
    composition: "手、杯子、沒看鏡頭的人",
    palette: "木色、茶、暖燈",
    layout: "照片滿版，字壓在最安靜的一角",
    hookShape: "邀請變得很小，生活很大",
    form: "單張 IG + Threads 短句",
    zenClub: {
      title: "茶會不是考試",
      hook: "來坐一下，不用先懂禪。",
      visual: "晚上茶會的手與燈，淡江學生",
      why: "招生感一重，IG 就會變成一直在找人。",
    },
  },
];

export function abstractInspiration(seed: InspirationSeed) {
  return {
    composition: seed.composition,
    palette: seed.palette,
    layout: seed.layout,
    hook: seed.hookShape,
    form: seed.form,
  };
}

const SEASON_BEATS: Record<
  SeasonBeat,
  { title: string; hook: string; visual: string; composition: string; palette: string; layout: string; hookShape: string; form: string }
> = {
  orientation: {
    title: "開學季的第一個晚上",
    hook: "剛到淡水的人，通常還沒找到可以坐下的地方。",
    visual: "淡水斜坡黃昏、還沒拆完的行李、遠一點的燈",
    composition: "人很小、路很長，封面只有生活句",
    palette: "暮藍加一點暖窗光",
    layout: "上半風景、下半短句，活動名不進封面",
    hookShape: "講剛到淡水，不講社團章程",
    form: "Carousel：生活 → 課表 → 找地方坐 → 茶會 → 時間地點",
  },
  settling: {
    title: "課表開始固定之後",
    hook: "最近是不是很久沒有好好坐下來？",
    visual: "校園夜色、同學側臉、茶",
    composition: "留白多、字少",
    palette: "低飽和夜色",
    layout: "一句 Hook 壓在最安靜的角落",
    hookShape: "問句，像在講疲勞而不是活動",
    form: "單張 IG + Story 三張",
  },
  midterm: {
    title: "期中前後的出口",
    hook: "最近是不是連休息都覺得有罪惡感？",
    visual: "圖書館燈、宿舍桌、短的夜",
    composition: "不要海報資訊牆",
    palette: "冷一點的墨藍，暖燈只留一點",
    layout: "極短字、大留白",
    hookShape: "先承認累，再給一個晚上",
    form: "Story 互動 + 短 Caption，不要連續招生",
  },
  "after-midterm": {
    title: "學期過半還在的人",
    hook: "有些人開始從社團消失，你還好嗎？",
    visual: "熟面孔、茶、龜龜不要搶戲",
    composition: "社員故事，不是招生海報",
    palette: "木色與苔綠",
    layout: "照片滿版，字很少",
    hookShape: "對還在的人說話",
    form: "社員故事 → 日常 → 下一次茶會",
  },
  finals: {
    title: "撐完之前",
    hook: "這個晚上不用產出任何東西。",
    visual: "短、暗、具體的一盞燈",
    composition: "一行字就能讀完",
    palette: "深墨與一點暖光",
    layout: "9:16，底部才放時間",
    hookShape: "極短，不要詩意堆疊",
    form: "Story 或 Reels Cover，15 秒內講完",
  },
  break: {
    title: "人離開淡水之後",
    hook: "你已經不在淡水了，可是晚上還是會想起那盞燈。",
    visual: "河岸回顧、舊照片、預告",
    composition: "回顧大於招生",
    palette: "褪色的暖色",
    layout: "舊照片 + 一句話",
    hookShape: "想念，不是招新",
    form: "回顧 Carousel → 下學期預告",
  },
  summer: {
    title: "暑假還在的人",
    hook: "淡水變空的時候，其實也還可以坐一下。",
    visual: "河風、空一點的校園",
    composition: "生活感，不要空教室海報",
    palette: "午後熱、晚上涼",
    layout: "風景大、字小",
    hookShape: "給還在淡水的人",
    form: "生活單張 + 預告下學期",
  },
};

export function seasonInspiration(now = new Date()): InspirationSeed {
  const season = seasonContext(now);
  const beat = SEASON_BEATS[season.beat];
  return {
    id: `season-${season.beat}`,
    watch: `${season.label} · 淡江學生現在`,
    composition: beat.composition,
    palette: beat.palette,
    layout: beat.layout,
    hookShape: beat.hookShape,
    form: beat.form,
    zenClub: {
      title: beat.title,
      hook: beat.hook,
      visual: `${season.weather} ${beat.visual}`,
      why: `${season.studentNow} ${season.contentHint}`,
    },
  };
}

export function inspirationFeed(now = new Date()): InspirationSeed[] {
  const live = seasonInspiration(now);
  return [live, ...INSPIRATION_SEEDS];
}
