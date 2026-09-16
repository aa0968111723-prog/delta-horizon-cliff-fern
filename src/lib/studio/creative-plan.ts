import { completeCarouselPages } from "./carousel.ts";
import { emptyBrief } from "./brief.ts";
import type { Campaign } from "./campaign-types.ts";
import type { Brief, CampaignPlan, CarouselPagePlan, CarouselPageRole } from "./types.ts";
import type { MultimodalConversionResult, ZenVisualDirection } from "./zen-prompt-engine.ts";

const ROLE_MAP: CarouselPageRole[] = ["cover", "problem", "detail", "proof", "cta"];

export function briefFromCampaign(campaign: Campaign): Brief {
  return {
    ...emptyBrief(),
    product: campaign.name,
    eventName: campaign.name,
    schedule: `${campaign.date} ${campaign.time}`.trim(),
    location: campaign.location,
    offer: campaign.mainCta,
    audience: "淡江大學學生（新生、通勤、宿舍、期中壓力）",
    goal: campaign.type === "recruitment" ? "conversion" : campaign.type === "daily" ? "ugc" : "awareness",
    features: [campaign.theme, campaign.oneLiner, campaign.studentPain].filter(Boolean).join("／"),
    style: "溫暖、生活感、不說教",
    notes: campaign.description,
    deliverables: { post: true, story: true, carousel: true, reels: true },
  };
}

export function briefFromTopic(topic: string, direction: ZenVisualDirection, extras?: { date?: string; location?: string; cta?: string }): Brief {
  return {
    ...emptyBrief(),
    product: topic,
    eventName: topic,
    schedule: extras?.date ?? "",
    location: extras?.location ?? "淡江大學",
    offer: extras?.cta ?? direction.subhead,
    audience: "淡江大學學生（新生、通勤、宿舍、期中壓力）",
    goal: "awareness",
    features: direction.concept,
    style: direction.atmosphere,
    notes: direction.composition,
    deliverables: { post: true, story: true, carousel: true, reels: true },
  };
}

export function planFromCreativeWave(input: {
  topic: string;
  direction: ZenVisualDirection;
  conversion: MultimodalConversionResult;
  source: "live" | "mock";
  campaign?: Campaign | null;
}): CampaignPlan {
  const { direction, conversion, topic, source, campaign } = input;
  const headline = direction.headline;
  const cta = conversion.igPost.cta || campaign?.mainCta || "點主頁連結預約";
  const pages: CarouselPagePlan[] = conversion.carousel.pages.map((page, index) => ({
    role: ROLE_MAP[index] ?? "detail",
    headline: page.headline,
    subhead: index === 0 ? direction.subhead : "",
    body: page.body,
    cta: index >= conversion.carousel.pages.length - 1 ? cta : "",
    visualNote: page.visualTip,
    templateId: index === 0 ? "editorial" : index === conversion.carousel.pages.length - 1 ? "offer" : "quote",
  }));
  const filled = completeCarouselPages(pages, {
    headline,
    subhead: direction.subhead,
    body: conversion.igPost.caption.slice(0, 80),
    cta,
    hook: conversion.igPost.headline,
    insight: direction.concept,
    templateId: "editorial",
  });
  return {
    campaignName: campaign?.name || topic.slice(0, 40) || "淡江禪學社活動",
    concept: direction.concept,
    insight: campaign?.studentPain || direction.atmosphere,
    hook: conversion.igPost.headline.replace(/\n/g, " "),
    visualTheme: direction.atmosphere,
    visualDirection: `${direction.composition} Prompt：${direction.imagePrompt}`,
    templateId: "editorial",
    colorMood: direction.colorPalette.map((c) => `${c.name} ${c.hex}`).join("／"),
    eyebrow: "TAMKANG ZEN",
    headline,
    subhead: direction.subhead,
    body: conversion.carousel.pages[2]?.body || conversion.igPost.caption.split("\n")[0] || direction.concept,
    cta,
    captions: [
      { style: "敘事", text: conversion.igPost.caption },
      { style: "Threads", text: conversion.threads.post },
    ],
    hashtags: conversion.igPost.hashtags,
    storyBeats: conversion.story.cards.map((c) => `${c.title}：${c.copy}`),
    carouselPages: filled,
    assetNeeds: [
      { kind: "photo", title: "生活感主視覺", detail: direction.imagePrompt, required: true },
      { kind: "logo", title: "三色光標誌", detail: "透明底，放角落不搶標題", required: true },
    ],
    checklist: [
      "標題兩行以內，第一眼讀得完",
      "時間地點寫進畫面或文案",
      "沒有宗教說教與佛學專有名詞",
      "CTA 指向主頁連結或私訊",
      "色盤接近淡水夜青／宣紙白／晨曦暖光",
    ],
    altText: `${topic}，${direction.atmosphere}，淡江大學禪學社活動宣傳。`,
    qaNotes: [direction.typography, direction.composition],
    generatedAt: Date.now(),
    source,
  };
}

export function suggestedScheduleSlots(baseDate?: string): { carousel: string; story: string; reels: string; post: string } {
  const start = baseDate && /^\d{4}-\d{2}-\d{2}/.test(baseDate) ? new Date(`${baseDate.slice(0, 10)}T20:00:00+08:00`) : new Date("2026-09-18T20:00:00+08:00");
  const fmt = (offsetDays: number, hour = 20) => {
    const d = new Date(start.getTime() - offsetDays * 86400000);
    d.setHours(hour, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hour)}:00`;
  };
  return {
    carousel: fmt(6, 20),
    story: fmt(4, 21),
    post: fmt(3, 19),
    reels: fmt(1, 18),
  };
}
