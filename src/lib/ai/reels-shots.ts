import type { ReelsScript } from "../studio/types.ts";

export type ReelsShot = {
  startSec: number;
  endSec: number;
  caption: string;
  voice: string;
};

export function parseBeatSecond(value: string) {
  const n = Number.parseFloat(String(value).replace(/秒/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function wrapCaption(text: string, maxChars = 14, maxLines = 3) {
  const chars = [...text.replace(/\s+/g, " ").trim()];
  const lines: string[] = [];
  let cur = "";
  for (const ch of chars) {
    if (cur.length >= maxChars) {
      lines.push(cur);
      cur = ch;
      if (lines.length >= maxLines) break;
    } else {
      cur += ch;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

export function reelsShotsFromScript(script?: ReelsScript | null, hook?: string): ReelsShot[] {
  const fallback = (script?.hook || hook || "來坐一下").trim();
  const beats = script?.beats ?? [];
  const shots = beats
    .map((beat) => {
      const startSec = parseBeatSecond(beat.start);
      const endSec = Math.max(startSec + 0.5, parseBeatSecond(beat.end));
      return {
        startSec,
        endSec,
        caption: (beat.caption || fallback).trim(),
        voice: (beat.voice || beat.caption || fallback).trim(),
      };
    })
    .filter((shot) => shot.endSec > shot.startSec);
  if (shots.length) return clampShots(shots);
  return [{ startSec: 0, endSec: 8, caption: fallback, voice: fallback }];
}

function clampShots(shots: ReelsShot[]): ReelsShot[] {
  const max = 20;
  return shots
    .map((shot) => ({
      ...shot,
      endSec: Math.min(shot.endSec, max),
      startSec: Math.min(shot.startSec, max),
    }))
    .filter((shot) => shot.endSec - shot.startSec >= 0.4);
}

export function reelsDurationSec(shots: ReelsShot[]) {
  const end = Math.max(0, ...shots.map((shot) => shot.endSec));
  return Math.min(20, Math.max(3, end || 8));
}

export function shotAt(shots: ReelsShot[], t: number): ReelsShot {
  return shots.find((shot) => t >= shot.startSec && t < shot.endSec) ?? shots[shots.length - 1] ?? shots[0]!;
}

export function reelsEncodeSpec(shots: ReelsShot[]) {
  return {
    width: 1080,
    height: 1920,
    fps: 24,
    bitrate: 900_000,
    durationSec: reelsDurationSec(shots),
  };
}
