/** 口語問句 → Drive / Canva 可查的短詞。不把整句丟進 fullText。 */
const STOP = new Set([
  "找",
  "以前",
  "的",
  "照片",
  "素材",
  "一下",
  "相關",
  "適合",
  "幫我",
  "做",
  "新的",
  "一個",
  "有",
  "很多",
  "同學",
]);

export function driveQueryFromNl(query: string): string[] {
  const terms: string[] = [];
  if (/茶會|喝茶/.test(query)) terms.push("茶會");
  if (/晚上|夜間/.test(query)) terms.push("夜間");
  if (/龜/.test(query)) terms.push("龜");
  if (/浮游|禪光/.test(query)) terms.push("浮游禪光");
  if (/三色光/.test(query)) terms.push("三色光");
  if (/招生/.test(query)) terms.push("招生");
  if (/淡水|河岸/.test(query)) terms.push("淡水");
  if (/校園|圖書館/.test(query)) terms.push("圖書館");
  if (/海報|主視覺/.test(query)) terms.push("海報");
  if (/logo|標誌/i.test(query)) terms.push("logo");

  const cleaned = query.replace(/['"\\]/g, " ");
  for (const token of cleaned.split(/[\s，。？?、]+/)) {
    const word = token.trim();
    if (word.length < 2 || word.length > 6 || STOP.has(word)) continue;
    if (/^[a-zA-Z0-9._-]+$/.test(word) && word.length < 3) continue;
    if (!terms.includes(word) && /[\u4e00-\u9fff]/.test(word)) terms.push(word);
  }
  return [...new Set(terms)].slice(0, 4);
}

export function driveFileQuery(term: string, folderId?: string) {
  const safe = term.replace(/[^0-9A-Za-z\u4e00-\u9fff._-]/g, "").slice(0, 40);
  const folder = folderId?.replace(/[^0-9A-Za-z_-]/g, "");
  if (!safe) return folder ? `'${folder}' in parents and trashed = false` : "trashed = false";
  const parts = ["trashed = false", `(name contains '${safe}' or fullText contains '${safe}')`];
  if (folder) parts.unshift(`'${folder}' in parents`);
  return parts.join(" and ");
}

export function canvaSearchQuery(query: string) {
  return driveQueryFromNl(query)[0] || query.trim().slice(0, 40);
}
