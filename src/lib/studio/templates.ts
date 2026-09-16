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
    name: "編輯封面",
    description: "大標＋主視覺，適合品牌敘事",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "品牌故事",
      eventName: "品牌敘事",
      audience: "淡江學生",
      goal: "awareness",
      notes: "語氣生活，不要社團官方腔。",
      style: "編輯節奏、留白",
    }),
    copy: {
      eyebrow: "STUDIO NOTE",
      headline: "把故事\n放進畫面",
      subhead: "以編輯節奏鋪陳品牌觀點。",
      body: "適合系列開場、理念闡述與季節提案。",
      cta: "閱讀更多",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "product",
    name: "活動主視覺",
    description: "上圖下文，適合茶會與夜間活動",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "活動主視覺",
      eventName: "夜間活動",
      offer: "現場可來",
      audience: "淡江學生",
      goal: "traffic",
      notes: "強調現場感覺與時間地點。",
    }),
    copy: {
      eyebrow: "NEW ARRIVAL",
      headline: "活動名稱",
      subhead: "一句話說清楚為什麼現在要看。",
      body: "時間、地點或現場感覺放這裡。",
      cta: "晚上來坐一下",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "offer",
    name: "報名倒數",
    description: "置中大標與 CTA，適合當天提醒",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "當晚活動",
      eventName: "倒數提醒",
      offer: "現場可來",
      audience: "已經知道活動、需要被提醒的淡江學生",
      goal: "traffic",
      notes: "清楚寫時間地點，不要焦慮話術。",
    }),
    copy: {
      eyebrow: "TONIGHT",
      headline: "晚上來坐",
      subhead: "時間與地點寫在同一視線。",
      body: "帶一個朋友就好。",
      cta: "晚上來坐一下",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "quote",
    name: "引言卡片",
    description: "語句為主，適合價值主張",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "品牌主張",
      eventName: "一句話主張",
      audience: "想被一句話停下來的淡江學生",
      goal: "ugc",
      notes: "短、可截圖、可分享。",
      style: "短句、可分享",
    }),
    copy: {
      eyebrow: "NOTE",
      headline: "好的貼文\n先讓人停下",
      subhead: "留給畫面呼吸，而不是塞滿資訊。",
      body: "",
      cta: "收藏這句",
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
