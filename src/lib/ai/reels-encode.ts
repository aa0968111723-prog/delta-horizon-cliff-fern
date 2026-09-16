import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { blobFromBase64, bytesToBase64 } from "../studio/bytes.ts";
import type { ReelsScript } from "../studio/types.ts";
import { reelsEncodeSpec, reelsShotsFromScript, shotAt, wrapCaption, type ReelsShot } from "./reels-shots.ts";

export type EncodedReels = {
  base64: string;
  mime: "video/mp4";
  durationSec: number;
  width: number;
  height: number;
};

export async function canEncodeReels() {
  if (typeof VideoEncoder === "undefined" || typeof VideoFrame === "undefined") return false;
  try {
    const support = await VideoEncoder.isConfigSupported({
      codec: "avc1.42001f",
      width: 1080,
      height: 1920,
      bitrate: 900_000,
      avc: { format: "avc" },
      framerate: 24,
    });
    return Boolean(support.supported);
  } catch {
    return false;
  }
}

function sourceSize(poster: CanvasImageSource, fallbackW: number, fallbackH: number) {
  if (poster instanceof ImageBitmap || poster instanceof HTMLImageElement || poster instanceof HTMLCanvasElement) {
    return { w: poster.width, h: poster.height };
  }
  return { w: fallbackW, h: fallbackH };
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  poster: CanvasImageSource,
  t: number,
  shot: ReelsShot,
  width: number,
  height: number,
) {
  const start = shot.startSec;
  const span = Math.max(0.4, shot.endSec - start);
  const local = Math.min(1, Math.max(0, (t - start) / span));
  const scale = 1.02 + local * 0.05;
  const { w: srcW, h: srcH } = sourceSize(poster, width, height);
  const srcRatio = srcW / Math.max(1, srcH);
  const dstRatio = width / height;
  let dw = width * scale;
  let dh = height * scale;
  if (srcRatio > dstRatio) {
    dw = height * scale * srcRatio;
    dh = height * scale;
  } else {
    dw = width * scale;
    dh = (width * scale) / srcRatio;
  }
  ctx.fillStyle = "#141c18";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(poster, (width - dw) / 2, (height - dh) / 2, dw, dh);
  const fade = ctx.createLinearGradient(0, height * 0.58, 0, height);
  fade.addColorStop(0, "rgba(20, 28, 24, 0)");
  fade.addColorStop(1, "rgba(20, 28, 24, 0.72)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);
  const lines = wrapCaption(shot.caption, 12, 3);
  ctx.fillStyle = "#fffaf4";
  ctx.textAlign = "center";
  ctx.font = "600 52px 'Iowan Old Style', 'Songti TC', serif";
  ctx.shadowColor = "rgba(20, 28, 24, 0.45)";
  ctx.shadowBlur = 12;
  const baseY = height - 280 - (lines.length - 1) * 64;
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, baseY + i * 64);
  });
  ctx.shadowBlur = 0;
}

export async function encodeReelsFromPng(
  pngBase64: string,
  script?: ReelsScript | null,
  hook?: string,
): Promise<EncodedReels | null> {
  if (!(await canEncodeReels())) return null;
  const shots = reelsShotsFromScript(script, hook);
  const spec = reelsEncodeSpec(shots);
  const blob = blobFromBase64(pngBase64, "image/png");
  const poster = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    poster.close();
    return null;
  }
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width: spec.width, height: spec.height, frameRate: spec.fps },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: () => undefined,
  });
  encoder.configure({
    codec: "avc1.42001f",
    width: spec.width,
    height: spec.height,
    bitrate: spec.bitrate,
    framerate: spec.fps,
    avc: { format: "avc" },
    latencyMode: "quality",
  });
  const total = Math.round(spec.durationSec * spec.fps);
  try {
    for (let i = 0; i < total; i++) {
      const t = i / spec.fps;
      coverDraw(ctx, poster, t, shotAt(shots, t), spec.width, spec.height);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round((i * 1e6) / spec.fps),
        duration: Math.round(1e6 / spec.fps),
      });
      encoder.encode(frame, { keyFrame: i % spec.fps === 0 });
      frame.close();
    }
    await encoder.flush();
    muxer.finalize();
  } catch {
    poster.close();
    encoder.close();
    return null;
  }
  encoder.close();
  poster.close();
  const buffer = target.buffer;
  if (!buffer?.byteLength) return null;
  return {
    base64: bytesToBase64(new Uint8Array(buffer)),
    mime: "video/mp4",
    durationSec: spec.durationSec,
    width: spec.width,
    height: spec.height,
  };
}
