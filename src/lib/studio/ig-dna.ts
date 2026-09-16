import type { BrandKit, Project } from "./types";

/**
 * Zen Club IG DNA：從社團自己做過的內容抽出習慣，
 * 讓 AI 生成新內容時優先參考自己的帳號，而不是一般品牌模板。
 *
 * 現在的來源是本機內容與品牌記憶；接上 Instagram 之後會再加入真實貼文與成效。
 */
export type IgDna = {
  captionLength: { min: number; max: number; avg: number };
  topHashtags: { tag: string; count: number }[];
  topCtas: { cta: string; count: number }[];
  kinds: { kind: string; count: number }[];
  colors: string[];
  hookStarts: string[];
  sampleCount: number;
};

export function buildIgDna(projects: Project[], brand: BrandKit | undefined): IgDna {
  const captions = projects.map((p) => p.copy.caption.trim()).filter(Boolean);
  const lengths = captions.map((c) => c.length);
  const hashtags = new Map<string, number>();
  const ctas = new Map<string, number>();
  const kinds = new Map<string, number>();
  const hooks: string[] = [];

  for (const project of projects) {
    for (const tag of project.copy.hashtags) {
      const key = tag.startsWith("#") ? tag : `#${tag}`;
      hashtags.set(key, (hashtags.get(key) ?? 0) + 1);
    }
    const cta = project.copy.cta.trim();
    if (cta) ctas.set(cta, (ctas.get(cta) ?? 0) + 1);
    kinds.set(project.contentKind, (kinds.get(project.contentKind) ?? 0) + 1);
    const firstLine = project.copy.caption.split("\n").find((line) => line.trim());
    if (firstLine) hooks.push(firstLine.trim());
  }

  for (const draft of projects.flatMap((p) => p.copyDrafts)) {
    if (draft.hook) hooks.push(draft.hook);
    if (draft.cta) ctas.set(draft.cta, (ctas.get(draft.cta) ?? 0) + 1);
  }

  return {
    captionLength: {
      min: lengths.length ? Math.min(...lengths) : 0,
      max: lengths.length ? Math.max(...lengths) : 0,
      avg: lengths.length ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0,
    },
    topHashtags: rank(hashtags).slice(0, 8),
    topCtas: rank(ctas)
      .slice(0, 5)
      .map((row) => ({ cta: row.tag, count: row.count })),
    kinds: rank(kinds)
      .slice(0, 6)
      .map((row) => ({ kind: row.tag, count: row.count })),
    colors: (brand?.colors ?? []).map((c) => c.hex),
    hookStarts: [...new Set(hooks)].slice(0, 6),
    sampleCount: projects.length,
  };
}

function rank(map: Map<string, number>): { tag: string; count: number }[] {
  return [...map.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
