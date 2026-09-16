import "../_runtime.mjs";
import { _ as stampSlideMeta, c as completeCarouselPages, d as formatById, g as roleTemplate, h as remapLayerToFormat, l as copyForCarouselPage, m as pagePlanFromArtboard, o as PAGE_ROLE_LABEL$1, p as isCarouselRole, r as CAROUSEL_SEQUENCE, u as copyFromArtboard, v as uid } from "./schema-DPsPUDiS.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { A as Slot, P as require_jsx_runtime } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function emptyDeliverables() {
	return {
		post: true,
		story: false,
		carousel: false,
		reels: false
	};
}
function emptyBrief() {
	return {
		product: "",
		eventName: "",
		schedule: "",
		location: "",
		offer: "",
		audience: "淡江大學學生，包含新生、住宿生、通勤生，以及最近感到壓力或想認識新朋友的人",
		goal: "awareness",
		features: "",
		style: "明亮、自然、有學生生活感；把禪轉譯成喘口氣、安定與認識自己",
		notes: "先從淡江學生正在經歷的生活情境切入，不說教、不過度宗教、不寫成工整的 AI 金句。",
		deliverables: emptyDeliverables()
	};
}
function migrateBrief(raw) {
	const base = emptyBrief();
	if (!raw) return base;
	const eventName = (raw.eventName || raw.product || "").trim();
	return {
		...base,
		...raw,
		product: (raw.product || eventName).trim(),
		eventName,
		schedule: raw.schedule ?? "",
		location: raw.location ?? "",
		features: raw.features ?? "",
		style: raw.style ?? "",
		notes: raw.notes ?? "",
		offer: raw.offer ?? "",
		audience: raw.audience ?? "",
		goal: raw.goal ?? "awareness",
		deliverables: {
			...emptyDeliverables(),
			...raw.deliverables ?? {}
		}
	};
}
function formatsFromBrief(brief, current) {
	const d = {
		...emptyDeliverables(),
		...brief.deliverables
	};
	if (!d.post && !d.story && !d.carousel && !d.reels) d.post = true;
	const feed = current.startsWith("feed") ? current : "feed-portrait";
	const next = [];
	if (d.post || d.carousel) next.push(feed);
	if (d.story) next.push("story");
	if (d.reels) next.push("reels-cover");
	return [...new Set(next)];
}
function asPages(raw) {
	if (!Array.isArray(raw)) return [];
	return raw.map((item) => {
		const row = item;
		if (!row.headline) return null;
		return {
			role: isCarouselRole(row.role) ? row.role : "detail",
			headline: row.headline,
			subhead: row.subhead ?? "",
			body: row.body ?? "",
			cta: row.cta ?? "",
			visualNote: row.visualNote ?? "",
			templateId: row.templateId ?? "product"
		};
	}).filter((item) => Boolean(item));
}
function asNeeds(raw) {
	if (!Array.isArray(raw)) return [];
	return raw.map((item) => {
		const row = item;
		if (!row.title) return null;
		return {
			kind: row.kind ?? "photo",
			title: row.title,
			detail: row.detail ?? "",
			required: row.required ?? true
		};
	}).filter((item) => Boolean(item));
}
function migratePlan(raw) {
	if (!raw) return null;
	const captions = Array.isArray(raw.captions) ? raw.captions : [];
	return {
		campaignName: raw.campaignName ?? "",
		concept: raw.concept || raw.insight || "",
		insight: raw.insight ?? "",
		hook: raw.hook ?? "",
		visualTheme: raw.visualTheme || raw.colorMood || "",
		visualDirection: raw.visualDirection ?? "",
		templateId: raw.templateId ?? "editorial",
		colorMood: raw.colorMood ?? "",
		eyebrow: raw.eyebrow ?? "",
		headline: raw.headline || raw.hook || raw.campaignName || "",
		subhead: raw.subhead || raw.insight || "",
		body: raw.body || raw.visualDirection || "",
		cta: raw.cta || "了解更多",
		captions,
		hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
		storyBeats: Array.isArray(raw.storyBeats) ? raw.storyBeats : [],
		carouselPages: asPages(raw.carouselPages),
		assetNeeds: asNeeds(raw.assetNeeds),
		checklist: Array.isArray(raw.checklist) ? raw.checklist : Array.isArray(raw.qaNotes) ? raw.qaNotes : [],
		altText: raw.altText ?? "",
		qaNotes: Array.isArray(raw.qaNotes) ? raw.qaNotes : [],
		generatedAt: raw.generatedAt ?? Date.now(),
		source: raw.source === "mock" || raw.source === "live" ? raw.source : "live"
	};
}
function migratePlanVersions(raw, fallback) {
	if (Array.isArray(raw) && raw.length) return raw.map((item) => {
		const row = item;
		const plan = migratePlan(row.plan);
		if (!plan) return null;
		return {
			id: row.id || `plan_${plan.generatedAt}`,
			createdAt: row.createdAt ?? plan.generatedAt,
			source: row.source ?? plan.source,
			name: row.name || plan.campaignName || "企劃版本",
			plan
		};
	}).filter((item) => Boolean(item));
	if (fallback) return [{
		id: `plan_${fallback.generatedAt}`,
		createdAt: fallback.generatedAt,
		source: fallback.source,
		name: fallback.campaignName || "初稿",
		plan: fallback
	}];
	return [];
}
var DELIVERABLE_OPTIONS = [
	{
		id: "post",
		label: "貼文",
		hint: "1:1 或 4:5 單張"
	},
	{
		id: "carousel",
		label: "輪播",
		hint: "六頁說完活動"
	},
	{
		id: "story",
		label: "限時動態",
		hint: "9:16 分鏡"
	},
	{
		id: "reels",
		label: "Reels 封面",
		hint: "9:16 封面"
	}
];
var ASSET_NEED_LABEL = {
	photo: "活動照片",
	people: "人物",
	background: "背景",
	logo: "Logo",
	illustration: "插圖"
};
var PAGE_ROLE_LABEL = PAGE_ROLE_LABEL$1;
var ASSET_DRAG_MIME = "application/x-kouzhen-asset";
var ASSET_CATEGORIES = [
	{
		id: "photo",
		label: "活動照片",
		hint: "商品、場景、活動紀實"
	},
	{
		id: "people",
		label: "人物",
		hint: "人像、手部、服務瞬間"
	},
	{
		id: "background",
		label: "背景",
		hint: "桌面、材質、留白場景"
	},
	{
		id: "illustration",
		label: "插圖",
		hint: "手繪、裝飾、編輯素材"
	},
	{
		id: "icon",
		label: "圖示",
		hint: "小圖、符號、徽章"
	},
	{
		id: "logo",
		label: "Logo",
		hint: "標誌與變體"
	},
	{
		id: "template",
		label: "模板",
		hint: "可套用的版型起點",
		virtual: true
	},
	{
		id: "history",
		label: "歷史素材",
		hint: "曾放到畫布的檔案",
		virtual: true
	}
];
var ASSET_SOURCES = [
	{
		id: "upload",
		label: "本機上傳"
	},
	{
		id: "seed",
		label: "示範素材"
	},
	{
		id: "generated",
		label: "生成"
	}
];
function categoryLabel(id) {
	return ASSET_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}
