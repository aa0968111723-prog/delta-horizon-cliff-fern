import type { Brief } from "../studio/types.ts";
import { contentTypeDeliverables } from "./rhythm.ts";
import type { Campaign, ContentItem } from "./types.ts";

export function campaignToBrief(campaign: Campaign, item?: ContentItem): Partial<Brief> {
  return {
    eventName: campaign.name,
    product: campaign.oneLiner || campaign.name,
    schedule: `${campaign.eventDate} ${campaign.eventTime}`.trim(),
    location: campaign.location,
    audience: `淡江大學學生；這次優先回應：${campaign.studentPain}`,
    features: [campaign.oneLiner, campaign.description].filter(Boolean).join("；"),
    style: "自然、年輕、有淡江生活感；把禪轉譯成喘口氣、安定與認識自己",
    offer: campaign.cta,
    notes: [
      campaign.theme ? `活動主題：${campaign.theme}` : "",
      item ? `這一波內容：${item.title}。角度：${item.angle}` : "請提出完整宣傳主軸與三個創意方向。",
      campaign.registrationUrl
        ? `報名連結：${campaign.registrationUrl}`
        : "報名方式尚未填，文案不要假裝已提供。",
    ].filter(Boolean).join("\n"),
    deliverables: item
      ? contentTypeDeliverables(item.type)
      : { post: true, carousel: true, story: true, reels: true },
  };
}

export function campaignImageIdea(campaign: Campaign) {
  return [
    campaign.name,
    campaign.oneLiner,
    campaign.theme ? `主題：${campaign.theme}` : "",
    campaign.studentPain ? `學生正在：${campaign.studentPain}` : "",
    campaign.location ? `地點：${campaign.location}` : "",
  ].filter(Boolean).join("。").slice(0, 500);
}
