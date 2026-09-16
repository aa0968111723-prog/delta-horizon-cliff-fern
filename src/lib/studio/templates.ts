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
    description: "大標＋主視覺，適合活動敘事",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "社團活動",
      eventName: "活動敘事",
      audience: "在意生活節奏的淡江學生",
      goal: "awareness",
      notes: "語氣自然，不要折扣口吻。",
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
    description: "上圖下文，適合現場照片與主視覺",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "活動現場",
      eventName: "夜間茶會",
      offer: "可帶一位朋友",
      audience: "剛下課、想找地方坐坐的淡江學生",
      goal: "conversion",
      notes: "強調時間、地點與參加方式。",
    }),
    copy: {
      eyebrow: "TONIGHT",
      headline: "先坐下來",
      subhead: "一句話說清楚今晚在做什麼。",
      body: "時間、地點或參加方式放這裡。",
      cta: "看看活動",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "offer",
    name: "資訊公告",
    description: "置中大標與 CTA，適合時間地點與報名",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "社團活動",
      eventName: "本週茶會",
      offer: "免費參加，可帶朋友",
      audience: "已在社團附近、需要明確時間地點的淡江學生",
      goal: "traffic",
      notes: "清楚寫時間地點，不要製造焦慮。",
    }),
    copy: {
      eyebrow: "THIS WEEK",
      headline: "今晚可以來",
      subhead: "把時間、地點與報名寫在同一視線。",
      body: "報名或到場方式寫這裡。",
      cta: "保留這個晚上",
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
      audience: "需要被一句話打動的淡江學生",
      goal: "ugc",
      notes: "短、可截圖、可分享。",
      style: "短句、可分享",
    }),
    copy: {
      eyebrow: "NOTE",
      headline: "好的網宣\n先把話說完",
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
