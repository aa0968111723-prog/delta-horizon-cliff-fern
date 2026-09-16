import type { CampaignPlan, ContentKind } from "@/lib/studio/types";

export type ConvertedPack = {
  kind: ContentKind;
  title: string;
  items: string[];
};

export function convertPlan(plan: CampaignPlan, kind: ContentKind): ConvertedPack {
  const when = plan.subhead || plan.cta;
  if (kind === "carousel") {
    const pages = plan.carouselPages.length
      ? plan.carouselPages.map((page, i) => `Page ${i + 1} ${page.role}：${page.headline.replace(/\n/g, " ")}`)
      : [
          `Page 1 Hook：${plan.hook}`,
          `Page 2 情境：${plan.insight}`,
          `Page 3 痛點：${plan.concept}`,
          `Page 4 活動：${plan.body}`,
          `Page 5 CTA：${plan.cta}`,
        ];
    return { kind, title: "Carousel", items: pages };
  }
  if (kind === "story") {
    const frames = plan.storyFrames?.length ? plan.storyFrames : plan.storyBeats;
    return { kind, title: "Story 3–5 則", items: frames.length ? frames : [plan.hook, when, plan.cta] };
  }
  if (kind === "reels") {
    const beats = plan.reelsScript?.beats?.length
      ? [
          `Hook ${plan.reelsScript.hook}`,
          ...plan.reelsScript.beats.map(
            (b) =>
              `${b.start}–${b.end} 秒｜畫面：${b.onScreen}／字幕：${b.caption}／旁白：${b.voice}／轉場：${b.transition}／素材：${b.assetHint}`,
          ),
        ]
      : [
          "0–3 秒 Hook：生活問句，畫面是光或呼吸",
          "3–7 秒：淡水／校園情境",
          "7–12 秒：活動是什麼",
          "12–17 秒：為什麼今晚要出門",
          "17–20 秒 CTA：時間地點",
        ];
    return { kind, title: "Reels Script", items: beats };
  }
  if (kind === "threads") {
    return {
      kind,
      title: "Threads",
      items: [plan.threadsPost || `${plan.hook}\n${plan.body}\n${plan.cta}`],
    };
  }
  if (kind === "line") {
    return {
      kind,
      title: "LINE",
      items: [plan.lineCopy || `【${plan.campaignName}】\n${plan.hook}\n${when}\n${plan.cta}`],
    };
  }
  return {
    kind,
    title: "IG Post",
    items: [plan.captions[0]?.text || `${plan.hook}\n${plan.body}`],
  };
}
