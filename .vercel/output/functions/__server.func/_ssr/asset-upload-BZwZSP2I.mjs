//#region node_modules/.nitro/vite/services/ssr/assets/asset-upload-BZwZSP2I.js
var ASSET_LIMITS = {
	maxBytes: 8388608,
	maxDimension: 1600,
	allowedMimes: [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"image/svg+xml"
	]
};
var AssetUploadError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "AssetUploadError";
		this.code = code;
	}
};
var EXT_MIME = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
	gif: "image/gif",
	svg: "image/svg+xml"
};
function mimeOfFile(file) {
	if (file.type && file.type !== "application/octet-stream") return file.type;
	return EXT_MIME[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? file.type ?? "";
}
function formatBytes(n) {
	if (n < 1024) return `${n} B`;
	if (n < 1048576) return `${Math.round(n / 102.4) / 10} KB`;
	return `${Math.round(n / 1024 / 102.4) / 10} MB`;
}
function validateAssetFile(file) {
	if (!file || file.size === 0) return new AssetUploadError("empty", `${file?.name || "檔案"} 是空的，無法上傳。`);
	if (file.size > ASSET_LIMITS.maxBytes) return new AssetUploadError("too-large", `${file.name} 超過 ${formatBytes(ASSET_LIMITS.maxBytes)}（目前 ${formatBytes(file.size)}）。請先壓縮再上傳。`);
	const mime = mimeOfFile(file);
	if (!ASSET_LIMITS.allowedMimes.includes(mime)) return new AssetUploadError("format", `${file.name} 不是支援的圖片格式。請使用 JPG、PNG、WebP、GIF 或 SVG。`);
	return null;
}
function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new AssetUploadError("load-fail", "無法讀取圖片，檔案可能已損壞或格式不完整。"));
		img.src = url;
	});
}
async function decodeAssetImage(file) {
	const invalid = validateAssetFile(file);
	if (invalid) throw invalid;
	const mime = mimeOfFile(file);
	const url = URL.createObjectURL(file);
	try {
		const img = await loadImage(url);
		const srcW = Math.max(1, img.naturalWidth || img.width || 0);
		const srcH = Math.max(1, img.naturalHeight || img.height || 0);
		if (!srcW || !srcH) throw new AssetUploadError("preview-fail", `${file.name} 無法產生預覽（尺寸為 0）。`);
		if (mime === "image/svg+xml") return {
			blob: file,
			width: srcW,
			height: srcH,
			mime
		};
		const scale = Math.min(1, ASSET_LIMITS.maxDimension / Math.max(srcW, srcH));
		const width = Math.max(1, Math.round(srcW * scale));
		const height = Math.max(1, Math.round(srcH * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new AssetUploadError("preview-fail", "無法壓縮圖片。");
		ctx.drawImage(img, 0, 0, width, height);
		const outMime = mime === "image/png" || mime === "image/webp" || mime === "image/gif" ? "image/png" : "image/jpeg";
		const blob = await new Promise((resolve) => canvas.toBlob(resolve, outMime, .86));
		if (!blob) throw new AssetUploadError("preview-fail", `${file.name} 預覽處理失敗。`);
		return {
			blob,
			width,
			height,
			mime: outMime
		};
	} catch (err) {
		if (err instanceof AssetUploadError) throw err;
		throw new AssetUploadError("load-fail", `${file.name} 無法讀取圖片。`);
	} finally {
		URL.revokeObjectURL(url);
	}
}
//#endregion
export { decodeAssetImage as n, AssetUploadError as t };
