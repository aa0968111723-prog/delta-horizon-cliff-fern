import type { VisualDirection } from "../studio/types.ts";

export type PixelStats = {
  avgR: number;
  avgG: number;
  avgB: number;
  brightness: number;
  saturation: number;
  goldShare: number;
  coolShare: number;
  topBrightness: number;
  bottomBrightness: number;
};

export type LocalVision = {
  content: string;
  people: string;
  color: string;
  light: string;
  composition: string;
  typeRatio: string;
  brand: string;
  student: string;
  stay: string;
  tooReligious: string;
  tooOld: string;
  tooAi: string;
  next: string[];
};

const NEXT = ["延續這個風格", "保留內容重新設計", "做成限動", "做成 Carousel", "做成 Reels Cover", "生成相似視覺"];

export function visionFromPixels(stats: PixelStats, hint = ""): LocalVision {
  const tea = /茶/.test(hint);
  const night = stats.brightness < 0.42 || stats.coolShare > 0.28;
  const tooGold = stats.goldShare > 0.16;
  const airyBottom = stats.bottomBrightness > stats.topBrightness + 0.08;
  const tooPunchy = stats.saturation > 0.55 && stats.brightness > 0.45;
  return {
    content: tea
      ? "像晚上的茶席或手邊的杯子，不是廟裡的儀式照。"
      : night
        ? "偏夜色與燈。有機會當 IG 主視覺，前提是字不要再疊滿。"
        : "畫面偏亮。若是校園或同學，可當生活向素材；若是海報，建議拆成限動。",
    people: stats.saturation < 0.35 ? "人物不會搶，比較像現場。" : "人物或物件對比強，注意不要網紅擺拍。",
    color: `主色大約 rgb(${Math.round(stats.avgR)}, ${Math.round(stats.avgG)}, ${Math.round(stats.avgB)})。${
      stats.coolShare > 0.25 ? "有暮藍／水色，接近淡水晚上。" : "暖色偏多，對一下品牌苔綠與沙色。"
    }`,
    light: night ? "夜燈或暮色，適合停留。" : "偏平光，可再找一盞暖燈。",
    composition: airyBottom ? "下半較亮，適合放大 Hook。" : "上下亮度接近，字要自己留白，不要貼滿。",
    typeRatio: airyBottom ? "還有放字的空氣。" : "可能已經有字或資訊層，做成 IG 時要減字。",
    brand: tooGold ? "金色偏多，品牌感容易變成寺廟。" : "可對照三色光、龜龜、苔綠。",
    student: night && !tooGold ? "比較像淡江學生會停的晚上。" : "還要再問：這跟課表、宿舍、捷運有關嗎？",
    stay: tooPunchy ? "太滿、太衝，Grid 上會像招生海報。" : "有機會停，前提是第一句是生活不是公告。",
    tooReligious: tooGold ? "金色／暖金比例偏高，先拿掉香爐、金身、廟宇感。" : "沒有明顯宗教開場。",
    tooOld: stats.brightness < 0.22 ? "太暗會老氣。留一點燈就好。" : "還好。",
    tooAi: tooPunchy ? "飽和偏高，有一點塑膠感。" : "還可以，不要再磨皮。",
    next: NEXT,
  };
}

export function visionFromDirection(dir: VisualDirection, prompt: string): LocalVision {
  const tea = /茶/.test(`${prompt}${dir.concept}`);
  return {
    content: dir.concept,
    people: /人|同學|側臉/.test(dir.concept) ? "先看到人，再看到活動。" : "人很小，氣氛比較大。",
    color: dir.palette,
    light: /夜|燈/.test(`${dir.concept}${dir.palette}`) ? "夜燈、留白。" : "空氣感。",
    composition: dir.composition,
    typeRatio: "字在下半或一側，不要海報堆字。",
    brand: /龜|三色/.test(`${dir.title}${dir.concept}`) ? "龜龜或三色光有出場，但應保持小。" : "品牌色在，角色可再點一下。",
    student: tea ? "茶會、坐下來，對準剛到淡水或課表很滿的人。" : "對準淡江學生晚上想停下來的感覺。",
    stay: "第一句是 Hook，活動名很小。",
    tooReligious: "方向裡已避開廟與香爐。",
    tooOld: "年輕、有空氣。",
    tooAi: "Prompt 要求 photographic，不要塑膠皮膚。",
    next: NEXT,
  };
}

export function visionFromHint(hint = ""): LocalVision {
  return visionFromPixels(
    {
      avgR: 80,
      avgG: 95,
      avgB: 118,
      brightness: 0.3,
      saturation: 0.24,
      goldShare: 0.03,
      coolShare: 0.35,
      topBrightness: 0.2,
      bottomBrightness: 0.34,
    },
    hint,
  );
}

export function isStubVision(content: string) {
  return /本機無法看圖|無法看圖/.test(content);
}
