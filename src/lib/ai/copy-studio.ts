import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zenSystemPrompt } from "@/lib/zen/context";
import { hookFromMemoryHint } from "@/lib/zen/memory-hook";
import { studentReviewOf, tidyCopy } from "@/lib/zen/review";
import type { CopyPack, CopyTone, StudentReview } from "@/lib/studio/types";

const ToneSchema = z.enum(["short", "normal", "emotional", "student", "life", "humor"]);

const CopyInput = z.object({
  idea: z.string().min(1).max(500),
  eventName: z.string().max(120).optional(),
  schedule: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  tone: ToneSchema.optional(),
  memoryHint: z.string().max(1200).optional(),
  forceMock: z.boolean().optional(),
});

function parseCopyInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "idea" in inner) return CopyInput.parse(inner);
  }
  return CopyInput.parse(input);
}

export type CopyResult =
  | { ok: true; adapter: "live" | "mock"; packs: CopyPack[]; review: StudentReview }
  | { ok: false; adapter: "live" | "mock"; error: string };

function hookFromMemory(memoryHint: string | undefined, idea: string) {
  return (
    hookFromMemoryHint(memoryHint) ||
    (/坐|休息|空|累/.test(idea) ? "最近是不是連休息都覺得有罪惡感？" : "最近是不是很久沒有好好坐下來？")
  );
}

function mockPacks(idea: string, eventName: string, schedule: string, location: string, memoryHint = ""): CopyPack[] {
  const hook = hookFromMemory(memoryHint, idea);
  const where = [schedule, location].filter(Boolean).join(" · ");
  const eventLine = eventName ? `${eventName}${where ? `，${where}` : ""}` : where;
  const body = tidyCopy(`${idea.trim()}\n${eventLine}\n想找人一起的話，把這則傳給他。`);
  const tags = ["#淡江禪學社", "#淡江", "#淡水"];
  const cta = "來坐一下";
  const tones: CopyTone[] = ["student", "short", "emotional", "life", "humor", "normal"];
  return tones.map((tone) => ({
    tone,
    hook,
    body:
      tone === "short"
        ? `${hook}\n${where || eventName}`
        : tone === "humor"
          ? tidyCopy(`${hook}\n不是要你頓悟，就是來坐一下。${where}`)
          : body,
    cta,
    hashtags: tags,
  }));
}

export { studentReviewOf };

export const generateCopyPacks = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCopyInput(input))
  .handler(async ({ data }): Promise<CopyResult> => {
    const apiKey = process.env.XAI_API_KEY;
    const packsMock = mockPacks(data.idea, data.eventName ?? "", data.schedule ?? "", data.location ?? "", data.memoryHint);
    const review = studentReviewOf(
      `${packsMock[0].hook}\n${packsMock[0].body}`,
      data.schedule ?? "",
      data.location ?? "",
    );
    if (!apiKey || data.forceMock) {
      return { ok: true, adapter: "mock", packs: packsMock, review };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.7,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: zenSystemPrompt() },
          {
            role: "user",
            content: `為淡江禪學社寫 IG 文案。想法：${data.idea}
活動：${data.eventName || "未定"} 時間：${data.schedule || ""} 地點：${data.location || ""}
品牌記憶與過去 IG：${data.memoryHint || "問句 Hook 收藏較高。學自己的 IG，不要套一般品牌模板。"}
需要 JSON：{packs:[{tone,hook,body,cta,hashtags}], review:{wouldStop,understandable,tooReligious,tooSerious,tooLiterary,tooAi,tooLong,knowsWhat,knowsWhenWhere,wouldBringFriend,knowsHowToSignup,rewriteHook,notes[]}}
tones 必含 short,normal,emotional,student,life,humor。禁止誠摯邀請。`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false, adapter: "live", error: `文案服務暫時無法使用（${res.status}）。` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as {
        packs?: CopyPack[];
        review?: StudentReview;
      };
      if (!parsed.packs?.length) throw new Error("empty");
      return { ok: true, adapter: "live", packs: parsed.packs, review: parsed.review ?? review };
    } catch {
      return { ok: false, adapter: "live", error: "文案無法解析，可改用本機草案。" };
    }
  });
