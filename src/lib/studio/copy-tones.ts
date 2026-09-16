import type { CopyPack, CopyTone, CopyVariant } from "./types.ts";

export const STUDENT_COPY_TONES = ["校園口語", "清楚資訊", "傳給朋友"] as const;
export const LEGACY_COPY_TONES = ["短版", "一般版", "感性版", "學生版", "生活版", "幽默版"] as const;
export const ALL_COPY_TONES = [...STUDENT_COPY_TONES, ...LEGACY_COPY_TONES] as const;

export type StudentCopyTone = (typeof STUDENT_COPY_TONES)[number];

export const COPY_TONE_HINT: Record<StudentCopyTone, string> = {
  校園口語: "像跟同學說話，先講淡江生活再帶活動。",
  清楚資訊: "時間、地點、怎麼來，一眼找得到。",
  傳給朋友: "短到可以貼進 LINE，對方看完知道要不要一起。",
};

export function isStudentCopyTone(tone: string): tone is StudentCopyTone {
  return (STUDENT_COPY_TONES as readonly string[]).includes(tone);
}

export function preferredCopyVariant(pack?: CopyPack | null): CopyVariant | undefined {
  if (!pack?.variants.length) return undefined;
  return (
    pack.variants.find((item) => item.tone === "校園口語")
    ?? pack.variants.find((item) => item.tone === "學生版")
    ?? pack.variants.find((item) => item.tone === "清楚資訊")
    ?? pack.variants[0]
  );
}

export function copyTonesOf(pack?: CopyPack | null): CopyTone[] {
  if (!pack?.variants.length) return [...STUDENT_COPY_TONES];
  const seen = new Set<CopyTone>();
  const ordered: CopyTone[] = [];
  for (const tone of STUDENT_COPY_TONES) {
    if (pack.variants.some((item) => item.tone === tone) && !seen.has(tone)) {
      seen.add(tone);
      ordered.push(tone);
    }
  }
  for (const item of pack.variants) {
    if (!seen.has(item.tone)) {
      seen.add(item.tone);
      ordered.push(item.tone);
    }
  }
  return ordered;
}
