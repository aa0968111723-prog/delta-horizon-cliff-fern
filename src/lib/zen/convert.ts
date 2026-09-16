import type { CampaignPlan, CarouselPagePlan } from "../studio/types.ts";

export type ConvertedFormats = {
  post: { hook: string; body: string; cta: string };
  carousel: CarouselPagePlan[];
  story: { headline: string; body: string; visualNote: string }[];
  threads: string;
  line: string;
  reels: NonNullable<CampaignPlan["reelsScript"]>;
};

export function convertFromPlan(plan: CampaignPlan): ConvertedFormats {
  const hook = plan.hook || plan.headline.replace(/\n/g, " ");
  const when = plan.subhead;
  const cta = plan.cta;
  const pages = plan.carouselPages.length
    ? plan.carouselPages
    : defaultCarousel(plan);

  const story = (plan.storyBeats.length ? plan.storyBeats : [hook, plan.insight, `${cta} · ${when}`]).slice(0, 5).map((beat, i) => ({
    headline: i === 0 ? hook : beat.slice(0, 16),
    body: beat,
    visualNote: i === 0 ? "大字 + 夜色或現場光" : "一張畫面一件事",
  }));

  const reels = plan.reelsScript?.length
    ? plan.reelsScript
    : [
        { startSec: 0, endSec: 3, visual: "學生臉或校園夜色特寫", caption: hook, voiceover: hook, transition: "切", assetHint: "現場／淡水黃昏" },
        { startSec: 3, endSec: 7, visual: "坐下來、茶、燈", caption: "不是要你突然很懂禪", voiceover: plan.insight.slice(0, 40), transition: "慢推", assetHint: "茶會或燈光" },
        { startSec: 7, endSec: 12, visual: "三色光或龜龜", caption: plan.campaignName, voiceover: `${plan.campaignName}。`, transition: "切", assetHint: "三色光" },
        { startSec: 12, endSec: 17, visual: "時間地點大字", caption: when, voiceover: when, transition: "切", assetHint: "文字卡" },
        { startSec: 17, endSec: 20, visual: "朋友一起走來", caption: cta, voiceover: `${cta}。找一個朋友也行。`, transition: "淡出", assetHint: "人" },
      ];

  return {
    post: {
      hook,
      body: plan.captions[0]?.text ?? `${hook}\n\n${plan.insight}`,
      cta,
    },
    carousel: pages,
    story,
    threads: plan.threadsPost || `${hook}\n\n${plan.insight}\n\n${when}\n${cta}`,
    line: plan.lineCopy || `${plan.campaignName}\n${when}\n${cta}`,
    reels,
  };
}

function defaultCarousel(plan: CampaignPlan): CarouselPagePlan[] {
  const cta = plan.cta;
  return [
    { role: "cover", headline: plan.headline, subhead: plan.subhead, body: plan.hook, cta, visualNote: "Hook 先行，活動名可小。", templateId: "quote" },
    { role: "problem", headline: "最近是不是\n很滿", subhead: "淡江的日常", body: plan.insight, cta, visualNote: "生活場景，不要廟。", templateId: "quote" },
    { role: "detail", headline: plan.campaignName.replace(/(.*)/, "$1").slice(0, 10), subhead: plan.subhead, body: plan.body, cta, visualNote: "活動內容三件事。", templateId: "editorial" },
    { role: "proof", headline: "來過的人\n通常只是坐著", subhead: "不用先懂禪", body: "沒有考試，也沒有要你變成另一個人。", cta, visualNote: "同學互動。", templateId: "product" },
    { role: "cta", headline: cta, subhead: plan.subhead, body: "時間地點看這頁。找一個朋友一起來也行。", cta, visualNote: "只留資訊。", templateId: "offer" },
    { role: "close", headline: plan.hook.slice(0, 12), subhead: "淡江禪學社", body: plan.cta, cta, visualNote: "可截圖。", templateId: "quote" },
  ];
}
