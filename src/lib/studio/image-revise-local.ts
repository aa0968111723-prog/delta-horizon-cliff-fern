import { CLUB_PALETTE } from "../zen/club.ts";

export type ReviseRatio = "4:5" | "1:1" | "9:16" | "1.91:1";

export type LocalReviseInput = {
  imageUrl: string;
  presetId: string;
  ratio: ReviseRatio;
};

export type LocalReviseResult = {
  dataUrl: string;
  adapter: "local";
  note: string;
};

export const RATIO_PX: Record<ReviseRatio, { w: number; h: number }> = {
  "4:5": { w: 1080, h: 1350 },
  "1:1": { w: 1080, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "1.91:1": { w: 1200, h: 628 },
};

/** 素材已經是目標 IG 尺寸時，做成限動／輪播不必再墊一層紙白。 */
export function alreadyFramedForRatio(
  asset: { tags: string[]; width: number; height: number } | undefined,
  ratio: ReviseRatio,
): boolean {
  if (!asset) return false;
  if (!asset.tags.includes(ratio)) return false;
  const size = RATIO_PX[ratio];
  return asset.width === size.w && asset.height === size.h;
}

/** 本機排版用的改版預設：限動留中間標題帶，方圖與橫式多留白。 */
export function presetForRatio(ratio: ReviseRatio): string {
  if (ratio === "9:16") return "story-space";
  if (ratio === "1:1" || ratio === "1.91:1") return "more-air";
  return "tku-life";
}

export type CoverRect = { x: number; y: number; w: number; h: number };

/** object-cover：圖等比放大後置中裁切。 */
export function coverRect(sw: number, sh: number, dw: number, dh: number): CoverRect {
  const scale = Math.max(dw / Math.max(1, sw), dh / Math.max(1, sh));
  const w = sw * scale;
  const h = sh * scale;
  return { x: (dw - w) / 2, y: (dh - h) / 2, w, h };
}

export type ReviseFrame = {
  pad: number;
  band: { y: number; h: number; alpha: number } | null;
  filter: string;
};

export function frameForPreset(presetId: string, ratio: ReviseRatio): ReviseFrame {
  if (presetId === "story-space" || ratio === "9:16") {
    return { pad: 0.07, band: { y: 0.36, h: 0.24, alpha: 0.78 }, filter: "none" };
  }
  if (presetId === "more-air") {
    return { pad: 0.16, band: null, filter: "contrast(0.9) brightness(1.06) saturate(0.92)" };
  }
  if (presetId === "less-religion") {
    return { pad: 0.11, band: { y: 0.74, h: 0.2, alpha: 0.9 }, filter: "saturate(0.82) brightness(1.05)" };
  }
  return { pad: 0.07, band: { y: 0.78, h: 0.16, alpha: 0.84 }, filter: "none" };
}

export const LOCAL_REVISE_NOTE = "本機改版只改構圖比例與留白，沒有改畫面內容。";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("讀不到這張圖"));
    img.src = src;
  });
}

/**
 * 沒有 Imagine 時的本機改版：把原圖依比例重構、加紙白留白，不生假畫面。
 */
export async function reviseImageLocal(input: LocalReviseInput): Promise<LocalReviseResult> {
  const size = RATIO_PX[input.ratio] ?? RATIO_PX["4:5"];
  const frame = frameForPreset(input.presetId, input.ratio);
  const img = await loadImage(input.imageUrl);
  const sw = img.naturalWidth || img.width || size.w;
  const sh = img.naturalHeight || img.height || size.h;
  const canvas = document.createElement("canvas");
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("這個環境沒辦法改構圖。");

  ctx.fillStyle = CLUB_PALETTE.paper;
  ctx.fillRect(0, 0, size.w, size.h);

  const padX = Math.round(size.w * frame.pad);
  const padY = Math.round(size.h * Math.min(frame.pad, 0.12));
  const innerW = size.w - padX * 2;
  const innerH = size.h - padY * 2;
  const cover = coverRect(sw, sh, innerW, innerH);

  ctx.save();
  ctx.beginPath();
  const radius = Math.round(Math.min(innerW, innerH) * 0.04);
  if (typeof ctx.roundRect === "function") ctx.roundRect(padX, padY, innerW, innerH, radius);
  else ctx.rect(padX, padY, innerW, innerH);
  ctx.clip();
  if (frame.filter !== "none") ctx.filter = frame.filter;
  ctx.drawImage(img, padX + cover.x, padY + cover.y, cover.w, cover.h);
  ctx.restore();

  if (frame.band) {
    const y = Math.round(size.h * frame.band.y);
    const h = Math.round(size.h * frame.band.h);
    ctx.globalAlpha = frame.band.alpha;
    ctx.fillStyle = CLUB_PALETTE.paper;
    ctx.fillRect(0, y, size.w, h);
    ctx.globalAlpha = 1;
    const lineY = y + h - 6;
    const third = (size.w - padX * 2) / 3;
    ctx.fillStyle = CLUB_PALETTE.warm;
    ctx.fillRect(padX, lineY, third - 6, 4);
    ctx.fillStyle = CLUB_PALETTE.clear;
    ctx.fillRect(padX + third, lineY, third - 6, 4);
    ctx.fillStyle = CLUB_PALETTE.night;
    ctx.fillRect(padX + third * 2, lineY, third, 4);
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    adapter: "local",
    note: LOCAL_REVISE_NOTE,
  };
}
