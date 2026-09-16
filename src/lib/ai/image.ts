import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import type { CreativeDirection } from "@/lib/studio/types";
import { mockDirections } from "./pack-mock";
import { extractJson, hasXai, xaiChat, xaiImage } from "./xai";
import { parseFnInput } from "./parse";
import { preferChinese, withClubImageScene } from "./zh";

const ImageInput = z.object({
  prompt: z.string().min(4).max(800),
  aspect: z.enum(["1:1", "4:5", "9:16"]).optional(),
  topic: z.string().max(120).optional(),
});

export const generateStudioImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseFnInput(ImageInput, input))
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; src: string; prompt: string; adapter: "live" | "mock" } | { ok: false; error: string }> => {
      const prompt = withClubImageScene(data.prompt);
      try {
        if (hasXai()) {
          const src = await xaiImage(prompt, data.aspect ?? "4:5");
          if (src) return { ok: true, src, prompt, adapter: "live" };
        }
      } catch {
        /* mock below */
      }
      const dir = mockDirections(data.topic || "禪學社")[0];
      const aspect = data.aspect ?? "4:5";
      const height = aspect === "9:16" ? 1920 : aspect === "1:1" ? 1080 : 1350;
      const mark = aspect === "9:16" ? "限動封面" : (dir.headline.split("\n")[0] ?? "先坐下來");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 ${height}">
        <rect width="1080" height="${height}" fill="#161410"/>
        <circle cx="380" cy="${aspect === "9:16" ? 720 : 560}" r="240" fill="#D9A15A" fill-opacity="0.7"/>
        <circle cx="720" cy="${aspect === "9:16" ? 680 : 520}" r="220" fill="#3D8B84" fill-opacity="0.68"/>
        <circle cx="540" cy="${aspect === "9:16" ? 1100 : 820}" r="210" fill="#C46B6B" fill-opacity="0.55"/>
        <text x="80" y="${height - 160}" fill="#F3EEE4" font-size="56" font-family="serif">${escapeXml(mark)}</text>
      </svg>`;
      return {
        ok: true,
        src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
        prompt,
        adapter: "mock",
      };
    },
  );

function escapeXml(value: string) {
  return value.replace(/[<>&]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[ch] ?? ch);
}

export const listVisualDirections = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    parseFnInput(
      z.object({
        topic: z.string().min(1).max(200),
        notes: z.string().max(1600).optional(),
      }),
      input,
    ),
  )
  .handler(async ({ data }) => {
    const mocked = mockDirections(data.topic);
    try {
      if (!hasXai()) return { ok: true as const, directions: mocked };
      const season = academicMoment();
      const text = await xaiChat(
        [
          { role: "system", content: clubSystemPrompt(season.label, season.weather) },
          {
            role: "user",
            content: `為「${data.topic}」提出 3 個視覺方向。先想活動、淡江學生情境、淡水、夜晚、校園、壓力、朋友感、品牌色、龜龜、三色光、IG 停留。不要只生禪風海報。
${data.notes ? `先讀這些：\n${data.notes}` : ""}
名稱、概念、配色、構圖、字、headline、subhead 用台灣繁體中文。imagePrompt 用生活中文畫面描述。
輸出 JSON {directions:[{id,name,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}]} 必須 3 個。`,
          },
        ],
        { json: true, maxTokens: 1600 },
      );
      if (!text) return { ok: true as const, directions: mocked };
      const raw = extractJson(text) as { directions?: CreativeDirection[] };
      if (raw.directions?.length === 3) {
        const directions = raw.directions.map((item, index) => ({
          ...item,
          name: preferChinese(item.name, mocked[index]?.name ?? item.name),
          concept: preferChinese(item.concept, mocked[index]?.concept ?? item.concept),
          imagePrompt: preferChinese(item.imagePrompt, mocked[index]?.imagePrompt ?? item.imagePrompt),
          headline: preferChinese(item.headline, mocked[index]?.headline ?? item.headline),
          subhead: preferChinese(item.subhead, mocked[index]?.subhead ?? item.subhead),
        }));
        return { ok: true as const, directions };
      }
    } catch {
      /* mock */
    }
    return { ok: true as const, directions: mocked };
  });
