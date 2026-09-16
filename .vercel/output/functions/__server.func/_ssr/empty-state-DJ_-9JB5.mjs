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
		audience: "",
		goal: "awareness",
		features: "",
		style: "",
		notes: "",
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
function textOverflows(layer) {
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
var SEED_BRAND_ID = "brand_nisshoku";
var SEED_PROJECT_ID = "proj_yirgacheffe";
var SEED_DRAFT_ID = "proj_weekend_pour";
var SEED_LOGO_ID = "asset_nisshoku_logo";
var SEED_CUP_ID = "asset_cup";
var SEED_BEANS_ID = "asset_beans";
var SEED_TIME = Date.parse("2026-09-01T00:00:00+08:00");
var SEED_ASSETS = [
	{
		id: SEED_LOGO_ID,
		name: "日食標誌",
		kind: "logo",
		category: "logo",
		mime: "image/svg+xml",
		width: 80,
		height: 80,
		tags: [
			"logo",
			"品牌",
			"圖標"
		],
		createdAt: SEED_TIME,
		updatedAt: SEED_TIME,
		seedSrc: "/seed/nisshoku-mark.svg",
		source: "seed",
		licenseNotes: "品牌自有標誌，僅限日食咖啡網宣使用。",
		licenseOwner: "日食咖啡",
		favorite: true,
		lastUsedAt: SEED_TIME,
		useCount: 2
	},
	{
		id: SEED_CUP_ID,
		name: "手沖杯",
		kind: "image",
		category: "photo",
		mime: "image/jpeg",
		width: 1408,
		height: 1408,
		tags: [
			"商品",
			"咖啡",
			"活動"
		],
		createdAt: SEED_TIME,
		updatedAt: SEED_TIME,
		seedSrc: "/seed/cup.jpg",
		source: "seed",
		licenseNotes: "店內拍攝，可商用。請保留杯緣完整，勿加浮水印。",
		licenseOwner: "日食咖啡",
		favorite: true,
		lastUsedAt: SEED_TIME,
		useCount: 1
	},
	{
		id: SEED_BEANS_ID,
		name: "烘焙豆",
		kind: "image",
		category: "background",
		mime: "image/jpeg",
		width: 1408,
		height: 1408,
		tags: [
			"素材",
			"咖啡",
			"背景"
		],
		createdAt: SEED_TIME,
		updatedAt: SEED_TIME,
		seedSrc: "/seed/beans.jpg",
		source: "seed",
		licenseNotes: "店內拍攝，可作背景或商品圖。",
		licenseOwner: "日食咖啡",
		favorite: false,
		lastUsedAt: Date.parse("2026-09-03T10:00:00+08:00"),
		useCount: 1
	}
];
var SEED_BRAND = {
	id: SEED_BRAND_ID,
	name: "日食咖啡",
	handle: "@nisshoku.coffee",
	website: "nisshoku.coffee",
	voice: "沉靜、精準、不賣弄。像一位熟悉豆性的烘豆師在櫃檯輕聲說話。",
	doSay: "單品、產地、處理法、風味描述、手沖、當季",
	dontSay: "最便宜、爆款、網紅、限時瘋搶",
	forbiddenWords: [
		"便宜",
		"爆款",
		"錯過就沒有"
	],
	colors: [
		{
			id: "c1",
			hex: "#2C1810",
			role: "primary",
			label: "深焙"
		},
		{
			id: "c2",
			hex: "#3D4F3A",
			role: "secondary",
			label: "葉影"
		},
		{
			id: "c3",
			hex: "#F4E6D4",
			role: "background",
			label: "亞麻"
		},
		{
			id: "c4",
			hex: "#B85C38",
			role: "accent",
			label: "赤陶"
		},
		{
			id: "c5",
			hex: "#2C1810",
			role: "ink",
			label: "墨"
		}
	],
	fontDisplay: "Noto Serif TC",
	fontBody: "Noto Sans TC",
	logoAssetId: SEED_LOGO_ID,
	logos: [{
		id: "logo_nisshoku_primary",
		name: "主標誌",
		assetId: SEED_LOGO_ID,
		usage: "primary"
	}, {
		id: "logo_nisshoku_mark",
		name: "圖標",
		assetId: SEED_LOGO_ID,
		usage: "mark"
	}],
	slogans: ["這個月只烘一個產地。", "喝完就換豆。"],
	ctas: [
		"查看風味",
		"到店手沖",
		"帶一包回家"
	],
	imageStyle: {
		mood: "沉靜、暖光、留白",
		lighting: "窗邊自然光或柔和側光，避免硬閃與過飽和濾鏡",
		paletteHint: "亞麻、深焙褐、赤陶點綴",
		composition: "商品置中或上半，下半留白給標題",
		do: "手沖、豆、器皿特寫、櫃上光線、手的局部",
		dont: "霓虹、過度濾鏡、擁擠桌面、網紅姿勢、浮水印"
	},
	rules: {
		noCompetitorMarks: true,
		noWatermark: true,
		noLowRes: true,
		notes: "Logo 不壓在杯緣；價格不進主畫面。"
	},
	boilerplate: {
		...emptyBoilerplate(),
		cta: "查看風味",
		disclaimer: "風味因烘焙批次略有差異。",
		hashtags: ["#日食咖啡", "#單品咖啡"],
		captionClose: "歡迎到店手沖，或帶一包回家。"
	},
	updatedAt: SEED_TIME
};
var copy = {
	eyebrow: "SEPTEMBER SINGLE ORIGIN",
	headline: "衣索比亞\n水洗耶加雪菲",
	subhead: "茉莉、佛手柑、蜂蜜尾韻。\n九月櫃上，限量烘焙。",
	body: "海拔 2,100 公尺的小農批次，水洗處理，淺中焙。建議手沖 92°C、1:16。",
	cta: "查看風味",
	handle: "@nisshoku.coffee",
	caption: "九月單品：衣索比亞水洗耶加雪菲。\n茉莉、佛手柑，尾段是乾淨的蜂蜜甜。\n櫃上只放一個批次，喝完就換豆。\n歡迎到店手沖，或帶一包回家。",
	hashtags: [
		"#日食咖啡",
		"#耶加雪菲",
		"#單品咖啡",
		"#手沖",
		"#台北咖啡"
	],
	altText: "亞麻色桌面上手沖咖啡杯，旁有日食咖啡九月單品文案。"
};
function stabilize(layers, prefix) {
	return layers.map((layer, index) => ({
		...layer,
		id: `${prefix}${index}`
	}));
}
function createSeedProject() {
	const now = SEED_TIME;
	const page1 = buildLayout("feed-portrait", copy, SEED_BRAND, "product", { imageAssetId: SEED_CUP_ID });
	page1.layers = stabilize(page1.layers, "seed_ly_");
	page1.role = "cover";
	page1.templateId = "product";
	const page2 = buildLayout("feed-portrait", {
		...copy,
		eyebrow: "ISSUE",
		headline: "專程來一趟\n值不值得？",
		subhead: "受眾要的是可以相信的理由。",
		body: "不是更大聲的促銷，是這包豆值不值得出門。",
		cta: "查看風味"
	}, SEED_BRAND, "quote");
	page2.layers = stabilize(page2.layers, "seed_p2_ly_");
	page2.role = "problem";
	page2.templateId = "quote";
	const page3 = buildLayout("feed-portrait", {
		...copy,
		eyebrow: "FOCUS",
		headline: "茉莉 · 佛手柑\n蜂蜜尾韻",
		subhead: "淺中焙 · 水洗處理 · G1",
		body: "建議手沖 92°C、1:16，悶蒸 30 秒。",
		cta: "到店手沖"
	}, SEED_BRAND, "editorial", { imageAssetId: SEED_BEANS_ID });
	const line = {
		id: "seed_p3_line",
		name: "分隔線",
		type: "line",
		x: 72,
		y: 820,
		w: 220,
		h: 32,
		rotation: 0,
		opacity: 1,
		locked: false,
		hidden: false,
		fromLayout: false,
		stroke: "#B85C38",
		strokeWidth: 3,
		shadow: { ...DEFAULT_SHADOW }
	};
	page3.layers = [...stabilize(page3.layers, "seed_p3_ly_"), line];
	page3.role = "detail";
	page3.templateId = "editorial";
	const page4 = buildLayout("feed-portrait", {
		...copy,
		eyebrow: "PROOF",
		headline: "九月櫃上\n只放一批",
		subhead: "日食咖啡門市",
		body: "喝完就換豆。來的人通常會再帶一包回家。",
		cta: "查看地點"
	}, SEED_BRAND, "product", { imageAssetId: SEED_BEANS_ID });
	page4.layers = stabilize(page4.layers, "seed_p4_ly_");
	page4.role = "proof";
	page4.templateId = "product";
	const page5 = buildLayout("feed-portrait", {
		...copy,
		eyebrow: "NOW",
		headline: "到店手沖",
		subhead: "2026年9月櫃上 · 日食咖啡門市",
		body: "來的時候帶這則貼文即可。",
		cta: "到店手沖"
	}, SEED_BRAND, "offer");
	page5.layers = stabilize(page5.layers, "seed_p5_ly_");
	page5.role = "cta";
	page5.templateId = "offer";
	const page6 = buildLayout("feed-portrait", {
		...copy,
		eyebrow: "NOTE",
		headline: "這個月\n只烘一個產地。",
		subhead: "日食咖啡",
		body: "歡迎到店手沖，或帶一包回家。",
		cta: "查看風味"
	}, SEED_BRAND, "quote");
	page6.layers = stabilize(page6.layers, "seed_p6_ly_");
	page6.role = "close";
	page6.templateId = "quote";
	const slides = [
		page1,
		page2,
		page3,
		page4,
		page5,
		page6
	];
	const brief = migrateBrief({
		product: "衣索比亞水洗耶加雪菲 淺中焙",
		eventName: "九月單品・耶加雪菲",
		schedule: "2026年9月櫃上",
		location: "日食咖啡門市",
		offer: "九月櫃上單品，限量烘焙",
		audience: "在意產地與風味的都市咖啡愛好者",
		goal: "awareness",
		features: "水洗處理、茉莉與佛手柑、蜂蜜尾韻",
		style: "沉靜、留白、不促銷",
		notes: "不要用促銷口氣，強調批次與風味。",
		deliverables: {
			post: true,
			story: false,
			carousel: true,
			reels: false
		}
	});
	const plan = migratePlan({
		campaignName: "九月單品上市",
		concept: "把「這個月只烘一個產地」當成主軸，讓人專程為一杯耶加雪菲來店。",
		insight: "受眾要的不是折扣，而是「這包豆值不值得專程來」。",
		hook: "這個月只烘一個產地。",
		visualTheme: "沉靜暖光、亞麻底、商品置中，赤陶作眉題。",
		visualDirection: "上半商品攝影、下半亞麻底與大標，赤陶作眉題色。",
		templateId: "product",
		colorMood: "亞麻、深焙、赤陶",
		eyebrow: copy.eyebrow,
		headline: copy.headline,
		subhead: "茉莉、佛手柑、蜂蜜尾韻。",
		body: copy.body,
		cta: copy.cta,
		captions: [{
			style: "敘事",
			text: copy.caption
		}, {
			style: "短句",
			text: "茉莉、佛手柑、蜂蜜。九月，耶加雪菲。"
		}],
		hashtags: copy.hashtags,
		storyBeats: [
			"產地特寫",
			"風味三詞",
			"到店手沖邀請"
		],
		carouselPages: [
			{
				role: "cover",
				headline: copy.headline,
				subhead: "九月櫃上，限量烘焙",
				body: "這個月只烘一個產地。",
				cta: "查看風味",
				visualNote: "杯緣完整，Logo 不壓主體。",
				templateId: "product"
			},
			{
				role: "problem",
				headline: "專程來一趟\n值不值得？",
				subhead: "受眾要的是可以相信的理由。",
				body: "不是更大聲的促銷，是這包豆值不值得出門。",
				cta: "查看風味",
				visualNote: "痛點頁只留一句猶豫。",
				templateId: "quote"
			},
			{
				role: "detail",
				headline: "茉莉 · 佛手柑\n蜂蜜尾韻",
				subhead: "淺中焙 · 水洗處理",
				body: "建議手沖 92°C、1:16。",
				cta: "到店手沖",
				visualNote: "豆面特寫或風味三詞。",
				templateId: "editorial"
			},
			{
				role: "proof",
				headline: "九月櫃上\n只放一批",
				subhead: "日食咖啡門市",
				body: "喝完就換豆。",
				cta: "查看地點",
				visualNote: "現場或物件證明值得出門。",
				templateId: "product"
			},
			{
				role: "cta",
				headline: "到店手沖",
				subhead: "2026年9月櫃上 · 門市",
				body: "來的時候帶這則貼文即可。",
				cta: "到店手沖",
				visualNote: "只留時間、地點、CTA。",
				templateId: "offer"
			},
			{
				role: "close",
				headline: "這個月\n只烘一個產地。",
				subhead: "日食咖啡",
				body: "歡迎到店手沖，或帶一包回家。",
				cta: "查看風味",
				visualNote: "結尾可截圖分享。",
				templateId: "quote"
			}
		],
		assetNeeds: [
			{
				kind: "photo",
				title: "手沖杯主視覺",
				detail: "窗邊自然光，保留杯緣。",
				required: true
			},
			{
				kind: "logo",
				title: "日食標誌",
				detail: "淺底或透明版本。",
				required: true
			},
			{
				kind: "background",
				title: "烘焙豆",
				detail: "可作第二頁或背景。",
				required: false
			}
		],
		checklist: [
			"標題兩行以內，落在安全區",
			"時間（九月）有出現",
			"CTA 可讀",
			"沒用禁用詞",
			"Logo 沒壓到杯緣"
		],
		altText: copy.altText,
		qaNotes: ["避免把價格放上主畫面", "Logo 放右下，不要壓到杯緣"],
		generatedAt: now,
		source: "live"
	});
	return {
		id: SEED_PROJECT_ID,
		name: "九月單品・耶加雪菲",
		createdAt: now,
		updatedAt: now,
		brandId: SEED_BRAND_ID,
		templateId: "product",
		activeFormatId: "feed-portrait",
		status: "ready",
		brief,
		copy,
		plan,
		artboards: { "feed-portrait": page1 },
		slides: { "feed-portrait": slides },
		slideIndex: 0,
		snapshots: [{
			id: "snap_seed_v1",
			name: "初稿 · 六頁輪播",
			createdAt: now,
			kind: "manual",
			formatId: "feed-portrait",
			slideIndex: 0,
			artboard: structuredClone(page1),
			pages: structuredClone(slides)
		}],
		planVersions: migratePlanVersions(void 0, plan),
		exports: []
	};
}
function createSeedDraft() {
	const now = Date.parse("2026-09-03T10:00:00+08:00");
	const draftCopy = {
		eyebrow: "WEEKEND",
		headline: "週末手沖",
		subhead: "兩人座，預約制。",
		body: "",
		cta: "預約席次",
		handle: "@nisshoku.coffee",
		caption: "",
		hashtags: ["#日食咖啡"],
		altText: ""
	};
	const artboard = buildLayout("story", draftCopy, SEED_BRAND, "offer", { imageAssetId: SEED_BEANS_ID });
	artboard.layers = artboard.layers.map((layer, index) => ({
		...layer,
		id: `seed_draft_ly_${index}`
	}));
	return {
		id: SEED_DRAFT_ID,
		name: "週末限時・手沖體驗",
		createdAt: now,
		updatedAt: now,
		brandId: SEED_BRAND_ID,
		templateId: "offer",
		activeFormatId: "story",
		status: "draft",
		brief: migrateBrief({
			product: "週末手沖體驗席",
			eventName: "週末手沖體驗",
			schedule: "週末午后",
			location: "日食咖啡",
			offer: "兩人座，預約制",
			audience: "想慢慢喝一杯的附近住戶",
			goal: "traffic",
			features: "兩人座、預約制",
			style: "安靜、不催促",
			notes: "尚未定標題層級，先當草稿。",
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
createSeedProject();
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
	version: 6,
	partialize: (s) => ({
		brands: s.brands,
		assets: s.assets,
		projects: s.projects,
		lastProjectId: s.lastProjectId
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		const brands = (p.brands ?? current.brands).map(migrateBrandRecord);
		const assets = (p.assets ?? current.assets).map(migrateAssetRecord);
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
		const brands = (state.brands ?? []).map(migrateBrandRecord);
		const assets = (state.assets ?? []).map(migrateAssetRecord);
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
function EmptyState({ icon: Icon, title, description, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center rounded-2xl bg-surface px-6 py-14 text-center shadow-[var(--shadow-border)]", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-11 items-center justify-center rounded-lg bg-surface-2 text-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 font-display text-xl tracking-tight",
				children: title
			}),
			description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-sm text-sm text-muted",
				children: description
			}) : null,
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: action
			}) : null
		]
	});
}
function LoadingState({ label = "載入中…" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-6 animate-spin rounded-full border-2 border-border-strong border-t-accent" }), label]
	});
}
function ErrorState({ title = "出了一點問題", message, onRetry }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-surface px-5 py-8 text-center shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-danger",
				children: message
			}),
			onRetry ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-5",
				variant: "secondary",
				onClick: onRetry,
				children: "再試一次"
			}) : null
		]
	});
}
//#endregion
export { formatsFromBrief as A, resolveProjectId as B, createLogoLayer as C, cssShadow as D, cssFilter as E, normalizeCrop as F, usageLabel as G, snapMove as H, normalizeFilter as I, useStudio as K, pagesOf as L, logoUsageLabel as M, matchesAssetQuery as N, cssTextShadow as O, migrateBrief as P, previewTemplate as R, createLineLayer as S, createTextLayer as T, sourceLabel as U, rotateByPointer as V, textOverflows as W, categoryLabel as _, Button as a, createGeneratedAsset as b, ErrorState as c, PAGE_ROLE_LABEL as d, TEMPLATE_META as f, buttonVariants as g, assetUsageStatus as h, ASSET_SOURCES as i, kindFromCategory as j, emptyBrief as k, LOGO_USAGE as l, activeArtboard as m, ASSET_DRAG_MIME as n, DELIVERABLE_OPTIONS as o, TEMPLATE_STARTERS as p, ASSET_NEED_LABEL as r, EmptyState as s, ASSET_CATEGORIES as t, LoadingState as u, cn as v, createShapeLayer as w, createImageLayer as x, collectUsedAssetIds as y, resizeBox as z };
