import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { COPY_KIND_IDS, COPY_STYLES, completeCopyVariants, systemPrompt } from "@/lib/zen/voice";
import { applyStudentRewrite } from "@/lib/zen/review";
import type { CopyPack } from "@/lib/zen/types";
import { describeAdapter } from "./campaign";

const CopyInput = z.object({
  idea: z.string().min(1).max(500),
  kind: z.enum(COPY_KIND_IDS),
  style: z.string().max(40).optional(),
  eventName: z.string().max(120).optional(),
  schedule: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  signupUrl: z.string().max(300).optional(),
  angle: z.string().max(80).optional(),
  forceMock: z.boolean().optional(),
  dnaNotes: z.string().max(2000).optional(),
  memoryNotes: z.string().max(4000).optional(),
});

function mockCopy(data: z.infer<typeof CopyInput>): CopyPack {
  const hook =
    data.kind === "emotion"
      ? "最近是不是連休息都覺得有罪惡感？"
      : data.kind === "countdown"
        ? "明天晚上，真的只是坐一下。"
        : data.kind === "recruit"
          ? "你不用先懂禪，才有資格來。"
          : data.kind === "qa"
            ? "你最近一次好好坐下來，是什麼時候？"
            : data.kind === "poll"
              ? "最近比較像哪一種：課表塞滿，還是晚上不知道要幹嘛？"
              : data.kind === "member"
                ? "來社團之前，我也覺得自己不太會交朋友。"
                : data.kind === "knowledge"
                  ? "禪不是要你突然變得很懂。先坐一下就好。"
                  : "最近是不是很久沒有好好坐下來？";
  const when = data.schedule || "";
  const where = data.location || "淡江大學淡水校園";
  const event = data.eventName?.trim() || (data.idea.trim() === hook ? "今晚" : data.idea.trim());
  const signup = data.signupUrl?.trim();
  const angleLine = data.angle ? `${data.angle}\n\n` : "";
  const body = `${angleLine}${data.idea.trim()}\n\n不是要你突然變得很懂禪。${when ? `\n${when}，${where}。` : `\n${where}。`}\n找一個朋友一起來也行。${signup ? `\n報名：${signup}` : ""}`;
  const variants = COPY_STYLES.map((style) => ({
    style: style.label,
    text:
      style.id === "short"
        ? `${hook}\n晚上見。`
        : style.id === "humor"
          ? `${hook}\n報告先放旁邊。${event}這種事，來坐一下就好。`
          : style.id === "tender"
            ? `有時候我們需要的不是答案，只是一個安靜的晚上。\n${event}`
            : `${hook}\n\n${body}`,
  }));
  return {
    hook,
    body,
    cta: signup ? "報名連結在下面" : "晚上見",
    hashtags: ["#淡江禪學社", "#淡江", "#淡水"],
    variants: completeCopyVariants({ hook, body, cta: signup ? "報名連結在下面" : "晚上見", variants }),
    studentReview: {
      wouldStop: "會。第一句在講我。",
      understandable: "看得懂。",
      tooReligious: "沒有。",
      tooSerious: "還好。",
      tooLiterary: styleCheck(data.style),
      tooAi: "沒有金句連發。",
      tooLong: "可以再砍一行。",
      knowsWhat: `知道跟「${event}」有關。`,
      knowsWhenWhere: when ? "有時間地點。" : "時間還不清楚。",
      wouldBringFriend: "可以。",
      knowsSignup: signup ? "有報名方式。" : "還沒寫怎麼報名。",
      notes: [
        ...(when ? [] : ["補時間地點。"]),
        ...(signup ? [] : ["補報名連結。"]),
        ...(data.angle ? [`這一波換角度：${data.angle}`] : []),
        ...(data.memoryNotes?.trim()
          ? [`記得參考：${data.memoryNotes.trim().split("\n").find(Boolean)}`]
          : []),
      ],
      rewriteHook:
        data.kind === "emotion"
          ? "大學生活很自由，但你最近真的有比較快樂嗎？"
          : "最近是不是連休息都覺得有罪惡感？",
    },
  };
}

function styleCheck(style?: string) {
  if (style?.includes("詩")) return "有點文。";
  return "還好。";
}

export const generateCopyPack = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const inner =
      input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
        ? (input as { data: unknown }).data
        : input;
    return CopyInput.parse(inner);
  })
  .handler(async ({ data }): Promise<{ ok: true; pack: CopyPack; adapter: "live" | "mock" } | { ok: false; error: string; adapter: "live" | "mock" }> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || data.forceMock) {
      return { ok: true, pack: applyStudentRewrite(mockCopy(data)), adapter: "mock" };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.75,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt("copy", { dnaNotes: data.dnaNotes, memoryNotes: data.memoryNotes }) },
          {
            role: "user",
            content: `為淡江禪學社寫 IG 文案。類型：${data.kind}。想法：${data.idea}。活動：${data.eventName ?? ""}。時間：${data.schedule ?? ""}。地點：${data.location ?? ""}。
報名連結：${data.signupUrl ?? "尚未提供"}。換角度：${data.angle ?? "無"}。
優先讀 Creative Memory 與自己 IG，不要套一般品牌模板。有報名連結就要讓學生知道怎麼報。
輸出 JSON：hook, body, cta, hashtags[], variants[{style,text}]（短版/一般版/感性版/學生版/生活版/幽默版）, studentReview{wouldStop,understandable,tooReligious,tooSerious,tooLiterary,tooAi,tooLong,knowsWhat,knowsWhenWhere,wouldBringFriend,knowsSignup,notes,rewriteHook}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `文案服務暫時無法使用（${res.status}）。`, adapter: "live" };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as CopyPack;
      if (!parsed.hook) return { ok: false, error: "文案無法解析。", adapter: "live" };
      const cta = parsed.cta ?? "";
      const filled = {
        ...parsed,
        body: parsed.body ?? parsed.hook,
        cta,
        hashtags: parsed.hashtags ?? [],
        variants: completeCopyVariants({
          hook: parsed.hook,
          body: parsed.body ?? parsed.hook,
          cta,
          variants: parsed.variants,
        }),
        studentReview: parsed.studentReview,
      };
      return { ok: true, pack: applyStudentRewrite(filled), adapter: "live" };
    } catch {
      return { ok: false, error: "文案無法解析。", adapter: "live" };
    }
  });

export { describeAdapter };
