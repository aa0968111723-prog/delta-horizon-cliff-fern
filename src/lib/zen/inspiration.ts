/** Abstracted visual / copy patterns — never a swipe file of other clubs. */

export type InspirationCard = {
  id: string;
  title: string;
  lens: string;
  composition: string;
  palette: string;
  hookShape: string;
  form: string;
  zenUse: string;
};

export const INSPIRATION: InspirationCard[] = [
  {
    id: "night-pause",
    title: "夜晚停一下",
    lens: "大學生社群常見：把『忙』拍成空氣，而不是行程表。",
    composition: "上半留空、下半一句人話，主體偏角落。",
    palette: "低飽和夜色 + 一點暖光。",
    hookShape: "先問身體狀態，再提活動。",
    form: "單張 4:5 或限動第一則。",
    zenUse: "轉成淡水晚上、坐下來、三色光，而不是寺廟圖。",
  },
  {
    id: "friend-seat",
    title: "空一個位子",
    lens: "校園活動海報裡，『可以找人一起來』比 Logo 更能停滑。",
    composition: "兩到三人局部、臉不一定清楚，留座位或杯子。",
    palette: "暖紙色 + 水色。",
    hookShape: "用『要不要一起』代替『誠摯邀請』。",
    form: "Carousel 第 5 頁 CTA。",
    zenUse: "茶會、社員故事，龜龜可當安靜吉祥物。",
  },
  {
    id: "carousel-breath",
    title: "輪播要會呼吸",
    lens: "有效的校園 Carousel 通常 5–6 頁，每頁只做一件事。",
    composition: "封面一句話 → 情境 → 痛點 → 內容 → CTA，不要每頁都是海報。",
    palette: "全輯同一底色，只換層級。",
    hookShape: "封面不要活動全名堆上去。",
    form: "IG Carousel。",
    zenUse: "浮游禪光、茶會、招生都走這條骨架，文案換學生生活。",
  },
  {
    id: "reels-first-seconds",
    title: "前三秒是身體",
    lens: "Reels Cover 先讓人感到光線或呼吸，而不是標題牆。",
    composition: "中心一個光源或一個坐姿剪影，字極少。",
    palette: "深底 + 三色光點。",
    hookShape: "旁白先講感覺，3 秒後才報活動名。",
    form: "Reels 0–3s + 封面。",
    zenUse: "避免木魚特寫開場。",
  },
];
