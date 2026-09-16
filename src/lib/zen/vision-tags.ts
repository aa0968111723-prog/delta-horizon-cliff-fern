/** Map vision analysis into library tags — no server fn imports. */

export type VisionTagInput = {
  content: string;
  colors?: string;
  tooReligious?: boolean;
  tooOld?: boolean;
  tooAi?: boolean;
  fitsTamkang?: boolean;
  suggestions?: string[];
};

export function tagsFromVision(analysis: VisionTagInput, extra: string[] = []): string[] {
  const blob = `${analysis.content} ${analysis.colors ?? ""}`;
  const tags: string[] = [...extra];
  if (/龜/.test(blob)) tags.push("龜龜");
  if (/茶|杯/.test(blob)) tags.push("茶會");
  if (/夜|燈|光|暮/.test(blob)) tags.push("夜晚");
  if (/校園|教室|走廊|淡江/.test(blob)) tags.push("淡江校園");
  if (/淡水|河/.test(blob)) tags.push("淡水");
  if (/海報|字/.test(blob)) tags.push("海報");
  if (analysis.tooReligious) tags.push("偏宗教");
  if (analysis.tooOld) tags.push("偏老氣");
  if (analysis.tooAi) tags.push("偏AI");
  if (analysis.fitsTamkang) tags.push("學生感");
  for (const suggestion of analysis.suggestions ?? []) {
    if (/限動|Story/i.test(suggestion)) tags.push("可做限動");
    if (/Carousel|輪播/i.test(suggestion)) tags.push("可做Carousel");
    if (/風格/.test(suggestion)) tags.push("可延續風格");
  }
  const seen = new Set<string>();
  return tags.filter((tag) => {
    if (!tag || seen.has(tag)) return false;
    seen.add(tag);
    return true;
  }).slice(0, 10);
}

export function ideaFromVision(analysis: VisionTagInput, seed = ""): string {
  return [
    seed || "延續這張圖，做新的淡江禪學社網宣。",
    `畫面：${analysis.content}`,
    analysis.colors ? `配色：${analysis.colors}` : "",
    "不要複製舊作品。不要寺廟海報。讓淡江學生覺得這跟自己有關。",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 400);
}
