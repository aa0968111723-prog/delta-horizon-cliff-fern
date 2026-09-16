import type { IgLessonPost } from "./insights.ts";
import { formatLessons, lessonsFromIg, quotedHookFromLessons } from "./insights.ts";

export type InspirationCard = {
  id: string;
  pattern: string;
  abstractedFrom: string;
  composition: string;
  palette: string;
  layout: string;
  hookShape: string;
  form: string;
  clubUse: string;
};

export const INSPIRATION: InspirationCard[] = [
  {
    id: "life-question",
    pattern: "生活問句當第一句",
    abstractedFrom: "大學生社群貼文常用停頓句，而不是活動名稱當標題。",
    composition: "上半生活畫面，下半一句問句",
    palette: "低飽和、夜間暖光",
    layout: "字少、留白多",
    hookShape: "這好像在講我",
    form: "單張 IG / Carousel 封面",
    clubUse: "最近是不是很久沒有好好坐下來？",
  },
  {
    id: "carousel-five",
    pattern: "五頁輪播節奏",
    abstractedFrom: "校園活動 Carousel 常見：停 → 共感 → 說明 → 降低門檻 → CTA。",
    composition: "每頁一件事",
    palette: "同一組品牌色，第三頁對比稍強",
    layout: "大標 + 一句",
    hookShape: "封面不問活動名",
    form: "Carousel",
    clubUse: "Hook → 淡江情境 → 痛點 → 浮游禪光內容 → 來坐一下",
  },
  {
    id: "reels-cover-safe",
    pattern: "Reels 封面安全區",
    abstractedFrom: "垂直封面標題常被 UI 吃掉，所以字要進中段。",
    composition: "中段大字，上下空",
    palette: "深底淺字或宣紙底苔綠字",
    layout: "9:16，兩行以內",
    hookShape: "0–3 秒先問生活",
    form: "Reels Cover",
    clubUse: "風比較大的晚上 → 燈會先亮",
  },
  {
    id: "night-poster",
    pattern: "夜間活動海報不是廟宇",
    abstractedFrom: "校園夜間活動用光與人，而不是宗教符號堆疊。",
    composition: "光帶 + 人物側影 + 時間",
    palette: "青／暖／玫瑰三色光，避免金箔",
    layout: "活動名第三層才出現",
    hookShape: "先氣氛再資訊",
    form: "海報 / 主視覺",
    clubUse: "三色光是氣氛，不是科幻霓虹。",
  },
  {
    id: "bring-a-friend",
    pattern: "降低第一次壓力",
    abstractedFrom: "社團招生若一直講理念，新生會滑走；寫「可以兩個人來」比較真。",
    composition: "兩人，不要正臉網紅",
    palette: "玫瑰光 + 宣紙",
    layout: "一句口語 + CTA",
    hookShape: "我可以帶朋友嗎？",
    form: "Story / 貼文",
    clubUse: "帶朋友來也可以。不懂禪也可以。",
  },
];

export function inspirationQuery(card: InspirationCard) {
  return `${card.clubUse}\n視覺：${card.composition}。${card.palette}。`;
}

export function inspirationFromIg(posts: IgLessonPost[]): InspirationCard[] {
  if (!posts.length) return [];
  const lessons = lessonsFromIg(posts);
  const hook = quotedHookFromLessons(formatLessons(lessons));
  const cards: InspirationCard[] = [];
  if (hook) {
    cards.push({
      id: "from-ig-hook",
      pattern: "延續自己比較有停留的第一句",
      abstractedFrom: "從淡江禪學社自己的 IG 成效抽象，不是抄別的帳號。",
      composition: lessons.visual,
      palette: "夜間暖光與三色光，不要廟宇金箔",
      layout: "字少、問句在上",
      hookShape: "這好像在講我",
      form: "單張 IG / Carousel 封面",
      clubUse: hook,
    });
  }
  cards.push({
    id: "from-ig-carousel",
    pattern: "用自己的 Carousel 節奏",
    abstractedFrom: lessons.carousel,
    composition: "每頁一件事，中段變成對話",
    palette: "同一組品牌色",
    layout: "大標 + 一句",
    hookShape: "封面不問活動名",
    form: "Carousel",
    clubUse: "Hook → 淡江情境 → 痛點 → 活動 → CTA",
  });
  cards.push({
    id: "from-ig-story",
    pattern: "Story 問一句真話",
    abstractedFrom: lessons.story,
    composition: "一張、一句、一個問題",
    palette: "宣紙底、苔綠字",
    layout: "中段安全區",
    hookShape: "你現在卡在哪",
    form: "Story",
    clubUse: "問學生此刻卡在哪，而不是再貼一次主視覺。",
  });
  return cards;
}

export function studioInspiration(posts: IgLessonPost[]) {
  const own = inspirationFromIg(posts);
  const rest = INSPIRATION.filter((card) => !own.some((item) => item.id === card.id));
  return [...own, ...rest];
}
