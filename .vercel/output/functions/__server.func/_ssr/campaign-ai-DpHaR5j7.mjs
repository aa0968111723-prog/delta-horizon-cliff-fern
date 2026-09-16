import { t as uid } from "./ids-D2oCDrlv.mjs";
import { c as string, n as array, o as number, r as boolean, s as object } from "../_libs/zod.mjs";
import { t as CONTENT_KIND_META } from "./status-BrzQjlVh.mjs";
import { _ as eventKindLabel } from "./club-CaoIGk4S.mjs";
import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { i as zenChat, n as buildZenContext, r as extractJson, t as aiAvailable } from "./zen-context-YFY9eKdo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/campaign-ai-DpHaR5j7.js
var CampaignBriefSchema = object({
	name: string().max(120).catch(""),
	kind: string().max(40).catch("class"),
	date: string().max(20).catch(""),
	time: string().max(40).catch(""),
	location: string().max(120).catch(""),
	oneLiner: string().max(300).catch(""),
	intro: string().max(1500).catch(""),
	theme: string().max(200).catch(""),
	painPoint: string().max(300).catch(""),
	cta: string().max(60).catch(""),
	signupUrl: string().max(300).catch(""),
	audienceIds: array(string().max(40)).max(8).catch([]),
	/** 宣傳期還有幾天，AI 用來決定波次密度 */
	daysUntil: number().int().min(-90).max(400).catch(14),
	/** 跨來源搜到的素材摘要，讓 AI 知道有什麼可用 */
	availableAssets: array(string().max(120)).max(20).catch([]),
	forceLocal: boolean().optional()
});
var KIND_VALUES = Object.keys(CONTENT_KIND_META);
var CampaignJsonSchema = object({
	axis: string().catch(""),
	directions: array(object({
		title: string().catch(""),
		concept: string().catch(""),
		visual: string().catch(""),
		sampleHook: string().catch("")
	})).max(4).catch([]),
	waves: array(object({
		offsetDays: number().int().min(-120).max(60).catch(0),
		stage: string().catch(""),
		title: string().catch(""),
		kind: string().catch("ig-post"),
		hook: string().catch(""),
		note: string().catch("")
	})).max(16).catch([])
});
function unwrap(input, schema) {
	if (input && typeof input === "object" && "data" in input) return schema.parse(input.data);
	return schema.parse(input);
}
function asContentKind(raw) {
	return KIND_VALUES.includes(raw) ? raw : "ig-post";
}
/**
* 「AI 生成完整宣傳」：宣傳主軸 + 3 個創意方向 + 發布節奏。
* 節奏由 AI 依活動類型、宣傳期長度自己決定，不是寫死的 14/10/7/5/3/2/1。
*/
var generateCampaignStrategy_createServerFn_handler = createServerRpc({
	id: "7fa32adcefe04ce494c9666a6c08adc0c5b2886a1c27e0f9c37853ec29bfcb11",
	name: "generateCampaignStrategy",
	filename: "src/lib/ai/campaign-ai.ts"
}, (opts) => generateCampaignStrategy.__executeServer(opts));
var generateCampaignStrategy = createServerFn({ method: "POST" }).validator((input) => unwrap(input, CampaignBriefSchema)).handler(generateCampaignStrategy_createServerFn_handler, async ({ data }) => {
	if (data.forceLocal || !aiAvailable()) return {
		ok: false,
		error: "目前沒有連上 AI，先用本機節奏草稿。",
		adapter: "local"
	};
	const prompt = [
		buildZenContext({ audienceIds: data.audienceIds }),
		"",
		"【這場活動】",
		`名稱：${data.name || "未命名"}（${eventKindLabel(data.kind)}）`,
		data.date ? `日期：${data.date} ${data.time}` : "日期：未定",
		data.location ? `地點：${data.location}` : "",
		data.oneLiner ? `一句話介紹：${data.oneLiner}` : "",
		data.intro ? `完整介紹：${data.intro}` : "",
		data.theme ? `活動主題：${data.theme}` : "",
		data.painPoint ? `學生痛點：${data.painPoint}` : "",
		data.cta ? `主要行動：${data.cta}` : "",
		data.signupUrl ? `報名連結：有` : "報名方式：直接到現場",
		`距離活動還有 ${data.daysUntil} 天。`,
		data.availableAssets.length ? `現有素材：${data.availableAssets.join("、")}` : "",
		"",
		"【任務】規劃這場活動的完整 IG 宣傳。",
		"輸出 JSON：{axis, directions:[{title,concept,visual,sampleHook}], waves:[{offsetDays,stage,title,kind,hook,note}]}",
		"axis：這次宣傳的主軸，一到兩句。不是口號，是策略判斷。",
		"directions：正好 3 個創意方向，彼此角度要真的不同（不要只是換形容詞）。sampleHook 是那個方向的第一句示範。",
		`waves：發布節奏，${Math.max(4, Math.min(12, Math.round(data.daysUntil / 2) + 3))} 篇左右。`,
		"offsetDays 是相對活動日的天數（-14 代表提前 14 天，0 是當天，2 是活動後兩天）。",
		`kind 只能用：${KIND_VALUES.join("、")}`,
		"節奏規則：不要連續三篇都是活動廣告。要穿插生活、互動、知識、社員故事，讓版面不像一直在招生。",
		"宣傳期短就壓縮波次，宣傳期長就在前段多放情緒與生活內容。",
		"活動當天要有提醒，活動後要有回顧。",
		"每一篇的 hook 是第一句，title 是這篇要講什麼，note 是製作提醒（要什麼素材、注意什麼）。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		maxTokens: 3600,
		temperature: .75
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
		adapter: "local"
	};
	try {
		const parsed = CampaignJsonSchema.parse(extractJson(res.text));
		const waves = parsed.waves.filter((w) => w.title || w.hook).sort((a, b) => a.offsetDays - b.offsetDays).map((w) => ({
			id: uid("wave"),
			offsetDays: w.offsetDays,
			stage: w.stage,
			title: w.title,
			kind: asContentKind(w.kind),
			hook: w.hook,
			note: w.note,
			contentId: null
		}));
		const directions = parsed.directions.filter((d) => d.title).map((d) => ({
			id: uid("dir"),
			title: d.title,
			concept: d.concept,
			visual: d.visual,
			sampleHook: d.sampleHook
		}));
		if (!waves.length) return {
			ok: false,
			error: "AI 回傳無法解析，先用本機節奏草稿。",
			adapter: "local"
		};
		return {
			ok: true,
			adapter: "live",
			axis: parsed.axis,
			directions,
			waves
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析，先用本機節奏草稿。",
			adapter: "local"
		};
	}
});
var IdeaSchema = object({
	audienceIds: array(string().max(40)).max(8).catch([]),
	recentTopics: array(string().max(120)).max(12).catch([]),
	upcoming: string().max(300).catch(""),
	forceLocal: boolean().optional()
});
var IdeaJsonSchema = object({ ideas: array(object({
	title: string().catch(""),
	hook: string().catch(""),
	kind: string().catch("ig-post"),
	why: string().catch("")
})).max(6).catch([]) });
var generateIdeas_createServerFn_handler = createServerRpc({
	id: "2e49305bc0c291ee368d144a30d188482352f2cde0ff93e37a0a1acd7a9473e9",
	name: "generateIdeas",
	filename: "src/lib/ai/campaign-ai.ts"
}, (opts) => generateIdeas.__executeServer(opts));
var generateIdeas = createServerFn({ method: "POST" }).validator((input) => unwrap(input, IdeaSchema)).handler(generateIdeas_createServerFn_handler, async ({ data }) => {
	if (data.forceLocal || !aiAvailable()) return {
		ok: false,
		error: "目前沒有連上 AI。",
		adapter: "local"
	};
	const prompt = [
		buildZenContext({ audienceIds: data.audienceIds }),
		"",
		data.upcoming ? `【近期活動】${data.upcoming}` : "【近期活動】沒有排定的活動。",
		data.recentTopics.length ? `【最近發過】${data.recentTopics.join("、")}（不要重複）` : "",
		"",
		"【任務】給 4 個今天就可以開始做的內容題目，要適合現在這個學期階段。",
		`輸出 JSON：{ideas:[{title,hook,kind,why}]}，kind 只能用：${KIND_VALUES.join("、")}`,
		"hook 是第一句示範。why 用一句話說為什麼現在適合發這個。",
		"至少一個題目跟活動無關，是純生活或知識型內容。"
	].filter(Boolean).join("\n");
	const res = await zenChat({
		prompt,
		maxTokens: 1400,
		temperature: .9
	});
	if (!res.ok) return {
		ok: false,
		error: res.error === "no-key" ? "目前沒有連上 AI" : res.error,
		adapter: "local"
	};
	try {
		const ideas = IdeaJsonSchema.parse(extractJson(res.text)).ideas.filter((i) => i.title || i.hook).map((i) => ({
			id: uid("idea"),
			title: i.title,
			hook: i.hook,
			kind: asContentKind(i.kind),
			why: i.why
		}));
		if (!ideas.length) return {
			ok: false,
			error: "AI 回傳無法解析。",
			adapter: "local"
		};
		return {
			ok: true,
			ideas,
			adapter: "live"
		};
	} catch {
		return {
			ok: false,
			error: "AI 回傳無法解析。",
			adapter: "local"
		};
	}
});
//#endregion
export { generateCampaignStrategy_createServerFn_handler, generateIdeas_createServerFn_handler };
