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
