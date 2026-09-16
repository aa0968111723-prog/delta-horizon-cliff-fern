const VARIATIONS = {
  compose: "換構圖：主體不要置中死板，留白給字，像 IG 會停下來的畫面。",
  mood: "換氣氛：淡水黃昏、河岸風、柔光夜間，有一點同學在場的溫度。",
  bg: "換背景：淡江校園小路、宿舍窗邊或圖書館前，不要寺廟。",
  style: "換風格：更像同學拍的照片，少插畫、少光滑 AI 感。",
  type: "換文字：畫面少字，Hook 更大，留白更多。",
  similar: "延伸同風格新畫面，不要直接複製原圖。龜龜或三色光當配角即可。",
  story: "做成限動 9:16，一句話，時間地點放最後。",
  reels: "做成 Reels 封面 9:16，少字、大留白、夜間生活感。",
} as const;

export type ImageVaryKind = keyof typeof VARIATIONS;

/** 視覺微調用生活中文，避免英文指令把畫面帶偏。 */
export function varyImagePrompt(base: string, kind: ImageVaryKind) {
  const seed = base.trim() || "淡江學生夜間生活，三色光，霧亞麻";
  return `${seed}。${VARIATIONS[kind]}`;
}
