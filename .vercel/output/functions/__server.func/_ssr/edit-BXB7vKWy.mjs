import { c as string, n as array, o as number, r as boolean, s as object } from "../_libs/zod.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { a as riskOf, r as interpretMock, t as EditPlanSchema } from "./edit-mock-CJ87x2jK.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/edit-BXB7vKWy.js
var SceneLayerSchema = object({
	id: string(),
	name: string(),
	type: string(),
	role: string().optional(),
	x: number(),
	y: number(),
	w: number(),
	h: number(),
	text: string().optional(),
	fontSize: number().optional(),
	color: string().optional(),
	fill: string().optional(),
	align: string().optional(),
	assetId: string().optional(),
	locked: boolean(),
	hidden: boolean()
});
var EditorSceneSchema = object({
	projectId: string(),
	projectName: string(),
	formatId: string(),
	formatName: string(),
	width: number(),
	height: number(),
	slideIndex: number(),
	slideCount: number(),
	templateId: string(),
	selectedId: string().nullable(),
	copy: object({
		eyebrow: string(),
		headline: string(),
		subhead: string(),
		body: string(),
		cta: string(),
		handle: string()
	}),
	brief: object({
		eventName: string(),
		schedule: string(),
		location: string(),
		audience: string(),
		style: string()
	}),
	brand: object({
		name: string(),
		handle: string(),
		website: string(),
		voice: string(),
		colors: array(object({
			hex: string(),
			role: string(),
			label: string()
		})),
		forbiddenWords: array(string()),
		ctas: array(string())
	}),
	layers: array(SceneLayerSchema),
	assets: array(object({
		id: string(),
		name: string(),
		category: string(),
		kind: string()
	}))
});
var EditInputSchema = object({
	command: string().min(1).max(400),
	scene: EditorSceneSchema,
	forceMock: boolean().optional()
});
function extractJson(text) {
	const trimmed = text.trim();
	const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const raw = fence ? fence[1] : trimmed;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end === -1) throw new Error("模型未回傳 JSON");
	return JSON.parse(raw.slice(start, end + 1));
}
function parsePlan(raw) {
	const parsed = EditPlanSchema.safeParse(raw);
	if (!parsed.success) return null;
	return {
		...parsed.data,
		risk: parsed.data.risk ?? riskOf(parsed.data.actions)
	};
}
async function interpretLive(command, scene) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: true,
		plan: interpretMock(command, scene),
		adapter: "mock"
	};
	const prompt = `你是 Instagram 畫布操作代理。只能輸出 JSON，不要 markdown。
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
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: .2,
			max_tokens: 1400,
			response_format: { type: "json_object" },
			messages: [{
				role: "system",
				content: "You edit an Instagram artboard via a JSON action list. Output one JSON object."
			}, {
				role: "user",
				content: prompt
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `畫布代理暫時無法使用（${res.status}）。可改用本機規則。`,
		adapter: "live"
	};
	const text = (await res.json()).choices?.[0]?.message?.content ?? "";
	try {
		const plan = parsePlan(extractJson(text));
		if (!plan) return {
			ok: false,
			error: "AI 回傳的操作無法套用。可再試一次，或改用本機規則。",
			adapter: "live"
		};
		return {
			ok: true,
			plan,
			adapter: "live"
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析。可再試一次，或改用本機規則。",
			adapter: "live"
		};
	}
}
function parseEditInput(input) {
	if (input && typeof input === "object" && "data" in input) {
		const inner = input.data;
		if (inner && typeof inner === "object" && "command" in inner) return EditInputSchema.parse(inner);
	}
	return EditInputSchema.parse(input);
}
var interpretEditorCommand_createServerFn_handler = createServerRpc({
	id: "86652c34390936ffd17f0154640d9f08f7b9106dd86d50dcb537409d9aeff764",
	name: "interpretEditorCommand",
	filename: "src/lib/ai/edit.ts"
}, (opts) => interpretEditorCommand.__executeServer(opts));
var interpretEditorCommand = createServerFn({ method: "POST" }).validator((input) => parseEditInput(input)).handler(interpretEditorCommand_createServerFn_handler, async ({ data }) => {
	if (!Boolean(process.env.XAI_API_KEY) || data.forceMock) return {
		ok: true,
		plan: interpretMock(data.command, data.scene),
		adapter: "mock"
	};
	return interpretLive(data.command, data.scene);
});
//#endregion
export { interpretEditorCommand_createServerFn_handler };
