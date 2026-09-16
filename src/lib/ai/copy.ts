import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { systemPrompt } from "@/lib/zen/voice";
import { COPY_STYLES } from "@/lib/zen/voice";
import type { CopyPack } from "@/lib/zen/types";
import { describeAdapter } from "./campaign";

const CopyInput = z.object({
  idea: z.string().min(1).max(500),
  kind: z.enum([
    "event",
    "emotion",
    "campus",
    "recruit",
    "member",
    "zen-life",
    "countdown",
    "recap",
    "knowledge",
    "carousel",
    "reels",
    "story",
  ]),
  style: z.string().max(40).optional(),
  eventName: z.string().max(120).optional(),
  schedule: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  forceMock: z.boolean().optional(),
});

function mockCopy(data: z.infer<typeof CopyInput>): CopyPack {
  const hook =
    data.kind === "emotion"
      ? "最近是不是連休息都覺得有罪惡感？"
      : data.kind === "countdown"
        ? "明天晚上，真的只是坐一下。"
        : data.kind === "recruit"
          ? "你不用先懂禪，才有資格來。"
          : "最近是不是很久沒有好好坐下來？";
  const when = data.schedule || "";
  const where = data.location || "淡江大學淡水校園";
  const event = data.eventName || data.idea;
  const body = `${data.idea.trim()}\n\n不是要你突然變得很懂禪。${when ? `\n${when}，${where}。` : `\n${where}。`}\n找一個朋友一起來也行。`;
  const variants = COPY_STYLES.map((style) => ({
    style: style.label,
    text:
      style.id === "short"
        ? `${hook}\n${event}。晚上見。`
        : style.id === "humor"
          ? `${hook}\n報告先放旁邊。${event}這種事，來坐一下就好。`
          : style.id === "tender"
            ? `有時候我們需要的不是答案，只是一個安靜的晚上。\n${event}`
            : `${hook}\n\n${body}`,
  }));
  return {
    hook,
    body,
    cta: "晚上見",
    hashtags: ["#淡江禪學社", "#淡江", "#淡水"],
    variants,
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
      knowsSignup: "還沒寫怎麼報名。",
      notes: when ? [] : ["補時間地點。"],
      rewriteHook: "",
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
      return { ok: true, pack: mockCopy(data), adapter: "mock" };
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
          { role: "system", content: systemPrompt("copy") },
          {
            role: "user",
            content: `為淡江禪學社寫 IG 文案。類型：${data.kind}。想法：${data.idea}。活動：${data.eventName ?? ""}。時間：${data.schedule ?? ""}。地點：${data.location ?? ""}。
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
      return { ok: true, pack: parsed, adapter: "live" };
    } catch {
      return { ok: false, error: "文案無法解析。", adapter: "live" };
    }
  });

export { describeAdapter };
