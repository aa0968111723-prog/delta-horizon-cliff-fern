import type { Artboard, ReelsScript } from "./types.ts";

/** 依腳本寫出可送去生圖的封面 prompt。不帶字幕、不含宗教符號。 */
export function coverImagePrompt(reels: Pick<ReelsScript, "hook" | "cover" | "beats">): string {
  const visual = reels.cover.trim() || reels.beats[0]?.visual || "quiet dorm window at dusk";
  const hook = reels.hook.trim().slice(0, 80);
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

/** 整支腳本：複製到備忘錄就能拍。 */
export function reelsScriptText(reels: ReelsScript): string {
  const beats = reels.beats
    .map(
      (beat) =>
        `${beat.range}\n畫面：${beat.visual}\n字幕：${beat.caption}\n旁白：${beat.voice}\n轉場：${beat.transition}\n素材：${beat.asset}`,
    )
    .join("\n\n");
  return [`Hook：${reels.hook}`, `封面：${reels.cover}`, beats].join("\n\n");
}

/** 拍攝清單：一個人一支手機就能拍。 */
export function shotListText(reels: ReelsScript): string {
  const shots = reels.beats
    .map((beat, i) => `${i + 1}. ${beat.range}｜拍：${beat.asset || beat.visual}\n   字幕：${beat.caption}`)
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
