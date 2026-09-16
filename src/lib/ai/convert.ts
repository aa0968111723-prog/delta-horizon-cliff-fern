import type { CampaignPlan, CarouselPagePlan, ContentKind } from "@/lib/studio/types";

export type ConvertedPack = {
  kind: ContentKind;
  title: string;
  items: string[];
};

const PAGE_ROLE: Record<string, string> = {
  cover: "封面 Hook",
  problem: "情境",
  detail: "痛點",
  proof: "活動內容",
  cta: "CTA",
  close: "收束",
};

export function carouselPageLine(page: Pick<CarouselPagePlan, "role" | "headline">, index: number) {
  const role = PAGE_ROLE[page.role] ?? page.role;
  return `第 ${index + 1} 頁 ${role}：${page.headline.replace(/\n/g, " ")}`;
}

export function convertPlan(plan: CampaignPlan, kind: ContentKind): ConvertedPack {
  const when = plan.subhead || plan.cta;
  if (kind === "carousel") {
    const pages = plan.carouselPages.length
      ? plan.carouselPages.map((page, i) => carouselPageLine(page, i))
      : [
          `第 1 頁 封面 Hook：${plan.hook}`,
          `第 2 頁 情境：${plan.insight}`,
          `第 3 頁 痛點：${plan.concept}`,
          `第 4 頁 活動內容：${plan.body}`,
          `第 5 頁 CTA：${plan.cta}`,
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
          `0–3 秒 Hook：${plan.reelsScript.hook}`,
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

export function packCaption(plan: CampaignPlan, pack: ConvertedPack) {
  if (pack.kind === "ig-post" || pack.kind === "threads" || pack.kind === "line") {
    return pack.items.join("\n");
  }
  const tags = plan.hashtags.join(" ");
  return [plan.hook, plan.body, plan.cta, tags].filter(Boolean).join("\n");
}

export function captionFromCopyPack(pack: { hook: string; body: string; cta: string; hashtags?: string[] }) {
  return [pack.hook, pack.body, pack.cta, (pack.hashtags ?? []).join(" ")].filter(Boolean).join("\n");
}
