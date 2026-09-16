import { t as uid } from "./ids-D2oCDrlv.mjs";
import { c as string, n as array, o as number, r as boolean, s as object, t as _enum } from "../_libs/zod.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { n as STUDENT_REVIEW_QUESTIONS } from "./voice-D6qT5Et6.mjs";
import { i as zenChat, n as buildZenContext, r as extractJson, t as aiAvailable } from "./zen-context-YFY9eKdo.mjs";
import { a as buildLocalStudentReview, i as buildLocalReels, o as toneLabel, r as buildLocalCopyDraft, s as topicLabel } from "./copy-local-C-0StsLs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/copy-ai-9EggZy1r.js
var ToneSchema = _enum([
	"short",
	"normal",
	"emotional",
	"student",
	"life",
	"humor"
]);
var CopyBriefSchema = object({
	topic: _enum([
		"event",
		"emotion",
		"campus",
		"recruit",
		"member",
		"zen-life",
		"countdown",
		"recap",
		"knowledge"
	]).catch("event"),
	tones: array(ToneSchema).min(1).max(4),
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	detail: string().max(1200).catch(""),
	painPoint: string().max(300).catch(""),
	cta: string().max(60).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	signupUrl: string().max(300).catch(""),
	brandVoice: string().max(600).optional(),
	brandDontSay: string().max(300).optional(),
	forbiddenWords: array(string().max(40)).max(20).optional(),
	forceLocal: boolean().optional()
});
function toLocalBrief(data) {
	return {
		topic: data.topic,
		tone: data.tones[0],
		eventName: data.eventName,
		schedule: data.schedule,
		location: data.location,
		detail: data.detail,
		painPoint: data.painPoint,
		cta: data.cta,
		audienceIds: data.audienceIds,
		signupUrl: data.signupUrl
	};
}
function localDrafts(data) {
	const brief = toLocalBrief(data);
	return data.tones.map((tone) => buildLocalCopyDraft(brief, tone));
}
function unwrap(input, schema) {
	if (input && typeof input === "object" && "data" in input) return schema.parse(input.data);
	return schema.parse(input);
}
var CopyJsonSchema = object({ drafts: array(object({
	tone: ToneSchema.catch("normal"),
	hook: string().catch(""),
	body: string().catch(""),
	cta: string().catch(""),
	hashtags: array(string()).max(15).catch([])
})).max(6).catch([]) });
var generateIgCopy_createServerFn_handler = createServerRpc({
	id: "ca6121e6bfa5e659459d5a4afa6adff810d28176000d1565582ceb662f14fd92",
	name: "generateIgCopy",
	filename: "src/lib/ai/copy-ai.ts"
}, (opts) => generateIgCopy.__executeServer(opts));
var generateIgCopy = createServerFn({ method: "POST" }).validator((input) => unwrap(input, CopyBriefSchema)).handler(generateIgCopy_createServerFn_handler, async ({ data }) => {
	const fallback = localDrafts(data);
	if (data.forceLocal || !aiAvailable()) return {
		ok: true,
		drafts: fallback,
		adapter: "local"
	};
	const prompt = [
		buildZenContext({
			audienceIds: data.audienceIds,
			brandVoice: data.brandVoice,
			brandDontSay: data.brandDontSay,
			forbiddenWords: data.forbiddenWords
		}),
		"",
		"【這次要寫的內容】",
		`類型：${topicLabel(data.topic)}`,
		data.eventName ? `活動：${data.eventName}` : "",
		data.schedule ? `時間：${data.schedule}` : "",
		data.location ? `地點：${data.location}` : "",
		data.detail ? `內容說明：${data.detail}` : "",
		data.painPoint ? `想打到的痛點：${data.painPoint}` : "",
		data.cta ? `希望的行動：${data.cta}` : "",
		data.signupUrl ? `報名連結：${data.signupUrl}` : "",
		"",
		`請寫 ${data.tones.length} 個版本，語氣分別是：${data.tones.map((t) => `${t}(${toneLabel(t)})`).join("、")}`,
		"",
		"輸出 JSON：{drafts:[{tone,hook,body,cta,hashtags[]}]}",
		"hook 是第一句，一句話，最多 30 個字，要讓淡江學生覺得「這在講我」。",
		"body 是 IG 內文，用 \\n 分段，2-4 段，短版只要 1-2 段。有活動就一定要寫清楚時間、地點、怎麼參加。",
		"cta 4-10 個字，用社團自己的口氣。",
		"hashtags 6-8 個，要含 #淡江大學 與社團標籤，不要塞滿。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		maxTokens: 2400,
		temperature: .8
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
		drafts: fallback,
		adapter: "local"
	};
	try {
		const drafts = CopyJsonSchema.parse(extractJson(res.text)).drafts.filter((d) => d.hook || d.body).map((d) => ({
			id: uid("copy"),
			tone: d.tone,
			hook: d.hook.trim(),
			body: d.body.trim(),
			cta: d.cta.trim() || data.cta || "來坐一下",
			hashtags: d.hashtags.map((h) => h.startsWith("#") ? h : `#${h}`),
			createdAt: Date.now(),
			source: "live"
		}));
		if (!drafts.length) return {
			ok: false,
			error: "AI 回傳無法解析，先給你本機草稿。",
			drafts: fallback,
			adapter: "local"
		};
		return {
			ok: true,
			drafts,
			adapter: "live"
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析，先給你本機草稿。",
			drafts: fallback,
			adapter: "local"
		};
	}
});
var ReviewSchema = object({
	text: string().min(1).max(4e3),
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	signupUrl: string().max(300).catch(""),
	painPoint: string().max(300).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	forceLocal: boolean().optional()
});
var ReviewJsonSchema = object({
	score: number().min(0).max(100).catch(70),
	items: array(object({
		question: string().catch(""),
		verdict: _enum(["ok", "risk"]).catch("ok"),
		note: string().catch("")
	})).max(14).catch([]),
	rewriteHook: string().catch(""),
	suggestions: array(string()).max(8).catch([])
});
var reviewAsStudent_createServerFn_handler = createServerRpc({
	id: "1830499ede9f7054919614dc4b7eec520e9a1b10152ac740f01bcbace08b8686",
	name: "reviewAsStudent",
	filename: "src/lib/ai/copy-ai.ts"
}, (opts) => reviewAsStudent.__executeServer(opts));
var reviewAsStudent = createServerFn({ method: "POST" }).validator((input) => unwrap(input, ReviewSchema)).handler(reviewAsStudent_createServerFn_handler, async ({ data }) => {
	const brief = {
		topic: "event",
		tone: "normal",
		eventName: data.eventName,
		schedule: data.schedule,
		location: data.location,
		detail: "",
		painPoint: data.painPoint,
		cta: "",
		audienceIds: data.audienceIds,
		signupUrl: data.signupUrl
	};
	const fallback = buildLocalStudentReview(data.text, brief);
	if (data.forceLocal || !aiAvailable()) return {
		ok: true,
		review: fallback,
		adapter: "local"
	};
	const prompt = [
		buildZenContext({ audienceIds: data.audienceIds }),
		"",
		"【任務】現在把身分切換成一個滑到這篇貼文的淡江學生（不是小編）。",
		"誠實回答下面每一題，會覺得怪就說怪。不要客套。",
		STUDENT_REVIEW_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n"),
		"",
		"【要看的內容】",
		data.text.slice(0, 3e3),
		data.eventName ? `\n（活動：${data.eventName}｜時間：${data.schedule || "未寫"}｜地點：${data.location || "未寫"}）` : "",
		"",
		"輸出 JSON：{score, items:[{question,verdict:\"ok\"|\"risk\",note}], rewriteHook, suggestions[]}",
		"score 是 0-100，代表淡江學生會停下來看的可能。",
		"items 要覆蓋上面每一題，note 用學生的口氣寫，一句話。",
		"rewriteHook 是你會更想看的第一句。suggestions 是 2-4 個具體修改，不要空話。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		maxTokens: 1800,
		temperature: .6
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
		review: fallback,
		adapter: "local"
	};
	try {
		const parsed = ReviewJsonSchema.parse(extractJson(res.text));
		const items = parsed.items.filter((i) => i.question);
		if (!items.length) return {
			ok: false,
			error: "AI 回傳無法解析。",
			review: fallback,
			adapter: "local"
		};
		return {
			ok: true,
			adapter: "live",
			review: {
				score: Math.round(parsed.score),
				items,
				rewriteHook: parsed.rewriteHook,
				suggestions: parsed.suggestions,
				createdAt: Date.now(),
				source: "live"
			}
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析。",
			review: fallback,
			adapter: "local"
		};
	}
});
var ReelsSchema = object({
	eventName: string().max(120).catch(""),
	schedule: string().max(120).catch(""),
	location: string().max(120).catch(""),
	detail: string().max(1200).catch(""),
	painPoint: string().max(300).catch(""),
	cta: string().max(60).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	forceLocal: boolean().optional()
});
var ReelsJsonSchema = object({
	hook: string().catch(""),
	cover: string().catch(""),
	beats: array(object({
		range: string().catch(""),
		visual: string().catch(""),
		caption: string().catch(""),
		voice: string().catch(""),
		transition: string().catch(""),
		asset: string().catch("")
	})).max(8).catch([])
});
var generateReelsScript_createServerFn_handler = createServerRpc({
	id: "7ef27ed7046fbee271f733c33c19ad89852901bd561e23efba86c02be7574e09",
	name: "generateReelsScript",
	filename: "src/lib/ai/copy-ai.ts"
}, (opts) => generateReelsScript.__executeServer(opts));
var generateReelsScript = createServerFn({ method: "POST" }).validator((input) => unwrap(input, ReelsSchema)).handler(generateReelsScript_createServerFn_handler, async ({ data }) => {
	const brief = {
		topic: "event",
		tone: "student",
		eventName: data.eventName,
		schedule: data.schedule,
		location: data.location,
		detail: data.detail,
		painPoint: data.painPoint,
		cta: data.cta,
		audienceIds: data.audienceIds,
		signupUrl: ""
	};
	const fallback = buildLocalReels(brief);
	if (data.forceLocal || !aiAvailable()) return {
		ok: true,
		reels: fallback,
		adapter: "local"
	};
	const prompt = [
		buildZenContext({ audienceIds: data.audienceIds }),
		"",
		"【任務】寫一支 20 秒的 Reels 腳本，拍攝者只有一個人、只有手機。",
		data.eventName ? `活動：${data.eventName}｜${data.schedule}｜${data.location}` : "",
		data.detail ? `內容：${data.detail}` : "",
		data.painPoint ? `痛點：${data.painPoint}` : "",
		"",
		"輸出 JSON：{hook, cover, beats:[{range,visual,caption,voice,transition,asset}]}",
		"beats 固定五段：0–3 秒、3–7 秒、7–12 秒、12–17 秒、17–20 秒。",
		"0–3 秒要能讓人停下來，不要出現社團名稱。",
		"visual 要能用手機在淡江校園拍到；asset 寫需要什麼素材。",
		"caption 是畫面上的字幕，短。voice 是旁白，沒有就寫「（無旁白）」。",
		"cover 描述封面畫面。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		maxTokens: 1800,
		temperature: .75
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
		reels: fallback,
		adapter: "local"
	};
	try {
		const parsed = ReelsJsonSchema.parse(extractJson(res.text));
		const beats = parsed.beats.filter((b) => b.visual || b.caption);
		if (!beats.length) return {
			ok: false,
			error: "AI 回傳無法解析。",
			reels: fallback,
			adapter: "local"
		};
		return {
			ok: true,
			adapter: "live",
			reels: {
				hook: parsed.hook || fallback.hook,
				cover: parsed.cover || fallback.cover,
				beats,
				createdAt: Date.now(),
				source: "live"
			}
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析。",
			reels: fallback,
			adapter: "local"
		};
	}
});
var getZenAiStatus_createServerFn_handler = createServerRpc({
	id: "053c91563332c678986db16317e15e99668511125d016720b799489391a15690",
	name: "getZenAiStatus",
	filename: "src/lib/ai/copy-ai.ts"
}, (opts) => getZenAiStatus.__executeServer(opts));
var getZenAiStatus = createServerFn({ method: "POST" }).handler(getZenAiStatus_createServerFn_handler, async () => {
	if (aiAvailable()) return {
		available: true,
		label: "AI 已連線",
		detail: "會先讀品牌記憶、淡江學生情境與現在的學期階段，再生成內容。"
	};
	return {
		available: false,
		label: "本機草稿模式",
		detail: "目前沒有連上 AI。按生成會用本機規則寫一版可以直接編輯的草稿，不是線上模型的回覆。"
	};
});
//#endregion
export { generateIgCopy_createServerFn_handler, generateReelsScript_createServerFn_handler, getZenAiStatus_createServerFn_handler, reviewAsStudent_createServerFn_handler };
