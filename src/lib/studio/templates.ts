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
    name: "茶會主視覺封面",
    description: "大標＋微光留白，適合茶會活動與心靈共鳴",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "浮游禪光 迎新茶會",
      eventName: "09/24 浮游禪光",
      audience: "開學面對課業與人際壓力、想在淡水夜晚放空喘息的淡江學生",
      goal: "awareness",
      notes: "語氣溫暖陪伴，像朋友在草坪聊天，不要宗教說教口吻。",
      style: "生活感、晨曦暖光、留白呼吸感",
    }),
    copy: {
      eyebrow: "09/24 迎新茶會",
      headline: "最近是不是\n很久沒好好坐下來？",
      subhead: "開學第三週 · 給自己留一個放空的晚上",
      body: "在淡水微涼的夜裡，捧一杯熱茶，給心靈一個不需要被評分的角落。",
      cta: "預約茶會席位",
      handle: "@tku_zenclub",
      caption: "",
      hashtags: ["#淡江大學", "#淡江禪學社", "#浮游禪光"],
      altText: "淡水夜青微光背景，溫暖陶杯熱茶特寫與大字率排版",
    },
  },
  {
    id: "product",
    name: "活動亮點卡片",
    description: "上圖下文，適合展示三色光靜心或熱茶體驗",
    formatId: "feed-portrait",
    brief: migrateBrief({
      product: "三色光靜心體驗",
      eventName: "日常社課體驗",
      offer: "免費入場體驗",
      audience: "常感到腦袋很吵、想提升專注力與睡眠品質的同學",
      goal: "conversion",
      notes: "強調具體放鬆感受與日常練習法，不講玄學名詞。",
    }),
    copy: {
      eyebrow: "ZEN EXPERIENCE",
      headline: "沒有說教\n只有一杯熱茶",
      subhead: "三色光專注導引，五分鐘整理思緒。",
      body: "每週四 19:00 淡江 B304 社課教室，隨時歡迎你來坐坐。",
      cta: "加入日常靜心",
      handle: "@tku_zenclub",
      caption: "",
      hashtags: ["#淡江禪學社", "#專注力", "#放鬆練習"],
      altText: "同學們圍坐草坪品茶與專注靜心的溫暖生活照",
    },
  },
  {
    id: "offer",
    name: "席次預約與報名",
    description: "置中大標與清楚 CTA，適合活動報名指引",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "茶會席次預約",
      eventName: "茶會倒數預約",
      offer: "免費席次限定",
      audience: "已看到貼文、想來參加但需要清楚行動指引的同學",
      goal: "traffic",
      notes: "清楚寫出時間地點與報名連結位置，提供一人席與朋友席。",
    }),
    copy: {
      eyebrow: "INVITATION",
      headline: "填表留位\n免費參加",
      subhead: "09/24 (四) 18:30 · 淡江活動中心",
      body: "名額有限，點擊主頁連結即可完成預約。",
      cta: "立即點主頁預約",
      handle: "@tku_zenclub",
      caption: "",
      hashtags: ["#淡江茶會", "#免費席位"],
      altText: "活動時間地點與報名指引清晰圖卡",
    },
  },
  {
    id: "quote",
    name: "克難坡校園引言卡",
    description: "生活共鳴短句，適合淡江學生轉發分享",
    formatId: "feed-square",
    brief: migrateBrief({
      product: "校園生活共鳴",
      eventName: "淡江生活感悟",
      audience: "每天爬坡趕課、在淡水多雨生活中感到疲憊的淡江人",
      goal: "ugc",
      notes: "短、好讀、高共鳴、可截圖、可分享至 IG 限動。",
      style: "簡約、文字有力、留白充足",
    }),
    copy: {
      eyebrow: "TAMKANG LIFE",
      headline: "爬完克難坡\n給心一個安靜的空間",
      subhead: "在淡水的風裡，找回心裡的安靜。",
      body: "",
      cta: "收藏這篇貼文",
      handle: "@tku_zenclub",
      caption: "",
      hashtags: ["#克難坡", "#淡江日常", "#淡江禪學社"],
      altText: "深青漸層留白卡片，寫著爬完克難坡給心靈安靜空間的共鳴金句",
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
