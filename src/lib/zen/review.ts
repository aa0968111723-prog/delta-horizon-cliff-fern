import type { CopyPack } from "./types.ts";

export function applyStudentRewrite(pack: CopyPack): CopyPack {
  const rewrite = pack.studentReview.rewriteHook?.trim();
  if (!rewrite || rewrite === pack.hook) return pack;
  const previous = pack.hook;
  const swap = (text: string) => (text.includes(previous) ? text.replaceAll(previous, rewrite) : text);
  const notes = Array.isArray(pack.studentReview.notes) ? pack.studentReview.notes : [];
  return {
    ...pack,
    hook: rewrite,
    body: swap(pack.body),
    variants: pack.variants.map((row) => ({ ...row, text: swap(row.text) })),
    studentReview: {
      ...pack.studentReview,
      notes: notes.some((line) => line.includes(previous)) ? notes : [...notes, `原第一句：${previous}`],
    },
  };
}
