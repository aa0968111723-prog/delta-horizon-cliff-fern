export function canvaPreset(format: string) {
  if (format === "story" || format === "reels-cover") return "instagramStory";
  if (format === "feed-square" || format === "threads" || format === "line") return "instagramPost";
  return "instagramPost";
}

export function canvaBrief(input: { title: string; hook: string; body: string; cta: string; palette?: string }) {
  return [
    `標題：${input.title}`,
    `Hook：${input.hook}`,
    input.body,
    `CTA：${input.cta}`,
    input.palette ? `配色：${input.palette}` : "",
    "延續淡江禪學社 DNA：霧園、靜水、三色光、龜龜可在角落。不要寺廟、不要宗教海報。",
  ]
    .filter(Boolean)
    .join("\n");
}
