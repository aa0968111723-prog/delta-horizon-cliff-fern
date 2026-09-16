/** Live models sometimes answer in English; the club product is Traditional Chinese only. */
export function looksEnglish(text: string) {
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  return letters > 18 && letters > cjk;
}

export const CLUB_IMAGE_SCENE =
  "淡江大學淡水學生生活，空氣感，不要寺廟、不要僧袍、不要密密經文，電影靜幀，IG 構圖";

/** 送給生圖模型的畫面描述，維持生活中文，不要夾英文指令。 */
export function withClubImageScene(prompt: string) {
  const base = prompt.trim();
  if (!base) return CLUB_IMAGE_SCENE;
  if (base.includes("不要寺廟") && /淡江|淡水/.test(base)) return base;
  return `${base}。${CLUB_IMAGE_SCENE}`;
}

export function preferChinese(text: string | undefined, fallback: string) {
  const value = text?.trim() ?? "";
  if (!value || looksEnglish(value)) return fallback;
  return value;
}
