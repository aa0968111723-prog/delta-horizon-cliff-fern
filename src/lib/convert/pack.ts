import type { CampaignPlan, ContentKind } from "../studio/types.ts";

export type ConvertedPack = {
  kind: ContentKind;
  title: string;
  items: { heading: string; body: string; visual: string }[];
};

export function convertPlan(plan: CampaignPlan, kind: ContentKind): ConvertedPack {
  const hook = plan.hook || plan.headline;
  if (kind === "carousel") {
    const pages = plan.carouselPages?.length
      ? plan.carouselPages
      : [
          { headline: hook, subhead: "", body: plan.insight, visualNote: "Hook" },
          { headline: "情境", subhead: "", body: plan.concept, visualNote: "淡江生活" },
          { headline: "卡住的地方", subhead: "", body: plan.insight, visualNote: "痛點" },
          { headline: plan.campaignName, subhead: "", body: plan.body, visualNote: "活動" },
          { headline: plan.cta, subhead: plan.subhead, body: `${plan.subhead}`, visualNote: "CTA" },
        ];
    return {
      kind,
      title: "Carousel",
      items: pages.map((page, i) => ({
        heading: i === 0 ? "Page 1 Hook" : `Page ${i + 1}`,
        body: [page.headline, page.subhead, page.body].filter(Boolean).join("\n"),
        visual: page.visualNote,
      })),
    };
  }
  if (kind === "story") {
    const beats = plan.storyBeats?.length ? plan.storyBeats : [hook, plan.campaignName, plan.cta];
    return {
      kind,
      title: "Story 3–5 張",
      items: beats.slice(0, 5).map((beat, i) => ({
        heading: `張 ${i + 1}`,
        body: beat,
        visual: i === beats.length - 1 ? "時間地點＋CTA" : "大字，少資訊",
      })),
    };
  }
  if (kind === "reels") {
    const beats = plan.reelsScript?.length
      ? plan.reelsScript
      : [
          { start: 0, end: 3, visual: "生活畫面", caption: hook, voiceover: hook, transition: "切", assetHint: "淡水或捷運" },
          { start: 3, end: 7, visual: "光", caption: plan.campaignName, voiceover: plan.subhead, transition: "疊字", assetHint: "三色光" },
          { start: 7, end: 12, visual: "人坐下", caption: "人到了就好", voiceover: plan.insight, transition: "慢推", assetHint: "現場" },
          { start: 12, end: 17, visual: "資訊", caption: plan.subhead, voiceover: plan.body, transition: "卡片", assetHint: "主視覺" },
          { start: 17, end: 20, visual: "CTA", caption: plan.cta, voiceover: plan.cta, transition: "淡出", assetHint: "龜龜" },
        ];
    return {
      kind,
      title: "Reels Script",
      items: beats.map((beat) => ({
        heading: `${beat.start}–${beat.end} 秒`,
        body: `畫面：${beat.visual}\n字幕：${beat.caption}\n旁白：${beat.voiceover}\n轉場：${beat.transition}`,
        visual: beat.assetHint,
      })),
    };
  }
  if (kind === "threads") {
    return {
      kind,
      title: "Threads",
      items: [
        {
          heading: "Threads",
          body: plan.threadsPost?.caption || `${hook}\n${plan.campaignName}。${plan.cta}`,
          visual: plan.threadsPost?.visualNote || "1:1",
        },
      ],
    };
  }
  if (kind === "line") {
    return {
      kind,
      title: "LINE",
      items: [
        {
          heading: plan.lineCopy?.title || plan.campaignName,
          body: plan.lineCopy?.body || `${hook}\n${plan.subhead}`,
          visual: plan.lineCopy?.cta || plan.cta,
        },
      ],
    };
  }
  return {
    kind: "ig-post",
    title: "IG Post",
    items: [
      {
        heading: hook,
        body: plan.captions[0]?.text || `${hook}\n${plan.body}\n${plan.cta}`,
        visual: plan.visualDirection,
      },
    ],
  };
}

export const CONVERT_TARGETS: { id: ContentKind; label: string }[] = [
  { id: "ig-post", label: "IG Post" },
  { id: "carousel", label: "Carousel" },
  { id: "story", label: "Story" },
  { id: "threads", label: "Threads" },
  { id: "line", label: "LINE" },
  { id: "reels", label: "Reels Script" },
];

export function allConvertedPacks(plan: CampaignPlan): Partial<Record<ContentKind, ConvertedPack["items"]>> {
  return Object.fromEntries(CONVERT_TARGETS.map((item) => [item.id, convertPlan(plan, item.id).items])) as Partial<
    Record<ContentKind, ConvertedPack["items"]>
  >;
}
