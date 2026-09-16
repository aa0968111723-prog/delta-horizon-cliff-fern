import { migrateBrief } from "./brief";
import { buildLayout } from "./layout";
import type { Artboard, BrandKit, CopyDeck, FormatId, TemplateId } from "./types";

export type TemplateStarter = {
  id: TemplateId;
  name: string;
  description: string;
  formatId: FormatId;
  copy: CopyDeck;
  brief: ReturnType<typeof migrateBrief>;
};

export const TEMPLATE_STARTERS: TemplateStarter[] = [
  {
    id: "editorial",
    name: "活動主視覺",
    description: "大標＋主畫面，適合茶會、迎新、講座封面",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "浮游禪光",
      eventName: "茶會主視覺",
      audience: "剛到淡水、還沒找到地方坐下來的學生",
      goal: "awareness",
      notes: "語氣像學長姐，不要折扣口吻，不要宗教詞。",
      style: "夜晚一盞燈、留白、三色光",
    }),
    copy: {
      eyebrow: "淡江大學禪學社",
      headline: "最近是不是\n很久沒坐好",
      subhead: "一個晚上，一杯茶，什麼都不用做。",
      body: "9/24 週三 19:00 B302",
      cta: "直接來就好",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "product",
    name: "現場照片",
    description: "上圖下文，適合活動紀實與社員日常",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "社課現場",
      eventName: "週三晚上",
      offer: "",
      audience: "滑到一半想知道「他們在幹嘛」的同學",
      goal: "ugc",
      notes: "真實學生照，不要海報感。",
    }),
    copy: {
      eyebrow: "週三晚上",
      headline: "燈調暗之後",
      subhead: "教室還是教室，只是慢了一點。",
      body: "坐墊、茶杯、有人在寫作業有人沒有。",
      cta: "下週三見",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "offer",
    name: "時間地點",
    description: "置中大標，適合倒數、報到資訊、限動預告",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "浮游禪光",
      eventName: "活動資訊",
      offer: "不用報名",
      audience: "已經心動、只差時間地點的人",
      goal: "traffic",
      notes: "時間地點要一眼看到。不要製造焦慮。",
    }),
    copy: {
      eyebrow: "9/24 週三",
      headline: "B302\n19:00",
      subhead: "直接來就好，不用報名。",
      body: "淡江宮燈大道旁邊那棟。",
      cta: "加入行事曆",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "quote",
    name: "一句 Hook",
    description: "語句為主，適合限動、金句、轉發",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "一句話",
      eventName: "Hook",
      audience: "滑到停下來的淡江學生",
      goal: "ugc",
      notes: "短、可截圖。先講狀態，再講社團。",
      style: "短句、可分享",
    }),
    copy: {
      eyebrow: "NOTE",
      headline: "靜坐不是\n把腦清空",
      subhead: "比較像把跑太快的自己，放回身體裡。",
      body: "",
      cta: "帶朋友一起來",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
];

export function templateById(id: TemplateId): TemplateStarter {
  return TEMPLATE_STARTERS.find((t) => t.id === id) ?? TEMPLATE_STARTERS[0];
}

export function previewTemplate(template: TemplateStarter, brand: BrandKit, imageAssetId?: string | null): Artboard {
  const copy: CopyDeck = {
    ...template.copy,
    handle: brand.handle,
    cta: brand.boilerplate.cta || template.copy.cta,
    hashtags: brand.boilerplate.hashtags,
  };
  const artboard = buildLayout(template.formatId, copy, brand, template.id, { imageAssetId });
  artboard.layers = artboard.layers.map((layer, index) => ({
    ...layer,
    id: `tpl_${template.id}_${index}`,
  }));
  return artboard;
}
