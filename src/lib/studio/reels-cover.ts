import type { Artboard, ReelsScript } from "./types.ts";

export function coverImagePrompt(reels: Pick<ReelsScript, "hook" | "cover" | "beats">): string {
  const first = reels.beats?.[0] as { visual?: string } | undefined;
  const visual = (reels.cover ?? "").trim() || first?.visual || "quiet dorm window at dusk";
  const hook = (reels.hook ?? "").trim().slice(0, 80);
  return [
    visual,
    hook ? `mood suggested by: ${hook}` : "",
    "tall 9:16 vertical Instagram Reels cover",
    "soft natural light, airy negative space, muted warm neutrals with one accent light",
    "documentary photo, no text, no watermark, no religious iconography, no logos",
  ]
    .filter(Boolean)
    .join(", ");
}

export function reelsScriptText(reels: ReelsScript): string {
  const beats = (reels.beats ?? [])
    .map((beat) => {
      const row = beat as Record<string, string>;
      const range = row.range ?? `${row.from ?? ""}–${row.to ?? ""}`;
      return `${range}\n畫面：${row.visual ?? row.onScreen ?? ""}\n字幕：${row.caption ?? ""}\n旁白：${row.voice ?? row.voiceover ?? ""}\n轉場：${row.transition ?? ""}\n素材：${row.asset ?? row.assetHint ?? ""}`;
    })
    .join("\n\n");
  return [`Hook：${reels.hook}`, `封面：${reels.cover}`, beats].join("\n\n");
}

export function shotListText(reels: ReelsScript): string {
  const shots = (reels.beats ?? [])
    .map((beat, i) => {
      const row = beat as Record<string, string>;
      const range = row.range ?? `${row.from ?? ""}–${row.to ?? ""}`;
      return `${i + 1}. ${range}｜拍：${row.asset || row.assetHint || row.visual}\n   字幕：${row.caption}`;
    })
    .join("\n");
  return [`封面：${reels.cover}`, `Hook：${reels.hook}`, "", "拍攝順序", shots].join("\n");
}

export function applyAssetToArtboard(artboard: Artboard, assetId: string): Artboard {
  let found = false;
  const layers = artboard.layers.map((layer) => {
    if (layer.type === "image") {
      found = true;
      return { ...layer, assetId };
    }
    return layer;
  });
  if (found) return { ...artboard, layers };
  if (artboard.background.type === "image") {
    return { ...artboard, background: { ...artboard.background, assetId } };
  }
  return {
    ...artboard,
    background: { ...artboard.background, type: "image", assetId },
  };
}

export function hookKind(text: string): string {
  const t = text.trim();
  if (!t) return "直述";
  if (/[?？]/.test(t)) return "提問";
  if (/很久|最近|有時候|是不是|連.+都/.test(t)) return "生活狀態";
  if (/\d|[0-9]+月|週[一二三四五六日]|晚上|早上/.test(t)) return "時間資訊";
  if (/來|報名|坐一下|直接來/.test(t)) return "行動邀請";
  return "直述";
}
