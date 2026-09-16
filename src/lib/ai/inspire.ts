import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { campusResearch, parseResearchSeeds, type InspirationSeed } from "@/lib/zen/inspiration";
import { seasonContext } from "@/lib/zen/season";
import { systemPrompt } from "@/lib/zen/voice";

const ResearchInput = z.object({
  forceMock: z.boolean().optional(),
});

export const researchInspiration = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const inner =
      input && typeof input === "object" && "data" in input && (input as { data: unknown }).data
        ? (input as { data: unknown }).data
        : input;
    return ResearchInput.parse(inner ?? {});
  })
  .handler(async ({ data }): Promise<
    | { ok: true; items: InspirationSeed[]; adapter: "live" | "mock" }
    | { ok: false; error: string; adapter: "live" | "mock" }
  > => {
    const season = seasonContext();
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey || data.forceMock) {
      return { ok: true, items: campusResearch(), adapter: "mock" };
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
        max_tokens: 1400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt("inspire") },
          {
            role: "user",
            content: `現在是 ${season.todayIso}（${season.label}）。學生正在：${season.studentNow}
淡水／校園：${season.campus}。${season.weather}
研究大學生社群、校園活動、IG Carousel、Reels Cover 趨勢。不要抄任何真實帳號或作品。
輸出 JSON：{"items":[{title,hook,composition,palette,layout,hookShape,form,visual,why}]} 最多 3 則。
hook 必須像淡江學生會停下來的第一句，禁止「誠摯邀請」。
why 必須寫不要抄、只抽象構圖配色 Hook。visual 要有淡水或校園生活。`,
          },
        ],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `靈感研究暫時無法使用（${res.status}）。`, adapter: "live" };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const parsed = JSON.parse(body.choices?.[0]?.message?.content ?? "{}") as unknown;
      return { ok: true, items: parseResearchSeeds(parsed, season.beat), adapter: "live" };
    } catch {
      return { ok: false, error: "靈感研究無法解析。", adapter: "live" };
    }
  });
