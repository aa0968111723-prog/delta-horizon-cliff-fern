export type PreparedImage = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  mime: "image/jpeg";
};

function readImage(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("無法讀取圖片"));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("圖片轉換失敗")), "image/jpeg", quality);
  });
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("圖片編碼失敗"));
    reader.readAsDataURL(blob);
  });
}

export async function prepareImageForAi(blob: Blob): Promise<PreparedImage> {
  const image = await readImage(blob);
  const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("瀏覽器無法處理這張圖片");
  context.fillStyle = "#f4f1ea";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const output = await canvasBlob(canvas, 0.8);
  return { blob: output, dataUrl: await blobToDataUrl(output), width, height, mime: "image/jpeg" };
}

export async function base64ImageToBlob(base64: string, mime: string) {
  const bytes = atob(base64);
  const data = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index += 1) data[index] = bytes.charCodeAt(index);
  return new Blob([data.buffer], { type: mime });
}

export async function sourceBlob(assetId: string, url?: string) {
  const { getAssetStorage } = await import("./asset-storage");
  const stored = await getAssetStorage().get(assetId);
  if (stored) return stored;
  if (!url) throw new Error("找不到這張素材的原始檔");
  const response = await fetch(url);
  if (!response.ok) throw new Error("無法讀取這張素材");
  return response.blob();
}
