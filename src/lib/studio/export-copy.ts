import type { Campaign, ContentItem } from "../creative/types.ts";
import { captionMeter, convertCopyForSurface, projectImageNote, scheduleReminder, surfaceFromFormat } from "./ig-surfaces.ts";
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
  const variant = pack?.variants.find((item) => item.tone === "學生版") ?? pack?.variants[0];
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
  const imageNote = projectImageNote(project);
  const reminder = scheduleReminder({
    schedule: project.brief.schedule || campaign?.eventTime,
    location: project.brief.location || campaign?.location,
    content: linked,
  });

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
    "【畫面備註】",
    imageNote,
    "",
    "【排程提醒】",
    reminder,
    pack?.threads ? `\n【Threads】\n${pack.threads}` : "",
    pack?.line ? `\n【LINE】\n${pack.line}` : "",
    converted.overlay.length && surface === "story"
      ? `\n【限動逐則】\n${converted.overlay.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
      : pack?.storyFrames?.length
        ? `\n【限動逐則】\n${pack.storyFrames.map((item, index) => `${index + 1}. ${item}`).join("\n")}`
        : "",
    pack?.reelsScript?.length ? `\n【Reels 腳本】\n${pack.reelsScript.map((item) => `${item.timing} ${item.subtitle}`).join("\n")}` : "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";
}
