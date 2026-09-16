import { t as uid } from "./ids-D2oCDrlv.mjs";
import { c as string, n as array, r as boolean, s as object, t as _enum } from "../_libs/zod.mjs";
import { h as VISUAL_ANCHORS } from "./club-CaoIGk4S.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { i as zenChat, n as buildZenContext, r as extractJson, t as aiAvailable } from "./zen-context-YFY9eKdo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/image-ai-CcsLx-v3.js
/** 主視覺方向：一個方向包含概念、配色、構圖、字體與可直接送生成的圖片 prompt。 */
var DirectionBriefSchema = object({
	intent: string().min(1).max(600),
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	painPoint: string().max(300).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	imageStyle: string().max(600).optional(),
	forceLocal: boolean().optional()
});
var DirectionJsonSchema = object({ directions: array(object({
	title: string().catch(""),
	concept: string().catch(""),
	palette: string().catch(""),
	composition: string().catch(""),
	typography: string().catch(""),
	imagePrompt: string().catch(""),
	headline: string().catch(""),
	subhead: string().catch("")
})).max(4).catch([]) });
function unwrap(input, schema) {
	if (input && typeof input === "object" && "data" in input) return schema.parse(input.data);
	return schema.parse(input);
}
/** 沒有 AI 時的三個方向，仍然照品牌記憶走。 */
function localDirections(intent) {
	const subject = intent.trim().replace(/^我要宣傳/, "").trim() || "社課";
	return [
		{
			id: uid("vis"),
			title: "夜晚的安靜",
			concept: `把${subject}講成「一個安靜的晚上」，訴求晚上沒事做、腦袋停不下來的學生。`,
			palette: "夜光為主、曦光作點光，底色偏深但不壓抑",
			composition: "上三分之二留給夜色與燈光，下方紙白色塊放大標",
			typography: "襯線大標兩行，無襯線小字放時間地點",
			imagePrompt: `dim dorm desk at night lit by a single warm lamp, notebook and a mug, deep indigo shadows, soft glow, calm and spacious, muted film photo, no text, no religious symbols, ${VISUAL_ANCHORS.mood}`,
			headline: "有時候需要的\n只是一個安靜的晚上",
			subhead: "不用準備什麼，來就好。"
		},
		{
			id: uid("vis"),
			title: "窗邊的白天",
			concept: `讓${subject}看起來像社課現場，不像宗教場所。降低第一次來的不確定感。`,
			palette: "紙白底、澄光為主色，木頭與米色",
			composition: "主體偏左，右側大面留白給標題與流程三行字",
			typography: "無襯線為主，字級層級清楚，時間地點放大",
			imagePrompt: `sunlit corner of a university classroom, meditation cushions on wooden floor, soft daylight through window blinds, warm neutral palette, airy negative space, documentary photo, no text, no religious iconography, ${VISUAL_ANCHORS.mood}`,
			headline: "坐下來\n然後什麼都不用做",
			subhead: "引導十五分鐘 · 想講再講"
		},
		{
			id: uid("vis"),
			title: "淡水的光",
			concept: `用淡水河的傍晚做地方感，讓淡江學生一眼認出這是自己的生活場景。`,
			palette: "曦光與夜光漸層，紙白作文字底",
			composition: "滿版風景，標題壓在下三分之一半透明紙白區",
			typography: "襯線大標＋細長英文眉題",
			imagePrompt: `Tamsui riverside at dusk seen from a campus slope, warm amber sky fading into blue, distant ferry lights, silhouettes of trees, quiet and wide, cinematic photo, no text, ${VISUAL_ANCHORS.mood}`,
			headline: "走上坡的時候\n你通常在想什麼",
			subhead: "這週三晚上，來坐一小時。"
		}
	];
}
/**
* AI Image Studio 的第一步：不是直接生圖，而是先想清楚方向。
* 使用者輸入「我要宣傳茶會」，AI 會先考慮活動、學生情境、淡水、品牌色，
* 再提出三個可以各自往下生成的視覺方向。
*/
var generateVisualDirections_createServerFn_handler = createServerRpc({
	id: "be0447b4c1a8c8942aa6c3fad59c141c81b2d731750fbc5191f22be12f982747",
	name: "generateVisualDirections",
	filename: "src/lib/ai/image-ai.ts"
}, (opts) => generateVisualDirections.__executeServer(opts));
var generateVisualDirections = createServerFn({ method: "POST" }).validator((input) => unwrap(input, DirectionBriefSchema)).handler(generateVisualDirections_createServerFn_handler, async ({ data }) => {
	const fallback = localDirections(data.intent);
	if (data.forceLocal || !aiAvailable()) return {
		ok: false,
		error: "目前沒有連上 AI，先給你本機的三個方向。",
		directions: fallback,
		adapter: "local"
	};
	const prompt = [
		buildZenContext({
			audienceIds: data.audienceIds,
			imageStyle: data.imageStyle
		}),
		"",
		"【使用者想做的事】",
		data.intent,
		data.eventName ? `活動：${data.eventName}｜${data.schedule}｜${data.location}` : "",
		data.painPoint ? `學生痛點：${data.painPoint}` : "",
		"",
		"【任務】先想，再給方向。不要直接產出「禪風海報」這種模板答案。",
		"想的順序：活動主題 → 活動時間（白天／夜晚）→ 學生情境 → 淡水生活 → 校園 → 壓力 → 朋友感 → 氣氛 → 品牌色與三色光 → IG 上會不會讓人停下來。",
		"",
		"輸出 JSON：{directions:[{title,concept,palette,composition,typography,imagePrompt,headline,subhead}]}",
		"正好 3 個方向，角度要真的不同（例如：夜晚情緒／白天現場／地方感）。",
		"imagePrompt 用英文寫，給文生圖模型用：具體場景、光線、色調、鏡頭感，結尾加 no text。",
		"imagePrompt 不要出現蓮花、佛像、金光、宗教符號、擺拍的笑臉。",
		"headline 最多兩行，用 \\n 分行，每行不超過 10 個中文字。subhead 一句。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		maxTokens: 2200,
		temperature: .85
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
		directions: fallback,
		adapter: "local"
	};
	try {
		const directions = DirectionJsonSchema.parse(extractJson(res.text)).directions.filter((d) => d.title || d.imagePrompt).map((d) => ({
			id: uid("vis"),
			title: d.title,
			concept: d.concept,
			palette: d.palette,
			composition: d.composition,
			typography: d.typography,
			imagePrompt: d.imagePrompt,
			headline: d.headline,
			subhead: d.subhead
		}));
		if (!directions.length) return {
			ok: false,
			error: "AI 回傳無法解析。",
			directions: fallback,
			adapter: "local"
		};
		return {
			ok: true,
			directions,
			adapter: "live"
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析。",
			directions: fallback,
			adapter: "local"
		};
	}
});
var ImageGenSchema = object({
	prompt: string().min(1).max(1200),
	/** 產出比例，會影響加在 prompt 後面的說明 */
	ratio: _enum([
		"4:5",
		"1:1",
		"9:16",
		"1.91:1"
	]).catch("4:5")
});
var RATIO_HINT = {
	"4:5": "vertical 4:5 Instagram feed composition",
	"1:1": "square 1:1 Instagram feed composition",
	"9:16": "tall 9:16 vertical composition for Instagram story, keep the middle third clear for text",
	"1.91:1": "wide 1.91:1 landscape composition"
};
/**
* 真的呼叫 xAI Imagine 生圖。金鑰是社團擁有者的，所以只在使用者按下按鈕時呼叫，
* 一次一張，不做自動重試風暴。
*/
var generateImage_createServerFn_handler = createServerRpc({
	id: "164be129fc3d75a3d02af05799091b61462961f408ef096197cd3f8a58ed7539",
	name: "generateImage",
	filename: "src/lib/ai/image-ai.ts"
}, (opts) => generateImage.__executeServer(opts));
var generateImage = createServerFn({ method: "POST" }).validator((input) => unwrap(input, ImageGenSchema)).handler(generateImage_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "這個環境沒有連上圖片生成服務。可以先用素材庫的圖，或之後再生成。"
	};
	const prompt = [
		data.prompt,
		RATIO_HINT[data.ratio],
		"soft natural light, airy negative space, muted warm neutral palette with one accent light, documentary photo feel, no text, no watermark, no religious iconography"
	].join(", ");
	try {
		const res = await fetch("https://api.x.ai/v1/images/generations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: "grok-imagine-image-quality",
				prompt,
				n: 1,
				response_format: "b64_json"
			})
		});
		if (!res.ok) return {
			ok: false,
			error: `圖片生成失敗（${res.status}）。稍後再試一次。`
		};
		const first = (await res.json()).data?.[0];
		if (first?.b64_json) return {
			ok: true,
			dataUrl: `data:image/png;base64,${first.b64_json}`,
			revisedPrompt: first.revised_prompt
		};
		if (first?.url) {
			const fetched = await fetch(first.url);
			if (!fetched.ok) return {
				ok: false,
				error: "圖片下載失敗。"
			};
			const buffer = Buffer.from(await fetched.arrayBuffer());
			return {
				ok: true,
				dataUrl: `data:${fetched.headers.get("content-type") ?? "image/png"};base64,${buffer.toString("base64")}`,
				revisedPrompt: first.revised_prompt
			};
		}
		return {
			ok: false,
			error: "圖片生成沒有回傳結果。"
		};
	} catch {
		return {
			ok: false,
			error: "無法連上圖片生成服務。"
		};
	}
});
var VisionSchema = object({
	imageUrl: string().min(1).max(3e6),
	question: string().max(600).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([])
});
var VisionJsonSchema = object({
	summary: string().catch(""),
	content: string().catch(""),
	people: string().catch(""),
	color: string().catch(""),
	light: string().catch(""),
	composition: string().catch(""),
	textRatio: string().catch(""),
	hierarchy: string().catch(""),
	brandFit: string().catch(""),
	studentFit: string().catch(""),
	stopPower: string().catch(""),
	tooReligious: boolean().catch(false),
	tooOld: boolean().catch(false),
	tooAi: boolean().catch(false),
	fitsTku: boolean().catch(true),
	nextSteps: array(string()).max(8).catch([]),
	stylePrompt: string().catch(""),
	captionIdea: string().catch("")
});
var analyzeImage_createServerFn_handler = createServerRpc({
	id: "9a3f680954aed293f72e1ad989246bf475f866215b5eec2338fc8fdc4093fe93",
	name: "analyzeImage",
	filename: "src/lib/ai/image-ai.ts"
}, (opts) => analyzeImage.__executeServer(opts));
var analyzeImage = createServerFn({ method: "POST" }).validator((input) => unwrap(input, VisionSchema)).handler(analyzeImage_createServerFn_handler, async ({ data }) => {
	if (!aiAvailable()) return {
		ok: false,
		error: "這個環境沒有連上圖片理解服務。"
	};
	const prompt = [
		buildZenContext({ audienceIds: data.audienceIds }),
		"",
		"【任務】看這張圖，用禪學社小編的眼光判斷它能不能用、怎麼用。",
		data.question ? `使用者特別想知道：${data.question}` : "",
		"",
		"輸出 JSON：{summary,content,people,color,light,composition,textRatio,hierarchy,brandFit,studentFit,stopPower,tooReligious,tooOld,tooAi,fitsTku,nextSteps[],stylePrompt,captionIdea}",
		"summary 一句話講這張圖是什麼。content 畫面內容。people 人物（沒有就寫沒有）。",
		"color 色彩、light 光線、composition 構圖、textRatio 文字比例、hierarchy 視覺層級。",
		"brandFit 跟禪學社品牌感的距離；studentFit 淡江學生看了的感覺；stopPower 會不會讓人停下來。",
		"tooReligious/tooOld/tooAi/fitsTku 用 true / false 誠實判斷。",
		"nextSteps 是 3-5 個可以直接做的下一步（例如：延續這個風格、保留內容重新設計、做成限動、做成輪播、做成 Reels 封面）。",
		"stylePrompt 用英文寫，是「延續這個風格」時可以送去生圖的 prompt。",
		"captionIdea 是看到這張圖時想到的第一句文案。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		imageUrls: [data.imageUrl],
		maxTokens: 2e3,
		temperature: .5
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error
	};
	try {
		return {
			ok: true,
			analysis: VisionJsonSchema.parse(extractJson(res.text))
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析。"
		};
	}
});
//#endregion
export { analyzeImage_createServerFn_handler, generateImage_createServerFn_handler, generateVisualDirections_createServerFn_handler };
