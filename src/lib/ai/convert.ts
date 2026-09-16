import type { CampaignPlan, ContentKind } from "@/lib/studio/types";
import { carouselPageLine, carouselPagesFromPlan } from "./carousel-pages.ts";
import { tidyCopy } from "../zen/review.ts";

export type ConvertedPack = {
  kind: ContentKind;
  title: string;
  items: string[];
};

export function convertPlan(plan: CampaignPlan, kind: ContentKind): ConvertedPack {
  const when = plan.subhead || plan.cta;
  if (kind === "carousel") {
    const pages = carouselPagesFromPlan(plan).map((page, i) => carouselPageLine(page, i));
    return { kind, title: "Carousel", items: pages };
  }
  if (kind === "story") {
    const frames = plan.storyFrames?.length ? plan.storyFrames : plan.storyBeats;
    return {
      kind,
      title: "Story 3–5 則",
      items: frames.length ? frames : [plan.hook, when, plan.cta],
    };
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

export function captionBody(plan: {
  hook: string;
  body: string;
  captions?: { text: string }[];
  copyPacks?: { tone: string; body: string }[];
}) {
  const hook = plan.hook.trim();
  const body = (plan.body || "").trim();
  if (body && body !== hook) return body;
  return (
    plan.copyPacks?.find((pack) => pack.tone === "student")?.body ||
    plan.captions?.[0]?.text ||
    ""
  ).trim();
}

export function packCaption(plan: CampaignPlan, pack: ConvertedPack) {
  if (pack.kind === "ig-post" || pack.kind === "threads" || pack.kind === "line") {
    return pack.items.join("\n");
  }
  return rewriteCopyPack({
    hook: plan.hook,
    body: captionBody(plan),
    cta: plan.cta,
    hashtags: plan.hashtags,
  }).caption;
}

export function captionFromCopyPack(pack: { hook: string; body: string; cta: string; hashtags?: string[] }) {
  const hook = pack.hook.trim();
  let body = pack.body.trim();
  if (hook && (body === hook || body.startsWith(`${hook}\n`))) {
    body = body.slice(hook.length).trim();
  }
  return tidyCopy([hook, body, pack.cta, (pack.hashtags ?? []).join(" ")].filter(Boolean).join("\n"));
}

function isCaptionMetaLine(line: string) {
  return /\d{1,2}\/\d{1,2}|19:00|淡江|淡水|想找人一起|^#/.test(line);
}

/** 快速修改 replaces the first line; keep the rest of the student body. */
export function rewriteCopyPack(
  pack: { hook: string; body: string; cta: string; hashtags?: string[] },
  previousHook?: string,
) {
  const hook = pack.hook.trim();
  const prev = previousHook?.trim();
  const lines = pack.body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line): line is string => Boolean(line && line !== hook && line !== prev));
  if (
    lines[0] &&
    !isCaptionMetaLine(lines[0]) &&
    (lines.length >= 3 || /[？?]$/.test(lines[0]))
  ) {
    lines.shift();
  }
  const body = lines.join("\n");
  return {
    hook,
    body,
    cta: pack.cta,
    hashtags: pack.hashtags,
    caption: captionFromCopyPack({ ...pack, hook, body }),
  };
}
