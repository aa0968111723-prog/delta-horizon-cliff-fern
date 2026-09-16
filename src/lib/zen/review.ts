import type { StudentReview } from "../studio/types.ts";
import { HOOK_EXAMPLES } from "./context.ts";

export function tidyCopy(text: string) {
  return text.replace(/。{2,}/g, "。").replace(/，。/g, "。").trim();
}

/** Student-facing rewrite — never keep a formal invitation as the first line. */
export function proposedHook(text: string): string {
  const first = text.split(/[。\n]/)[0]?.trim() ?? "";
  if (/誠摯|敬邀|蒞臨|不容錯過/.test(first)) return HOOK_EXAMPLES[0];
  if (!/[？?]/.test(first)) return HOOK_EXAMPLES[2];
  const alt = HOOK_EXAMPLES.find((hook) => !first.includes(hook.slice(0, 8)));
  return alt ?? HOOK_EXAMPLES[1];
}

export function studentReviewOf(text: string, schedule = "", location = ""): StudentReview {
  const religious = /佛法|涅槃|般若|禪宗|開示|虔誠|法會|業力|輪迴/.test(text);
  const formal = /誠摯|敬邀|蒞臨|不容錯過/.test(text);
  const long = text.length > 320;
  return {
    wouldStop: /[？?]/.test(text.slice(0, 40)) ? "開頭有問句，比較容易停。" : "開頭比較像公告，可改成問句。",
    understandable: "活動如果有寫進正文就能懂。",
    tooReligious: religious ? "宗教詞偏多，改成生活語。" : "沒有明顯宗教詞。",
    tooSerious: formal ? "語氣偏正式。" : "還算像社團的人在發。",
    tooLiterary: /靈魂|詩意|綻放|心靈/.test(text) ? "有點文青。" : "還好。",
    tooAi: /開啟全新|不僅|更是|篇章/.test(text) ? "有 AI 腔。" : "還可以再口語一點。",
    tooLong: long ? "偏長，Feed 上會被摺。" : "長度可以。",
    knowsWhat: eventGuess(text),
    knowsWhenWhere: schedule || location ? `${schedule} ${location}`.trim() : "時間地點還不夠清楚。",
    wouldBringFriend: /一起|揪|朋友/.test(text) ? "有揪人空間。" : "可加一句找朋友。",
    knowsHowToSignup: /報名|連結|表單/.test(text) ? "有報名線索。" : "如果需要報名，還要補。",
    rewriteHook: proposedHook(text),
    notes: [religious ? "拿掉佛學詞" : "保持生活感", "時間地點要能截圖"],
  };
}

function eventGuess(text: string) {
  const m = text.match(/浮游禪光|茶會|靜坐|招新|社課|禪光/);
  return m ? m[0] : "活動內容還要更白話。";
}

export function igHookAnalysis(caption: string) {
  const first = caption.trim().split(/\n/)[0] ?? "";
  const review = studentReviewOf(caption);
  return {
    hook: first,
    length: caption.length,
    review,
    notes: [
      first.includes("？") ? "Hook 是問句，比較像在講學生。" : "可把第一句改成生活問句。",
      caption.length > 280 ? "Caption 偏長。" : "長度還好。",
      /誠摯邀請|淡江大學禪學社誠/.test(caption) ? "開頭太正式。" : "語氣還算自然。",
    ],
  };
}
