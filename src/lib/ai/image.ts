import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clubSystemPrompt } from "@/lib/club/identity";
import { academicMoment } from "@/lib/club/season";
import type { CreativeDirection } from "@/lib/studio/types";
import { mockDirections } from "./pack-mock";
import { extractJson, hasXai, xaiChat, xaiImage } from "./xai";
import { parseFnInput } from "./parse";

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
      const prompt = `${data.prompt}. Tamkang University Tamsui student life, airy, not religious temple, not monk robes, no dense sutra text, cinematic, IG composition.`;
      try {
        if (hasXai()) {
          const src = await xaiImage(prompt, data.aspect ?? "4:5");
          if (src) return { ok: true, src, prompt, adapter: "live" };
        }
      } catch {
        /* mock below */
      }
      const dir = mockDirections(data.topic || "禪學社")[0];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350">
        <rect width="1080" height="1350" fill="#161410"/>
        <circle cx="380" cy="560" r="240" fill="#D9A15A" fill-opacity="0.7"/>
        <circle cx="720" cy="520" r="220" fill="#3D8B84" fill-opacity="0.68"/>
        <circle cx="540" cy="820" r="210" fill="#C46B6B" fill-opacity="0.55"/>
        <text x="80" y="1180" fill="#F3EEE4" font-size="56" font-family="serif">${escapeXml(dir.headline.split("\n")[0] ?? "先坐下來")}</text>
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
  .validator((input: unknown) => parseFnInput(z.object({ topic: z.string().min(1).max(200) }), input))
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
輸出 JSON {directions:[{id,name,concept,palette,composition,typeDirection,imagePrompt,headline,subhead}]} 必須 3 個。`,
          },
        ],
        { json: true, maxTokens: 1600 },
      );
      if (!text) return { ok: true as const, directions: mocked };
      const raw = extractJson(text) as { directions?: CreativeDirection[] };
      if (raw.directions?.length === 3) return { ok: true as const, directions: raw.directions };
    } catch {
      /* mock */
    }
    return { ok: true as const, directions: mocked };
  });
