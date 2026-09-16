import { studentContext } from "./context.ts";

export type InspirationPattern = {
  id: string;
  sourceKind: "campus" | "carousel" | "reels" | "poster" | "hook";
  observed: string;
  abstract: { composition: string; color: string; layout: string; hook: string; form: string };
  zenUse: string;
};

/** 不抄別人的帳號。把「大學生社群常見手法」抽象成淡江禪學社自己能用的形式。 */
export const INSPIRATION_PATTERNS: InspirationPattern[] = [
  {
    id: "night-one-light",
    sourceKind: "campus",
    observed: "校園 IG 常在晚上拍一條有燈的路，人物很小。",
    abstract: {
      composition: "上 2/3 場景、下 1/3 留白",
      color: "暖燈 + 冷天空，對比不要太劇烈",
      layout: "標題壓在留白，不壓燈",
      hook: "問句，講「一個人走回去」的狀態",
      form: "單張 4:5",
    },
    zenUse: "宮燈大道夜景 +「最近是不是很久沒有好好坐下來？」龜龜放右下。",
  },
  {
    id: "five-page-feel",
    sourceKind: "carousel",
    observed: "學生社團輪播常做成 1 金句 2 痛點 3 活動 4 時間 5 CTA，每頁字很多。",
    abstract: {
      composition: "每頁只留一句主句",
      color: "同一組三色，封面深、內頁淺",
      layout: "封面大字、內頁中字、末頁只有時間地點",
      hook: "封面不要社團名",
      form: "Carousel 5 頁",
    },
    zenUse: "Hook → 宿舍情境 → 痛點 → 茶會是什麼 → 9/24 B302。",
  },
  {
    id: "three-sec-hook",
    sourceKind: "reels",
    observed: "校園 Reels 前三秒常是字幕質問 + 快切。",
    abstract: {
      composition: "臉或手的特寫，背景虛",
      color: "真實宿舍燈，不要調太橘",
      layout: "字幕靠下 1/4，不要置中詩意",
      hook: "口語、不完整句",
      form: "20 秒 Reels",
    },
    zenUse: "0–3s「報告寫到一半。」3–7s 茶杯 7–12s 教室燈 17–20s 時間地點。",
  },
  {
    id: "poster-less-text",
    sourceKind: "poster",
    observed: "迎新海報常把理念、時間、QR、Logo 全塞進一張。",
    abstract: {
      composition: "一個主體 + 兩行字",
      color: "品牌三色光，不要金紅對比",
      layout: "QR 與 Logo 同角落，字級差要大",
      hook: "活動名不當第一句",
      form: "海報 / IG 4:5 共用",
    },
    zenUse: "主體是一杯茶或窗邊，標題是學生狀態，社團名放很小。",
  },
  {
    id: "story-poll",
    sourceKind: "hook",
    observed: "限動投票「有 / 沒有」比長文案回覆多。",
    abstract: {
      composition: "全畫面一句話",
      color: "深底淺字",
      layout: "貼紙放下方安全區",
      hook: "是非題講感受",
      form: "Story 投票",
    },
    zenUse: "「最近有好好休息嗎」有 / 還沒。下一張才出現活動。",
  },
];

export function inspirationForToday(date = new Date()): InspirationPattern[] {
  const ctx = studentContext(date);
  const prefer: InspirationPattern["sourceKind"][] = ctx.phase.includes("midterm") || ctx.phase.includes("final")
    ? ["hook", "reels", "carousel"]
    : ctx.phase === "orientation"
      ? ["poster", "carousel", "campus"]
      : ["campus", "carousel", "hook"];
  return [...INSPIRATION_PATTERNS].sort((a, b) => prefer.indexOf(a.sourceKind) - prefer.indexOf(b.sourceKind));
}
