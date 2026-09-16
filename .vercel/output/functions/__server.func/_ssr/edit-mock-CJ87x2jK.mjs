import { a as literal, c as string, i as discriminatedUnion, n as array, o as number, r as boolean, s as object, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/edit-mock-CJ87x2jK.js
var AlignModeSchema = _enum([
	"left",
	"center",
	"right",
	"top",
	"middle",
	"bottom",
	"safe-left",
	"safe-center",
	"safe-right",
	"safe-top",
	"safe-middle",
	"safe-bottom"
]);
var LayerPatchSchema = object({
	x: number().optional(),
	y: number().optional(),
	w: number().optional(),
	h: number().optional(),
	text: string().optional(),
	fontSize: number().optional(),
	color: string().optional(),
	align: _enum([
		"left",
		"center",
		"right"
	]).optional(),
	fill: string().optional(),
	opacity: number().optional(),
	hidden: boolean().optional(),
	brightness: number().optional(),
	contrast: number().optional(),
	saturate: number().optional(),
	assetId: string().optional()
});
var EditorActionSchema = discriminatedUnion("type", [
	object({
		type: literal("update-layer"),
		layerId: string(),
		patch: LayerPatchSchema,
		label: string().optional()
	}),
	object({
		type: literal("align-layer"),
		layerId: string(),
		mode: AlignModeSchema,
		label: string().optional()
	}),
	object({
		type: literal("delete-layer"),
		layerId: string(),
		label: string().optional()
	}),
	object({
		type: literal("add-text"),
		text: string(),
		name: string().optional(),
		role: _enum([
			"eyebrow",
			"headline",
			"subhead",
			"body",
			"cta",
			"handle",
			"custom"
		]).optional(),
		x: number().optional(),
		y: number().optional(),
		w: number().optional(),
		h: number().optional(),
		fontSize: number().optional(),
		align: _enum([
			"left",
			"center",
			"right"
		]).optional(),
		color: string().optional(),
		label: string().optional()
	}),
	object({
		type: literal("add-qr"),
		payload: string(),
		caption: string().optional(),
		x: number().optional(),
		y: number().optional(),
		size: number().optional(),
		label: string().optional()
	}),
	object({
		type: literal("replace-image"),
		layerId: string().optional(),
		prefer: _enum([
			"brighter",
			"people",
			"background",
			"other"
		]).optional(),
		assetId: string().optional(),
		label: string().optional()
	}),
	object({
		type: literal("set-background"),
		color: string().optional(),
		color2: string().optional(),
		label: string().optional()
	}),
	object({
		type: literal("set-format"),
		formatId: _enum([
			"feed-square",
			"feed-portrait",
			"feed-landscape",
			"story",
			"reels-cover"
		]),
		label: string().optional()
	}),
	object({
		type: literal("apply-template"),
		templateId: _enum([
			"editorial",
			"product",
			"offer",
			"quote"
		]),
		label: string().optional()
	}),
	object({
		type: literal("set-copy"),
		patch: object({
			eyebrow: string().optional(),
			headline: string().optional(),
			subhead: string().optional(),
			body: string().optional(),
			cta: string().optional()
		}),
		label: string().optional()
	}),
	object({
		type: literal("whitespace"),
		amount: _enum(["more", "less"]),
		label: string().optional()
	}),
	object({
		type: literal("layout-versions"),
		count: number().min(2).max(4).optional(),
		label: string().optional()
	}),
	object({
		type: literal("select"),
		layerId: string().nullable(),
		label: string().optional()
	})
]);
var EditPlanSchema = object({
	summary: string(),
	risk: _enum(["small", "large"]).optional(),
	actions: array(EditorActionSchema).max(24),
	notes: array(string()).max(12).optional()
});
function actionLabel(action) {
	if (action.label) return action.label;
	switch (action.type) {
		case "update-layer": return "調整圖層";
		case "align-layer": return "對齊圖層";
		case "delete-layer": return "刪除圖層";
		case "add-text": return `新增文字「${action.text.slice(0, 12)}」`;
		case "add-qr": return "新增報名 QR";
		case "replace-image": return "更換圖片";
		case "set-background": return "改背景色";
		case "set-format": return "切換尺寸";
		case "apply-template": return "套用版型";
		case "set-copy": return "改文案";
		case "whitespace": return action.amount === "more" ? "增加留白" : "收緊留白";
		case "layout-versions": return "產生多個排版版本";
		case "select": return "選取圖層";
	}
}
function riskOf(actions) {
	if (actions.some((a) => a.type === "layout-versions" || a.type === "apply-template")) return "large";
	if (actions.filter((a) => a.type === "delete-layer").length >= 2) return "large";
	const styleHits = actions.filter((a) => a.type === "update-layer" || a.type === "set-background" || a.type === "set-copy" || a.type === "whitespace").length;
	if (actions.length >= 7) return "large";
	if (styleHits >= 5) return "large";
	return "small";
}
var UNRECOGNIZED_SUMMARY = "無法對應到畫布操作";
function compact(command) {
	return command.replace(/\s+/g, "").toLowerCase();
}
function headlineLayer(scene) {
	const selected = scene.layers.find((l) => l.id === scene.selectedId && l.type === "text");
	if (selected?.role === "headline" || selected && /標題|headline/i.test(selected.name)) return selected;
	return scene.layers.find((l) => l.type === "text" && l.role === "headline") ?? scene.layers.find((l) => l.type === "text" && /標題|headline/i.test(l.name)) ?? scene.layers.filter((l) => l.type === "text" && !l.hidden).slice().sort((a, b) => (b.fontSize ?? 0) - (a.fontSize ?? 0))[0];
}
function imageLayer(scene) {
	const selected = scene.layers.find((l) => l.id === scene.selectedId && l.type === "image");
	if (selected && selected.w * selected.h >= 4e4) return selected;
	return scene.layers.filter((l) => l.type === "image" && !l.hidden).slice().sort((a, b) => b.w * b.h - a.w * a.h)[0];
}
function photoAsset(scene, excludeId) {
	const pool = scene.assets.filter((a) => a.id !== excludeId && a.kind !== "logo" && a.category !== "logo" && a.category !== "icon");
	return pool.find((a) => a.category === "photo") ?? pool.find((a) => a.category === "people") ?? pool.find((a) => a.category === "background") ?? pool[0];
}
function color(scene, role, fallback) {
	return scene.brand.colors.find((c) => c.role === role)?.hex ?? fallback;
}
function plan(summary, actions, notes = []) {
	return {
		summary,
		actions,
		notes,
		risk: riskOf(actions)
	};
}
function headlineUpCenter(scene) {
	const layer = headlineLayer(scene);
	if (!layer) return plan("找不到標題圖層", [], ["畫布上沒有標題可調整。"]);
	const size = Math.min(120, Math.round((layer.fontSize ?? 64) * 1.28));
	const lines = Math.max(1, (layer.text ?? "").split("\n").length);
	const h = Math.round(size * 1.2 * lines + 20);
	const w = Math.min(scene.width - 96, Math.max(layer.w, Math.round(scene.width * .82)));
	return plan("放大標題並移到上方中央", [
		{
			type: "update-layer",
			layerId: layer.id,
			patch: {
				fontSize: size,
				h,
				w,
				align: "center"
			},
			label: `標題字級改為 ${size}`
		},
		{
			type: "align-layer",
			layerId: layer.id,
			mode: "safe-center",
			label: "標題水平置中"
		},
		{
			type: "align-layer",
			layerId: layer.id,
			mode: "safe-top",
			label: "標題移到上方"
		},
		{
			type: "select",
			layerId: layer.id
		}
	]);
}
function brighterPhoto(scene) {
	const layer = imageLayer(scene);
	if (!layer) return plan("找不到照片", [], ["這頁沒有圖片圖層。"]);
	const other = photoAsset(scene, layer.assetId);
	const actions = [{
		type: "replace-image",
		layerId: layer.id,
		prefer: "brighter",
		assetId: other?.id,
		label: other ? `換成「${other.name}」並提高亮度` : "提高目前照片亮度"
	}];
	return plan(other ? `換成較明亮的「${other.name}」` : "提高目前照片亮度", actions);
}
function livelyStyle(scene) {
	const accent = color(scene, "accent", "#B85C38");
	const bg = color(scene, "background", "#F4E6D4");
	const headline = headlineLayer(scene);
	const image = imageLayer(scene);
	const cta = scene.layers.find((l) => l.type === "text" && l.role === "cta");
	const actions = [{
		type: "set-background",
		color: bg,
		color2: accent,
		label: "背景加入活潑點綴色"
	}];
	if (headline) {
		const size = Math.min(112, Math.round((headline.fontSize ?? 64) * 1.12));
		actions.push({
			type: "update-layer",
			layerId: headline.id,
			patch: {
				fontSize: size,
				color: color(scene, "ink", "#1A1814"),
				align: "center"
			},
			label: "標題加大、語氣更醒目"
		});
	}
	if (image) actions.push({
		type: "update-layer",
		layerId: image.id,
		patch: {
			brightness: 1.16,
			saturate: 1.18,
			contrast: 1.06
		},
		label: "照片提高明度與飽和"
	});
	if (cta) actions.push({
		type: "update-layer",
		layerId: cta.id,
		patch: {
			text: scene.brand.ctas[1] || scene.brand.ctas[0] || "立刻報名",
			fontSize: Math.max(cta.fontSize ?? 28, 32)
		},
		label: "CTA 改成更直接的行動"
	});
	actions.push({
		type: "set-copy",
		patch: { cta: scene.brand.ctas[1] || scene.brand.ctas[0] || scene.copy.cta },
		label: "同步文案 CTA"
	});
	return plan("改成校園活動較活潑的視覺節奏", actions, ["維持品牌色，不使用禁用詞。"]);
}
function toStory(scene) {
	if (scene.formatId === "story") return plan("已經是限時動態尺寸", [], ["目前就是 9:16，沒有切換。"]);
	return plan("轉成限時動態 9:16", [{
		type: "set-format",
		formatId: "story",
		label: "切換為限時動態尺寸"
	}]);
}
function deleteBottomLeft(scene) {
	const hits = scene.layers.filter((l) => {
		if (l.locked || l.hidden) return false;
		const cx = l.x + l.w / 2;
		const cy = l.y + l.h / 2;
		if (cx > scene.width * .5) return false;
		if (cy < scene.height * .58) return false;
		if (l.type === "image" && l.w > scene.width * .65) return false;
		return true;
	});
	if (!hits.length) return plan("左下角沒有可刪的資訊", [], ["沒有位於左下的文字或小物件。"]);
	return plan(`刪除左下角 ${hits.length} 個物件`, hits.map((l) => ({
		type: "delete-layer",
		layerId: l.id,
		label: `刪除「${l.name}」`
	})));
}
function addDateAndQr(scene) {
	const date = scene.brief.schedule.trim() || "活動日期見內文";
	const payload = scene.brand.website.trim() || scene.brand.handle || scene.brief.eventName || "signup";
	const size = 196;
	const x = scene.width - 72 - size;
	const y = scene.height - 72 - size - 48;
	return plan("加上活動日期與報名 QR", [{
		type: "add-text",
		name: "活動日期",
		role: "custom",
		text: date,
		x: 72,
		y: scene.height - 140,
		w: 520,
		h: 64,
		fontSize: 28,
		align: "left",
		label: `新增日期「${date}」`
	}, {
		type: "add-qr",
		payload,
		caption: "掃碼報名",
		x,
		y,
		size,
		label: "新增報名 QR"
	}]);
}
function moreWhitespace() {
	return plan("拉開邊界、減少擁擠資訊", [{
		type: "whitespace",
		amount: "more",
		label: "增加留白"
	}]);
}
function threeLayouts() {
	return plan("產生三個不同排版版本", [{
		type: "layout-versions",
		count: 3,
		label: "存成排版 A／B／C 供比較"
	}]);
}
function fallback(command, scene) {
	const q = compact(command);
	if (/刪除|拿掉|去掉/.test(q) && scene.selectedId) {
		const layer = scene.layers.find((l) => l.id === scene.selectedId);
		if (layer && !layer.locked) return plan(`刪除選取的「${layer.name}」`, [{
			type: "delete-layer",
			layerId: layer.id,
			label: `刪除「${layer.name}」`
		}]);
	}
	if (/置中|居中/.test(q)) {
		const layer = scene.layers.find((l) => l.id === scene.selectedId) ?? headlineLayer(scene);
		if (layer) return plan("選取物件水平置中", [{
			type: "align-layer",
			layerId: layer.id,
			mode: "safe-center",
			label: `「${layer.name}」置中`
		}]);
	}
	return plan(UNRECOGNIZED_SUMMARY, [], ["請說具體動作，例如：把標題放大並移到上方中央。"]);
}
function isRecognizedPlan(plan) {
	return plan.summary !== UNRECOGNIZED_SUMMARY;
}
function interpretMock(command, scene) {
	const q = compact(command);
	if (!q) return plan("請先輸入要對畫布做的事", [], ["空白指令不會改畫布。"]);
	if (/標題/.test(q) && (/放大|變大|加大/.test(q) || /中央|置中|上方/.test(q)) || /放大.*標題/.test(q)) return headlineUpCenter(scene);
	if (/換|改成|換成/.test(q) && /圖|照片|相片/.test(q) || /明亮/.test(q)) return brighterPhoto(scene);
	if (/淡江|活潑|學生/.test(q)) return livelyStyle(scene);
	if (/限時|限動|story|9:16|9／16|9\/16/.test(q)) return toStory(scene);
	if (/刪除|拿掉|去掉/.test(q) && /左下|資訊/.test(q)) return deleteBottomLeft(scene);
	if (/qr|qrcode|報名/.test(q) || /日期/.test(q) && /加|增|放/.test(q)) return addDateAndQr(scene);
	if (/留白|呼吸|疏朗|不要太滿|空一點/.test(q)) return moreWhitespace();
	if (/三個|3個|三版|不同排版|幾個版本|多個版本/.test(q)) return threeLayouts();
	return fallback(command, scene);
}
//#endregion
export { riskOf as a, isRecognizedPlan as i, actionLabel as n, interpretMock as r, EditPlanSchema as t };
