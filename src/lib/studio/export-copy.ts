import type { Campaign, ContentItem } from "../creative/types.ts";
import {
  captionMeter,
  convertCopyForSurface,
  projectImageNote,
  reviewIgSurface,
  scheduleReminder,
  surfaceFromFormat,
} from "./ig-surfaces.ts";
import { preferredCopyVariant } from "./copy-tones.ts";
import type { Project } from "./types.ts";

function pageCountOf(project: Project) {
  const slides = project.slides?.[project.activeFormatId];
  if (slides && slides.length) return slides.length;
  return project.artboards[project.activeFormatId] ? 1 : 0;
}

export function buildExportCopyPack(
  project: Project,
  extras?: {
    contentItems?: ContentItem[];
    campaigns?: Campaign[];
  },
) {
  const pack = project.plan?.copyPack;
  const variant = preferredCopyVariant(pack);
  const surface = surfaceFromFormat(project.activeFormatId, pageCountOf(project));
  const converted = convertCopyForSurface(pack, surface, project.copy.caption, project.copy.hashtags);
  const caption = converted.caption
    || (variant
      ? [variant.body, variant.cta, variant.hashtags.join(" ")].filter(Boolean).join("\n\n")
      : [project.copy.caption, project.copy.hashtags.join(" ")].filter(Boolean).join("\n\n"));
  const meter = captionMeter(caption, converted.hashtags.length ? converted.hashtags : project.copy.hashtags);
  const linked = extras?.contentItems?.find((item) => item.projectId === project.id)
    ?? extras?.contentItems?.find((item) => item.title === project.name)
    ?? null;
  const campaign = extras?.campaigns?.find((item) => item.id === linked?.campaignId);
  const imageNote = projectImageNote(project) || converted.imageNote;
  const reminder = scheduleReminder({
    schedule: project.brief.schedule || campaign?.eventTime,
    location: project.brief.location || campaign?.location,
    content: linked,
  });
  const review = reviewIgSurface(surface, converted, {
    schedule: project.brief.schedule || campaign?.eventTime,
    location: project.brief.location || campaign?.location,
    registrationUrl: project.brief.notes.match(/https?:\/\/\S+/)?.[0],
    pageCount: pageCountOf(project),
  });
  const failed = review.filter((item) => !item.pass);

  return [
    `禪作所一人發佈包｜${project.name}`,
    `尺寸：${project.activeFormatId}（${surface}）`,
    "這是本機輸出，不是 Instagram 發文，也不含官方 Insights。",
    "",
    "【貼文文案】",
    caption || "（尚未有文案）",
    `字數 ${meter.chars}/${meter.charLimit}　第一行 ${meter.previewChars}/${meter.previewLimit}　Hashtag ${meter.hashtags}/${meter.hashtagLimit}`,
    project.copy.altText ? `\n【Alt】\n${project.copy.altText}` : "",
    "",
    "【畫面檔】",
    pageCountOf(project) > 1
      ? `下載一人發佈包時會附上 ${pageCountOf(project)} 頁目前畫布 PNG 與這份備註。這是本機檔，不是 Instagram 發文。`
      : "下載一人發佈包時會附上目前畫布 PNG 與這份備註。這是本機檔，不是 Instagram 發文。",
    "",
    "【畫面備註】",
    imageNote,
    "",
    "【排程提醒】",
    reminder,
    failed.length
      ? `\n【學生視角還要修】\n${failed.map((item) => `- ${item.question}：${item.feedback}`).join("\n")}`
      : "\n【學生視角】目前這則通過第一句、字數與時間地點檢查。",
    pack?.threads ? `\n【Threads】\n${pack.threads}` : "",
    pack?.line ? `\n【LINE】\n${pack.line}` : "",
    converted.overlay.length && surface === "story"
      ? `\n【限動逐則】\n${converted.overlay.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
      : pack?.storyFrames?.length
        ? `\n【限動逐則】\n${pack.storyFrames.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
        : "",
    converted.overlay.length && surface === "carousel"
      ? `\n【輪播各頁】\n${converted.overlay.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
      : "",
    pack?.reelsScript?.length ? `\n【Reels 腳本】\n${pack.reelsScript.map((item) => `${item.timing} ${item.subtitle}`).join("\n")}` : "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}
