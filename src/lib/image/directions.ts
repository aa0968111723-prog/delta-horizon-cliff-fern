import type { CreativeDirection } from "../studio/types.ts";

export function mockDirections(idea: string, eventName = "", learnedHook = ""): CreativeDirection[] {
  const title = eventName || idea.slice(0, 10);
  const hook = learnedHook.includes("？") ? learnedHook : "";
  return [
    {
      id: "dir_a",
      name: "坐下",
      concept: "學生生活問句＋室內暖光。",
      palette: "宣紙、苔綠",
      composition: "上半光或人，下半字",
      typeDirection: "兩行大標",
      imagePrompt: `Quiet Tamkang university evening, student sitting, warm paper light, soft cyan amber rose glow, not temple, not golden, editorial photo, space for Chinese headline, idea: ${idea}, event: ${title}`,
      headline: hook || "最近是不是很久沒坐下來？",
      subhead: title,
    },
    {
      id: "dir_b",
      name: "淡水晚上",
      concept: "捷運風 → 教室燈。",
      palette: "水光、暖光",
      composition: "深色上緣，字在安全區",
      typeDirection: "短標＋時間",
      imagePrompt: `Tamsui night after MRT, wind, then indoor club lights, naturalistic Taiwan campus, ${idea}, ${title}, no cyberpunk neon`,
      headline: "風比較大的晚上",
      subhead: title,
    },
    {
      id: "dir_c",
      name: "帶朋友",
      concept: "兩人側影，降低第一次壓力。",
      palette: "玫瑰光、宣紙",
      composition: "人物不要正臉網紅",
      typeDirection: "口語一句",
      imagePrompt: `two college students sitting together in a dim campus room, small turtle motif, candid, ${idea}, ${title}, photoreal, not AI-smooth skin`,
      headline: "帶朋友來也可以",
      subhead: title,
    },
  ];
}

export function directionsOrMock(idea: string, eventName = "", parsed?: CreativeDirection[] | null, learnedHook = "") {
  const directions = parsed?.filter((row) => row.imagePrompt && row.headline) ?? [];
  return directions.length ? directions : mockDirections(idea, eventName, learnedHook);
}
