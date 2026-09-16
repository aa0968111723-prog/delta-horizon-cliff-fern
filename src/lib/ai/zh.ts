/** Live models sometimes answer in English; the club product is Traditional Chinese only. */
export function looksEnglish(text: string) {
  const letters = (text.match(/[A-Za-z]/g) ?? []).length;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  return letters > 18 && letters > cjk;
}
