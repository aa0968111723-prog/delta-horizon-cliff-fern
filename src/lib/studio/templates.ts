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
      audience: "在意質感的都市受眾",
      goal: "awareness",
      notes: "語氣沉靜，不要折扣口吻。",
      style: "編輯節奏、留白",
    }),
    copy: {
      eyebrow: "SIT",
      headline: "把故事\n放進畫面",
      subhead: "先讓學生覺得這跟自己有關。",
      body: "適合系列開場、生活向與活動預告。",
      cta: "晚上見",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "product",
    name: "活動主圖",
    description: "上圖下文，適合茶會與夜燈",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "主打商品",
      eventName: "新品上市",
      offer: "新到櫃上",
      audience: "會比較規格與產地的買家",
      goal: "conversion",
      notes: "強調規格與使用情境。",
    }),
    copy: {
      eyebrow: "NEW ARRIVAL",
      headline: "新品名稱",
      subhead: "一句話說清楚為什麼現在要看。",
      body: "產地、規格或使用方式放這裡。",
      cta: "查看商品",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "offer",
    name: "活動公告",
    description: "置中大標與 CTA，適合倒數",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "檔期活動",
      eventName: "期間限定",
      offer: "期間限定",
      audience: "已關注品牌、等待理由行動的人",
      goal: "traffic",
      notes: "清楚寫期限，不要製造焦慮。",
    }),
    copy: {
      eyebrow: "SEASON OFFER",
      headline: "本週限定",
      subhead: "把優惠與期限寫在同一視線。",
      body: "到店或線上兌換方式。",
      cta: "立即查看",
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
      audience: "需要被一句話打動的瀏覽者",
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
