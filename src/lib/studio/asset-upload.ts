export const ASSET_LIMITS = {
  maxBytes: 8 * 1024 * 1024,
  maxDimension: 1600,
  allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"] as const,
};

export type AssetUploadCode = "format" | "too-large" | "load-fail" | "preview-fail" | "empty";

export class AssetUploadError extends Error {
  code: AssetUploadCode;
  constructor(code: AssetUploadCode, message: string) {
    super(message);
    this.name = "AssetUploadError";
    this.code = code;
  }
}

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export function mimeOfFile(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? file.type ?? "";
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 102.4) / 10} KB`;
  return `${Math.round(n / 1024 / 102.4) / 10} MB`;
}

export function validateAssetFile(file: File): AssetUploadError | null {
  if (!file || file.size === 0) {
    return new AssetUploadError("empty", `${file?.name || "檔案"} 是空的，無法上傳。`);
  }
  if (file.size > ASSET_LIMITS.maxBytes) {
    return new AssetUploadError(
      "too-large",
      `${file.name} 超過 ${formatBytes(ASSET_LIMITS.maxBytes)}（目前 ${formatBytes(file.size)}）。請先壓縮再上傳。`,
    );
  }
  const mime = mimeOfFile(file);
  if (!(ASSET_LIMITS.allowedMimes as readonly string[]).includes(mime)) {
    return new AssetUploadError(
      "format",
      `${file.name} 不是支援的圖片格式。請使用 JPG、PNG、WebP、GIF 或 SVG。`,
    );
  }
  return null;
}

export type DecodedAsset = {
  blob: Blob;
  width: number;
  height: number;
  mime: string;
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new AssetUploadError("load-fail", "無法讀取圖片，檔案可能已損壞或格式不完整。"));
    img.src = url;
  });
}

export async function decodeAssetImage(file: File): Promise<DecodedAsset> {
  const invalid = validateAssetFile(file);
  if (invalid) throw invalid;

  const mime = mimeOfFile(file);
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const srcW = Math.max(1, img.naturalWidth || img.width || 0);
    const srcH = Math.max(1, img.naturalHeight || img.height || 0);
    if (!srcW || !srcH) {
      throw new AssetUploadError("preview-fail", `${file.name} 無法產生預覽（尺寸為 0）。`);
    }

    if (mime === "image/svg+xml") {
      return { blob: file, width: srcW, height: srcH, mime };
    }

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
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outMime, 0.86),
    );
    if (!blob) throw new AssetUploadError("preview-fail", `${file.name} 預覽處理失敗。`);
    return { blob, width, height, mime: outMime };
  } catch (err) {
    if (err instanceof AssetUploadError) throw err;
    throw new AssetUploadError("load-fail", `${file.name} 無法讀取圖片。`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** @deprecated use decodeAssetImage */
export const readFileAsImage = decodeAssetImage;
