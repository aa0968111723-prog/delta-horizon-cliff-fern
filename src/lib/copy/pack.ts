import type { StudentReview } from "@/lib/studio/types";

export const COPY_TONES = ["短版", "一般版", "感性版", "學生版", "生活版", "幽默版"] as const;
export type CopyTone = (typeof COPY_TONES)[number];

export const COPY_INTENTS = [
  "活動宣傳",
  "情緒共鳴",
  "校園生活",
  "招生",
  "社員故事",
  "禪生活",
  "倒數",
  "活動回顧",
  "知識型",
  "Carousel",
  "Reels",
  "Story",
] as const;

export type CopyPack = {
  tone: CopyTone;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  variants: { tone: CopyTone; hook: string; body: string; cta: string }[];
  studentReview: StudentReview;
  source: "live" | "mock";
};

export function buildCopyPack(idea: string, tone: CopyTone, extra?: { eventName?: string; schedule?: string; location?: string }): CopyPack {
  const hook = idea.includes("？") ? idea.split("\n")[0] : "最近是不是很久沒有好好坐下來？";
  const when = extra?.schedule || "";
  const where = extra?.location || "淡江校園";
  const eventName = extra?.eventName || "";
  const body = [idea, when && where ? `${when}，${where}。` : where, eventName, "人到了就好。想帶朋友來也可以。"]
    .filter(Boolean)
    .join("\n");
  const variants = COPY_TONES.map((item) => ({
    tone: item,
    hook: item === "幽默版" ? "大學很自由，但你最近真的有比較快樂嗎？" : hook,
    body: item === "短版" ? `${hook}\n${eventName} ${when}`.trim() : body,
    cta: "來坐一下",
  }));
  return {
    tone,
    hook,
    body,
    cta: "來坐一下",
    hashtags: ["#淡江禪學社", "#淡江", "#淡水"],
    variants,
    studentReview: {
      wouldStop: "有機會。第一句在問生活。",
      understood: eventName ? "活動名稱有出現。" : "還沒講活動也可以，但發布前要補。",
      tooReligious: "沒有。",
      tooSerious: "還好。",
      tooLiterary: "短版比較安全。",
      tooAi: "不要再加金句。",
      tooLong: "一般版可以再砍兩行。",
      knowsWhat: eventName || "情緒貼，尚未指向活動",
      knowsWhenWhere: `${when} ${where}`.trim(),
      wouldBringFriend: "有寫可以帶朋友。",
      knowsSignup: "來坐一下",
      revisions: ["時間靠近結尾", "避免破折號"],
    },
    source: "mock",
  };
}