function sourceLabel(id) {
	return ASSET_SOURCES.find((item) => item.id === id)?.label ?? id;
}
function usageLabel(status) {
	if (status === "in-use") return "使用中";
	if (status === "used") return "曾使用";
	return "未使用";
}
function kindFromCategory(category) {
	if (category === "logo") return "logo";
	if (category === "background") return "pattern";
	return "image";
}
function inferCategory(raw) {
	if (raw.category && ASSET_CATEGORIES.some((item) => item.id === raw.category)) return raw.category;
	if (raw.kind === "logo") return "logo";
	if (raw.kind === "pattern") return "background";
	const blob = `${(raw.tags ?? []).join(" ").toLowerCase()} ${(raw.name ?? "").toLowerCase()}`;
	if (/人物|人像|portrait|people/.test(blob)) return "people";
	if (/背景|場景|材質|background|texture/.test(blob)) return "background";
	if (/插圖|illustration|handdrawn/.test(blob)) return "illustration";
	if (/圖示|icon|badge/.test(blob)) return "icon";
	if (/logo|標誌/.test(blob)) return "logo";
	return "photo";
}
function migrateAsset(raw) {
	const category = inferCategory(raw);
	return {
		id: raw.id,
		name: raw.name,
		kind: raw.kind ?? kindFromCategory(category),
		category,
		mime: raw.mime ?? "image/jpeg",
		width: raw.width ?? 0,
		height: raw.height ?? 0,
		tags: Array.isArray(raw.tags) ? raw.tags : [],
		createdAt: raw.createdAt ?? Date.now(),
		updatedAt: raw.updatedAt ?? raw.createdAt ?? Date.now(),
		seedSrc: raw.seedSrc,
		source: raw.source === "seed" || raw.source === "generated" || raw.source === "upload" ? raw.source : "upload",
		licenseNotes: raw.licenseNotes ?? "",
		licenseOwner: raw.licenseOwner ?? "",
		favorite: Boolean(raw.favorite),
		lastUsedAt: raw.lastUsedAt ?? null,
		useCount: raw.useCount ?? 0
	};
}
function createGeneratedAsset(input) {
	const now = Date.now();
	return migrateAsset({
		id: input.id,
		name: input.name,
		kind: kindFromCategory(input.category ?? "icon"),
		category: input.category ?? "icon",
		mime: input.mime,
		width: input.width,
		height: input.height,
		tags: ["生成", "QR"],
		createdAt: now,
		updatedAt: now,
		source: "generated",
		licenseNotes: "由構幀依報名網址在本機產生，僅供畫面使用。",
		licenseOwner: "本機產生"
	});
}
function matchesAssetQuery(asset, query) {
	const q = query.trim().toLowerCase();
	if (!q) return true;
	const blob = [
		asset.name,
		asset.category,
		categoryLabel(asset.category),
		asset.licenseNotes,
		...asset.tags ?? []
	].join(" ").toLowerCase();
	return q.split(/\s+/).every((part) => blob.includes(part));
}
function collectFromBoard(board, ids) {
	if (!board) return;
	for (const layer of board.layers) {
		if (layer.type === "image") ids.add(layer.assetId);
		if (layer.type === "logo" && layer.assetId) ids.add(layer.assetId);
		if (board.background.assetId) ids.add(board.background.assetId);
	}
}
function collectUsedAssetIds(projects, brands) {
	const ids = /* @__PURE__ */ new Set();
	for (const project of projects) {
		for (const board of Object.values(project.artboards)) collectFromBoard(board, ids);
		for (const list of Object.values(project.slides ?? {})) for (const board of list ?? []) collectFromBoard(board, ids);
	}
	for (const brand of brands) {
		if (brand.logoAssetId) ids.add(brand.logoAssetId);
		for (const logo of brand.logos ?? []) ids.add(logo.assetId);
	}
	return ids;
}
function assetUsageStatus(asset, usedIds) {
	if (usedIds.has(asset.id)) return "in-use";
	if (asset.useCount > 0 || asset.lastUsedAt) return "used";
	return "unused";
}
function fitPlacedAsset(asset, maxW, maxH) {
	const w = Math.max(1, asset.width || maxW);
	const h = Math.max(1, asset.height || maxH);
	const scale = Math.min(maxW / w, maxH / h, 1);
	return {
		w: Math.max(48, Math.round(w * scale)),
		h: Math.max(48, Math.round(h * scale))
	};
}
var DEFAULT_FILTER = {
	brightness: 1,
	contrast: 1,
	saturate: 1,
	blur: 0,
	grayscale: 0
};
var DEFAULT_CROP = {
	x: 50,
	y: 50,
	zoom: 1
};
var DEFAULT_SHADOW = {
	enabled: false,
	x: 0,
	y: 12,
	blur: 28,
	color: "rgba(26,24,20,0.28)"
};
function brandColor(brand, role, fallback) {
	return brand.colors.find((c) => c.role === role)?.hex ?? fallback;
}
function base(partial) {
	return {
		id: partial.id ?? uid("ly"),
		name: partial.name,
		type: partial.type,
		x: partial.x ?? 80,
		y: partial.y ?? 80,
		w: partial.w ?? 400,
		h: partial.h ?? 240,
		rotation: partial.rotation ?? 0,
		opacity: partial.opacity ?? 1,
		locked: partial.locked ?? false,
		hidden: partial.hidden ?? false,
		fromLayout: partial.fromLayout ?? false,
		radius: partial.radius ?? 0,
		shadow: partial.shadow ?? { ...DEFAULT_SHADOW }
	};
}
function createTextLayer(brand, opts = {}) {
	return {
		...base({
			name: opts.name ?? "文字",
			type: "text",
			x: opts.x ?? 120,
			y: opts.y ?? 200,
			w: opts.w ?? 800,
			h: opts.h ?? 120
		}),
		type: "text",
		text: opts.text ?? "新文字",
		role: opts.role ?? "custom",
		fontFamily: opts.fontFamily ?? brand.fontDisplay,
		fontWeight: 600,
		fontSize: opts.fontSize ?? 48,
		lineHeight: 1.2,
		letterSpacing: 0,
		color: opts.color ?? brandColor(brand, "ink", "#1A1814"),
		align: opts.align ?? "left"
	};
}
function createShapeLayer(brand, kind, opts = {}) {
	const pill = kind === "pill";
	return {
		...base({
			name: opts.name ?? (pill ? "膠囊" : kind === "ellipse" ? "圓形" : "矩形"),
			type: "shape",
			x: opts.x ?? 200,
			y: opts.y ?? 400,
			w: opts.w ?? (pill ? 280 : 400),
			h: opts.h ?? (pill ? 72 : 240),
			radius: kind === "rect" ? 0 : 24
		}),
		type: "shape",
		shape: kind,
		fill: opts.fill ?? brandColor(brand, "accent", "#1E4A45"),
		radius: kind === "rect" ? 0 : kind === "pill" ? 999 : 9999,
		stroke: void 0,
		strokeWidth: 0
	};
}
function createLineLayer(brand, opts = {}) {
	return {
		...base({
			name: "線條",
			type: "line",
			x: opts.x ?? 120,
			y: opts.y ?? 400,
			w: opts.w ?? 480,
			h: opts.h ?? 40
		}),
		type: "line",
		stroke: opts.stroke ?? brandColor(brand, "accent", "#1E4A45"),
		strokeWidth: 4
	};
}
function createImageLayer(assetId, name, opts = {}) {
	return {
		...base({
			name,
			type: "image",
			x: opts.x ?? 0,
			y: opts.y ?? 0,
			w: opts.w ?? 1080,
			h: opts.h ?? 720,
			radius: 0
		}),
		type: "image",
		assetId,
		objectFit: opts.objectFit ?? "cover",
		crop: { ...DEFAULT_CROP },
		filter: { ...DEFAULT_FILTER },
		radius: 0
	};
}
function createLogoLayer(brand, opts = {}) {
	const assetId = opts.assetId ?? brand.logoAssetId;
	if (!assetId) return null;
	const size = opts.size ?? 96;
	return {
		...base({
			name: "Logo",
			type: "logo",
			x: opts.x ?? 80,
			y: opts.y ?? 80,
			w: size,
			h: size
		}),
		type: "logo",
		assetId,
		radius: 0
	};
}
function duplicateLayer(layer, offset = 40) {
	const copy = structuredClone(layer);
	copy.id = uid("ly");
	copy.name = `${layer.name} 副本`;
	copy.x = layer.x + offset;
	copy.y = layer.y + offset;
	copy.fromLayout = false;
	copy.locked = false;
	if (copy.type === "text") copy.role = "custom";
	return copy;
}
function cloneArtboard(artboard) {
	const next = structuredClone(artboard);
	next.layers = next.layers.map((layer) => ({
		...layer,
		id: uid("ly"),
		fromLayout: false
	}));
	return next;
}
function emptyArtboard(formatId, color) {
	return {
		formatId,
		background: {
			type: "solid",
			color
		},
		layers: []
	};
}
function normalizeFilter(raw) {
	return {
		brightness: raw?.brightness ?? 1,
		contrast: raw?.contrast ?? 1,
		saturate: raw?.saturate ?? 1,
		blur: raw?.blur ?? 0,
		grayscale: raw?.grayscale ?? 0
	};
}
function normalizeCrop(raw) {
	return {
		x: raw?.x ?? 50,
		y: raw?.y ?? 50,
		zoom: raw?.zoom ?? 1
	};
}
function normalizeShadow(raw) {
	return {
		enabled: raw?.enabled ?? false,
		x: raw?.x ?? DEFAULT_SHADOW.x,
		y: raw?.y ?? DEFAULT_SHADOW.y,
		blur: raw?.blur ?? DEFAULT_SHADOW.blur,
		color: raw?.color ?? DEFAULT_SHADOW.color
	};
}
function normalizeLayer(raw) {
	const shadow = normalizeShadow(raw.shadow);
	if (raw.type === "image") return {
		...raw,
		objectFit: raw.objectFit === "contain" ? "contain" : "cover",
		crop: normalizeCrop(raw.crop),
		filter: normalizeFilter(raw.filter),
		radius: raw.radius ?? 0,
		shadow
	};
	if (raw.type === "line") return {
		...raw,
		stroke: raw.stroke || "#1A1814",
		strokeWidth: raw.strokeWidth || 4,
		shadow
	};
	if (raw.type === "logo") return {
		...raw,
		radius: raw.radius ?? 0,
		shadow
	};
	if (raw.type === "shape") return {
		...raw,
		radius: raw.radius ?? 0,
		shadow
	};
	return {
		...raw,
		shadow
	};
}
function normalizeArtboard(raw) {
	return {
		...raw,
		background: {
			type: raw.background?.type ?? "solid",
			color: raw.background?.color ?? "#F4E6D4",
			color2: raw.background?.color2,
			angle: raw.background?.angle ?? 180,
			assetId: raw.background?.assetId
		},
		layers: (raw.layers ?? []).map((layer) => normalizeLayer(layer)),
		role: raw.role,
		templateId: raw.templateId
	};
}
function cssFilter(filter) {
	const f = normalizeFilter(filter);
	const parts = [];
	if (f.brightness !== 1) parts.push(`brightness(${f.brightness})`);
	if (f.contrast !== 1) parts.push(`contrast(${f.contrast})`);
	if (f.saturate !== 1) parts.push(`saturate(${f.saturate})`);
	if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
	if (f.grayscale > 0) parts.push(`grayscale(${f.grayscale})`);
	return parts.length ? parts.join(" ") : void 0;
}
function cssShadow(layer) {
	const s = layer.shadow;
	if (!s?.enabled) return void 0;
	const value = `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;
	return layer.type === "text" ? void 0 : value;
}
function cssTextShadow(layer) {
	const s = layer.shadow;
	if (!s?.enabled || layer.type !== "text") return void 0;
	return `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;
}
function textOverflows$1(layer) {
	const charsPerLine = Math.max(1, Math.floor(layer.w / (layer.fontSize * .92)));
	let lines = 0;
	for (const paragraph of layer.text.split("\n")) lines += Math.max(1, Math.ceil([...paragraph].length / charsPerLine));
	return lines * layer.fontSize * layer.lineHeight > layer.h + 4;
}
function pagesOf(project, formatId) {
	const id = formatId ?? project.activeFormatId;
	const slides = project.slides?.[id];
	if (slides && slides.length) return slides;
	const one = project.artboards[id];
	return one ? [one] : [];
}
function emptyCopy(handle = "", boilerplate) {
	return {
		eyebrow: "",
		headline: "新的網宣",
		subhead: "",
		body: "",
		cta: boilerplate?.cta || "了解更多",
		handle,
		caption: "",
		hashtags: boilerplate?.hashtags ?? [],
		altText: ""
	};
}
function withBoilerplate(copy, boilerplate) {
	if (!boilerplate) return copy;
	const close = boilerplate.captionClose.trim();
	const tags = [.../* @__PURE__ */ new Set([...copy.hashtags ?? [], ...boilerplate.hashtags])];
	return {
		...copy,
		cta: copy.cta || boilerplate.cta,
		hashtags: tags,
		caption: close && copy.caption && !copy.caption.includes(close) ? `${copy.caption}\n\n${close}` : copy.caption
	};
}
function color(brand, role, fallback) {
	return brand.colors.find((c) => c.role === role)?.hex ?? fallback;
}
function textLayer(partial) {
	return {
		id: partial.id ?? uid("ly"),
		type: "text",
		rotation: 0,
		opacity: 1,
		locked: false,
		hidden: false,
		fromLayout: true,
		lineHeight: partial.lineHeight ?? 1.2,
		letterSpacing: partial.letterSpacing ?? 0,
		shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
		...partial
	};
}
function shapeLayer(partial) {
	return {
		id: partial.id ?? uid("ly"),
		type: "shape",
		rotation: 0,
		opacity: 1,
		locked: false,
		hidden: false,
		fromLayout: true,
		shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
		...partial
	};
}
function imageLayer(partial) {
	return {
		id: partial.id ?? uid("ly"),
		type: "image",
		rotation: 0,
		opacity: 1,
		locked: false,
		hidden: false,
		fromLayout: true,
		objectFit: partial.objectFit ?? "cover",
		crop: partial.crop ?? { ...DEFAULT_CROP },
		filter: partial.filter ?? { ...DEFAULT_FILTER },
		radius: partial.radius ?? 0,
		shadow: partial.shadow ?? { ...DEFAULT_SHADOW },
		...partial
	};
}
function logoLayer(brand, x, y, size) {
	if (!brand.logoAssetId) return null;
	return {
		id: uid("ly"),
		name: "Logo",
		type: "logo",
		x,
		y,
		w: size,
		h: size,
		rotation: 0,
		opacity: 1,
		locked: false,
		hidden: false,
		fromLayout: true,
		assetId: brand.logoAssetId,
		radius: 0,
		shadow: { ...DEFAULT_SHADOW }
	};
}
function findImageAsset(layersHint) {
	if (!layersHint) return null;
	return layersHint.find((l) => l.type === "image")?.assetId ?? null;
}
function buildLayout(formatId, copy, brand, templateId, hints = {}) {
	const format = formatById(formatId);
	const W = format.width;
	const H = format.height;
	const S = format.safe;
	const primary = color(brand, "primary", "#1A1814");
	const accent = color(brand, "accent", "#B85C38");
	const bg = color(brand, "background", "#F4E6D4");
	const ink = color(brand, "ink", "#2C1810");
	const imageId = hints.imageAssetId ?? null;
	const display = brand.fontDisplay;
	const body = brand.fontBody;
	const handle = copy.handle || brand.handle;
	const layers = [];
	const push = (layer) => {
		if (layer) layers.push(layer);
	};
	const isStory = formatId === "story" || formatId === "reels-cover";
	const isLand = formatId === "feed-landscape";
	if (templateId === "product") {
		const imgH = isLand ? H : isStory ? Math.round(H * .42) : Math.round(H * .56);
		push(imageId ? imageLayer({
			name: "主視覺",
			x: 0,
			y: 0,
			w: W,
			h: imgH,
			assetId: imageId
		}) : shapeLayer({
			name: "主視覺色塊",
			x: 0,
			y: 0,
			w: W,
			h: imgH,
			shape: "rect",
			fill: primary,
			radius: 0
		}));
		push(shapeLayer({
			name: "資訊底板",
			x: 0,
			y: imgH - (isLand ? 0 : 28),
			w: W,
			h: H - imgH + (isLand ? 0 : 28),
			shape: "rect",
			fill: bg,
			radius: isLand ? 0 : 36
		}));
		const tx = S.left;
		let ty = imgH + (isLand ? 16 : 48);
		const tw = W - S.left - S.right;
		if (copy.eyebrow) {
			push(textLayer({
				name: "眉題",
				role: "eyebrow",
				x: tx,
				y: ty,
				w: tw,
				h: 36,
				text: copy.eyebrow,
				fontFamily: body,
				fontWeight: 500,
				fontSize: isLand ? 18 : isStory ? 24 : 22,
				letterSpacing: 4,
				color: accent,
				align: "left"
			}));
			ty += isLand ? 28 : 44;
		}
		push(textLayer({
			name: "標題",
			role: "headline",
			x: tx,
			y: ty,
			w: tw,
			h: isStory ? 240 : isLand ? 80 : 200,
			text: copy.headline,
			fontFamily: display,
			fontWeight: 600,
			fontSize: isStory ? 72 : isLand ? 36 : 64,
			lineHeight: 1.15,
			letterSpacing: -1,
			color: ink,
			align: "left"
		}));
		ty += isStory ? 200 : isLand ? 64 : 150;
		if (copy.subhead && !isLand) {
			push(textLayer({
				name: "副標",
				role: "subhead",
				x: tx,
				y: ty,
				w: tw,
				h: 80,
				text: copy.subhead,
				fontFamily: body,
				fontWeight: 400,
				fontSize: 28,
				lineHeight: 1.4,
				color: ink,
				align: "left"
			}));
			ty += 90;
		}
		push(shapeLayer({
			name: "CTA 底",
			x: tx,
			y: H - S.bottom - (isLand ? 44 : isStory ? 88 : 64),
			w: isLand ? 200 : 240,
			h: isLand ? 44 : 64,
			shape: "pill",
			fill: primary,
			radius: 999
		}));
		push(textLayer({
			name: "CTA",
			role: "cta",
			x: tx,
			y: H - S.bottom - (isLand ? 44 : isStory ? 88 : 64),
			w: isLand ? 200 : 240,
			h: isLand ? 44 : 64,
			text: copy.cta,
			fontFamily: body,
			fontWeight: 600,
			fontSize: isLand ? 16 : isStory ? 24 : 22,
			color: bg,
			align: "center",
			lineHeight: isLand ? 2.6 : 2.8
		}));
		push(logoLayer(brand, W - S.right - 80, H - S.bottom - (isStory ? 96 : 80), 72));
	} else if (templateId === "offer") {
		push(shapeLayer({
			name: "外框",
			x: 36,
			y: S.top - 20 < 36 ? 36 : S.top - 20,
			w: W - 72,
			h: H - (S.top - 20 < 36 ? 72 : S.top + S.bottom - 40),
			shape: "rect",
			fill: "transparent",
			radius: 0,
			stroke: accent,
			strokeWidth: 2
		}));
		const frameTop = S.top + 24;
		push(textLayer({
			name: "眉題",
			role: "eyebrow",
			x: S.left,
			y: frameTop,
			w: W - S.left - S.right,
			h: 40,
			text: copy.eyebrow || "LIMITED",
			fontFamily: body,
			fontWeight: 500,
			fontSize: 20,
			letterSpacing: 6,
			color: accent,
			align: "center"
		}));
		push(textLayer({
			name: "標題",
			role: "headline",
			x: S.left,
			y: frameTop + (isLand ? 40 : 80),
			w: W - S.left - S.right,
			h: isStory ? 280 : isLand ? 90 : 220,
			text: copy.headline,
			fontFamily: display,
			fontWeight: 600,
			fontSize: isStory ? 88 : isLand ? 42 : 72,
			lineHeight: 1.1,
			letterSpacing: -1.5,
			color: ink,
			align: "center"
		}));
		push(textLayer({
			name: "內文",
			role: "body",
			x: S.left + 20,
			y: isLand ? H / 2 + 10 : H * .52,
			w: W - S.left - S.right - 40,
			h: isLand ? 60 : 140,
			text: copy.body || copy.subhead,
			fontFamily: body,
			fontWeight: 400,
			fontSize: isLand ? 18 : 26,
			lineHeight: 1.45,
			color: ink,
			align: "center"
		}));
		const ctaW = 280;
		push(shapeLayer({
			name: "CTA 底",
			x: (W - ctaW) / 2,
			y: H - S.bottom - 70,
			w: ctaW,
			h: 64,
			shape: "pill",
			fill: accent,
			radius: 999
		}));
		push(textLayer({
			name: "CTA",
			role: "cta",
			x: (W - ctaW) / 2,
			y: H - S.bottom - 70,
			w: ctaW,
			h: 64,
			text: copy.cta,
			fontFamily: body,
			fontWeight: 600,
			fontSize: 22,
			color: bg,
			align: "center",
			lineHeight: 2.8
		}));
		push(logoLayer(brand, (W - 64) / 2, S.top + (isLand ? 4 : 16), 64));
	} else if (templateId === "quote") {
		push(textLayer({
			name: "引號",
			role: "custom",
			x: S.left,
			y: S.top + (isLand ? 0 : 40),
			w: W - S.left - S.right,
			h: isLand ? 60 : 120,
			text: "「",
			fontFamily: display,
			fontWeight: 500,
			fontSize: isLand ? 64 : 120,
			color: accent,
			align: "left",
			lineHeight: 1
		}));
		push(textLayer({
			name: "標題",
			role: "headline",
			x: S.left,
			y: S.top + (isLand ? 50 : 140),
			w: W - S.left - S.right,
			h: isStory ? 520 : isLand ? 180 : 360,
			text: copy.headline,
			fontFamily: display,
			fontWeight: 600,
			fontSize: isStory ? 64 : isLand ? 32 : 52,
			lineHeight: 1.3,
			letterSpacing: -.5,
			color: ink,
			align: "left"
		}));
		push(textLayer({
			name: "出處",
			role: "handle",
			x: S.left,
			y: H - S.bottom - 80,
			w: W - S.left - S.right,
			h: 40,
			text: handle,
			fontFamily: body,
			fontWeight: 500,
			fontSize: 22,
			color: accent,
			align: "left"
		}));
		push(logoLayer(brand, W - S.right - 72, H - S.bottom - 72, 72));
	} else {
		if (imageId && !isLand) push(imageLayer({
			name: "主視覺",
			x: isStory ? 0 : W * .42,
			y: 0,
			w: isStory ? W : W * .58,
			h: isStory ? Math.round(H * .38) : H,
			assetId: imageId
		}));
		const colX = S.left;
		const colW = imageId && !isStory && !isLand ? W * .38 - S.left : W - S.left - S.right;
		push(textLayer({
			name: "眉題",
			role: "eyebrow",
			x: colX,
			y: S.top,
			w: colW,
			h: 36,
			text: copy.eyebrow,
			fontFamily: body,
			fontWeight: 500,
			fontSize: 20,
			letterSpacing: 5,
			color: accent,
			align: "left"
		}));
		push(textLayer({
			name: "標題",
			role: "headline",
			x: colX,
			y: S.top + 56,
			w: colW,
			h: isStory ? 280 : isLand ? 120 : 280,
			text: copy.headline,
			fontFamily: display,
			fontWeight: 600,
			fontSize: isStory ? 78 : isLand ? 40 : imageId ? 56 : 72,
			lineHeight: 1.12,
			letterSpacing: -1.2,
			color: ink,
			align: "left"
		}));
		push(textLayer({
			name: "副標",
			role: "subhead",
			x: colX,
			y: S.top + (isLand ? 150 : 360),
			w: colW,
			h: isLand ? 48 : 120,
			text: copy.subhead,
			fontFamily: body,
			fontWeight: 400,
			fontSize: isLand ? 18 : 26,
			lineHeight: 1.45,
			color: ink,
			align: "left"
		}));
		if (copy.body && !isLand) push(textLayer({
			name: "內文",
			role: "body",
			x: colX,
			y: H * .62,
			w: colW,
			h: 140,
			text: copy.body,
			fontFamily: body,
			fontWeight: 400,
			fontSize: 22,
			lineHeight: 1.5,
			color: ink,
			align: "left"
		}));
		push(shapeLayer({
			name: "CTA 底",
			x: colX,
			y: H - S.bottom - 64,
			w: 228,
			h: 56,
			shape: "pill",
			fill: primary,
			radius: 999
		}));
		push(textLayer({
			name: "CTA",
			role: "cta",
			x: colX,
			y: H - S.bottom - 64,
			w: 228,
			h: 56,
			text: copy.cta,
			fontFamily: body,
			fontWeight: 600,
			fontSize: 20,
			color: bg,
			align: "center",
			lineHeight: 2.7
		}));
		push(textLayer({
			name: "帳號",
			role: "handle",
			x: colX + 244,
			y: H - S.bottom - 56,
			w: colW - 244,
			h: 40,
			text: handle,
			fontFamily: body,
			fontWeight: 500,
			fontSize: 18,
			color: ink,
			align: "left",
			lineHeight: 2.2
		}));
		push(logoLayer(brand, W - S.right - 80, S.top, 80));
	}
	const cleaned = layers.filter((l) => l.opacity > 0).filter((l) => l.type !== "text" || l.text.trim().length > 0);
	return {
		formatId,
		background: {
			type: "solid",
			color: bg
		},
		layers: cleaned,
		templateId
	};
}
function extractImageAssetId(artboard) {
	return findImageAsset(artboard?.layers);
}
function applyCopyToArtboard(artboard, copy) {
	const map = {
		eyebrow: copy.eyebrow,
		headline: copy.headline,
		subhead: copy.subhead,
		body: copy.body,
		cta: copy.cta,
		handle: copy.handle
	};
	return {
		...artboard,
		layers: artboard.layers.map((layer) => {
			if (layer.type !== "text") return layer;
			const next = map[layer.role];
			if (next === void 0) return layer;
			return {
				...layer,
				text: next
			};
		})
	};
}
var TEMPLATE_META = [
	{
		id: "editorial",
		name: "編輯封面",
		description: "大標＋主視覺，適合品牌敘事"
	},
	{
		id: "product",
		name: "商品主圖",
		description: "上圖下文，適合單品上市"
	},
	{
		id: "offer",
		name: "優惠公告",
		description: "置中大標與 CTA，適合檔期"
	},
	{
		id: "quote",
		name: "引言卡片",
		description: "語句為主，適合價值主張"
	}
];
function copyFromCampaign(plan, brand) {
	return withBoilerplate({
		eyebrow: plan.eyebrow,
		headline: plan.headline,
		subhead: plan.subhead,
		body: plan.body,
		cta: plan.cta,
		handle: brand.handle,
		caption: plan.captions[0]?.text ?? "",
		hashtags: plan.hashtags,
		altText: plan.altText
	}, brand.boilerplate);
}
function storyCopy(base, plan) {
	const beats = plan.storyBeats;
	return {
		...base,
		eyebrow: "STORY",
		headline: plan.hook || base.headline,
		subhead: beats[0] || base.subhead,
		body: beats.slice(1).join("\n") || base.body,
		cta: plan.cta || base.cta
	};
}
function carouselPlans(plan, copy, carousel) {
	if (!carousel) return [{
		role: "cover",
		headline: copy.headline,
		subhead: copy.subhead,
		body: copy.body,
		cta: copy.cta,
		visualNote: "",
		templateId: plan.templateId
	}];
	return completeCarouselPages(plan.carouselPages, {
		headline: copy.headline,
		subhead: copy.subhead,
		body: copy.body,
		cta: copy.cta,
		hook: plan.hook,
		insight: plan.insight,
		templateId: plan.templateId
	}).slice(0, 10);
}
function buildCampaignBoards(input) {
	const brief = migrateBrief(input.brief);
	const copy = copyFromCampaign(input.plan, input.brand);
	const imageAssetId = extractImageAssetId(input.project.artboards[input.project.activeFormatId] ?? Object.values(input.project.artboards).find(Boolean));
	const formats = formatsFromBrief(brief, input.project.activeFormatId);
	const slides = { ...input.project.slides };
	const artboards = { ...input.project.artboards };
	const pages = carouselPlans(input.plan, copy, brief.deliverables.carousel);
	for (const formatId of formats) {
		if (brief.deliverables.carousel) {
			const boards = stampSlideMeta(pages.map((page) => {
				const board = buildLayout(formatId, copyForCarouselPage(copy, page, input.plan), input.brand, page.templateId || input.plan.templateId, { imageAssetId });
				board.role = page.role;
				board.templateId = page.templateId || input.plan.templateId;
				return board;
			}));
			slides[formatId] = boards;
			artboards[formatId] = boards[0];
			continue;
		}
		const board = buildLayout(formatId, formatId === "story" || formatId === "reels-cover" ? storyCopy(copy, input.plan) : copy, input.brand, input.plan.templateId, { imageAssetId });
		board.role = "cover";
		board.templateId = input.plan.templateId;
		slides[formatId] = [board];
		artboards[formatId] = board;
	}
	return {
		copy,
		slides,
		artboards,
		activeFormatId: formats[0] ?? input.project.activeFormatId
	};
}
function adaptArtboard(source, targetFormatId, brand, opts = {}) {
	const copy = opts.copy ?? copyFromArtboard(source);
	const templateId = opts.templateId ?? source.templateId ?? roleTemplate(source.role);
	const next = buildLayout(targetFormatId, copy, brand, templateId, { imageAssetId: extractImageAssetId(source) });
	next.role = source.role;
	next.templateId = templateId;
	const extras = source.layers.filter((layer) => !layer.fromLayout);
	if (!extras.length) return next;
	const mapped = source.formatId === targetFormatId ? extras.map((layer) => ({ ...layer })) : extras.map((layer) => remapLayerToFormat(layer, source.formatId, targetFormatId));
	next.layers = [...next.layers, ...mapped];
	return next;
}
function adaptPages(pages, targetFormatId, brand, fallbackTemplate) {
	return stampSlideMeta(pages).map((page) => adaptArtboard(page, targetFormatId, brand, { templateId: page.templateId ?? fallbackTemplate }));
}
function emptyBoilerplate() {
	return {
		cta: "了解更多",
		disclaimer: "",
		hashtags: [],
		captionClose: ""
	};
}
function emptyImageStyle() {
	return {
		mood: "",
		lighting: "",
		paletteHint: "",
		composition: "",
		do: "",
		dont: ""
	};
}
function emptyBrandRules() {
	return {
		noCompetitorMarks: true,
		noWatermark: true,
		noLowRes: true,
		notes: ""
	};
}
var LOGO_USAGE = [
	{
		id: "primary",
		label: "主標誌",
		hint: "預設放上畫布"
	},
	{
		id: "light",
		label: "淺底／正色",
		hint: "亞麻或淺色背景"
	},
	{
		id: "dark",
		label: "深底／反白",
		hint: "深色或照片上"
	},
	{
		id: "mark",
		label: "圖標",
		hint: "小尺寸、頭像、浮水印"
	},
	{
		id: "horizontal",
		label: "橫式",
		hint: "標題列、限動上緣"
	}
];
function logoUsageLabel(usage) {
	return LOGO_USAGE.find((item) => item.id === usage)?.label ?? usage;
}
function defaultBrandColors() {
	return [
		{
			id: uid("c"),
			hex: "#1A1814",
			role: "primary",
			label: "主色"
		},
		{
			id: uid("c"),
			hex: "#6F6A63",
			role: "secondary",
			label: "輔助色"
		},
		{
			id: uid("c"),
			hex: "#F3F0EA",
			role: "background",
			label: "背景色"
		},
		{
			id: uid("c"),
			hex: "#1E4A45",
			role: "accent",
			label: "強調"
		},
		{
			id: uid("c"),
			hex: "#1A1814",
			role: "ink",
			label: "文字"
		}
	];
}
function createEmptyBrand(name) {
	return {
		id: uid("brand"),
		name: name.trim() || "未命名品牌",
		handle: "",
		website: "",
		voice: "",
		doSay: "",
		dontSay: "",
		forbiddenWords: [],
		colors: defaultBrandColors(),
		fontDisplay: "Noto Serif TC",
		fontBody: "Noto Sans TC",
		logoAssetId: null,
		logos: [],
		slogans: [],
		ctas: [],
		imageStyle: emptyImageStyle(),
		rules: emptyBrandRules(),
		boilerplate: emptyBoilerplate(),
		updatedAt: Date.now()
	};
}
function asStringArray(value) {
	if (!Array.isArray(value)) return [];
	return value.map((item) => String(item).trim()).filter(Boolean);
}
function asLogos(raw, logoAssetId) {
	if (Array.isArray(raw) && raw.length) return raw.map((item) => {
		const row = item;
		if (!row.assetId) return null;
		return {
			id: row.id || uid("logo"),
			name: row.name?.trim() || "Logo",
			assetId: row.assetId,
			usage: row.usage || "primary"
		};
	}).filter((item) => Boolean(item));
	if (logoAssetId) return [{
		id: uid("logo"),
		name: "主標誌",
		assetId: logoAssetId,
		usage: "primary"
	}];
	return [];
}
function migrateBrand(raw) {
	const logoAssetId = raw.logoAssetId ?? null;
	const logos = asLogos(raw.logos, logoAssetId);
	const primary = logos.find((item) => item.usage === "primary") ?? logos[0];
	return {
		id: raw.id,
		name: raw.name,
		handle: raw.handle ?? "",
		website: raw.website ?? "",
		voice: raw.voice ?? "",
		doSay: raw.doSay ?? "",
		dontSay: raw.dontSay ?? "",
		forbiddenWords: asStringArray(raw.forbiddenWords),
		colors: Array.isArray(raw.colors) && raw.colors.length ? raw.colors : defaultBrandColors(),
		fontDisplay: raw.fontDisplay ?? "Noto Serif TC",
		fontBody: raw.fontBody ?? "Noto Sans TC",
		logoAssetId: logoAssetId ?? primary?.assetId ?? null,
		logos,
		slogans: asStringArray(raw.slogans),
		ctas: asStringArray(raw.ctas),
		imageStyle: {
			...emptyImageStyle(),
			...raw.imageStyle ?? {}
		},
		rules: {
			...emptyBrandRules(),
			...raw.rules ?? {}
		},
		boilerplate: raw.boilerplate ?? emptyBoilerplate(),
		updatedAt: raw.updatedAt ?? Date.now()
	};
}
function rotatePoint(px, py, cx, cy, deg) {
	if (!deg) return {
		x: px,
		y: py
	};
	const r = deg * Math.PI / 180;
	const dx = px - cx;
	const dy = py - cy;
	return {
		x: cx + dx * Math.cos(r) - dy * Math.sin(r),
		y: cy + dx * Math.sin(r) + dy * Math.cos(r)
	};
}
function centerOf(box) {
	return {
		x: box.x + box.w / 2,
		y: box.y + box.h / 2
	};
}
function localPoint(box, worldX, worldY) {
	const c = centerOf(box);
	return rotatePoint(worldX, worldY, c.x, c.y, -box.rotation);
}
function worldFromLocal(box, lx, ly) {
	const c = centerOf(box);
	return rotatePoint(lx, ly, c.x, c.y, box.rotation);
}
function fixedLocal(orig, handle) {
	switch (handle) {
		case "se": return {
			x: orig.x,
			y: orig.y
		};
		case "nw": return {
			x: orig.x + orig.w,
			y: orig.y + orig.h
		};
		case "ne": return {
			x: orig.x,
			y: orig.y + orig.h
		};
		case "sw": return {
			x: orig.x + orig.w,
			y: orig.y
		};
		case "e": return {
			x: orig.x,
			y: orig.y + orig.h / 2
		};
		case "w": return {
			x: orig.x + orig.w,
			y: orig.y + orig.h / 2
		};
		case "s": return {
			x: orig.x + orig.w / 2,
			y: orig.y
		};
		case "n": return {
			x: orig.x + orig.w / 2,
			y: orig.y + orig.h
		};
	}
}
function resizeBox(orig, handle, worldPointer, opts = {}) {
	const min = opts.min ?? 16;
	const local = localPoint(orig, worldPointer.x, worldPointer.y);
	let left = orig.x;
	let right = orig.x + orig.w;
	let top = orig.y;
	let bottom = orig.y + orig.h;
	if (handle === "e" || handle === "ne" || handle === "se") right = local.x;
	if (handle === "w" || handle === "nw" || handle === "sw") left = local.x;
	if (handle === "s" || handle === "se" || handle === "sw") bottom = local.y;
	if (handle === "n" || handle === "ne" || handle === "nw") top = local.y;
	if (right < left) {
		const t = left;
		left = right;
		right = t;
	}
	if (bottom < top) {
		const t = top;
		top = bottom;
		bottom = t;
	}
	let w = Math.max(min, right - left);
	let h = Math.max(min, bottom - top);
	if (opts.keepAspect && orig.h > 0) {
		const ratio = orig.w / orig.h;
		if (handle.length === 2) {
			if (w / h > ratio) w = h * ratio;
			else h = w / ratio;
			if (handle.includes("w")) left = right - w;
			else right = left + w;
			if (handle.includes("n")) top = bottom - h;
			else bottom = top + h;
		} else if (handle === "e" || handle === "w") {
			h = w / ratio;
			const cy = orig.y + orig.h / 2;
			top = cy - h / 2;
			bottom = cy + h / 2;
		} else {
			w = h * ratio;
			const cx = orig.x + orig.w / 2;
			left = cx - w / 2;
			right = cx + w / 2;
		}
		w = Math.max(min, right - left);
		h = Math.max(min, bottom - top);
	}
	const next = {
		x: left,
		y: top,
		w,
		h,
		rotation: orig.rotation
	};
	const anchor = fixedLocal(orig, handle);
	const before = worldFromLocal(orig, anchor.x, anchor.y);
	const afterAnchor = fixedLocal({
		x: left,
		y: top,
		w,
		h
	}, handle);
	const after = worldFromLocal(next, afterAnchor.x, afterAnchor.y);
	return {
		x: Math.round(left + (before.x - after.x)),
		y: Math.round(top + (before.y - after.y)),
		w: Math.round(w),
		h: Math.round(h)
	};
}
function rotateByPointer(orig, startPointer, pointer, snap) {
	const c = centerOf(orig);
	const a0 = Math.atan2(startPointer.y - c.y, startPointer.x - c.x);
	const a1 = Math.atan2(pointer.y - c.y, pointer.x - c.x);
	let deg = orig.rotation + (a1 - a0) * 180 / Math.PI;
	while (deg > 180) deg -= 360;
	while (deg < -180) deg += 360;
	if (snap) deg = Math.round(deg / 15) * 15;
	return Math.round(deg * 10) / 10;
}
function alignBox(layer, format, mode) {
	const { width: W, height: H, safe: S } = format;
	switch (mode) {
		case "left": return { x: 0 };
		case "center": return { x: Math.round((W - layer.w) / 2) };
		case "right": return { x: Math.round(W - layer.w) };
		case "top": return { y: 0 };
		case "middle": return { y: Math.round((H - layer.h) / 2) };
		case "bottom": return { y: Math.round(H - layer.h) };
		case "safe-left": return { x: S.left };
		case "safe-center": return { x: Math.round((W - layer.w) / 2) };
		case "safe-right": return { x: Math.round(W - S.right - layer.w) };
		case "safe-top": return { y: S.top };
		case "safe-middle": return { y: Math.round((H - layer.h) / 2) };
		case "safe-bottom": return { y: Math.round(H - S.bottom - layer.h) };
	}
}
var SNAP_EDGES = (box) => [
	box.x,
	box.x + box.w / 2,
	box.x + box.w
];
var SNAP_MIDS = (box) => [
	box.y,
	box.y + box.h / 2,
	box.y + box.h
];
function snapMove(box, artboard, format, excludeId, threshold, grid) {
	const xs = [
		0,
		format.width / 2,
		format.width,
		format.safe.left,
		format.width - format.safe.right
	];
	const ys = [
		0,
		format.height / 2,
		format.height,
		format.safe.top,
		format.height - format.safe.bottom
	];
	if (grid) {
		for (let g = 0; g <= format.width; g += 54) xs.push(g);
		for (let g = 0; g <= format.height; g += 54) ys.push(g);
	}
	for (const layer of artboard.layers) {
		if (layer.id === excludeId || layer.hidden) continue;
		xs.push(...SNAP_EDGES(layer));
		ys.push(...SNAP_MIDS(layer));
	}
	let dx = 0;
	let dy = 0;
	let bestX = threshold + 1;
	let bestY = threshold + 1;
	const guides = [];
	let guideV = null;
	let guideH = null;
	for (const edge of SNAP_EDGES(box)) for (const t of xs) {
		const d = t - edge;
		const ad = Math.abs(d);
		if (ad < bestX) {
			bestX = ad;
			dx = d;
			guideV = t;
		}
	}
	for (const edge of SNAP_MIDS(box)) for (const t of ys) {
		const d = t - edge;
		const ad = Math.abs(d);
		if (ad < bestY) {
			bestY = ad;
			dy = d;
			guideH = t;
		}
	}
	const next = { ...box };
	if (bestX <= threshold) {
		next.x = Math.round(box.x + dx);
		if (guideV !== null) guides.push({
			axis: "v",
			pos: guideV
		});
	}
	if (bestY <= threshold) {
		next.y = Math.round(box.y + dy);
		if (guideH !== null) guides.push({
			axis: "h",
			pos: guideH
		});
	}
	return {
		box: next,
		guides
	};
}
function hexToRgb(hex) {
	const raw = hex.trim().replace("#", "");
	const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
	if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
	return {
		r: parseInt(full.slice(0, 2), 16),
		g: parseInt(full.slice(2, 4), 16),
		b: parseInt(full.slice(4, 6), 16)
	};
}
function channel(c) {
	const s = c / 255;
	return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
}
function relativeLuminance(hex) {
	const rgb = hexToRgb(hex);
	if (!rgb) return null;
	return .2126 * channel(rgb.r) + .7152 * channel(rgb.g) + .0722 * channel(rgb.b);
}
function contrastRatio(a, b) {
	const l1 = relativeLuminance(a);
	const l2 = relativeLuminance(b);
	if (l1 === null || l2 === null) return null;
	const light = Math.max(l1, l2);
	const dark = Math.min(l1, l2);
	return (light + .05) / (dark + .05);
}
var QA_CHECK_LABEL = {
	headline: "標題突出",
	hierarchy: "文字層級",
	"type-size": "字級大小",
	contrast: "對比度",
	crowding: "資訊密度",
	whitespace: "留白",
	align: "對齊",
	"image-stretch": "圖片比例",
	"logo-size": "Logo 尺寸",
	cta: "CTA 可見",
	safe: "安全區域",
	carousel: "輪播一致",
	overflow: "溢出遮擋"
};
var CHECK_ORDER = [
	"headline",
	"hierarchy",
	"type-size",
	"contrast",
	"crowding",
	"whitespace",
	"align",
	"image-stretch",
	"logo-size",
	"cta",
	"safe",
	"carousel",
	"overflow"
];
function textOverflows(layer) {
	const charsPerLine = Math.max(1, Math.floor(layer.w / (layer.fontSize * .92)));
	let lines = 0;
	for (const paragraph of layer.text.split("\n")) lines += Math.max(1, Math.ceil([...paragraph].length / charsPerLine));
	return lines * layer.fontSize * layer.lineHeight > layer.h + 4;
}
function rectsOverlap(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function overlapArea(a, b) {
	return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
}
function bgBehindText(artboard, layer) {
	const ti = artboard.layers.indexOf(layer);
	return [...artboard.layers].slice(0, Math.max(0, ti)).reverse().find((item) => item.type === "shape" && !item.hidden && item.fill !== "transparent" && item.opacity > .4 && rectsOverlap(item, layer))?.fill ?? artboard.background.color;
}
function brandInk(brand) {
	return brand.colors.find((c) => c.role === "ink")?.hex ?? "#1A1814";
}
function brandPaper(brand) {
	return brand.colors.find((c) => c.role === "background")?.hex ?? "#F4E6D4";
}
function brandAccent(brand) {
	return brand.colors.find((c) => c.role === "accent")?.hex ?? "#B85C38";
}
function colorLabel(brand, hex) {
	const match = brand.colors.find((c) => c.hex.toUpperCase() === hex.toUpperCase());
	return match ? `品牌${match.label}` : hex.toUpperCase();
}
function pickReadable(bg, brand) {
	const ink = brandInk(brand);
	const paper = brandPaper(brand);
	return (contrastRatio(ink, bg) ?? 0) >= (contrastRatio(paper, bg) ?? 0) ? ink : paper;
}
function pageLabel(page, index) {
	const role = page.role ? PAGE_ROLE_LABEL$1[page.role] : null;
	return role ? `第 ${index + 1} 頁 · ${role}` : `第 ${index + 1} 頁`;
}
function loc(page, index, layer) {
	return layer ? `${pageLabel(page, index)} · ${layer.name}` : pageLabel(page, index);
}
function textsOf(artboard) {
	return artboard.layers.filter((l) => l.type === "text" && !l.hidden && l.opacity > .15);
}
function byRole(texts, role) {
	return texts.find((t) => t.role === role);
}
function minType(role, tall) {
	if (role === "headline") return tall ? 52 : 40;
	if (role === "subhead") return tall ? 28 : 24;
	if (role === "cta") return tall ? 22 : 20;
	return tall ? 22 : 18;
}
function inspectPage(artboard, brand, pageIndex, copy) {
	const format = formatById(artboard.formatId);
	const tall = format.height >= 1600;
	const issues = [];
	const texts = textsOf(artboard);
	const headline = byRole(texts, "headline");
	const subhead = byRole(texts, "subhead");
	const body = byRole(texts, "body");
	const cta = byRole(texts, "cta");
	const here = (layer) => loc(artboard, pageIndex, layer);
	if (!headline || !headline.text.trim()) issues.push({
		id: `headline-missing-${pageIndex}`,
		check: "headline",
		severity: "fail",
		title: "沒有標題",
		location: pageLabel(artboard, pageIndex),
		detail: "這一頁找不到標題圖層，縮圖時會變成沒有主訊息的畫面。",
		suggestion: "補上一句最多兩行的標題，字級至少 40px，並放在安全區上半。",
		pageIndex,
		fix: {
			kind: "emphasize-headline",
			pageIndex,
			layerId: headline?.id ?? "",
			fontSize: minType("headline", tall)
		},
		fixLabel: "放大現有大字"
	});
	else {
		const nextLargest = texts.filter((t) => t.id !== headline.id && t.role !== "custom").reduce((m, t) => Math.max(m, t.fontSize), 0);
		if (nextLargest > 0 && headline.fontSize < nextLargest * 1.15) {
			const target = Math.round(Math.max(minType("headline", tall), nextLargest * 1.35));
			issues.push({
				id: `headline-weak-${headline.id}`,
				check: "headline",
				severity: "fail",
				title: "標題不夠突出",
				location: here(headline),
				detail: `標題 ${headline.fontSize}px，最大的其他文字卻有 ${nextLargest}px，縮圖時主訊息會被吃掉。`,
				suggestion: `把「${headline.name}」加大到 ${target}px，並維持品牌標題字型。`,
				layerId: headline.id,
				pageIndex,
				fix: {
					kind: "emphasize-headline",
					pageIndex,
					layerId: headline.id,
					fontSize: target
				},
				fixLabel: `標題改 ${target}px`
			});
		} else if (headline.y > format.height * .62 && artboard.templateId !== "offer" && artboard.templateId !== "product") issues.push({
			id: `headline-low-${headline.id}`,
			check: "headline",
			severity: "warn",
			title: "標題位置偏低",
			location: here(headline),
			detail: `標題目前在畫布 ${Math.round(headline.y / format.height * 100)}% 處，Feed 縮圖上半截看不到主句。`,
			suggestion: "把標題移到安全區上半或中央，讓 1:1 縮圖也能讀到。",
			layerId: headline.id,
			pageIndex,
			fix: {
				kind: "move-safe",
				pageIndex,
				layerId: headline.id
			},
			fixLabel: "移入安全區上沿"
		});
	}
	if (headline && subhead && subhead.fontSize >= headline.fontSize) issues.push({
		id: `hier-sub-${subhead.id}`,
		check: "hierarchy",
		severity: "fail",
		title: "副標比標題還大",
		location: here(subhead),
		detail: `副標 ${subhead.fontSize}px ≥ 標題 ${headline.fontSize}px，層級反了。`,
		suggestion: `副標改成 ${Math.round(headline.fontSize * .45)}–${Math.round(headline.fontSize * .55)}px，標題保持最大。`,
		layerId: subhead.id,
		pageIndex,
		fix: {
			kind: "grow-type",
			pageIndex,
			layerId: headline.id,
			fontSize: Math.max(headline.fontSize, subhead.fontSize + 16)
		},
		fixLabel: "拉開標題層級"
	});
	else if (headline && body && body.fontSize >= headline.fontSize * .7) issues.push({
		id: `hier-body-${body.id}`,
		check: "hierarchy",
		severity: "warn",
		title: "內文與標題太接近",
		location: here(body),
		detail: `內文 ${body.fontSize}px、標題 ${headline.fontSize}px，遠看會糊成同一層。`,
		suggestion: `內文降到 ${Math.round(headline.fontSize * .4)}px 左右，讓標題先被讀到。`,
		layerId: body.id,
		pageIndex,
		fix: {
			kind: "grow-type",
			pageIndex,
			layerId: body.id,
			fontSize: Math.max(18, Math.round(headline.fontSize * .38))
		},
		fixLabel: "縮小內文"
	});
	for (const t of texts) {
		if (t.role === "custom" && t.fontSize >= 80) continue;
		const min = minType(t.role, tall);
		if (t.fontSize < min) issues.push({
			id: `size-${t.id}`,
			check: "type-size",
			severity: t.role === "headline" || t.role === "cta" ? "fail" : "warn",
			title: `${t.name} 字級偏小`,
			location: here(t),
			detail: `目前 ${t.fontSize}px，在手機 Feed 上大約只有 ${Math.round(t.fontSize * .32)}px，偏難讀。`,
			suggestion: `將「${t.name}」加到至少 ${min}px（以 1080 寬為基準）。`,
			layerId: t.id,
			pageIndex,
			fix: {
				kind: "grow-type",
				pageIndex,
				layerId: t.id,
				fontSize: min
			},
			fixLabel: `改 ${min}px`
		});
		const bg = bgBehindText(artboard, t);
		const ratio = contrastRatio(t.color, bg);
		const need = t.fontSize >= 42 || t.fontWeight >= 600 ? 3 : 4.5;
		if (ratio !== null && ratio < need) {
			const next = pickReadable(bg, brand);
			const nextRatio = contrastRatio(next, bg) ?? 0;
			const useBacking = nextRatio < need;
			const backing = pickReadable(t.color, brand) === brandInk(brand) ? brandPaper(brand) : brandInk(brand);
			issues.push({
				id: `contrast-${t.id}`,
				check: "contrast",
				severity: ratio < 2.5 ? "fail" : "warn",
				title: `${t.name} 對比不足`,
				location: here(t),
				detail: `「${t.name}」與背景 ${bg.toUpperCase()} 的對比只有 ${ratio.toFixed(1)}:1，低於 ${need}:1。`,
				suggestion: useBacking ? `在「${t.name}」後方加一層${colorLabel(brand, backing)}半透明底板，或改用${colorLabel(brand, next)}。` : `把「${t.name}」改成${colorLabel(brand, next)}（對比可到 ${nextRatio.toFixed(1)}:1）。`,
				layerId: t.id,
				pageIndex,
				fix: useBacking ? {
					kind: "add-text-backing",
					pageIndex,
					layerId: t.id,
					fill: backing
				} : {
					kind: "set-text-color",
					pageIndex,
					layerId: t.id,
					color: next
				},
				fixLabel: useBacking ? "加底板" : `改${colorLabel(brand, next)}`
			});
		}
		const pad = 8;
		if (t.x < format.safe.left - pad || t.y < format.safe.top - pad || t.x + t.w > format.width - format.safe.right + pad || t.y + t.h > format.height - format.safe.bottom + pad) {
			const story = artboard.formatId === "story" || artboard.formatId === "reels-cover";
			issues.push({
				id: `safe-${t.id}`,
				check: "safe",
				severity: story || t.role === "headline" || t.role === "cta" ? "fail" : "warn",
				title: `${t.name} 落在安全區外`,
				location: here(t),
				detail: story ? `限時動態上／下約 250px 會被頭像、回覆列擋住。「${t.name}」目前 y=${Math.round(t.y)}。` : `「${t.name}」超出 ${format.name} 安全框，邊緣可能被裁切或被 UI 擋住。`,
				suggestion: `把「${t.name}」移進安全區（上 ${format.safe.top}／下 ${format.safe.bottom}／左右 ${format.safe.left}）。`,
				layerId: t.id,
				pageIndex,
				fix: {
					kind: "move-safe",
					pageIndex,
					layerId: t.id
				},
				fixLabel: "移入安全區"
			});
		}
		if (t.x + t.w > format.width + 2 || t.y + t.h > format.height + 2 || t.x < -2 || t.y < -2) issues.push({
			id: `canvas-${t.id}`,
			check: "overflow",
			severity: "fail",
			title: `${t.name} 超出畫布`,
			location: here(t),
			detail: "圖層有一部分在畫布外，匯出 PNG 時會被裁掉。",
			suggestion: `把「${t.name}」整塊移回 ${format.width}×${format.height} 範圍內。`,
			layerId: t.id,
			pageIndex,
			fix: {
				kind: "move-safe",
				pageIndex,
				layerId: t.id
			},
			fixLabel: "移回畫布"
		});
		if (textOverflows(t)) issues.push({
			id: `flow-${t.id}`,
			check: "overflow",
			severity: "fail",
			title: `${t.name} 文字溢出框`,
			location: here(t),
			detail: `「${t.text.replace(/\n/g, " ").slice(0, 18)}」塞不進 ${Math.round(t.w)}×${Math.round(t.h)} 的文字框，會被裁切或疊到別層。`,
			suggestion: "加高文字框，或把字級略降、改成兩行。",
			layerId: t.id,
			pageIndex,
			fix: {
				kind: "expand-textbox",
				pageIndex,
				layerId: t.id
			},
			fixLabel: "加高文字框"
		});
		const ti = artboard.layers.indexOf(t);
		const onPhoto = artboard.layers.some((item, i) => item.type === "image" && !item.hidden && i < ti && rectsOverlap(item, t));
		const coveringShape = artboard.layers.some((item, i) => item.type === "shape" && !item.hidden && item.fill !== "transparent" && item.opacity > .4 && i < ti && rectsOverlap(item, t));
		if (onPhoto && !coveringShape) {
			const backing = brandPaper(brand);
			issues.push({
				id: `photo-type-${t.id}`,
				check: "contrast",
				severity: t.role === "headline" || t.role === "cta" ? "fail" : "warn",
				title: `${t.name} 叠在照片上`,
				location: here(t),
				detail: `「${t.name}」直接疊在圖片上，對比會隨照片亮暗改變，縮圖時可能讀不到。`,
				suggestion: `為「${t.name}」加${colorLabel(brand, backing)}半透明底板，或把文字移到純色區。`,
				layerId: t.id,
				pageIndex,
				fix: {
					kind: "add-text-backing",
					pageIndex,
					layerId: t.id,
					fill: backing
				},
				fixLabel: "加底板"
			});
		}
		const blocker = artboard.layers.slice(ti + 1).find((item) => {
			if (item.hidden || item.opacity < .25 || item.type === "text") return false;
			const area = t.w * t.h || 1;
			return overlapArea(item, t) / area > .28;
		});
		if (blocker) issues.push({
			id: `cover-${t.id}`,
			check: "overflow",
			severity: "fail",
			title: `${t.name} 被「${blocker.name}」擋住`,
			location: here(t),
			detail: `上層的「${blocker.name}」蓋住標題／內文超過四分之一，匯出後會讀不到。`,
			suggestion: `把「${blocker.name}」移開，或把「${t.name}」提到最上層。`,
			layerId: t.id,
			pageIndex,
			fix: {
				kind: "move-safe",
				pageIndex,
				layerId: t.id
			},
			fixLabel: "移開文字"
		});
	}
	const textArea = texts.reduce((sum, t) => sum + t.w * t.h, 0);
	const inner = (format.width - format.safe.left - format.safe.right) * (format.height - format.safe.top - format.safe.bottom);
	if (texts.length >= 6 && inner && textArea / inner > .48) issues.push({
		id: `crowd-${pageIndex}`,
		check: "crowding",
		severity: "warn",
		title: "資訊過度擁擠",
		location: pageLabel(artboard, pageIndex),
		detail: `這一頁有 ${texts.length} 段文字，文字框約佔內容區 ${Math.round(textArea / inner * 100)}%。遠看會像一張清單。`,
		suggestion: "每頁只留一個主句加一句補充。可隱藏帳號列或把內文移到下一頁。",
		pageIndex,
		fix: {
			kind: "nudge-whitespace",
			pageIndex
		},
		fixLabel: "拉開留白"
	});
	const content = artboard.layers.filter((l) => {
		if (l.hidden || l.opacity <= .2 || l.type === "image") return false;
		if (l.type === "shape" && l.x <= 2 && l.w >= format.width * .85) return false;
		return true;
	});
	if (content.length) {
		const minX = Math.min(...content.map((l) => l.x));
		const minY = Math.min(...content.map((l) => l.y));
		const maxX = Math.max(...content.map((l) => l.x + l.w));
		const maxY = Math.max(...content.map((l) => l.y + l.h));
		const padX = Math.min(minX, format.width - maxX);
		const padY = Math.min(minY, format.height - maxY);
		if (padX < 28 || padY < 24) issues.push({
			id: `space-${pageIndex}`,
			check: "whitespace",
			severity: "warn",
			title: "留白不足",
			location: pageLabel(artboard, pageIndex),
			detail: `內容離畫布邊緣只剩約 ${Math.round(Math.min(padX, padY))}px，畫面會顯得塞滿。`,
			suggestion: "把文字與 Logo 再往安全區內縮 24–40px，讓主視覺有呼吸。",
			pageIndex,
			fix: {
				kind: "nudge-whitespace",
				pageIndex
			},
			fixLabel: "內縮留白"
		});
	}
	if (texts.length >= 3) {
		const xs = texts.map((t) => Math.round(t.x / 8) * 8);
		const uniqueX = new Set(xs);
		const centered = texts.filter((t) => t.align === "center").length;
		if (uniqueX.size >= 3 && centered !== texts.length) issues.push({
			id: `align-${pageIndex}`,
			check: "align",
			severity: "warn",
			title: "元件沒有對齊",
			location: pageLabel(artboard, pageIndex),
			detail: `文字左緣落在 ${uniqueX.size} 條不同的垂直線上，看起來會鬆散。`,
			suggestion: `把文字統一對齊安全區左緣（x=${format.safe.left}）或全部置中。`,
			pageIndex,
			fix: {
				kind: "align-column",
				pageIndex
			},
			fixLabel: "齊左安全區"
		});
	}
	for (const img of artboard.layers.filter((l) => l.type === "image" && !l.hidden)) {
		const ratio = img.w / Math.max(1, img.h);
		if (ratio > 4 || ratio < .22) issues.push({
			id: `stretch-${img.id}`,
			check: "image-stretch",
			severity: "fail",
			title: `${img.name} 被拉成細長條`,
			location: here(img),
			detail: `圖片框比例 ${ratio.toFixed(2)}:1，看起來會像被拉伸而不是被裁切。`,
			suggestion: "改用 cover 裁切，並把框改回接近 4:5 或 1:1，不要單向拉長。",
			layerId: img.id,
			pageIndex,
			fix: {
				kind: "fit-image",
				pageIndex,
				layerId: img.id
			},
			fixLabel: "改 cover 並修正框"
		});
		else if (img.objectFit !== "cover" && img.objectFit !== "contain") issues.push({
			id: `fit-${img.id}`,
			check: "image-stretch",
			severity: "warn",
			title: `${img.name} 可能被變形`,
			location: here(img),
			detail: "圖片沒有指定 cover／contain，匯出時可能被硬 Stretch。",
			suggestion: "主視覺用 cover 裁切，商品完整展示才用 contain。",
			layerId: img.id,
			pageIndex,
			fix: {
				kind: "fit-image",
				pageIndex,
				layerId: img.id
			},
			fixLabel: "改為 cover"
		});
	}
	const logos = artboard.layers.filter((l) => l.type === "logo" && !l.hidden);
	const minSide = Math.min(format.width, format.height);
	for (const logo of logos) {
		const size = Math.max(logo.w, logo.h);
		const pct = size / minSide;
		if (pct < .04 || size < 48) issues.push({
			id: `logo-sm-${logo.id}`,
			check: "logo-size",
			severity: "warn",
			title: "Logo 太小",
			location: here(logo),
			detail: `Logo 邊長 ${Math.round(size)}px，只佔邊長 ${Math.round(pct * 100)}%，縮圖時會變成噪點。`,
			suggestion: "放大到約 72–96px（約畫布短邊的 7%），並離開主體 16px 以上。",
			layerId: logo.id,
			pageIndex,
			fix: {
				kind: "resize-logo",
				pageIndex,
				layerId: logo.id,
				size: Math.round(minSide * .075)
			},
			fixLabel: "放大 Logo"
		});
		else if (pct > .18 || size > 220) issues.push({
			id: `logo-lg-${logo.id}`,
			check: "logo-size",
			severity: "warn",
			title: "Logo 太大",
			location: here(logo),
			detail: `Logo 邊長 ${Math.round(size)}px，佔了短邊 ${Math.round(pct * 100)}%，會壓過標題。`,
			suggestion: "縮小到 72–120px，放角落，不要當成主視覺。",
			layerId: logo.id,
			pageIndex,
			fix: {
				kind: "resize-logo",
				pageIndex,
				layerId: logo.id,
				size: Math.round(minSide * .08)
			},
			fixLabel: "縮小 Logo"
		});
	}
	if (!logos.length && brand.logoAssetId) issues.push({
		id: `logo-miss-${pageIndex}`,
		check: "logo-size",
		severity: "warn",
		title: "這一頁沒有 Logo",
		location: pageLabel(artboard, pageIndex),
		detail: "品牌已設定標誌，但此頁沒有 Logo 圖層，輪播翻頁會覺得不是同一組。",
		suggestion: "在安全區角落放 72–96px 的品牌標誌，不要壓到標題。",
		pageIndex
	});
	if (!cta || !cta.text.trim()) {
		if (!(copy.cta || "").trim()) issues.push({
			id: `cta-miss-${pageIndex}`,
			check: "cta",
			severity: pageIndex === 0 ? "warn" : "fail",
			title: "沒有行動呼籲",
			location: pageLabel(artboard, pageIndex),
			detail: "畫面沒有 CTA，看完不知道下一步。",
			suggestion: `加上品牌常用 CTA（例如「${brand.boilerplate.cta || "了解更多"}」），用對比色膠囊。`,
			pageIndex,
			fix: {
				kind: "boost-cta",
				pageIndex
			},
			fixLabel: "加上 CTA"
		});
	} else {
		const ctaBg = bgBehindText(artboard, cta);
		const ctaRatio = contrastRatio(cta.color, ctaBg) ?? 99;
		const inStoryHole = (artboard.formatId === "story" || artboard.formatId === "reels-cover") && cta.y + cta.h > format.height - format.safe.bottom + 8;
		if (cta.fontSize < minType("cta", tall) || ctaRatio < 3 || inStoryHole) issues.push({
			id: `cta-weak-${cta.id}`,
			check: "cta",
			severity: "fail",
			title: "CTA 不容易被看見",
			location: here(cta),
			detail: inStoryHole ? `CTA 落在限時動態下緣操作列上，會被回覆欄擋住。` : `CTA ${cta.fontSize}px、對比 ${ctaRatio.toFixed(1)}:1，遠看會融進背景。`,
			suggestion: "用品牌主色做膠囊底、對比文字，放在安全區下沿內側，字級至少 20px。",
			layerId: cta.id,
			pageIndex,
			fix: {
				kind: "boost-cta",
				pageIndex,
				layerId: cta.id
			},
			fixLabel: "加強 CTA"
		});
	}
	return issues;
}
function inspectCarousel(pages) {
	if (pages.length < 2) return [];
	const issues = [];
	const first = pages[0];
	formatById(first.formatId);
	const h0 = textsOf(first).find((t) => t.role === "headline");
	const logo0 = first.layers.find((l) => l.type === "logo" && !l.hidden);
	const bg0 = first.background.color.toUpperCase();
	const fontMismatch = pages.map((page, i) => ({
		page,
		i,
		h: textsOf(page).find((t) => t.role === "headline")
	})).filter((row) => row.h && h0 && row.h.fontFamily !== h0.fontFamily);
	if (fontMismatch.length) {
		const sample = fontMismatch[0];
		issues.push({
			id: "carousel-font",
			check: "carousel",
			severity: "fail",
			title: "輪播標題字型不一致",
			location: `${pageLabel(first, 0)} ↔ ${pageLabel(sample.page, sample.i)}`,
			detail: `第 1 頁標題用 ${h0?.fontFamily}，第 ${sample.i + 1} 頁卻用 ${sample.h?.fontFamily}，翻頁會覺得換了品牌。`,
			suggestion: `把所有頁的標題統一成第 1 頁的「${h0?.fontFamily}」，內文維持品牌內文字型。`,
			pageIndex: sample.i,
			layerId: sample.h?.id,
			fix: { kind: "unify-carousel" },
			fixLabel: "統一字型與 Logo"
		});
	}
	const bgMismatch = pages.map((page, i) => ({
		page,
		i
	})).filter((row) => row.page.background.color.toUpperCase() !== bg0);
	if (bgMismatch.length) {
		const sample = bgMismatch[0];
		issues.push({
			id: "carousel-bg",
			check: "carousel",
			severity: "warn",
			title: "輪播底色不一致",
			location: `${pageLabel(first, 0)} ↔ ${pageLabel(sample.page, sample.i)}`,
			detail: `第 1 頁底色 ${bg0}，第 ${sample.i + 1} 頁是 ${sample.page.background.color.toUpperCase()}。`,
			suggestion: "整組使用同一品牌底色， variate 只放在主視覺照片，不要每頁換底。",
			pageIndex: sample.i,
			fix: { kind: "unify-carousel" },
			fixLabel: "統一底色"
		});
	}
	if (logo0) {
		const drifted = pages.map((page, i) => ({
			page,
			i,
			logo: page.layers.find((l) => l.type === "logo" && !l.hidden)
		})).filter((row) => {
			if (!row.logo) return true;
			return Math.abs(row.logo.w - logo0.w) > 20 || Math.abs(row.logo.x - logo0.x) > 80;
		});
		if (drifted.length) {
			const sample = drifted[0];
			issues.push({
				id: "carousel-logo",
				check: "carousel",
				severity: "warn",
				title: "輪播 Logo 位置／大小不一致",
				location: `${pageLabel(first, 0)} ↔ ${pageLabel(sample.page, sample.i)}`,
				detail: sample.logo ? `第 1 頁 Logo ${Math.round(logo0.w)}px、x=${Math.round(logo0.x)}；第 ${sample.i + 1} 頁是 ${Math.round(sample.logo.w)}px、x=${Math.round(sample.logo.x)}。` : `第 ${sample.i + 1} 頁缺少 Logo。`,
				suggestion: `各頁 Logo 都放同一角落、同一尺寸（建議 ${Math.round(logo0.w)}px），翻頁才會成套。`,
				pageIndex: sample.i,
				layerId: sample.logo?.id,
				fix: { kind: "unify-carousel" },
				fixLabel: "統一 Logo"
			});
		}
	}
	const align0 = h0?.align;
	if (align0) {
		if (pages.map((page, i) => ({
			page,
			i,
			h: textsOf(page).find((t) => t.role === "headline")
		})).filter((row) => row.h && row.h.align !== align0).length >= Math.ceil(pages.length / 2)) issues.push({
			id: "carousel-align",
			check: "carousel",
			severity: "warn",
			title: "輪播標題對齊不統一",
			location: pageLabel(first, 0),
			detail: `有的頁置${align0 === "center" ? "中" : "左"}、有的頁不同。偶爾可接受，但超過一半頁面不一致時會像拼貼。`,
			suggestion: "封面／案例可置左，引言頁可置中；同一角色的頁要相同。不要每頁換對齊。",
			pageIndex: 0
		});
	}
	return issues;
}
function summarize(issues) {
	const checks = CHECK_ORDER.map((id) => {
		const mine = issues.filter((item) => item.check === id);
		const fail = mine.some((item) => item.severity === "fail");
		const warn = mine.some((item) => item.severity === "warn");
		return {
			id,
			label: QA_CHECK_LABEL[id],
			status: fail ? "fail" : warn ? "warn" : "pass",
			count: mine.length
		};
	});
	const fails = issues.filter((i) => i.severity === "fail").length;
	const warns = issues.filter((i) => i.severity === "warn").length;
	const score = Math.max(0, Math.min(100, 100 - fails * 12 - warns * 5));
	const fixable = issues.filter((i) => i.fix).length;
	let summary = "13 項檢查都通過。仍建議在手機實機看一次縮圖。";
	if (fails + warns > 0) {
		const top = issues.find((i) => i.severity === "fail") ?? issues[0];
		summary = `${fails ? `${fails} 件必須修` : ""}${fails && warns ? "、" : ""}${warns ? `${warns} 件建議` : ""}。優先：${top.location} — ${top.title}。`;
	}
	return {
		score,
		summary,
		checks,
		issues,
		fixable
	};
}
function inspectProject(pages, brand, copy) {
	if (!pages.length) return summarize([{
		id: "empty",
		check: "headline",
		severity: "fail",
		title: "沒有畫布",
		location: "作品",
		detail: "這個尺寸還沒有頁面。",
		suggestion: "先產生一頁或套用企劃。",
		pageIndex: 0
	}]);
	const issues = pages.flatMap((page, index) => inspectPage(page, brand, index, copy));
	issues.push(...inspectCarousel(pages));
	return summarize(issues);
}
var SHADOW = {
	enabled: false,
	x: 0,
	y: 12,
	blur: 28,
	color: "rgba(26,24,20,0.28)"
};
function clampLayer(layer, formatId) {
	const format = formatById(formatId);
	const x = Math.min(Math.max(format.safe.left, layer.x), format.width - format.safe.right - layer.w);
	const y = Math.min(Math.max(format.safe.top, layer.y), format.height - format.safe.bottom - layer.h);
	return {
		...layer,
		x: Math.max(0, x),
		y: Math.max(0, y)
	};
}
function mapPage(pages, index, fn) {
	return pages.map((page, i) => i === index ? fn(page) : page);
}
function patchLayer(page, layerId, fn) {
	return {
		...page,
		layers: page.layers.map((layer) => layer.id === layerId ? fn(layer) : layer)
	};
}
function backingFor(text, fill) {
	return {
		id: uid("ly"),
		name: `${text.name}底板`,
		type: "shape",
		x: Math.max(0, text.x - 20),
		y: Math.max(0, text.y - 12),
		w: text.w + 40,
		h: text.h + 24,
		rotation: 0,
		opacity: .88,
		locked: false,
		hidden: false,
		fromLayout: false,
		shape: "rect",
		fill,
		radius: 20,
		shadow: { ...SHADOW }
	};
}
function applyQaFixToPages(pages, fix, brand) {
	if (fix.kind === "unify-carousel") {
		const origin = pages[0];
		if (!origin) return pages;
		const logo0 = origin.layers.find((l) => l.type === "logo" && !l.hidden);
		const head0 = origin.layers.find((l) => l.type === "text" && l.role === "headline");
		const bg = origin.background.color;
		const originH = formatById(origin.formatId).height;
		return pages.map((page) => {
			const h = formatById(page.formatId).height;
			return {
				...page,
				background: {
					...page.background,
					color: bg
				},
				layers: page.layers.map((layer) => {
					if (layer.type === "logo" && logo0) {
						const y = logo0.y < originH / 2 ? logo0.y : h - (originH - logo0.y - logo0.h) - logo0.h;
						return {
							...layer,
							w: logo0.w,
							h: logo0.h,
							x: logo0.x,
							y: Math.max(0, y)
						};
					}
					if (layer.type === "text" && head0 && layer.role === "headline") return {
						...layer,
						fontFamily: head0.fontFamily,
						color: head0.color
					};
					return layer;
				})
			};
		});
	}
	const pageIndex = "pageIndex" in fix ? fix.pageIndex : 0;
	if (!pages[pageIndex]) return pages;
	if (fix.kind === "grow-type") return mapPage(pages, pageIndex, (p) => patchLayer(p, fix.layerId, (layer) => layer.type === "text" ? {
		...layer,
		fontSize: fix.fontSize,
		h: Math.max(layer.h, Math.round(fix.fontSize * 1.4))
	} : layer));
	if (fix.kind === "set-text-color") return mapPage(pages, pageIndex, (p) => patchLayer(p, fix.layerId, (layer) => layer.type === "text" ? {
		...layer,
		color: fix.color
	} : layer));
	if (fix.kind === "add-text-backing") return mapPage(pages, pageIndex, (p) => {
		const text = p.layers.find((l) => l.id === fix.layerId && l.type === "text");
		if (!text) return p;
		const board = backingFor(text, fix.fill);
		const idx = p.layers.findIndex((l) => l.id === text.id);
		const layers = [...p.layers];
		layers.splice(Math.max(0, idx), 0, board);
		const readable = pickReadable(fix.fill, brand);
		layers[idx + 1] = {
			...text,
			color: readable
		};
		return {
			...p,
			layers
		};
	});
	if (fix.kind === "move-safe") return mapPage(pages, pageIndex, (p) => patchLayer(p, fix.layerId, (layer) => clampLayer(layer, p.formatId)));
	if (fix.kind === "expand-textbox") return mapPage(pages, pageIndex, (p) => patchLayer(p, fix.layerId, (layer) => {
		if (layer.type !== "text") return layer;
		const nextH = Math.round(layer.fontSize * layer.lineHeight * 3.2);
		const format = formatById(p.formatId);
		const h = Math.min(nextH, format.height - format.safe.bottom - layer.y);
		return {
			...layer,
			h: Math.max(layer.h, h)
		};
	}));
	if (fix.kind === "align-column") return mapPage(pages, pageIndex, (p) => {
		const x = formatById(p.formatId).safe.left;
		return {
			...p,
			layers: p.layers.map((layer) => layer.type === "text" && layer.align !== "center" ? {
				...layer,
				x,
				align: "left"
			} : layer)
		};
	});
	if (fix.kind === "fit-image") return mapPage(pages, pageIndex, (p) => {
		const format = formatById(p.formatId);
		return patchLayer(p, fix.layerId, (layer) => {
			if (layer.type !== "image") return layer;
			const w = format.width;
			const h = Math.round(Math.min(format.height * .56, Math.max(layer.h, w * .7)));
			return {
				...layer,
				objectFit: "cover",
				x: 0,
				y: 0,
				w,
				h
			};
		});
	});
	if (fix.kind === "resize-logo") return mapPage(pages, pageIndex, (p) => patchLayer(p, fix.layerId, (layer) => {
		if (layer.type !== "logo") return layer;
		const format = formatById(p.formatId);
		const size = fix.size;
		const x = Math.min(layer.x, format.width - format.safe.right - size);
		const y = Math.min(layer.y, format.height - format.safe.bottom - size);
		return {
			...layer,
			w: size,
			h: size,
			x: Math.max(format.safe.left, x),
			y: Math.max(format.safe.top, y)
		};
	}));
	if (fix.kind === "nudge-whitespace") return mapPage(pages, pageIndex, (p) => {
		const format = formatById(p.formatId);
		const inset = 28;
		return {
			...p,
			layers: p.layers.map((layer) => {
				if (layer.type === "image" && layer.x === 0 && layer.y === 0) return layer;
				const x = Math.max(format.safe.left, layer.x + (layer.x < format.safe.left + 12 ? inset : 0));
				const y = Math.max(format.safe.top, layer.y + (layer.y < format.safe.top + 12 ? inset : 0));
				const maxX = format.width - format.safe.right;
				const maxY = format.height - format.safe.bottom;
				const w = Math.min(layer.w, maxX - x);
				const h = Math.min(layer.h, maxY - y);
				return {
					...layer,
					x,
					y,
					w: Math.max(24, w),
					h: Math.max(24, h)
				};
			})
		};
	});
	if (fix.kind === "emphasize-headline") return mapPage(pages, pageIndex, (p) => {
		const target = p.layers.find((l) => l.id === fix.layerId) ?? p.layers.find((l) => l.type === "text" && l.role === "headline");
		if (!target || target.type !== "text") return p;
		const format = formatById(p.formatId);
		const next = {
			...target,
			fontSize: fix.fontSize,
			fontWeight: 600,
			h: Math.max(target.h, Math.round(fix.fontSize * 2.2)),
			y: Math.min(target.y, format.safe.top + 48)
		};
		return {
			...p,
			layers: p.layers.map((l) => l.id === target.id ? next : l)
		};
	});
	if (fix.kind === "boost-cta") return mapPage(pages, pageIndex, (p) => {
		const format = formatById(p.formatId);
		const ink = brandPaper(brand);
		const fill = brandAccent(brand) || brandInk(brand);
		const existing = fix.layerId ? p.layers.find((l) => l.id === fix.layerId && l.type === "text") : p.layers.find((l) => l.type === "text" && l.role === "cta");
		const y = format.height - format.safe.bottom - 64;
		const x = format.safe.left;
		const cta = existing ? {
			...existing,
			fontSize: Math.max(existing.fontSize, 22),
			fontWeight: 600,
			color: pickReadable(bgBehindText({
				...p,
				layers: p.layers
			}, existing) === p.background.color ? fill : bgBehindText(p, existing), brand) || ink,
			x,
			y,
			w: Math.max(existing.w, 240),
			h: 64,
			align: "center"
		} : {
			id: uid("ly"),
			name: "CTA",
			type: "text",
			role: "cta",
			text: brand.boilerplate.cta || "了解更多",
			x,
			y,
			w: 240,
			h: 64,
			rotation: 0,
			opacity: 1,
			locked: false,
			hidden: false,
			fromLayout: false,
			fontFamily: brand.fontBody,
			fontWeight: 600,
			fontSize: 22,
			lineHeight: 2.8,
			letterSpacing: 0,
			color: ink,
			align: "center",
			shadow: { ...SHADOW }
		};
		const board = {
			id: uid("ly"),
			name: "CTA 底",
			type: "shape",
			shape: "pill",
			fill,
			x: cta.x,
			y: cta.y,
			w: cta.w,
			h: cta.h,
			rotation: 0,
			opacity: 1,
			locked: false,
			hidden: false,
			fromLayout: false,
			radius: 999,
			shadow: { ...SHADOW }
		};
		const without = p.layers.filter((l) => l.id !== cta.id && l.name !== "CTA 底");
		const readable = pickReadable(fill, brand);
		return {
			...p,
			layers: [
				...without,
				board,
				{
					...cta,
					color: readable
				}
			]
		};
	});
	return pages;
}
var SEED_BRAND_ID = "brand_nisshoku";
var SEED_PROJECT_ID = "proj_yirgacheffe";
var SEED_DRAFT_ID = "proj_weekend_pour";
var SEED_LOGO_ID = "asset_tku_zen_logo";
var SEED_TIME = Date.parse("2026-09-16T00:00:00+08:00");
var SEED_ASSETS = [{
	id: SEED_LOGO_ID,
	name: "三色光標誌",
	kind: "logo",
	category: "logo",
	mime: "image/svg+xml",
	width: 96,
	height: 96,
	tags: [
		"Logo",
		"龜龜",
		"三色光",
		"淡江禪學社"
	],
	createdAt: SEED_TIME,
	updatedAt: SEED_TIME,
	seedSrc: "/seed/zen-mark.svg",
	source: "seed",
	licenseNotes: "淡江大學禪學社品牌示意標誌。",
	licenseOwner: "淡江大學禪學社",
	favorite: true,
	lastUsedAt: SEED_TIME,
	useCount: 2
}];
var SEED_BRAND = {
	id: SEED_BRAND_ID,
	name: "淡江大學禪學社",
	handle: "@tku_zen",
	website: "",
	voice: "像一位懂淡江生活的社團同學：自然、溫暖、偶爾口語，先陪伴再介紹活動。",
	doSay: "喘口氣、慢下來、整理情緒、認識自己、一起坐坐、可以帶朋友",
	dontSay: "誠摯邀請、殊勝、開悟、法喜充滿、艱澀佛學、說教與過度工整的 AI 金句",
	forbiddenWords: [
		"誠摯邀請",
		"殊勝",
		"開悟",
		"法喜充滿"
	],
	colors: [
		{
			id: "zen-c1",
			hex: "#174D49",
			role: "primary",
			label: "淡水深綠"
		},
		{
			id: "zen-c2",
			hex: "#D8B86A",
			role: "secondary",
			label: "禪光金"
		},
		{
			id: "zen-c3",
			hex: "#F4F1EA",
			role: "background",
			label: "霧白"
		},
		{
			id: "zen-c4",
			hex: "#D97A5B",
			role: "accent",
			label: "晚霞珊瑚"
		},
		{
			id: "zen-c5",
			hex: "#18312F",
			role: "ink",
			label: "深墨綠"
		}
	],
	fontDisplay: "Noto Serif TC",
	fontBody: "Noto Sans TC",
	logoAssetId: SEED_LOGO_ID,
	logos: [{
		id: "logo_tku_zen_primary",
		name: "三色光主標誌",
		assetId: SEED_LOGO_ID,
		usage: "primary"
	}],
	slogans: ["在忙亂裡，留一點空間給自己。", "一起坐坐，不急著想通。"],
	ctas: [
		"看看活動",
		"找朋友一起來",
		"保留這個晚上"
	],
	imageStyle: {
		mood: "明亮、療癒、年輕、有空氣感，帶一點淡水夜色與校園生活",
		lighting: "自然光、傍晚藍調或柔和三色光，避免宗教殿堂感與過度夢幻濾鏡",
		paletteHint: "霧白、淡水深綠、禪光金、晚霞珊瑚",
		composition: "人物或校園情境保留呼吸感，標題區清楚，手機上三秒能讀懂",
		do: "淡江校園、淡水、捷運、宿舍、同學互動、真實活動瞬間、龜龜與三色光",
		dont: "神像、蓮花堆疊、香火、沉重宗教符號、老氣書法、假笑 AI 人像、過量發光"
	},
	rules: {
		noCompetitorMarks: true,
		noWatermark: true,
		noLowRes: true,
		notes: "先讓學生感到與生活有關，再介紹禪與活動；時間、地點、報名方式不可藏起來。"
	},
	boilerplate: {
		...emptyBoilerplate(),
		cta: "看看活動",
		disclaimer: "",
		hashtags: [
			"#淡江大學",
			"#淡江禪學社",
			"#淡江生活"
		],
		captionClose: "如果你也想喘口氣，可以找朋友一起來。"
	},
	updatedAt: SEED_TIME
};
var copy = {
	eyebrow: "09.24 / TKU",
	headline: "最近是不是\n很久沒有好好坐下來？",
	subhead: "浮游禪光・一個不用急著想通的晚上",
	body: "在開學後的課表、通勤與新關係裡，留兩個小時整理最近的自己。",
	cta: "保留這個晚上",
	handle: "@tku_zen",
	caption: "最近是不是連坐下來，都還在想下一件事？\n\n09/24 晚上，我們想留一個不用急著想通的空間。可以安靜坐坐、整理最近的心情，也可以認識幾個新朋友。\n\n時間｜09/24 19:00–21:00\n地點｜淡江大學校園\n\n如果你也想喘口氣，可以找朋友一起來。",
	hashtags: [
		"#淡江大學",
		"#淡江禪學社",
		"#淡江生活",
		"#淡江社團",
		"#浮游禪光"
	],
	altText: "霧白與淡水深綠的浮游禪光活動宣傳，邀請淡江學生在九月二十四日晚間留一點空間給自己。"
};
var pageCopy = [
	{
		eyebrow: "09.24 / TKU",
		headline: "最近是不是\n很久沒有好好坐下來？",
		subhead: "浮游禪光",
		body: "先不用急著想通。",
		cta: "往下看看"
	},
	{
		eyebrow: "最近的你",
		headline: "下課了\n腦袋還沒下課",
		subhead: "課表、通勤、新關係一起湧進來",
		body: "有時候不是不累，只是不知道要在哪裡停一下。",
		cta: "留一點空間"
	},
	{
		eyebrow: "這個晚上",
		headline: "慢下來\n整理最近的自己",
		subhead: "不說教，也不需要懂禪",
		body: "一起坐坐、聊聊，也可以安靜待著。",
		cta: "可以帶朋友"
	},
	{
		eyebrow: "你會得到",
		headline: "不是答案\n是一點呼吸的空間",
		subhead: "安定・陪伴・自我探索",
		body: "在忙亂裡重新看見自己。",
		cta: "看看活動"
	},
	{
		eyebrow: "SAVE THE NIGHT",
		headline: "09.24\n浮游禪光",
		subhead: "19:00–21:00・淡江大學校園",
		body: "報名資訊請見禪學社 IG。",
		cta: "保留這個晚上"
	},
	{
		eyebrow: "淡江大學禪學社",
		headline: "一起坐坐\n不急著想通",
		subhead: "@tku_zen",
		body: "如果你也想喘口氣，可以找朋友一起來。",
		cta: "找朋友一起來"
	}
];
var templates = [
	"editorial",
	"quote",
	"product",
	"editorial",
	"offer",
	"quote"
];
var roles = [
	"cover",
	"problem",
	"detail",
	"proof",
	"cta",
	"close"
];
function createSeedProject() {
	const slides = pageCopy.map((item, index) => {
		const board = buildLayout("feed-portrait", {
			...copy,
			...item
		}, SEED_BRAND, templates[index]);
		board.layers = board.layers.map((layer, layerIndex) => ({
			...layer,
			id: `zen_${index}_${layerIndex}`
		}));
		board.role = roles[index];
		board.templateId = templates[index];
		return board;
	});
	const brief = migrateBrief({
		product: "浮游禪光晚間活動",
		eventName: "09/24 浮游禪光",
		schedule: "09/24 19:00–21:00",
		location: "淡江大學校園",
		audience: "剛開學還在適應課表、通勤、宿舍與新關係的淡江學生",
		goal: "awareness",
		features: "慢下來、整理情緒、自在認識新朋友；不需要懂禪",
		style: "夜晚、柔和三色光、有校園生活感，不宗教、不說教",
		notes: "第一句先說學生生活；時間地點清楚；可以帶朋友。",
		deliverables: {
			post: true,
			story: true,
			carousel: true,
			reels: true
		}
	});
	const plan = migratePlan({
		campaignName: "09/24 浮游禪光",
		concept: "先接住開學後停不下來的感受，再把活動介紹成一個可以喘口氣、整理自己、認識朋友的晚上。",
		insight: "淡江學生不一定在找禪，但可能正在找一個能慢下來又不尷尬的地方。",
		hook: copy.headline.replace("\n", ""),
		visualTheme: "淡水夜色、霧白留白與柔和三色光",
		visualDirection: "以霧白和深綠為主，禪光金與晚霞珊瑚做小面積節奏；避免宗教符號。",
		templateId: "editorial",
		colorMood: "霧白、淡水深綠、禪光金、晚霞珊瑚",
		eyebrow: copy.eyebrow,
		headline: copy.headline,
		subhead: copy.subhead,
		body: copy.body,
		cta: copy.cta,
		captions: [{
			style: "學生版",
			text: copy.caption
		}, {
			style: "短版",
			text: "下課了，腦袋還沒下課嗎？\n09/24，一起留一個不用急著想通的晚上。"
		}],
		hashtags: copy.hashtags,
		storyBeats: [
			"最近連休息都在想下一件事嗎？",
			"今晚不用懂禪，只要來坐坐",
			"09/24 19:00・找朋友一起來"
		],
		carouselPages: pageCopy.map((item, index) => ({
			role: roles[index],
			...item,
			visualNote: index === 0 ? "封面只保留 Hook、活動名與日期。" : "使用校園生活感與三色光節奏。",
			templateId: templates[index]
		})),
		assetNeeds: [
			{
				kind: "photo",
				title: "淡江傍晚校園",
				detail: "有空氣感，可留字區。",
				required: true
			},
			{
				kind: "people",
				title: "同學自然互動",
				detail: "不看鏡頭、不擺拍。",
				required: false
			},
			{
				kind: "logo",
				title: "三色光標誌",
				detail: "小尺寸放角落。",
				required: true
			}
		],
		checklist: [
			"第一句不是制式邀請",
			"時間與地點清楚",
			"不使用艱澀禪語",
			"手機三秒讀懂",
			"CTA 知道下一步"
		],
		altText: copy.altText,
		qaNotes: [
			"淡江學生會不會覺得這在說自己的生活？",
			"是否太宗教、太嚴肅、太文青或太像 AI？",
			"活動內容、時間、地點與參加方式是否清楚？"
		],
		generatedAt: SEED_TIME,
		source: "mock"
	});
	return {
		id: SEED_PROJECT_ID,
		name: "09/24 浮游禪光",
		createdAt: SEED_TIME,
		updatedAt: SEED_TIME,
		brandId: SEED_BRAND_ID,
		templateId: "editorial",
		activeFormatId: "feed-portrait",
		status: "ready",
		brief,
		copy,
		plan,
		artboards: { "feed-portrait": slides[0] },
		slides: { "feed-portrait": slides },
		slideIndex: 0,
		snapshots: [{
			id: "snap_zen_seed",
			name: "初稿・六頁輪播",
			createdAt: SEED_TIME,
			kind: "manual",
			formatId: "feed-portrait",
			slideIndex: 0,
			artboard: structuredClone(slides[0]),
			pages: structuredClone(slides)
		}],
		planVersions: migratePlanVersions(void 0, plan),
		exports: []
	};
}
function createSeedDraft() {
	const draftCopy = {
		...copy,
		eyebrow: "STORY IDEA",
		headline: "下課後\n先不要急著回訊息",
		subhead: "三十秒，看看自己現在的狀態",
		body: "",
		cta: "你今天還好嗎？",
		caption: ""
	};
	const artboard = buildLayout("story", draftCopy, SEED_BRAND, "quote");
	artboard.layers = artboard.layers.map((layer, index) => ({
		...layer,
		id: `zen_draft_${index}`
	}));
	return {
		id: SEED_DRAFT_ID,
		name: "開學後的三十秒",
		createdAt: SEED_TIME,
		updatedAt: SEED_TIME,
		brandId: SEED_BRAND_ID,
		templateId: "quote",
		activeFormatId: "story",
		status: "draft",
		brief: migrateBrief({
			eventName: "開學後的三十秒",
			audience: "剛下課、正在通勤或回宿舍的淡江學生",
			features: "一張簡單的情緒投票限動",
			deliverables: {
				post: false,
				story: true,
				carousel: false,
				reels: false
			}
		}),
		copy: draftCopy,
		plan: null,
		artboards: { story: artboard },
		slides: { story: [artboard] },
		slideIndex: 0,
		snapshots: [],
		planVersions: [],
		exports: []
	};
}
var TEMPLATE_STARTERS = [
	{
		id: "editorial",
		name: "編輯封面",
		description: "大標＋主視覺，適合品牌敘事",
		formatId: "feed-portrait",
		brief: migrateBrief({
			product: "品牌故事",
			eventName: "品牌敘事",
			audience: "在意質感的都市受眾",
			goal: "awareness",
			notes: "語氣沉靜，不要折扣口吻。",
			style: "編輯節奏、留白"
		}),
		copy: {
			eyebrow: "STUDIO NOTE",
			headline: "把故事\n放進畫面",
			subhead: "以編輯節奏鋪陳品牌觀點。",
			body: "適合系列開場、理念闡述與季節提案。",
			cta: "閱讀更多",
			handle: "",
			caption: "",
			hashtags: [],
			altText: ""
		}
	},
	{
		id: "product",
		name: "商品主圖",
		description: "上圖下文，適合單品上市",
		formatId: "feed-portrait",
		brief: migrateBrief({
			product: "主打商品",
			eventName: "新品上市",
			offer: "新到櫃上",
			audience: "會比較規格與產地的買家",
			goal: "conversion",
			notes: "強調規格與使用情境。"
		}),
		copy: {
			eyebrow: "NEW ARRIVAL",
			headline: "新品名稱",
			subhead: "一句話說清楚為什麼現在要看。",
			body: "產地、規格或使用方式放這裡。",
			cta: "查看商品",
			handle: "",
			caption: "",
			hashtags: [],
			altText: ""
		}
	},
	{
		id: "offer",
		name: "優惠公告",
		description: "置中大標與 CTA，適合檔期",
		formatId: "feed-square",
		brief: migrateBrief({
			product: "檔期活動",
			eventName: "期間限定",
			offer: "期間限定",
			audience: "已關注品牌、等待理由行動的人",
			goal: "traffic",
			notes: "清楚寫期限，不要製造焦慮。"
		}),
		copy: {
			eyebrow: "SEASON OFFER",
			headline: "本週限定",
			subhead: "把優惠與期限寫在同一視線。",
			body: "到店或線上兌換方式。",
			cta: "立即查看",
			handle: "",
			caption: "",
			hashtags: [],
			altText: ""
		}
	},
	{
		id: "quote",
		name: "引言卡片",
		description: "語句為主，適合價值主張",
		formatId: "feed-square",
		brief: migrateBrief({
			product: "品牌主張",
			eventName: "一句話主張",
			audience: "需要被一句話打動的瀏覽者",
			goal: "ugc",
			notes: "短、可截圖、可分享。",
			style: "短句、可分享"
		}),
		copy: {
			eyebrow: "NOTE",
			headline: "好的網宣\n先把話說完",
			subhead: "留給畫面呼吸，而不是塞滿資訊。",
			body: "",
			cta: "收藏這句",
			handle: "",
			caption: "",
			hashtags: [],
			altText: ""
		}
	}
];
function templateById(id) {
	return TEMPLATE_STARTERS.find((t) => t.id === id) ?? TEMPLATE_STARTERS[0];
}
function previewTemplate(template, brand, imageAssetId) {
	const copy = {
		...template.copy,
		handle: brand.handle,
		cta: brand.boilerplate.cta || template.copy.cta,
		hashtags: brand.boilerplate.hashtags
	};
	const artboard = buildLayout(template.formatId, copy, brand, template.id, { imageAssetId });
	artboard.layers = artboard.layers.map((layer, index) => ({
		...layer,
		id: `tpl_${template.id}_${index}`
	}));
	return artboard;
}
var STORAGE_KEY = "kouzhen-studio-v1";
var AUTO_SNAP_MS = 2e4;
function brandById(brands, id) {
	return brands.find((b) => b.id === id) ?? brands[0] ?? SEED_BRAND;
}
function clone(v) {
	return structuredClone(v);
}
function historyKey(projectId, formatId) {
	return `${projectId}:${formatId}`;
}
function migrateBrandRecord(raw) {
	if (raw.id === "brand_nisshoku" && raw.name === "日食咖啡") return clone(SEED_BRAND);
	const next = migrateBrand(raw);
	if (next.id !== "brand_nisshoku") return next;
	return {
		...next,
		slogans: next.slogans.length ? next.slogans : SEED_BRAND.slogans,
		ctas: next.ctas.length ? next.ctas : SEED_BRAND.ctas,
		logos: next.logos.length ? next.logos : SEED_BRAND.logos,
		imageStyle: next.imageStyle.mood ? next.imageStyle : SEED_BRAND.imageStyle,
		rules: next.rules.notes ? next.rules : {
			...SEED_BRAND.rules,
			...next.rules
		}
	};
}
function migrateAssetRecord(raw) {
	const next = migrateAsset(raw);
	const seed = SEED_ASSETS.find((item) => item.id === next.id);
	if (!seed) return next;
	return {
		...next,
		category: raw.category ?? seed.category,
		tags: next.tags.length ? next.tags : seed.tags,
		licenseNotes: next.licenseNotes || seed.licenseNotes,
		licenseOwner: next.licenseOwner || seed.licenseOwner,
		source: next.source || seed.source,
		favorite: raw.favorite ?? seed.favorite
	};
}
function migrateProject(raw) {
	if (raw.id === "proj_yirgacheffe" && raw.name.includes("耶加雪菲")) return createSeedProject();
	if (raw.id === "proj_weekend_pour" && raw.name.includes("手沖")) return createSeedDraft();
	const artboards = {};
	for (const [key, value] of Object.entries(raw.artboards ?? {})) if (value) artboards[key] = normalizeArtboard(value);
	const slides = {};
	const rawSlides = raw.slides ?? {};
	for (const key of /* @__PURE__ */ new Set([...Object.keys(artboards), ...Object.keys(rawSlides)])) {
		const id = key;
		const list = rawSlides[id];
		if (list?.length) slides[id] = stampSlideMeta(list.map((page) => normalizeArtboard(page)));
		else if (artboards[id]) slides[id] = stampSlideMeta([artboards[id]]);
	}
	const formatId = raw.activeFormatId ?? "feed-portrait";
	const pages = slides[formatId] ?? [];
	const slideIndex = Math.min(Math.max(0, raw.slideIndex ?? 0), Math.max(0, pages.length - 1));
	if (pages[slideIndex]) artboards[formatId] = pages[slideIndex];
	const plan = migratePlan(raw.plan);
	return {
		...raw,
		status: raw.status ?? (plan ? "ready" : "draft"),
		exports: raw.exports ?? [],
		artboards,
		slides,
		slideIndex,
		brief: migrateBrief(raw.brief),
		plan,
		planVersions: migratePlanVersions(raw.planVersions, plan),
		snapshots: (raw.snapshots ?? []).map((snap) => ({
			...snap,
			artboard: normalizeArtboard(snap.artboard),
			pages: snap.pages?.map((page) => normalizeArtboard(page))
		}))
	};
}
function withPages(project, formatId, pages, slideIndex) {
	const stamped = stampSlideMeta(pages);
	const idx = Math.min(Math.max(0, slideIndex), Math.max(0, stamped.length - 1));
	const current = stamped[idx];
	return {
		...project,
		artboards: current ? {
			...project.artboards,
			[formatId]: current
		} : project.artboards,
		slides: {
			...project.slides,
			[formatId]: stamped
		},
		slideIndex: idx,
		updatedAt: Date.now()
	};
}
function maybeAutoSnapshot(project, formatId, artboard, slideIndex) {
	const snaps = project.snapshots ?? [];
	const last = snaps[0];
	const now = Date.now();
	if (last && now - last.createdAt < AUTO_SNAP_MS) return snaps;
	const pages = pagesOf(project, formatId);
	return [{
		id: uid("snap"),
		name: "自動儲存",
		createdAt: now,
		kind: "auto",
		formatId,
		slideIndex,
		artboard: clone(artboard),
		pages: clone(pages)
	}, ...snaps].slice(0, 16);
}
function makeFormatSnapshot(project, formatId, name, kind) {
	const pages = pagesOf(project, formatId);
	if (!pages.length) return null;
	const idx = formatId === project.activeFormatId ? project.slideIndex ?? 0 : 0;
	return {
		id: uid("snap"),
		name,
		createdAt: Date.now(),
		kind,
		formatId,
		slideIndex: Math.min(idx, pages.length - 1),
		artboard: clone(pages[Math.min(idx, pages.length - 1)]),
		pages: clone(pages)
	};
}
var useStudio = create()(persist((set, get) => ({
	hydrated: false,
	brands: [SEED_BRAND],
	assets: SEED_ASSETS,
	projects: [createSeedProject(), createSeedDraft()],
	lastProjectId: SEED_PROJECT_ID,
	editor: {
		selectedId: null,
		zoom: 0,
		showGrid: false,
		showSafe: true,
		showBounds: true,
		tool: "select"
	},
	history: {},
	historyIndex: {},
	historyPaused: false,
	setHydrated: (v) => set({ hydrated: v }),
	setLastProjectId: (id) => set({ lastProjectId: id }),
	createBrand: (name) => {
		const brand = createEmptyBrand(name);
		set((s) => ({ brands: [...s.brands, brand] }));
		return brand;
	},
	updateBrand: (id, patch) => set((s) => ({ brands: s.brands.map((b) => b.id === id ? {
		...b,
		...patch,
		updatedAt: Date.now()
	} : b) })),
	deleteBrand: (id) => set((s) => {
		if (s.brands.length <= 1) return s;
		const brands = s.brands.filter((b) => b.id !== id);
		const fallback = brands[0].id;
		return {
			brands,
			projects: s.projects.map((p) => p.brandId === id ? {
				...p,
				brandId: fallback
			} : p)
		};
	}),
	addAsset: (meta) => set((s) => ({ assets: [migrateAsset(meta), ...s.assets] })),
	updateAsset: (id, patch) => set((s) => ({ assets: s.assets.map((a) => a.id === id ? {
		...a,
		...patch,
		updatedAt: Date.now()
	} : a) })),
	toggleFavorite: (id) => set((s) => ({ assets: s.assets.map((a) => a.id === id ? {
		...a,
		favorite: !a.favorite,
		updatedAt: Date.now()
	} : a) })),
	markAssetUsed: (id) => set((s) => ({ assets: s.assets.map((a) => a.id === id ? {
		...a,
		useCount: a.useCount + 1,
		lastUsedAt: Date.now(),
		updatedAt: Date.now()
	} : a) })),
	removeAsset: (id) => set((s) => ({
		assets: s.assets.filter((a) => a.id !== id),
		brands: s.brands.map((b) => {
			const logos = (b.logos ?? []).filter((logo) => logo.assetId !== id);
			const logoAssetId = b.logoAssetId === id ? logos[0]?.assetId ?? null : b.logoAssetId;
			return {
				...b,
				logos,
				logoAssetId
			};
		})
	})),
	placeAsset: (projectId, assetId, at) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		const asset = s.assets.find((a) => a.id === assetId);
		if (!project || !asset) return false;
		const brand = brandById(s.brands, project.brandId);
		const format = formatById(project.activeFormatId);
		const size = fitPlacedAsset(asset, format.width * .72, format.height * .55);
		if (asset.kind === "logo" || asset.category === "logo") {
			const side = Math.min(180, Math.max(72, Math.round(Math.min(size.w, size.h))));
			const layer = createLogoLayer(brand, {
				assetId: asset.id,
				size: side,
				x: at ? Math.round(at.x - side / 2) : format.width - side - format.safe.right,
				y: at ? Math.round(at.y - side / 2) : format.safe.top
			});
			if (!layer) return false;
			get().addLayer(projectId, layer);
		} else {
			const w = size.w;
			const h = size.h;
			const x = at ? Math.round(at.x - w / 2) : Math.round((format.width - w) / 2);
			const y = at ? Math.round(at.y - h / 2) : Math.round((format.height - h) / 3);
			get().addLayer(projectId, createImageLayer(asset.id, asset.name, {
				x,
				y,
				w,
				h
			}));
		}
		get().markAssetUsed(asset.id);
		return true;
	},
	createProject: ({ name, brandId, formatId, brief, templateId }) => {
		const brand = brandById(get().brands, brandId);
		const tpl = templateId ?? "editorial";
		const copy = withBoilerplate(emptyCopy(brand.handle, brand.boilerplate), brand.boilerplate);
		copy.headline = name;
		const artboard = buildLayout(formatId, copy, brand, tpl);
		const project = {
			id: uid("proj"),
			name: name.trim() || "未命名專案",
			createdAt: Date.now(),
			updatedAt: Date.now(),
			brandId,
			templateId: tpl,
			activeFormatId: formatId,
			status: "draft",
			brief: migrateBrief(brief),
			copy,
			plan: null,
			artboards: { [formatId]: artboard },
			slides: { [formatId]: [artboard] },
			slideIndex: 0,
			snapshots: [],
			planVersions: [],
			exports: []
		};
		set((s) => ({
			projects: [project, ...s.projects],
			lastProjectId: project.id
		}));
		return project;
	},
	createFromTemplate: ({ templateId, brandId }) => {
		const brand = brandById(get().brands, brandId);
		const starter = templateById(templateId);
		const copy = withBoilerplate({
			...starter.copy,
			handle: brand.handle,
			headline: starter.copy.headline
		}, brand.boilerplate);
		const artboard = buildLayout(starter.formatId, copy, brand, templateId);
		const project = {
			id: uid("proj"),
			name: starter.name,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			brandId,
			templateId,
			activeFormatId: starter.formatId,
			status: "draft",
			brief: migrateBrief(starter.brief),
			copy,
			plan: null,
			artboards: { [starter.formatId]: artboard },
			slides: { [starter.formatId]: [artboard] },
			slideIndex: 0,
			snapshots: [],
			planVersions: [],
			exports: []
		};
		set((s) => ({
			projects: [project, ...s.projects],
			lastProjectId: project.id
		}));
		return project;
	},
	applyCampaignPlan: (projectId, plan, brief) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const brand = brandById(s.brands, project.brandId);
		const nextBrief = migrateBrief(brief);
		const nextPlan = migratePlan(plan) ?? plan;
		const boards = buildCampaignBoards({
			project,
			brand,
			plan: nextPlan,
			brief: nextBrief
		});
		const version = {
			id: uid("plan"),
			createdAt: Date.now(),
			source: nextPlan.source,
			name: `${nextPlan.source === "mock" ? "本機草案" : "AI 企劃"} · ${nextPlan.campaignName || "未命名"}`,
			plan: clone(nextPlan)
		};
		get().updateProject(projectId, (p) => ({
			...p,
			brief: nextBrief,
			plan: nextPlan,
			copy: boards.copy,
			templateId: nextPlan.templateId,
			slides: boards.slides,
			artboards: boards.artboards,
			activeFormatId: boards.activeFormatId,
			slideIndex: 0,
			status: "ready",
			planVersions: [version, ...p.planVersions ?? []].slice(0, 12)
		}));
		get().captureSnapshot(projectId, nextPlan.source === "mock" ? "本機草案" : "AI 企劃", "manual");
		get().select(null);
	},
	restorePlanVersion: (projectId, versionId) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		const version = (project.planVersions ?? []).find((v) => v.id === versionId);
		if (!version) return;
		const brand = brandById(get().brands, project.brandId);
		const plan = migratePlan(version.plan) ?? version.plan;
		const boards = buildCampaignBoards({
			project,
			brand,
			plan,
			brief: migrateBrief(project.brief)
		});
		get().updateProject(projectId, (p) => ({
			...p,
			plan,
			copy: boards.copy,
			templateId: plan.templateId,
			slides: boards.slides,
			artboards: boards.artboards,
			activeFormatId: boards.activeFormatId,
			slideIndex: 0,
			status: "ready",
			planVersions: [version, p.planVersions.filter((v) => v.id !== versionId)].flat().slice(0, 12)
		}));
		get().captureSnapshot(projectId, `還原 ${version.name}`, "manual");
		get().select(null);
	},
	patchPlan: (projectId, patch) => {
		get().updateProject(projectId, (p) => {
			if (!p.plan) return p;
			const next = typeof patch === "function" ? patch(p.plan) : {
				...p.plan,
				...patch
			};
			return {
				...p,
				plan: next
			};
		});
	},
	applyAiEdit: async (projectId, _label, mutate) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		const formatId = project.activeFormatId;
		const beforePages = clone(pagesOf(project, formatId));
		const beforeIdx = project.slideIndex ?? 0;
		set({ historyPaused: true });
		try {
			await mutate();
		} finally {
			set({ historyPaused: false });
		}
		const after = get().projects.find((p) => p.id === projectId);
		if (!after) return;
		const afterFormat = after.activeFormatId;
		const afterPages = clone(pagesOf(after, afterFormat));
		const afterIdx = after.slideIndex ?? 0;
		if (afterFormat !== formatId) return;
		const key = historyKey(projectId, formatId);
		const s = get();
		const stack = (s.history[key] ?? [{
			pages: beforePages,
			slideIndex: beforeIdx
		}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
		if (!s.history[key]) stack[0] = {
			pages: beforePages,
			slideIndex: beforeIdx
		};
		stack.push({
			pages: afterPages,
			slideIndex: afterIdx
		});
		const trimmed = stack.slice(-40);
		set({
			history: {
				...s.history,
				[key]: trimmed
			},
			historyIndex: {
				...s.historyIndex,
				[key]: trimmed.length - 1
			}
		});
	},
	updateProject: (id, patch) => set((s) => ({ projects: s.projects.map((p) => {
		if (p.id !== id) return p;
		return {
			...typeof patch === "function" ? patch(p) : {
				...p,
				...patch
			},
			updatedAt: Date.now()
		};
	}) })),
	setProjectStatus: (id, status) => get().updateProject(id, { status }),
	deleteProject: (id) => set((s) => {
		const projects = s.projects.filter((p) => p.id !== id);
		return {
			projects,
			lastProjectId: s.lastProjectId === id ? projects[0]?.id ?? null : s.lastProjectId
		};
	}),
	duplicateProject: (id) => {
		const src = get().projects.find((p) => p.id === id);
		if (!src) return null;
		const copy = {
			...clone(src),
			id: uid("proj"),
			name: `${src.name} 副本`,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			status: "draft",
			exports: []
		};
		set((s) => ({
			projects: [copy, ...s.projects],
			lastProjectId: copy.id
		}));
		return copy;
	},
	recordExport: (id, version) => get().updateProject(id, (p) => ({
		...p,
		status: "exported",
		exports: [version, ...p.exports].slice(0, 20)
	})),
	ensureArtboard: (projectId, formatId) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		if (pagesOf(project, formatId).length) return;
		const brand = brandById(s.brands, project.brandId);
		const sourceFormat = project.activeFormatId;
		const sourcePages = pagesOf(project, sourceFormat);
		if (sourcePages.length && sourceFormat !== formatId) {
			const snap = makeFormatSnapshot(project, sourceFormat, `轉換前 · ${formatById(sourceFormat).short}`, "format");
			const adapted = adaptPages(sourcePages, formatId, brand, project.templateId);
			get().updateProject(projectId, (p) => {
				const next = withPages(p, formatId, adapted, 0);
				return snap ? {
					...next,
					snapshots: [snap, ...p.snapshots ?? []].slice(0, 16)
				} : next;
			});
			return;
		}
		const imageAssetId = extractImageAssetId(project.artboards[project.activeFormatId] ?? pagesOf(project)[0]);
		const artboard = buildLayout(formatId, project.copy, brand, project.templateId, { imageAssetId });
		artboard.role = "cover";
		artboard.templateId = project.templateId;
		get().updateProject(projectId, (p) => withPages(p, formatId, [artboard], 0));
	},
	setActiveFormat: (projectId, formatId) => {
		get().ensureArtboard(projectId, formatId);
		get().updateProject(projectId, {
			activeFormatId: formatId,
			slideIndex: 0
		});
		set((s) => ({ editor: {
			...s.editor,
			selectedId: null
		} }));
	},
	reflow: (projectId, templateId) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const brand = brandById(s.brands, project.brandId);
		const nextTemplate = templateId ?? project.templateId;
		const current = pagesOf(project)[project.slideIndex ?? 0];
		if (!current) return;
		const copy = copyFromArtboard(current, project.copy);
		const artboard = adaptArtboard(current, project.activeFormatId, brand, {
			templateId: nextTemplate,
			copy
		});
		get().patchArtboard(projectId, () => artboard);
		get().updateProject(projectId, { templateId: nextTemplate });
		get().select(null);
	},
	setCopy: (projectId, patch) => {
		get().updateProject(projectId, (p) => {
			const copy = {
				...p.copy,
				...patch
			};
			const formatId = p.activeFormatId;
			const pages = pagesOf(p, formatId);
			const idx = p.slideIndex ?? 0;
			if (!pages[idx]) return {
				...p,
				copy
			};
			const nextPages = pages.map((page, i) => i === idx ? applyCopyToArtboard(page, copy) : page);
			const planPages = p.plan?.carouselPages;
			const plan = p.plan && planPages?.[idx] ? {
				...p.plan,
				carouselPages: planPages.map((page, i) => i === idx ? {
					...page,
					headline: copy.headline,
					subhead: copy.subhead,
					body: copy.body,
					cta: copy.cta
				} : page)
			} : p.plan;
			return {
				...withPages({
					...p,
					copy,
					plan
				}, formatId, nextPages, idx),
				copy,
				plan
			};
		});
	},
	patchArtboard: (projectId, fn, recordHistory = true) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const formatId = project.activeFormatId;
		const pages = pagesOf(project, formatId);
		const idx = Math.min(project.slideIndex ?? 0, Math.max(0, pages.length - 1));
		const current = pages[idx];
		if (!current) return;
		const next = fn(current);
		const nextPages = pages.map((page, i) => i === idx ? next : page);
		if (recordHistory && !get().historyPaused) {
			const key = historyKey(projectId, formatId);
			const stack = (s.history[key] ?? [{
				pages: clone(pages),
				slideIndex: idx
			}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
			stack.push({
				pages: clone(nextPages),
				slideIndex: idx
			});
			const trimmed = stack.slice(-40);
			set({
				history: {
					...s.history,
					[key]: trimmed
				},
				historyIndex: {
					...s.historyIndex,
					[key]: trimmed.length - 1
				}
			});
		}
		get().updateProject(projectId, (p) => {
			const updated = withPages(p, formatId, nextPages, idx);
			return {
				...updated,
				snapshots: maybeAutoSnapshot(updated, formatId, next, idx)
			};
		});
	},
	updateLayer: (projectId, layerId, patch) => {
		get().patchArtboard(projectId, (a) => ({
			...a,
			layers: a.layers.map((l) => l.id === layerId ? {
				...l,
				...patch
			} : l)
		}));
	},
	addLayer: (projectId, layer) => {
		get().patchArtboard(projectId, (a) => ({
			...a,
			layers: [...a.layers, layer]
		}));
		get().select(layer.id);
		get().setEditor({ tool: "select" });
	},
	removeLayer: (projectId, layerId) => {
		get().patchArtboard(projectId, (a) => ({
			...a,
			layers: a.layers.filter((l) => l.id !== layerId)
		}));
		if (get().editor.selectedId === layerId) get().select(null);
	},
	duplicateLayer: (projectId, layerId) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		const layer = pagesOf(project)[project.slideIndex ?? 0]?.layers.find((l) => l.id === layerId);
		if (!layer) return;
		const copy = duplicateLayer(layer);
		get().addLayer(projectId, copy);
	},
	reorderLayer: (projectId, layerId, dir) => {
		get().patchArtboard(projectId, (a) => {
			const layers = [...a.layers];
			const i = layers.findIndex((l) => l.id === layerId);
			if (i < 0) return a;
			const [item] = layers.splice(i, 1);
			if (dir === "front") layers.push(item);
			else if (dir === "back") layers.unshift(item);
			else if (dir === "up") layers.splice(Math.min(layers.length, i + 1), 0, item);
			else layers.splice(Math.max(0, i - 1), 0, item);
			return {
				...a,
				layers
			};
		});
	},
	alignLayer: (projectId, layerId, mode) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		const layer = pagesOf(project)[project.slideIndex ?? 0]?.layers.find((l) => l.id === layerId);
		if (!layer || layer.locked) return;
		const patch = alignBox(layer, formatById(project.activeFormatId), mode);
		get().updateLayer(projectId, layerId, patch);
	},
	nudgeLayer: (projectId, layerId, dx, dy) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		const layer = pagesOf(project)[project.slideIndex ?? 0]?.layers.find((l) => l.id === layerId);
		if (!layer || layer.locked) return;
		get().updateLayer(projectId, layerId, {
			x: layer.x + dx,
			y: layer.y + dy
		});
	},
	addSlide: (projectId, mode = "duplicate") => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const formatId = project.activeFormatId;
		const pages = pagesOf(project, formatId);
		if (pages.length >= 10) return;
		const brand = brandById(s.brands, project.brandId);
		const source = pages[project.slideIndex ?? 0];
		const nextRole = CAROUSEL_SEQUENCE.find((item) => !pages.some((page) => page.role === item.role))?.role;
		const nextPage = mode === "blank" || !source ? emptyArtboard(formatId, brand.colors.find((c) => c.role === "background")?.hex ?? "#F4E6D4") : cloneArtboard(source);
		if (mode === "blank") {
			nextPage.role = nextRole;
			nextPage.templateId = roleTemplate(nextRole, project.templateId);
		}
		const nextPages = [...pages, nextPage];
		const nextIndex = nextPages.length - 1;
		const key = historyKey(projectId, formatId);
		const stack = (s.history[key] ?? [{
			pages: clone(pages),
			slideIndex: project.slideIndex ?? 0
		}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
		stack.push({
			pages: clone(nextPages),
			slideIndex: nextIndex
		});
		set({
			history: {
				...s.history,
				[key]: stack.slice(-40)
			},
			historyIndex: {
				...s.historyIndex,
				[key]: stack.slice(-40).length - 1
			},
			editor: {
				...s.editor,
				selectedId: null
			}
		});
		get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, nextIndex));
	},
	removeSlide: (projectId, index) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const formatId = project.activeFormatId;
		const pages = pagesOf(project, formatId);
		if (pages.length <= 1) return;
		const target = index ?? project.slideIndex ?? 0;
		const nextPages = pages.filter((_, i) => i !== target);
		const nextIndex = Math.min(target, nextPages.length - 1);
		const key = historyKey(projectId, formatId);
		const stack = (s.history[key] ?? [{
			pages: clone(pages),
			slideIndex: project.slideIndex ?? 0
		}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
		stack.push({
			pages: clone(nextPages),
			slideIndex: nextIndex
		});
		set({
			history: {
				...s.history,
				[key]: stack.slice(-40)
			},
			historyIndex: {
				...s.historyIndex,
				[key]: stack.slice(-40).length - 1
			},
			editor: {
				...s.editor,
				selectedId: null
			}
		});
		get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, nextIndex));
	},
	setSlide: (projectId, index) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		if (!pagesOf(project)[index]) return;
		get().updateProject(projectId, (p) => withPages(p, p.activeFormatId, pagesOf(p), index));
		get().select(null);
	},
	duplicateSlide: (projectId) => get().addSlide(projectId, "duplicate"),
	reorderSlide: (projectId, from, to) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const formatId = project.activeFormatId;
		const pages = [...pagesOf(project, formatId)];
		if (from === to || !pages[from] || to < 0 || to >= pages.length) return;
		const [moved] = pages.splice(from, 1);
		pages.splice(to, 0, moved);
		const key = historyKey(projectId, formatId);
		const stack = (s.history[key] ?? [{
			pages: clone(pagesOf(project, formatId)),
			slideIndex: project.slideIndex ?? 0
		}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
		stack.push({
			pages: clone(pages),
			slideIndex: to
		});
		set({
			history: {
				...s.history,
				[key]: stack.slice(-40)
			},
			historyIndex: {
				...s.historyIndex,
				[key]: stack.slice(-40).length - 1
			},
			editor: {
				...s.editor,
				selectedId: null
			}
		});
		get().updateProject(projectId, (p) => {
			const next = withPages(p, formatId, pages, to);
			if (!p.plan || p.plan.carouselPages.length !== pages.length) return next;
			const planPages = [...p.plan.carouselPages];
			const [planMoved] = planPages.splice(from, 1);
			planPages.splice(to, 0, planMoved);
			return {
				...next,
				plan: {
					...p.plan,
					carouselPages: planPages
				}
			};
		});
	},
	regenerateSlide: (projectId, index) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const brand = brandById(s.brands, project.brandId);
		const pages = pagesOf(project);
		const idx = index ?? project.slideIndex ?? 0;
		const current = pages[idx];
		if (!current) return;
		const planPage = project.plan?.carouselPages[idx];
		const copy = planPage ? copyForCarouselPage(copyFromArtboard(current, project.copy), planPage, project.plan ?? void 0) : copyFromArtboard(current, project.copy);
		const templateId = planPage?.templateId ?? current.templateId ?? roleTemplate(current.role, project.templateId);
		const next = adaptArtboard(current, project.activeFormatId, brand, {
			templateId,
			copy
		});
		if (planPage) next.role = planPage.role;
		get().patchArtboard(projectId, () => next);
		get().select(null);
	},
	expandCarousel: (projectId) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const brand = brandById(s.brands, project.brandId);
		const formatId = project.activeFormatId;
		const existing = pagesOf(project, formatId);
		const snap = makeFormatSnapshot(project, formatId, "展開輪播前", "format");
		const fromPlan = project.plan?.carouselPages ?? existing.map((page, i) => pagePlanFromArtboard(page, i));
		const pages = completeCarouselPages(fromPlan, {
			headline: project.copy.headline,
			subhead: project.copy.subhead,
			body: project.copy.body,
			cta: project.copy.cta,
			hook: project.plan?.hook,
			insight: project.plan?.insight,
			templateId: project.templateId
		}).slice(0, 10);
		const imageAssetId = extractImageAssetId(existing[0]);
		const boards = stampSlideMeta(pages.map((page, i) => {
			const source = existing[i] ?? existing[0];
			const board = buildLayout(formatId, copyForCarouselPage(project.copy, page, project.plan ?? void 0), brand, page.templateId, { imageAssetId: extractImageAssetId(source) ?? imageAssetId });
			board.role = page.role;
			board.templateId = page.templateId;
			return board;
		}));
		get().updateProject(projectId, (p) => {
			const next = withPages(p, formatId, boards, 0);
			const plan = p.plan ? {
				...p.plan,
				carouselPages: pages
			} : p.plan;
			return {
				...next,
				plan,
				brief: {
					...p.brief,
					deliverables: {
						...p.brief.deliverables,
						carousel: true
					}
				},
				snapshots: snap ? [snap, ...p.snapshots ?? []].slice(0, 16) : p.snapshots
			};
		});
		get().select(null);
	},
	adaptToFormat: (projectId, formatId) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const brand = brandById(s.brands, project.brandId);
		const sourceFormat = project.activeFormatId;
		const sourcePages = pagesOf(project, sourceFormat);
		if (!sourcePages.length) return;
		const sourceSnap = makeFormatSnapshot(project, sourceFormat, `轉換前 · ${formatById(sourceFormat).short}`, "format");
		const targetSnap = formatId !== sourceFormat && pagesOf(project, formatId).length ? makeFormatSnapshot(project, formatId, `覆蓋前 · ${formatById(formatId).short}`, "format") : null;
		const adapted = adaptPages(sourcePages, formatId, brand, project.templateId);
		const extras = [sourceSnap, targetSnap].filter(Boolean);
		get().updateProject(projectId, (p) => {
			return {
				...withPages({
					...p,
					activeFormatId: formatId
				}, formatId, adapted, Math.min(p.slideIndex ?? 0, adapted.length - 1)),
				activeFormatId: formatId,
				snapshots: extras.length ? [...extras, ...p.snapshots ?? []].slice(0, 16) : p.snapshots
			};
		});
		set((state) => ({ editor: {
			...state.editor,
			selectedId: null
		} }));
	},
	applyQaFix: (projectId, issue) => {
		if (!issue.fix) return false;
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return false;
		const brand = brandById(s.brands, project.brandId);
		const formatId = project.activeFormatId;
		const pages = pagesOf(project, formatId);
		get().captureSnapshot(projectId, "修正前 · 品質檢查", "manual");
		const nextPages = applyQaFixToPages(pages, issue.fix, brand);
		const key = historyKey(projectId, formatId);
		const stack = (s.history[key] ?? [{
			pages: clone(pages),
			slideIndex: project.slideIndex ?? 0
		}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
		const nextIndex = Math.min(issue.pageIndex ?? project.slideIndex ?? 0, Math.max(0, nextPages.length - 1));
		stack.push({
			pages: clone(nextPages),
			slideIndex: nextIndex
		});
		set({
			history: {
				...get().history,
				[key]: stack.slice(-40)
			},
			historyIndex: {
				...get().historyIndex,
				[key]: stack.slice(-40).length - 1
			}
		});
		get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, nextIndex));
		if (issue.layerId) get().select(issue.layerId);
		return true;
	},
	applyQaFixes: (projectId, issues) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return 0;
		const brand = brandById(s.brands, project.brandId);
		const formatId = project.activeFormatId;
		const pages = pagesOf(project, formatId);
		const list = (issues ?? inspectProject(pages, brand, project.copy).issues).filter((item) => item.fix);
		if (!list.length) return 0;
		get().captureSnapshot(projectId, "修正前 · 品質檢查", "manual");
		let nextPages = pages;
		for (const issue of list) if (issue.fix) nextPages = applyQaFixToPages(nextPages, issue.fix, brand);
		const key = historyKey(projectId, formatId);
		const stack = (s.history[key] ?? [{
			pages: clone(pages),
			slideIndex: project.slideIndex ?? 0
		}]).slice(0, (s.historyIndex[key] ?? 0) + 1);
		stack.push({
			pages: clone(nextPages),
			slideIndex: project.slideIndex ?? 0
		});
		set({
			history: {
				...get().history,
				[key]: stack.slice(-40)
			},
			historyIndex: {
				...get().historyIndex,
				[key]: stack.slice(-40).length - 1
			}
		});
		get().updateProject(projectId, (p) => withPages(p, formatId, nextPages, p.slideIndex ?? 0));
		get().select(null);
		return list.length;
	},
	captureSnapshot: (projectId, name, kind = "manual") => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return null;
		const snap = makeFormatSnapshot(project, project.activeFormatId, name?.trim() || (kind === "auto" ? "自動儲存" : kind === "format" ? "尺寸版本" : "手動版本"), kind);
		if (!snap) return null;
		get().updateProject(projectId, (p) => ({
			...p,
			snapshots: [snap, ...p.snapshots ?? []].slice(0, 16)
		}));
		return snap.id;
	},
	restoreSnapshot: (projectId, snapshotId) => {
		const project = get().projects.find((p) => p.id === projectId);
		if (!project) return;
		const snap = (project.snapshots ?? []).find((item) => item.id === snapshotId);
		if (!snap) return;
		if (snap.pages?.length) {
			get().updateProject(projectId, (p) => ({
				...withPages(p, snap.formatId, clone(snap.pages ?? []), snap.slideIndex),
				activeFormatId: snap.formatId
			}));
			get().select(null);
			return;
		}
		get().ensureArtboard(projectId, snap.formatId);
		get().updateProject(projectId, {
			activeFormatId: snap.formatId,
			slideIndex: snap.slideIndex
		});
		get().patchArtboard(projectId, () => clone(snap.artboard));
		get().select(null);
	},
	deleteSnapshot: (projectId, snapshotId) => {
		get().updateProject(projectId, (p) => ({
			...p,
			snapshots: (p.snapshots ?? []).filter((s) => s.id !== snapshotId)
		}));
	},
	select: (id) => set((s) => ({ editor: {
		...s.editor,
		selectedId: id
	} })),
	setEditor: (patch) => set((s) => ({ editor: {
		...s.editor,
		...patch
	} })),
	undo: (projectId) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const key = historyKey(projectId, project.activeFormatId);
		const stack = s.history[key];
		const idx = s.historyIndex[key] ?? -1;
		if (!stack || idx <= 0) return;
		const nextIdx = idx - 1;
		const entry = stack[nextIdx];
		set({ historyIndex: {
			...s.historyIndex,
			[key]: nextIdx
		} });
		get().updateProject(projectId, (p) => withPages(p, p.activeFormatId, clone(entry.pages), entry.slideIndex));
		get().select(null);
	},
	redo: (projectId) => {
		const s = get();
		const project = s.projects.find((p) => p.id === projectId);
		if (!project) return;
		const key = historyKey(projectId, project.activeFormatId);
		const stack = s.history[key];
		const idx = s.historyIndex[key] ?? -1;
		if (!stack || idx >= stack.length - 1) return;
		const nextIdx = idx + 1;
		const entry = stack[nextIdx];
		set({ historyIndex: {
			...s.historyIndex,
			[key]: nextIdx
		} });
		get().updateProject(projectId, (p) => withPages(p, p.activeFormatId, clone(entry.pages), entry.slideIndex));
		get().select(null);
	}
}), {
	name: STORAGE_KEY,
	skipHydration: true,
	version: 7,
	partialize: (s) => ({
		brands: s.brands,
		assets: s.assets,
		projects: s.projects,
		lastProjectId: s.lastProjectId
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		const legacySeed = p.brands?.some((brand) => brand.id === "brand_nisshoku" && brand.name === "日食咖啡") ?? false;
		const brands = (p.brands ?? current.brands).map(migrateBrandRecord);
		const assets = (p.assets ?? current.assets).filter((asset) => !legacySeed || ![
			"asset_cup",
			"asset_beans",
			"asset_nisshoku_logo"
		].includes(asset.id)).map(migrateAssetRecord);
		if (legacySeed && !assets.some((asset) => asset.id === SEED_ASSETS[0]?.id)) assets.unshift(...SEED_ASSETS);
		const projects = (p.projects ?? current.projects).map(migrateProject);
		return {
			...current,
			...p,
			brands,
			assets,
			projects,
			lastProjectId: p.lastProjectId ?? projects[0]?.id ?? current.lastProjectId
		};
	},
	migrate: (persisted) => {
		const state = persisted;
		const legacySeed = state.brands?.some((brand) => brand.id === "brand_nisshoku" && brand.name === "日食咖啡") ?? false;
		const brands = (state.brands ?? []).map(migrateBrandRecord);
		const assets = (state.assets ?? []).filter((asset) => !legacySeed || ![
			"asset_cup",
			"asset_beans",
			"asset_nisshoku_logo"
		].includes(asset.id)).map(migrateAssetRecord);
		if (legacySeed && !assets.some((asset) => asset.id === SEED_ASSETS[0]?.id)) assets.unshift(...SEED_ASSETS);
		const projects = (state.projects ?? []).map(migrateProject);
		return {
			brands,
			assets,
			projects,
			lastProjectId: state.lastProjectId ?? projects[0]?.id ?? null
		};
	}
}));
function activeArtboard(project) {
	const pages = pagesOf(project);
	if (!pages.length) return void 0;
	return pages[Math.min(project.slideIndex ?? 0, pages.length - 1)];
}
function resolveProjectId(preferred) {
	const { projects, lastProjectId } = useStudio.getState();
	if (preferred && projects.some((p) => p.id === preferred)) return preferred;
	if (lastProjectId && projects.some((p) => p.id === lastProjectId)) return lastProjectId;
	return projects[0]?.id ?? null;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-[color,background-color,box-shadow,opacity,transform] duration-150 ease-out active:not-disabled:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring/40", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:bg-accent/90",
			secondary: "bg-surface text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "text-fg hover:bg-surface-2",
			outline: "border border-border bg-transparent text-fg hover:bg-surface-2",
			danger: "bg-danger text-accent-fg hover:bg-danger/90",
			link: "text-accent underline-offset-4 hover:underline"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
//#endregion
export { logoUsageLabel as A, snapMove as B, cssFilter as C, formatsFromBrief as D, emptyBrief as E, pagesOf as F, textOverflows$1 as H, previewTemplate as I, resizeBox as L, migrateBrief as M, normalizeCrop as N, inspectProject as O, normalizeFilter as P, resolveProjectId as R, createTextLayer as S, cssTextShadow as T, usageLabel as U, sourceLabel as V, useStudio as W, createGeneratedAsset as _, Button as a, createLogoLayer as b, PAGE_ROLE_LABEL as c, activeArtboard as d, assetUsageStatus as f, collectUsedAssetIds as g, cn as h, ASSET_SOURCES as i, matchesAssetQuery as j, kindFromCategory as k, TEMPLATE_META as l, categoryLabel as m, ASSET_DRAG_MIME as n, DELIVERABLE_OPTIONS as o, buttonVariants as p, ASSET_NEED_LABEL as r, LOGO_USAGE as s, ASSET_CATEGORIES as t, TEMPLATE_STARTERS as u, createImageLayer as v, cssShadow as w, createShapeLayer as x, createLineLayer as y, rotateByPointer as z };
