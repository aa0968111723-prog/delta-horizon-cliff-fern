import type { AssetMeta, BrandKit, ClubCampaign, IgMemoryPost } from "../studio/types.ts";
import { learnFromIg } from "./insights.ts";

export type CreativeDna = {
  palette: string;
  motifs: string[];
  ctas: string[];
  likes: string[];
  dislikes: string[];
  captionLength: number;
  hashtags: string[];
  events: string[];
  visual: string;
  voice: string;
  promptBlock: string;
};

function hashtagsFromCaptions(captions: string[]) {
  const found = new Map<string, number>();
  for (const caption of captions) {
    for (const tag of caption.match(/#[^\s#]+/g) ?? []) {
      found.set(tag, (found.get(tag) ?? 0) + 1);
    }
  }
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 8);
}

/** Club memory the generator should read before inventing a generic brand. */
export function clubCreativeDna(input: {
  brand?: BrandKit;
  igMemory: IgMemoryPost[];
  campaigns: ClubCampaign[];
  assets?: AssetMeta[];
}): CreativeDna {
  const brand = input.brand;
  const captions = input.igMemory.map((p) => p.caption);
  const avg = captions.length ? Math.round(captions.reduce((n, c) => n + c.length, 0) / captions.length) : 0;
  const learning = learnFromIg(input.igMemory);
  const motifs = brand?.motifs?.length ? brand.motifs : ["龜龜", "三色光", "淡水夜晚"];
  const ctas = brand?.ctas?.length ? brand.ctas : ["來坐一下"];
  const likes = brand?.likes?.length ? brand.likes : ["問句 Hook", "夜晚座位", "空氣感"];
  const dislikes = brand?.dislikes?.length ? brand.dislikes : ["寺廟海報", "誠摯邀請", "資訊堆疊"];
  const events = input.campaigns.map((c) => c.name).slice(0, 6);
  const palette = brand?.colors?.map((c) => c.label).join(" / ") || "霧園 / 靜水 / 琥珀";
  const visual = brand?.imageStyle
    ? `${brand.imageStyle.mood}；${brand.imageStyle.lighting}；${brand.imageStyle.composition}`
    : "夜晚、留白、三色光，不要寺廟構圖。";
  const hashtags = hashtagsFromCaptions(captions);
  const voice = brand?.voice || "像社團的人在傳訊息";
  const promptBlock = [
    learning.promptBlock,
    `品牌記憶：${palette}。母題 ${motifs.join("、")}。`,
    `語氣：${voice}`,
    `喜歡：${likes.join("、")}。不要：${dislikes.join("、")}。`,
    `常用 CTA：${ctas[0]}。Caption 大約 ${avg || 90} 字。`,
    events.length ? `做過的活動：${events.join("、")}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    palette,
    motifs,
    ctas,
    likes,
    dislikes,
    captionLength: avg,
    hashtags,
    events,
    visual,
    voice,
    promptBlock: promptBlock.slice(0, 900),
  };
}
