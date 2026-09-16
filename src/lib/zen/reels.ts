import type { AssetMeta, ReelsBeat } from "../studio/types.ts";

export const REELS_BEAT_ROLES = [
  { id: "hook", label: "Hook", hint: "前三秒停下拇指", seconds: "0–3" },
  { id: "scene", label: "情境", hint: "學生的日常畫面", seconds: "3–7" },
  { id: "turn", label: "停下來", hint: "為什麼值得進來", seconds: "7–12" },
  { id: "place", label: "現場", hint: "社辦 / 茶 / 人", seconds: "12–17" },
  { id: "cta", label: "CTA", hint: "時間地點，怎麼來", seconds: "17–20" },
] as const;

export const REELS_TRANSITIONS = ["硬切", "慢推", "跟拍", "疊化", "定格"] as const;

const SLOT = [
  { from: 0, to: 3 },
  { from: 3, to: 7 },
  { from: 7, to: 12 },
  { from: 12, to: 17 },
  { from: 17, to: 20 },
] as const;

export function beatRole(index: number) {
  return REELS_BEAT_ROLES[Math.min(index, REELS_BEAT_ROLES.length - 1)] ?? REELS_BEAT_ROLES[0];
}

export function reelsDuration(beats: ReelsBeat[]) {
  return beats.reduce((max, b) => Math.max(max, Number(b.to) || 0), 0) || 20;
}

export function beatIndexAt(beats: ReelsBeat[], time: number) {
  if (!beats.length) return 0;
  const i = beats.findIndex((b) => time >= b.from && time < b.to);
  if (i >= 0) return i;
  return time >= reelsDuration(beats) ? beats.length - 1 : 0;
}

export function normalizeReelsBeats(beats: ReelsBeat[]): ReelsBeat[] {
  if (!beats.length) return [];
  return SLOT.map((slot, i) => {
    const src = beats[i] ?? beats[beats.length - 1]!;
    return {
      from: slot.from,
      to: slot.to,
      visual: src.visual || "",
      caption: src.caption || "",
      voiceover: src.voiceover || "",
      transition: src.transition || (i === 0 ? "硬切" : REELS_TRANSITIONS[Math.min(i, REELS_TRANSITIONS.length - 1)]!),
      assetHint: src.assetHint || "",
      assetId: src.assetId ?? null,
    };
  });
}

export function formatReelsScript(beats: ReelsBeat[]) {
  return beats
    .map((b, i) => {
      const role = beatRole(i);
      return [
        `${b.from}–${b.to}s  ${role.label}（${role.hint}）`,
        `畫面：${b.visual || "（未寫）"}`,
        `字幕：${b.caption || "（未寫）"}`,
        b.voiceover ? `旁白：${b.voiceover}` : "旁白：（無）",
        `轉場：${b.transition || "硬切"}`,
        `素材：${b.assetHint || "（待補）"}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function reelsCoverPrompt(visualDirection: string, hook: string) {
  const scene = visualDirection.trim() || "a quiet Tamkang University evening, one warm lamp, three-color glow";
  const mood = hook.trim() ? `Mood matching the line: "${hook.slice(0, 48)}".` : "";
  return `${scene}. Vertical 9:16 Instagram Reels cover, photographic, film grain, generous negative space in the lower third, tiny turtle mascot in a corner, no text, no watermark, no religious symbols. ${mood}`.trim();
}

export function suggestAssetsForBeat(beat: ReelsBeat, assets: AssetMeta[], limit = 4): AssetMeta[] {
  const blob = `${beat.assetHint} ${beat.visual}`.toLowerCase();
  const scored = assets.map((asset) => {
    let score = 0;
    const hay = `${asset.name} ${asset.tags.join(" ")} ${asset.category}`.toLowerCase();
    if (beat.assetId === asset.id) score += 12;
    if (/龜|mascot|turtle|gugu/.test(blob) && asset.category === "mascot") score += 6;
    if (/校園|宮燈|campus|淡江/.test(blob) && asset.category === "campus") score += 5;
    if (/淡水|河|夕陽/.test(blob) && asset.category === "tamsui") score += 5;
    if (/茶|活動|現場|社辦|教室/.test(blob) && (asset.category === "photo" || asset.category === "archive")) score += 4;
    if (/宿舍|自拍|人|側臉/.test(blob) && asset.category === "people") score += 4;
    if (/封面|純色|光|卡/.test(blob) && (asset.category === "background" || asset.category === "generated" || asset.category === "mascot")) score += 3;
    if (asset.category === "reels") score += 2;
    for (const word of blob.split(/[\s/·,，]+/).filter((w) => w.length > 1)) {
      if (hay.includes(word)) score += 1;
    }
    return { asset, score };
  });
  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.asset);
}
