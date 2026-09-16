import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import type { Inspiration } from "@/lib/creative/types";
import { mockInspirationResearch } from "./inspire-mock";
import { extractJson, hasXai, xaiChat } from "./xai";
import { parseFnInput } from "./parse";

const Input = z.object({
  topic: z.string().min(1).max(200),
  forceMock: z.boolean().optional(),
});

export const researchInspiration = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(Input, input))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; items: Inspiration[]; adapter: "live" | "mock" } | { ok: false; error: string }> => {
      const mocked = mockInspirationResearch(data.topic);
      try {
        if (!hasXai() || data.forceMock) {
          return { ok: true, items: mocked, adapter: "mock" };
        }
        const season = academicMoment();
        const text = await xaiChat(
          [
            { role: "system", content: clubSystemPrompt(season.label, season.weather) },
            {
              role: "user",
              content: `研究大學生社團 IG、校園活動、Carousel、Reels 封面、活動海報的抽象規律。
主題：${data.topic}

規則：
- 不要抄任何特定帳號、品牌或作品。
- 只抽出：構圖、配色、排版、Hook 形式、內容形式。
- 再轉成淡江大學禪學社自己能用的做法（淡江／淡水／宿舍／捷運／龜龜／三色光）。
- 禪＝坐下、陪伴、空間，不是宗教廣告。

輸出 JSON：{ "items": [{ "title","pattern","composition","color","hookShape","form","clubTurn" }] } 必須 3 則。`,
            },
          ],
          { json: true, maxTokens: 1800 },
        );
        if (!text) return { ok: true, items: mocked, adapter: "mock" };
        const raw = extractJson(text) as { items?: Inspiration[] };
        const items = (raw.items ?? [])
          .slice(0, 3)
          .map((item, index) => ({
            ...mocked[index]!,
            ...item,
            id: `insp_${Date.now()}_${index}`,
          }));
        return { ok: true, items: items.length === 3 ? items : mocked, adapter: items.length === 3 ? "live" : "mock" };
      } catch {
        return { ok: true, items: mocked, adapter: "mock" };
      }
    },
  );
