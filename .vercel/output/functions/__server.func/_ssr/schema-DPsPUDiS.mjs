import { c as string, n as array, r as boolean, s as object, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/schema-DPsPUDiS.js
var FORMATS = [
	{
		id: "feed-square",
		name: "正方形貼文",
		short: "1:1",
		ratio: "1:1",
		width: 1080,
		height: 1080,
		usage: "Feed 單張／輪播",
		safe: {
			top: 72,
			right: 72,
			bottom: 72,
			left: 72
		}
	},
	{
		id: "feed-portrait",
		name: "直式貼文",
		short: "4:5",
		ratio: "4:5",
		width: 1080,
		height: 1350,
		usage: "Feed 最大曝光",
		safe: {
			top: 80,
			right: 72,
			bottom: 88,
			left: 72
		}
	},
	{
		id: "feed-landscape",
		name: "橫式貼文",
		short: "1.91:1",
		ratio: "1.91:1",
		width: 1080,
		height: 566,
		usage: "連結預覽／廣告",
		safe: {
			top: 48,
			right: 64,
			bottom: 48,
			left: 64
		}
	},
	{
		id: "story",
		name: "限時動態",
		short: "9:16",
		ratio: "9:16",
		width: 1080,
		height: 1920,
		usage: "Stories 全螢幕",
		safe: {
			top: 250,
			right: 80,
			bottom: 250,
			left: 80
		}
	},
	{
		id: "reels-cover",
		name: "Reels 封面",
		short: "封面",
		ratio: "9:16",
		width: 1080,
		height: 1920,
		usage: "Reels 封面與預覽",
		safe: {
			top: 250,
			right: 80,
			bottom: 250,
			left: 80
		}
	}
];
var FORMAT_BY_ID = Object.fromEntries(FORMATS.map((f) => [f.id, f]));
function formatById(id) {
	return FORMAT_BY_ID[id];
}
function uid(prefix = "id") {
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
var CAROUSEL_SEQUENCE = [
	{
		role: "cover",
		templateId: "product",
		eyebrow: "COVER",
		label: "封面",
		hint: "主視覺與標題"
	},
	{
		role: "problem",
		templateId: "quote",
		eyebrow: "ISSUE",
		label: "痛點",
		hint: "為什麼現在要看"
	},
	{
		role: "detail",
		templateId: "editorial",
		eyebrow: "FOCUS",
		label: "重點",
		hint: "內容與規格"
	},
	{
		role: "proof",
		templateId: "product",
		eyebrow: "PROOF",
		label: "案例",
		hint: "現場或證明"
	},
	{
		role: "cta",
		templateId: "offer",
		eyebrow: "NOW",
		label: "行動",
		hint: "時間地點 CTA"
	},
	{
		role: "close",
		templateId: "quote",
		eyebrow: "NOTE",
		label: "結尾",
		hint: "一句話收束"
	}
];
var CAROUSEL_ROLES = CAROUSEL_SEQUENCE.map((item) => item.role);
var PAGE_ROLE_LABEL = {
	cover: "封面",
	problem: "痛點",
	detail: "重點",
	proof: "案例",
	cta: "行動",
	close: "結尾"
};
var ADAPT_FORMATS = [
	"feed-square",
	"feed-portrait",
	"story",
	"reels-cover"
];
function isCarouselRole(value) {
	return typeof value === "string" && CAROUSEL_ROLES.includes(value);
}
function roleTemplate(role, fallback = "editorial") {
	return CAROUSEL_SEQUENCE.find((item) => item.role === role)?.templateId ?? fallback;
}
function roleEyebrow(role, coverEyebrow = "") {
	if (!role || role === "cover") return coverEyebrow || "EVENT";
	return CAROUSEL_SEQUENCE.find((item) => item.role === role)?.eyebrow ?? role.toUpperCase();
}
function typeScaleFor(formatId) {
	if (formatId === "story" || formatId === "reels-cover") return 1.2;
	if (formatId === "feed-landscape") return .62;
	if (formatId === "feed-square") return .94;
	return 1;
}
function innerFrame(formatId) {
	const format = formatById(formatId);
	return {
		x: format.safe.left,
		y: format.safe.top,
		w: format.width - format.safe.left - format.safe.right,
		h: format.height - format.safe.top - format.safe.bottom
	};
}
function mapBoxToFormat(box, from, to) {
	const src = innerFrame(from);
	const dst = innerFrame(to);
	const relX = src.w ? (box.x - src.x) / src.w : 0;
	const relY = src.h ? (box.y - src.y) / src.h : 0;
	const relW = src.w ? box.w / src.w : 1;
	const relH = src.h ? box.h / src.h : 1;
	return {
		x: Math.round(dst.x + relX * dst.w),
		y: Math.round(dst.y + relY * dst.h),
		w: Math.max(24, Math.round(relW * dst.w)),
		h: Math.max(24, Math.round(relH * dst.h))
	};
}
function remapLayerToFormat(layer, from, to) {
	const box = mapBoxToFormat(layer, from, to);
	if (layer.type === "text") {
		const scale = typeScaleFor(to) / typeScaleFor(from);
		return {
			...layer,
			id: uid("ly"),
			x: box.x,
			y: box.y,
			w: box.w,
			h: box.h,
			fontSize: Math.max(14, Math.min(120, Math.round(layer.fontSize * scale)))
		};
	}
	return {
		...layer,
		id: uid("ly"),
		x: box.x,
		y: box.y,
		w: box.w,
		h: box.h
	};
}
function copyFromArtboard(artboard, fallback) {
	const texts = {};
	for (const layer of artboard.layers) {
		if (layer.type !== "text" || layer.role === "custom") continue;
		if (!texts[layer.role]) texts[layer.role] = layer.text;
	}
	return {
		eyebrow: texts.eyebrow ?? fallback?.eyebrow ?? "",
		headline: texts.headline ?? fallback?.headline ?? "",
		subhead: texts.subhead ?? fallback?.subhead ?? "",
		body: texts.body ?? fallback?.body ?? "",
		cta: texts.cta ?? fallback?.cta ?? "",
		handle: texts.handle ?? fallback?.handle ?? "",
		caption: fallback?.caption ?? "",
		hashtags: fallback?.hashtags ?? [],
		altText: fallback?.altText ?? ""
	};
}
function pagePlanFromArtboard(artboard, index) {
	const copy = copyFromArtboard(artboard);
	const role = artboard.role ?? CAROUSEL_SEQUENCE[index]?.role ?? "detail";
	return {
		role,
		headline: copy.headline,
		subhead: copy.subhead,
		body: copy.body,
		cta: copy.cta,
		visualNote: "",
		templateId: artboard.templateId ?? roleTemplate(role)
	};
}
function stampSlideMeta(pages) {
	return pages.map((page, index) => {
		const role = page.role ?? CAROUSEL_SEQUENCE[index]?.role;
		return {
			...page,
			role,
			templateId: page.templateId ?? roleTemplate(role, "editorial")
		};
	});
}
function completeCarouselPages(pages, fallback) {
	const byRole = /* @__PURE__ */ new Map();
	for (const page of pages) if (!byRole.has(page.role)) byRole.set(page.role, page);
	const unnamed = pages.filter((page) => !isCarouselRole(page.role));
	return CAROUSEL_SEQUENCE.map((seq, index) => {
		const existing = byRole.get(seq.role) ?? unnamed[index];
		if (existing) return {
			...existing,
			role: seq.role,
			templateId: existing.templateId || seq.templateId
		};
		const slot = {
			cover: {
				headline: fallback.headline,
				subhead: fallback.subhead,
				body: fallback.hook || fallback.body
			},
			problem: {
				headline: "為什麼現在看",
				subhead: fallback.insight || fallback.subhead,
				body: fallback.insight || fallback.body
			},
			detail: {
				headline: fallback.body || fallback.headline,
				subhead: fallback.subhead,
				body: fallback.body
			},
			proof: {
				headline: fallback.subhead || fallback.headline,
				subhead: fallback.subhead,
				body: fallback.body
			},
			cta: {
				headline: fallback.cta,
				subhead: fallback.subhead,
				body: fallback.hook || fallback.body
			},
			close: {
				headline: fallback.hook || fallback.headline,
				subhead: fallback.subhead,
				body: fallback.cta
			}
		}[seq.role];
		return {
			role: seq.role,
			headline: slot.headline,
			subhead: slot.subhead,
			body: slot.body,
			cta: fallback.cta,
			visualNote: seq.hint,
			templateId: seq.templateId
		};
	});
}
function copyForCarouselPage(base, page, plan) {
	return {
		...base,
		eyebrow: roleEyebrow(page.role, base.eyebrow),
		headline: page.headline || base.headline,
		subhead: page.subhead || base.subhead,
		body: page.body || base.body,
		cta: page.cta || plan?.cta || base.cta
	};
}
var GOALS = [
	{
		id: "awareness",
		label: "品牌認知",
		hint: "讓人停下來記住你"
	},
	{
		id: "traffic",
		label: "引導到店",
		hint: "網站、地圖或門市"
	},
	{
		id: "conversion",
		label: "轉換購買",
		hint: "下單、預約、兌換"
	},
	{
		id: "ugc",
		label: "互動分享",
		hint: "留言、標註、轉發"
	}
];
function goalLabel(id) {
	return GOALS.find((g) => g.id === id)?.label ?? id;
}
var TemplateIdSchema = _enum([
	"editorial",
	"product",
	"offer",
	"quote"
]).catch("editorial");
var CarouselPageSchema = object({
	role: _enum([
		"cover",
		"problem",
		"detail",
		"proof",
		"cta",
		"close"
	]).catch("detail"),
	headline: string().catch(""),
	subhead: string().catch(""),
	body: string().catch(""),
	cta: string().catch(""),
	visualNote: string().catch(""),
	templateId: TemplateIdSchema
});
var AssetNeedSchema = object({
	kind: _enum([
		"photo",
		"people",
		"background",
		"logo",
		"illustration"
	]).catch("photo"),
	title: string().catch(""),
	detail: string().catch(""),
	required: boolean().catch(true)
});
var PlanJsonSchema = object({
	campaignName: string().catch(""),
	concept: string().catch(""),
	insight: string().catch(""),
	hook: string().catch(""),
	visualTheme: string().catch(""),
	visualDirection: string().catch(""),
	templateId: TemplateIdSchema,
	colorMood: string().catch(""),
	eyebrow: string().catch(""),
	headline: string().catch(""),
	subhead: string().catch(""),
	body: string().catch(""),
	cta: string().catch(""),
	captions: array(object({
		style: string().catch("敘事"),
		text: string().catch("")
	})).max(4).catch([]),
	hashtags: array(string()).max(20).catch([]),
	storyBeats: array(string()).max(5).catch([]),
	carouselPages: array(CarouselPageSchema).max(8).catch([]),
	assetNeeds: array(AssetNeedSchema).max(8).catch([]),
	checklist: array(string()).max(10).catch([]),
	altText: string().catch(""),
	qaNotes: array(string()).max(8).catch([])
});
var BriefInputSchema = object({
	eventName: string().min(1).max(200),
	schedule: string().max(120),
	location: string().max(120),
	product: string().max(200),
	offer: string().max(200),
	audience: string().min(1).max(200),
	goal: _enum([
		"awareness",
		"traffic",
		"conversion",
		"ugc"
	]),
	features: string().max(400),
	style: string().max(200),
	notes: string().max(400),
	wantPost: boolean(),
	wantStory: boolean(),
	wantCarousel: boolean(),
	wantReels: boolean(),
	brandName: string().min(1).max(80),
	handle: string().max(60),
	voice: string().max(400),
	doSay: string().max(200),
	dontSay: string().max(200),
	forbiddenWords: array(string().max(40)).max(20),
	slogans: string().max(240).optional(),
	preferredCtas: string().max(160).optional(),
	imageStyle: string().max(400).optional(),
	forceMock: boolean().optional()
});
//#endregion
export { stampSlideMeta as _, GOALS as a, completeCarouselPages as c, formatById as d, goalLabel as f, roleTemplate as g, remapLayerToFormat as h, FORMATS as i, copyForCarouselPage as l, pagePlanFromArtboard as m, BriefInputSchema as n, PAGE_ROLE_LABEL as o, isCarouselRole as p, CAROUSEL_SEQUENCE as r, PlanJsonSchema as s, ADAPT_FORMATS as t, copyFromArtboard as u, uid as v };
