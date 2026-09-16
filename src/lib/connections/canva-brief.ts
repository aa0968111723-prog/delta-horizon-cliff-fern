export type CanvaPasteBriefInput = {
  campaignName: string;
  hook?: string;
  concept?: string;
  schedule?: string;
  location?: string;
  cta?: string;
  visualDirection?: string;
  collection?: string;
};

export function buildCanvaPasteBrief(input: CanvaPasteBriefInput) {
  const collection = input.collection || "浮游禪光";
  return [
    `淡江大學禪學社｜${input.campaignName || collection}`,
    input.hook ? `Hook：${input.hook}` : "",
    input.concept ? `概念：${input.concept}` : "",
    "視覺：夜晚校園、三色光、真實學生生活；不要宗教符號、佛像、蓮花堆砌或企業簡報感。",
    input.visualDirection ? `畫面方向：${input.visualDirection}` : "畫面方向：淡江學生能停下來的生活感，大標題安全區。",
    [input.schedule ? `時間｜${input.schedule}` : "", input.location ? `地點｜${input.location}` : ""].filter(Boolean).join("　"),
    input.cta ? `CTA：${input.cta}` : "CTA：找朋友一起來",
    "",
    "請在 Canva 手動套用這個 brief。Design Autofill 需要 Canva Enterprise，目前這個工作室沒有宣稱已開通。",
  ].filter((line, index, lines) => line || lines[index + 1]).join("\n");
}
