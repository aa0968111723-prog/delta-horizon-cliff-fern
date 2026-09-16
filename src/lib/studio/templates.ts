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
    description: "生活問句＋主視覺，適合淡江學生停滑",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "品牌故事",
      eventName: "品牌敘事",
      audience: "淡江學生，對禪不熟",
      goal: "awareness",
      notes: "不要公文，不要宗教。",
      style: "留白、學生語氣",
    }),
    copy: {
      eyebrow: "STUDIO NOTE",
      headline: "最近是不是\n很久沒坐好",
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
    description: "上圖下文，適合茶會、浮游禪光",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "活動主視覺",
      eventName: "浮游禪光",
      offer: "",
      audience: "淡江學生，剛到淡水的人",
      goal: "traffic",
      notes: "強調時間地點與可以揪人。",
    }),
    copy: {
      eyebrow: "09 / 24",
      headline: "最近是不是\n很久沒坐好",
      subhead: "浮游禪光 · 淡水晚上",
      body: "不是來聽課。就是找一個晚上，把身體先放下來。",
      cta: "來坐一下",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "offer",
    name: "倒數提醒",
    description: "置中大標與時間地點，適合 Story／倒數",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "活動倒數",
      eventName: "浮游禪光",
      offer: "今晚",
      audience: "已經看過預熱、還在猶豫出不出門的人",
      goal: "traffic",
      notes: "清楚寫時間地點，不要製造焦慮。",
    }),
    copy: {
      eyebrow: "TONIGHT",
      headline: "今晚\n來坐一下",
      subhead: "19:00 · 淡水校園",
      body: "不用準備什麼。",
      cta: "看時間地點",
      handle: "",
      caption: "",
      hashtags: [],
      altText: "",
    },
  },
  {
    id: "quote",
    name: "一句生活",
    description: "語句為主，適合限動與生活貼",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "生活貼",
      eventName: "允許慢一點",
      audience: "課業壓力大、剛到淡水的人",
      goal: "ugc",
      notes: "短、可截圖、不要說教。",
      style: "短句、可分享",
    }),
    copy: {
      eyebrow: "NOTE",
      headline: "先允許自己\n慢一點",
      subhead: "留給畫面呼吸，而不是塞滿資訊。",
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
