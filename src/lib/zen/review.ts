import type { StudentReview } from "../studio/types.ts";
import { HOOK_EXAMPLES } from "./context.ts";

/** Drop planner-form labels so IG captions do not read like a brief. */
export function stripBriefLeak(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^(一句介紹|學生痛點|主題|這次看點)[：:]\s*/, "").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

export function tidyCopy(text: string) {
  return stripBriefLeak(text).replace(/。{2,}/g, "。").replace(/，。/g, "。").trim();
}

/** Student-facing rewrite — never keep a formal invitation as the first line. */
export function proposedHook(text: string): string {
  const first = text.split(/[。\n]/)[0]?.trim() ?? "";
  if (/誠摯|敬邀|蒞臨|不容錯過/.test(first)) return HOOK_EXAMPLES[0];
  if (!/[？?]/.test(first)) return HOOK_EXAMPLES[2];
  const alts = HOOK_EXAMPLES.filter((hook) => hook !== first && !first.includes(hook.slice(0, 8)));
  return alts[0] ?? HOOK_EXAMPLES[1];
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
  const theme = eventGuess(caption);
  const hasQuestion = /[？?]/.test(first);
  const hasCta = /一起|來坐|報名|限動|來坐一下|揪/.test(caption);
  return {
    hook: first,
    length: caption.length,
    visual: /光|夜|淡水|龜|茶|坐|燈/.test(caption) ? "有生活場景線索，比較容易停滑。" : "視覺線索偏少，比較像純文字公告。",
    theme,
    cta: hasCta ? "有行動句。" : "我還不知道要不要出門、怎麼報名。",
    direction: hasQuestion ? "生活問句開頭，再進活動。" : "偏公告，比較難停滑。",
    improve: [
      hasQuestion ? "Hook 可再更貼淡江近況。" : "第一句改成學生會停下來的問句。",
      caption.length > 280 ? "縮短，時間地點放到前三行。" : "時間地點再靠近第一屏。",
      hasCta ? "保留揪人，不要改成招生口號。" : "加一句『要不要找人一起來』。",
    ],
    review,
    notes: [
      hasQuestion ? "Hook 是問句，比較像在講學生。" : "可把第一句改成生活問句。",
      caption.length > 280 ? "Caption 偏長。" : "長度還好。",
      /誠摯邀請|淡江大學禪學社誠/.test(caption) ? "開頭太正式。" : "語氣還算自然。",
    ],
  };
}
