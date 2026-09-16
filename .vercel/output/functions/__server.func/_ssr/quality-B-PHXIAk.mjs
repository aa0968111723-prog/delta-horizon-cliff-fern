import { d as formatById } from "./schema-DPsPUDiS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quality-B-PHXIAk.js
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
function rectsOverlap(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function bgBehindText(artboard, layer) {
	return [...artboard.layers.filter((l) => {
		if (l.id === layer.id || l.hidden) return false;
		return artboard.layers.indexOf(l) < artboard.layers.indexOf(layer) && l.type === "shape";
	})].reverse().find((s) => s.fill !== "transparent" && rectsOverlap(s, layer))?.fill ?? artboard.background.color;
}
function inspectQuality(artboard, brand, copy) {
	const format = formatById(artboard.formatId);
	const issues = [];
	const texts = artboard.layers.filter((l) => l.type === "text" && !l.hidden);
	for (const t of texts) {
		const safe = format.safe;
		if (t.x < safe.left - 8 || t.y < safe.top - 8 || t.x + t.w > format.width - safe.right + 8 || t.y + t.h > format.height - safe.bottom + 8) issues.push({
			id: `safe-${t.id}`,
			severity: artboard.formatId === "story" || artboard.formatId === "reels-cover" ? "fail" : "warn",
			title: `${t.name} 超出安全區`,
			detail: `${format.name} 的 UI 可能遮住邊緣文字，請內縮至安全框內。`,
			layerId: t.id
		});
		const minSize = t.role === "headline" ? format.height >= 1920 ? 42 : 36 : format.height >= 1920 ? 24 : 20;
		if (t.fontSize < minSize) issues.push({
			id: `size-${t.id}`,
			severity: t.role === "headline" ? "fail" : "warn",
			title: `${t.name} 字級偏小`,
			detail: `目前 ${t.fontSize}px，建議至少 ${minSize}px（以 1080 寬為基準）。`,
			layerId: t.id
		});
		const bg = bgBehindText(artboard, t);
		const ratio = contrastRatio(t.color, bg);
		const need = t.fontSize >= 42 || t.fontWeight >= 600 ? 3 : 4.5;
		if (ratio !== null && ratio < need) issues.push({
			id: `contrast-${t.id}`,
			severity: ratio < 2.5 ? "fail" : "warn",
			title: `${t.name} 對比不足`,
			detail: `對比 ${ratio.toFixed(1)}:1，需達 ${need}:1。請調整文字或底色。`,
			layerId: t.id
		});
		if (t.x + t.w > format.width + 2 || t.y + t.h > format.height + 2 || t.x < -2 || t.y < -2) issues.push({
			id: `overflow-${t.id}`,
			severity: "fail",
			title: `${t.name} 超出畫布`,
			detail: "圖層部分落在畫布外，匯出時會被裁切。",
			layerId: t.id
		});
	}
	const brandHex = new Set(brand.colors.map((c) => c.hex.toUpperCase()));
	const used = /* @__PURE__ */ new Set();
	used.add(artboard.background.color.toUpperCase());
	for (const l of artboard.layers) {
		if (l.type === "shape" && l.fill !== "transparent") used.add(l.fill.toUpperCase());
		if (l.type === "text") used.add(l.color.toUpperCase());
	}
	if ([...brandHex].filter((h) => used.has(h)).length === 0) issues.push({
		id: "brand-color",
		severity: "warn",
		title: "未使用品牌色",
		detail: "畫布沒有套用品牌色票，畫面可能偏離規範。"
	});
	if (!artboard.layers.some((l) => l.type === "logo" && !l.hidden) && brand.logoAssetId) issues.push({
		id: "logo",
		severity: "warn",
		title: "缺少 Logo",
		detail: "品牌已設定標誌，但此畫布沒有 Logo 圖層。"
	});
	if (!texts.some((t) => t.role === "cta" && t.text.trim()) && !copy.cta.trim()) issues.push({
		id: "cta",
		severity: "warn",
		title: "缺少行動呼籲",
		detail: "網宣建議有明確 CTA，例如「了解菜單」或「限時預訂」。"
	});
	const fonts = new Set(texts.map((t) => t.fontFamily));
	if (fonts.size > 2) issues.push({
		id: "fonts",
		severity: "fail",
		title: "字型過多",
		detail: `目前使用 ${fonts.size} 種字型，品牌規範建議不超過 2 種。`
	});
	const caption = copy.caption ?? "";
	if (caption.length > 2200) issues.push({
		id: "caption-len",
		severity: "fail",
		title: "內文超過 Instagram 上限",
		detail: `目前 ${caption.length} 字，上限 2,200。`
	});
	else if (caption.length > 0 && caption.length < 40) issues.push({
		id: "caption-short",
		severity: "warn",
		title: "Caption 偏短",
		detail: "建議第一句完整說明賣點，再接補充與標籤。"
	});
	const tags = copy.hashtags.filter(Boolean);
	if (tags.length > 30) issues.push({
		id: "tags-max",
		severity: "fail",
		title: "Hashtag 超過 30 則",
		detail: "Instagram 單則上限 30 個標籤。"
	});
	else if (tags.length > 0 && tags.length < 5) issues.push({
		id: "tags-few",
		severity: "warn",
		title: "標籤偏少",
		detail: "建議 5–15 個精準標籤，避免堆砌熱門空標。"
	});
	const haystack = [
		copy.headline,
		copy.subhead,
		copy.body,
		copy.caption,
		copy.cta,
		copy.eyebrow
	].join("\n").toLowerCase();
	for (const word of brand.forbiddenWords ?? []) {
		const needle = word.trim().toLowerCase();
		if (needle && haystack.includes(needle)) issues.push({
			id: `forbid-${needle}`,
			severity: "fail",
			title: `文案含禁用詞「${word}」`,
			detail: brand.dontSay || "品牌規範禁止此用語，請改寫。"
		});
	}
	const images = artboard.layers.filter((l) => l.type === "image" && !l.hidden);
	for (const img of images) if (img.w < 320 || img.h < 320) issues.push({
		id: `img-small-${img.id}`,
		severity: brand.rules?.noLowRes ? "fail" : "warn",
		title: brand.rules?.noLowRes ? "素材解析偏低" : "圖片區塊過小",
		detail: brand.rules?.noLowRes ? "品牌規則要求避免低解析素材，請換成更大的主視覺。" : "主視覺面積偏低，Feed 縮圖可能難以辨識。",
		layerId: img.id
	});
	const aligned = texts.filter((t) => Math.abs(t.x - format.safe.left) < 3 || t.align === "center");
	if (texts.length >= 3 && aligned.length === 0) issues.push({
		id: "align",
		severity: "warn",
		title: "對齊不一致",
		detail: "文字未對齊安全區或置中軸，建議統一欄位。"
	});
	const fails = issues.filter((i) => i.severity === "fail").length;
	const warns = issues.filter((i) => i.severity === "warn").length;
	const score = Math.max(0, Math.min(100, 100 - fails * 16 - warns * 6));
	if (issues.length === 0) issues.push({
		id: "ok",
		severity: "pass",
		title: "通過基礎檢查",
		detail: "安全區、對比、字級與品牌色目前沒有明顯問題。仍請在實機預覽一次。"
	});
	return {
		score,
		issues
	};
}
//#endregion
export { inspectQuality as t };
