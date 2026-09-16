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
    name: "情緒封面",
    description: "大標＋主視覺，適合先問學生生活",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "情緒共鳴",
      eventName: "先問一句真話",
      audience: "淡江大學學生",
      goal: "awareness",
      notes: "不要公文，不要宗教。",
      style: "留白、學生語氣",
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
      product: "社團活動",
      eventName: "活動主視覺",
      offer: "任何人都可以來",
      audience: "淡江大學學生",
      goal: "traffic",
      notes: "時間地點要清楚。",
    }),
    copy: {
      eyebrow: "09 / 24",
      headline: "浮游禪光",
      subhead: "一個給淡江學生的晚上。",
      body: "19:30 開始。燈會先亮。",
      cta: "看活動時間",
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
      product: "活動倒數",
      eventName: "明天這個時候",
      offer: "人到了就好",
      audience: "已經看過預告的淡江學生",
      goal: "traffic",
      notes: "清楚寫時間，不要製造焦慮。",
    }),
    copy: {
      eyebrow: "TOMORROW",
      headline: "明天 19:30",
      subhead: "淡江校園。到了再找位子。",
      body: "想帶朋友來也可以。",
      cta: "來坐一下",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "quote",
    name: "一句話",
    description: "短句為主，適合限動與分享",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "一句真話",
      eventName: "人到了就好",
      audience: "淡江學生",
      goal: "ugc",
      notes: "短、可截圖。不要金句工廠。",
      style: "口語、可分享",
    }),
    copy: {
      eyebrow: "NOTE",
      headline: "人到了\n就好。",
      subhead: "沒有人要你先懂禪。",
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
