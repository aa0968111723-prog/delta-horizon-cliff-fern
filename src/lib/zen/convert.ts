import type { CampaignPlan, CarouselPagePlan, ContentKind, FormatId } from "../studio/types.ts";

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

export const CONVERT_TARGETS = [
  { id: "post", label: "IG Post", formatId: "feed-portrait" as FormatId, contentKind: "ig-post" as ContentKind },
  { id: "carousel", label: "Carousel", formatId: "feed-portrait" as FormatId, contentKind: "carousel" as ContentKind },
  { id: "story", label: "Story", formatId: "story" as FormatId, contentKind: "story" as ContentKind },
  { id: "reels", label: "Reels", formatId: "reels-cover" as FormatId, contentKind: "reels" as ContentKind },
  { id: "threads", label: "Threads", formatId: "threads" as FormatId, contentKind: "threads" as ContentKind },
  { id: "line", label: "LINE", formatId: "line" as FormatId, contentKind: "line" as ContentKind },
] as const;

export type ConvertTargetId = (typeof CONVERT_TARGETS)[number]["id"];

export function convertTargetById(id: ConvertTargetId) {
  return CONVERT_TARGETS.find((row) => row.id === id)!;
}

export function briefFlagsForTarget(id: ConvertTargetId) {
  return {
    post: id === "post",
    carousel: id === "carousel",
    story: id === "story",
    reels: id === "reels",
    threads: id === "threads",
    line: id === "line",
  };
}

export function previewLines(converted: ConvertedFormats, id: ConvertTargetId): string[] {
  if (id === "post") return [converted.post.hook, converted.post.body, converted.post.cta];
  if (id === "carousel") return converted.carousel.map((p) => p.headline.replace(/\n/g, " "));
  if (id === "story") return converted.story.map((p) => p.headline);
  if (id === "reels") return converted.reels.map((b) => `${b.startSec}–${b.endSec}s ${b.caption}`);
  if (id === "threads") return converted.threads.split("\n").filter(Boolean);
  return converted.line.split("\n").filter(Boolean);
}

export function clipboardText(converted: ConvertedFormats, id: ConvertTargetId) {
  if (id === "post") return `${converted.post.hook}\n\n${converted.post.body}\n\n${converted.post.cta}`;
  if (id === "carousel") return converted.carousel.map((p, i) => `${i + 1}. ${p.headline.replace(/\n/g, " ")}\n${p.body}`).join("\n\n");
  if (id === "story") return converted.story.map((p, i) => `Story ${i + 1} ${p.headline}\n${p.body}`).join("\n\n");
  if (id === "reels") {
    return converted.reels
      .map((b) => `${b.startSec}–${b.endSec}s\n畫面：${b.visual}\n字幕：${b.caption}\n旁白：${b.voiceover}`)
      .join("\n\n");
  }
  if (id === "threads") return converted.threads;
  return converted.line;
}

export function captionForTarget(converted: ConvertedFormats, id: ConvertTargetId) {
  if (id === "post") return `${converted.post.hook}\n\n${converted.post.body}`;
  if (id === "carousel") return converted.carousel.map((p) => p.headline.replace(/\n/g, " ")).join(" → ");
  if (id === "story") return converted.story.map((p) => p.headline).join(" / ");
  if (id === "reels") return converted.reels.map((b) => b.caption).join(" / ");
  if (id === "threads") return converted.threads;
  return converted.line;
}

export function planForConvertTarget(plan: CampaignPlan, converted: ConvertedFormats, id: ConvertTargetId): CampaignPlan {
  if (id === "post") {
    return { ...plan, captions: [{ style: "IG", text: clipboardText(converted, "post") }] };
  }
  if (id === "carousel") return { ...plan, carouselPages: converted.carousel };
  if (id === "story") return { ...plan, storyBeats: converted.story.map((s) => s.body) };
  if (id === "reels") return { ...plan, reelsScript: converted.reels, hook: converted.reels[0]?.caption ?? plan.hook };
  if (id === "threads") {
    return { ...plan, threadsPost: converted.threads, captions: [{ style: "Threads", text: converted.threads }] };
  }
  return { ...plan, lineCopy: converted.line, captions: [{ style: "LINE", text: converted.line }] };
}

export function copyKindForContent(kind: ContentKind) {
  if (kind === "carousel") return "carousel" as const;
  if (kind === "story") return "story" as const;
  if (kind === "reels") return "reels" as const;
  if (kind === "countdown") return "countdown" as const;
  if (kind === "recap") return "recap" as const;
  if (kind === "member-story") return "member" as const;
  if (kind === "knowledge" || kind === "qa") return "knowledge" as const;
  if (kind === "poll") return "emotion" as const;
  return "event" as const;
}

export function tonightAt(daysAhead = 0, hour = 20) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}
