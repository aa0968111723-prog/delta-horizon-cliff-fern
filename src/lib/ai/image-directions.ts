import type { VisualDirection } from "../studio/types.ts";

export type ImageAspect = "4:5" | "1:1" | "9:16";

export type ImageTweakId =
  | "regen"
  | "composition-top"
  | "composition-side"
  | "mood-night"
  | "mood-friends"
  | "bg-campus"
  | "bg-river"
  | "style-turtle"
  | "style-lights"
  | "text-hook";

export const IMAGE_TWEAKS: { id: ImageTweakId; label: string; prompt: string }[] = [
  { id: "regen", label: "重新生成", prompt: "" },
  { id: "composition-top", label: "換構圖：上圖下字", prompt: "photo on the upper two thirds, large quiet Chinese headline in the lower third, generous negative space" },
  { id: "composition-side", label: "換構圖：人左字右", prompt: "candid person on the left, type and empty air on the right" },
  { id: "mood-night", label: "換氣氛：淡水夜", prompt: "Tamsui night, cool dusk blue, warm lamps, not temple incense" },
  { id: "mood-friends", label: "換氣氛：朋友感", prompt: "two or three Tamkang students sitting together, not posed influencers" },
  { id: "bg-campus", label: "換背景：校園", prompt: "Tamkang Tamsui campus slope, lanterns, night air" },
  { id: "bg-river", label: "換背景：淡水河", prompt: "Tamsui river twilight, distant metro, wind" },
  { id: "style-turtle", label: "換風格：龜龜", prompt: "small turtle mascot silhouette, never dominating the frame" },
  { id: "style-lights", label: "換風格：三色光", prompt: "soft floating cyan amber rose lights, airy, photographic" },
  { id: "text-hook", label: "換文字：大 Hook", prompt: "one large spoken-Chinese line, no poster clutter, no 誠摯邀請" },
];

function inferEvent(prompt: string) {
  if (/浮游|禪光|燈/.test(prompt)) return "浮游禪光";
  if (/茶/.test(prompt)) return "茶會";
  if (/招生|迎新/.test(prompt)) return "迎新";
  if (/社課/.test(prompt)) return "社課";
  return prompt.replace(/\s+/g, " ").trim().slice(0, 16) || "晚上活動";
}

export function proposeVisualDirections(prompt: string, aspect: ImageAspect = "4:5"): VisualDirection[] {
  const event = inferEvent(prompt);
  const aspectNote =
    aspect === "9:16" ? "vertical 9:16 story/reels cover" : aspect === "1:1" ? "square 1:1" : "portrait 4:5 Instagram";
  const tea = /茶/.test(prompt);
  const recruit = /招生|迎新/.test(prompt);

  return [
    {
      id: "dir_a",
      title: "夜色留白",
      concept: tea
        ? "第一句 Hook 很大，茶燈在遠處。先讓人坐下來，再講活動。"
        : "第一句 Hook 很大，燈在遠處。不要做成寺廟海報。",
      palette: "暮藍、沙色、暖光",
      composition: "上半夜色，下半大字",
      typeDirection: "襯線標題、細黑體說明，一行口語就好",
      imagePrompt: `${event} at Tamkang University Tamsui campus night, ${aspectNote}, soft three colored lights cyan amber rose, airy photographic, students sitting, large negative space for Chinese type, not a temple, not incense, not golden Buddha, not plastic AI skin. User ask: ${prompt}`,
      headline: "最近是不是\n很久沒坐好",
      subhead: event,
    },
    {
      id: "dir_b",
      title: "同學側臉",
      concept: recruit
        ? "先看到剛到淡水的人，再看到社團。"
        : "先看到人，再看到活動。側臉、手、茶，不要網紅擺拍。",
      palette: "苔綠、暖光、沙色",
      composition: "人在左側，字在右側留白",
      typeDirection: "短句、口語，不要誠摯邀請",
      imagePrompt: `candid Tamkang student at night ${tea ? "tea gathering" : "quiet campus gathering"}, warm lamp, friends, ${aspectNote}, not posed, not religious, photographic film grain, User ask: ${prompt}`,
      headline: "來坐一下\n不用先懂禪",
      subhead: "淡江大學淡水校園",
    },
    {
      id: "dir_c",
      title: "龜龜與三色光",
      concept: "品牌記憶出場，但角色要小、光要大。學生會停是因為氣氛，不是因為吉祥物卡通過量。",
      palette: "水色、暖光、沙色",
      composition: "角色小、光大、河或校園在後",
      typeDirection: "手寫感標題避免，資訊層最多兩層",
      imagePrompt: `turtle mascot small silhouette with floating cyan amber rose lights over Tamsui water or Tamkang campus, quiet editorial ${aspectNote}, photographic, User ask: ${prompt}`,
      headline: "淡水的晚上\n適合什麼都不做",
      subhead: event,
    },
  ];
}

export function applyImageTweak(basePrompt: string, tweakId: ImageTweakId) {
  const tweak = IMAGE_TWEAKS.find((item) => item.id === tweakId);
  if (!tweak || tweak.id === "regen") return basePrompt;
  return `${basePrompt}. Change: ${tweak.prompt}`;
}

export const VISION_ACTIONS = [
  { id: "continue-style", label: "延續這個風格" },
  { id: "redesign", label: "保留內容重新設計" },
  { id: "story", label: "做成限動" },
  { id: "carousel", label: "做成 Carousel" },
  { id: "reels-cover", label: "做成 Reels Cover" },
  { id: "similar", label: "生成相似視覺" },
] as const;

export type VisionActionId = (typeof VISION_ACTIONS)[number]["id"];

export function promptFromVisionAction(
  action: VisionActionId,
  analysis: { content: string; color: string; composition: string; brand: string },
) {
  const base = `Tamkang Zen Club Instagram, based on this image: ${analysis.content}. Color ${analysis.color}. Composition ${analysis.composition}. Brand ${analysis.brand}. Photographic, airy, Tamsui campus, not temple, not incense, not plastic AI.`;
  if (action === "continue-style") return `${base} Continue the same visual DNA for a new night gathering.`;
  if (action === "redesign") return `${base} Keep the subject, redesign layout with more air and a spoken Chinese hook.`;
  if (action === "reels-cover") return `${base} Vertical 9:16 reels cover, one large hook line, face or light in the upper half.`;
  if (action === "similar") return `${base} Generate a sibling frame in the same style, different crop.`;
  return base;
}
