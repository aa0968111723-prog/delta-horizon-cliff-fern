export function coverFit(srcW: number, srcH: number, destW: number, destH: number) {
  const scale = Math.max(destW / Math.max(1, srcW), destH / Math.max(1, srcH));
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (destW - dw) / 2, dy: (destH - dh) / 2, dw, dh };
}

export async function blobToDataUrl(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${blob.type || "image/jpeg"};base64,${btoa(binary)}`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load"));
    img.src = src;
  });
}

export async function rasterizeToJpeg(src: string, width: number, height: number) {
  if (typeof document === "undefined" || !src) return null;
  const destW = Math.max(40, Math.round(width));
  const destH = Math.max(40, Math.round(height));
  try {
    const img = await loadImage(src);
    const srcW = Math.max(1, img.naturalWidth || img.width);
    const srcH = Math.max(1, img.naturalHeight || img.height);
    const canvas = document.createElement("canvas");
    canvas.width = destW;
    canvas.height = destH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#F6F1E8";
    ctx.fillRect(0, 0, destW, destH);
    const fit = coverFit(srcW, srcH, destW, destH);
    ctx.drawImage(img, fit.dx, fit.dy, fit.dw, fit.dh);
    for (const quality of [0.88, 0.72, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;
      if (blob.size <= 900_000 || quality === 0.55) return blob.size <= 1_050_000 ? blob : null;
    }
    return null;
  } catch {
    return null;
  }
}
