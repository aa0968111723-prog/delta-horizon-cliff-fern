import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { systemPlanner } from "@/lib/club/prompts";
import { studentContext } from "@/lib/club/season";
import { extractJson } from "@/lib/ai/json";
import { chatGrok, hasXaiKey } from "@/lib/ai/xai";

export type VisionReport = {
  content: string;
  people: string;
  color: string;
  light: string;
  composition: string;
  typeRatio: string;
  hierarchy: string;
  brandFeel: string;
  studentFeel: string;
  stayFeel: string;
  tooReligious: string;
  tooOld: string;
  tooAi: string;
  fitsTamkang: string;
  actions: { id: string; label: string; detail: string }[];
  source: "live" | "mock";
};

const InputSchema = z.object({
  imageDataUrl: z.string().min(20).max(6_000_000),
  note: z.string().max(240).optional(),
  forceMock: z.boolean().optional(),
});

function mockReport(note: string): VisionReport {
  return {
    content: note || "畫面偏夜間室內，有光與留白。",
    people: "若有人，應保留側臉或手，不要網紅姿勢。",
    color: "宣紙與苔綠較合品牌；避免金箔。",
    light: "柔和側光比硬閃更學生。",
    composition: "下半可留給 Hook。",
    typeRatio: "字不要超過畫面三分之一。",
    hierarchy: "第一句 > 活動名 > 時間。",
    brandFeel: "可延續三色光與龜龜，不要廟宇。",
    studentFeel: "看起來要像淡江晚上，不是禪修中心廣告。",
    stayFeel: "若第一眼是宗教符號，學生會滑走。",
    tooReligious: "檢查有沒有蓮花、佛像、合十。",
    tooOld: "避免過正式的海報框。",
    tooAi: "皮膚過滑、手指數錯是警訊。",
    fitsTamkang: "加入捷運、宿舍、課表或淡水風會更真。",
    actions: [
      { id: "continue", label: "延續這個風格", detail: "用配色與構圖做新活動，不直接複製。" },
      { id: "redesign", label: "保留內容重新設計", detail: "資訊留下，層級重排。" },
      { id: "story", label: "做成限動", detail: "3–5 張，字更大。" },
      { id: "carousel", label: "做成 Carousel", detail: "Hook → 情境 → 痛點 → 內容 → CTA。" },
      { id: "reels", label: "做成 Reels Cover", detail: "9:16，字在安全區。" },
      { id: "similar", label: "生成相似視覺", detail: "同氣氛、新構圖。" },
    ],
    source: "mock",
  };
}

export const analyzeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    InputSchema.parse(input && typeof input === "object" && "data" in input ? (input as { data: unknown }).data : input),
  )
  .handler(async ({ data }): Promise<{ ok: true; report: VisionReport } | { ok: false; error: string }> => {
    if (!hasXaiKey() || data.forceMock) return { ok: true, report: mockReport(data.note ?? "") };
    const ctx = studentContext();
    const result = await chatGrok({
      maxTokens: 1400,
      messages: [
        { role: "system", content: systemPlanner(ctx) },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `分析這張圖（可能是照片、舊海報、IG 截圖、Canva 或活動照）。補充：${data.note || "無"}。
JSON 欄位：content,people,color,light,composition,typeRatio,hierarchy,brandFeel,studentFeel,stayFeel,tooReligious,tooOld,tooAi,fitsTamkang,actions[{id,label,detail}]。
id 用 continue|redesign|story|carousel|reels|similar。`,
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
    });
    if (!result.ok) return { ok: false, error: result.error };
    try {
      const parsed = extractJson(result.text) as VisionReport;
      return { ok: true, report: { ...mockReport(data.note ?? ""), ...parsed, source: "live" } };
    } catch {
      return { ok: false, error: "畫面分析無法解析" };
    }
  });
