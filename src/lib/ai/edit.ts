import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { describeAdapter, type AiStatus } from "./campaign";
import { EditPlanSchema, riskOf, type EditPlan } from "./actions";
import { interpretMock } from "./edit-mock";
import type { EditorScene } from "./scene";

export type EditResult =
  | { ok: true; plan: EditPlan; adapter: "live" | "mock" }
  | { ok: false; error: string; adapter: "live" | "mock" };

const SceneLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  role: z.string().optional(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  fill: z.string().optional(),
  align: z.string().optional(),
  assetId: z.string().optional(),
  locked: z.boolean(),
  hidden: z.boolean(),
});

const EditorSceneSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  formatId: z.string(),
  formatName: z.string(),
  width: z.number(),
  height: z.number(),
  slideIndex: z.number(),
  slideCount: z.number(),
  templateId: z.string(),
  selectedId: z.string().nullable(),
  copy: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    subhead: z.string(),
    body: z.string(),
    cta: z.string(),
    handle: z.string(),
  }),
  brief: z.object({
    eventName: z.string(),
    schedule: z.string(),
    location: z.string(),
    audience: z.string(),
    style: z.string(),
  }),
  brand: z.object({
    name: z.string(),
    handle: z.string(),
    website: z.string(),
    voice: z.string(),
    colors: z.array(z.object({ hex: z.string(), role: z.string(), label: z.string() })),
    forbiddenWords: z.array(z.string()),
    ctas: z.array(z.string()),
  }),
  layers: z.array(SceneLayerSchema),
  assets: z.array(z.object({ id: z.string(), name: z.string(), category: z.string(), kind: z.string() })),
});

const EditInputSchema = z.object({
  command: z.string().min(1).max(400),
  scene: EditorSceneSchema,
  forceMock: z.boolean().optional(),
});

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

function parsePlan(raw: unknown): EditPlan | null {
  const parsed = EditPlanSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    risk: parsed.data.risk ?? riskOf(parsed.data.actions),
  };
}

async function interpretLive(command: string, scene: EditorScene): Promise<EditResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: true, plan: interpretMock(command, scene), adapter: "mock" };

  const prompt = `你是淡江禪學社畫布編輯助手。只能輸出 JSON，不要 markdown。
根據「目前畫布」把使用者的話變成 actions。禁止只說已完成；沒有對應物件就給空 actions 並在 notes 說明。
可用 type：
update-layer{layerId,patch{x,y,w,h,text,fontSize,color,align,fill,opacity,hidden,brightness,contrast,saturate,assetId},label}
align-layer{layerId,mode:left|center|right|top|middle|bottom|safe-left|safe-center|safe-right|safe-top|safe-middle|safe-bottom,label}
delete-layer{layerId,label}
add-text{text,name,role,x,y,w,h,fontSize,align,color,label}
add-qr{payload,caption,x,y,size,label}
replace-image{layerId,prefer:brighter|people|background|other,assetId,label}
set-background{color,color2,label}
set-format{formatId:feed-square|feed-portrait|feed-landscape|story|reels-cover,label}
apply-template{templateId:editorial|product|offer|quote,label}
set-copy{patch{eyebrow,headline,subhead,body,cta},label}
whitespace{amount:more|less,label}
layout-versions{count,label}
select{layerId,label}
layerId 必須來自 scene.layers。座標以 1080 畫布像素為準。
小改動 risk=small；刪兩層以上、套模板、多版排版、大改風格 risk=large。
JSON：{summary,risk,actions,notes}

使用者：${command}

畫布：${JSON.stringify(scene)}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.2,
      max_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You edit an Instagram artboard via a JSON action list. Output one JSON object." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    return { ok: false, error: `畫布指令暫時無法使用（${res.status}）。可改用本機規則。`, adapter: "live" };
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = body.choices?.[0]?.message?.content ?? "";
  try {
    const plan = parsePlan(extractJson(text));
    if (!plan) return { ok: false, error: "AI 回傳的操作無法套用。可再試一次，或改用本機規則。", adapter: "live" };
    return { ok: true, plan, adapter: "live" };
  } catch {
    return { ok: false, error: "AI 回傳無法解析。可再試一次，或改用本機規則。", adapter: "live" };
  }
}

function parseEditInput(input: unknown) {
  if (input && typeof input === "object" && "data" in input) {
    const inner = (input as { data: unknown }).data;
    if (inner && typeof inner === "object" && "command" in inner) {
      return EditInputSchema.parse(inner);
    }
  }
  return EditInputSchema.parse(input);
}

export function describeEditAdapter(available: boolean): AiStatus {
  const base = describeAdapter(available);
  if (available) {
    return { ...base, label: "已連線畫布指令", detail: "會先讀目前圖層與品牌，再真正改畫布。不是只回「已完成」。" };
  }
  return {
    ...base,
    label: "本機畫布規則",
    detail: "目前沒有連到 AI 服務。會用本機規則執行常見操作，仍會真的改畫布，不是假裝完成。",
  };
}

export const interpretEditorCommand = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseEditInput(input))
  .handler(async ({ data }): Promise<EditResult> => {
    const hasKey = Boolean(process.env.XAI_API_KEY);
    if (!hasKey || data.forceMock) {
      return { ok: true, plan: interpretMock(data.command, data.scene as EditorScene), adapter: "mock" };
    }
    return interpretLive(data.command, data.scene as EditorScene);
  });
