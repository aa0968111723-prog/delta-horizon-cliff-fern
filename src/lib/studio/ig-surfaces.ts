import type { ContentItem } from "../creative/types.ts";
import { preferredCopyVariant } from "./copy-tones.ts";
import type {
  CampaignPlan,
  CopyDeck,
  CopyPack,
  CopyVariant,
  FormatId,
  Project,
  StudentReviewItem,
} from "./types.ts";

export type IgSurface = "feed" | "story" | "reels" | "carousel";

export const IG_SURFACES: { id: IgSurface; label: string; hint: string }[] = [
  { id: "feed", label: "Feed 貼文", hint: "4:5 主視覺＋完整貼文文案" },
  { id: "story", label: "Story 限動", hint: "9:16，每則一句，3–5 則" },
  { id: "reels", label: "Reels", hint: "封面＋前 3 秒 Hook" },
  { id: "carousel", label: "Carousel 輪播", hint: "多頁說完，末頁要有行動" },
];

export const IG_CAPTION_LIMIT = 2200;
export const IG_CAPTION_PREVIEW = 125;
export const IG_HASHTAG_LIMIT = 30;
export const STORY_FRAME_LIMIT = 48;
export const REELS_HOOK_LIMIT = 40;

export function countChars(text: string) {
  return [...(text ?? "")].length;
}

export function firstCaptionLine(text: string) {
  return (text ?? "").split(/\n/)[0]?.trim() ?? "";
}

export function formatIdForSurface(surface: IgSurface, current?: FormatId): FormatId {
  if (surface === "story") return "story";
  if (surface === "reels") return "reels-cover";
  if (
    (surface === "feed" || surface === "carousel")
    && (current === "feed-square" || current === "feed-landscape" || current === "feed-portrait")
  ) {
    return current;
  }
  return "feed-portrait";
}

export function surfaceFromFormat(formatId: FormatId, pageCount = 1): IgSurface {
  if (formatId === "story") return "story";
  if (formatId === "reels-cover") return "reels";
  if (pageCount > 1) return "carousel";
  return "feed";
}

export type CaptionMeter = {
  chars: number;
  charLimit: number;
  previewChars: number;
  previewLimit: number;
  hashtags: number;
  hashtagLimit: number;
  overCharLimit: boolean;
  overPreview: boolean;
  overHashtags: boolean;
};

export function captionMeter(caption: string, hashtags: string[] = []): CaptionMeter {
  const chars = countChars(caption);
  const previewChars = countChars(firstCaptionLine(caption));
  const tags = hashtags.length
    ? hashtags
    : [...new Set(caption.match(/#[\p{L}\p{N}_]+/gu) ?? [])];
  return {
    chars,
    charLimit: IG_CAPTION_LIMIT,
    previewChars,
    previewLimit: IG_CAPTION_PREVIEW,
    hashtags: tags.length,
    hashtagLimit: IG_HASHTAG_LIMIT,
    overCharLimit: chars > IG_CAPTION_LIMIT,
    overPreview: previewChars > IG_CAPTION_PREVIEW,
    overHashtags: tags.length > IG_HASHTAG_LIMIT,
  };
}

export type SurfaceCopy = {
  surface: IgSurface;
  formatId: FormatId;
  caption: string;
  overlay: string[];
  hashtags: string[];
  imageNote: string;
};

function studentVariant(pack?: CopyPack | null): CopyVariant | undefined {
  return preferredCopyVariant(pack);
}

export function composeCaption(caption: string, hashtags: string[] = []) {
  const body = (caption ?? "").trim();
  const tags = hashtags.map((tag) => tag.trim()).filter(Boolean);
  if (!tags.length) return body;
  if (tags.every((tag) => body.includes(tag))) return body;
  return [body, tags.join(" ")].filter(Boolean).join("\n\n");
}

export function convertCopyForSurface(
  pack: CopyPack | null | undefined,
  surface: IgSurface,
  fallbackCaption = "",
  fallbackHashtags: string[] = [],
  currentFormat?: FormatId,
): SurfaceCopy {
  const variant = studentVariant(pack);
  const hashtags = variant?.hashtags?.length ? variant.hashtags : fallbackHashtags;
  const feedCaption = variant
    ? [variant.body, variant.cta, hashtags.join(" ")].filter(Boolean).join("\n\n")
    : composeCaption(fallbackCaption, fallbackHashtags);
  const formatId = formatIdForSurface(surface, currentFormat);

  if (surface === "story") {
    const overlay = (pack?.storyFrames?.length ? pack.storyFrames : [variant?.hook, variant?.cta].filter(Boolean) as string[])
      .map((frame) => frame.trim())
      .filter(Boolean)
      .slice(0, 5);
    return {
      surface,
      formatId,
      caption: overlay.join("\n"),
      overlay,
      hashtags,
      imageNote: "限動每則只留一句；時間與 CTA 放最後一則，避開上下安全區。",
    };
  }

  if (surface === "reels") {
    const overlay = (pack?.reelsScript ?? []).map((beat) => beat.subtitle.trim()).filter(Boolean);
    return {
      surface,
      formatId,
      caption: pack?.revisedCaption || feedCaption,
      overlay,
      hashtags,
      imageNote: "封面只放前 3 秒 Hook；安全區避開 Rec 與字幕帶。",
    };
  }

  if (surface === "carousel") {
    const overlay = (pack?.carouselPages ?? []).map((page) => page.trim()).filter(Boolean);
    return {
      surface,
      formatId,
      caption: feedCaption,
      overlay,
      hashtags,
      imageNote: "輪播封面只留 Hook；資訊頁最多三層；末頁只留時間、地點與行動。",
    };
  }

  return {
    surface,
    formatId,
    caption: pack?.revisedCaption || feedCaption,
    overlay: [],
    hashtags,
    imageNote: "Feed 主視覺放校園或社員，標題最多兩行，CTA 不壓臉。",
  };
}

export function copyPatchForSurface(
  converted: SurfaceCopy,
  current: Pick<CopyDeck, "headline" | "subhead" | "body" | "cta">,
): Partial<CopyDeck> {
  const patch: Partial<CopyDeck> = {
    caption: converted.caption,
    hashtags: converted.hashtags,
  };
  if (converted.surface === "story") {
    if (converted.overlay[0]) patch.headline = converted.overlay[0];
    if (converted.overlay.length > 1) {
      patch.body = converted.overlay.slice(1, -1).join("\n") || converted.overlay[1];
    }
    const last = converted.overlay.at(-1);
    if (last) patch.cta = last;
  }
  if (converted.surface === "reels") {
    if (converted.overlay[0]) patch.headline = converted.overlay[0];
    if (converted.overlay[1]) patch.subhead = converted.overlay[1];
    const last = converted.overlay.at(-1);
    if (last) patch.cta = last;
  }
  if (converted.surface === "carousel") {
    if (converted.overlay[0]) patch.headline = converted.overlay[0];
    const last = converted.overlay.at(-1);
    if (last) patch.cta = last;
  }
  if (converted.surface === "feed" && !patch.headline) {
    patch.headline = current.headline;
  }
  return patch;
}

function item(
  question: string,
  pass: boolean,
  feedback: string,
): StudentReviewItem {
  return { question, pass, feedback };
}

export function reviewIgSurface(
  surface: IgSurface,
  converted: SurfaceCopy,
  extras?: { schedule?: string; location?: string; registrationUrl?: string; pageCount?: number },
): StudentReviewItem[] {
  const meter = captionMeter(converted.caption, converted.hashtags);
  const hasTime = Boolean(extras?.schedule && extras.location);
  const shared = [
    item(
      "同學會在第一句停下來嗎？",
      countChars(firstCaptionLine(converted.caption) || converted.overlay[0] || "") > 0
        && !/誠摯邀請|法喜|殊勝/.test(converted.caption),
      /誠摯邀請|法喜|殊勝/.test(converted.caption)
        ? "第一句還在報社團全名或佛學詞，淡江學生會滑過去。"
        : "第一句先說生活，沒有先報社團全名。",
    ),
  ];

  if (surface === "feed") {
    return [
      ...shared,
      item(
        "貼文文案會不會被「更多」吃掉重點？",
        !meter.overPreview,
        meter.overPreview
          ? `第一行 ${meter.previewChars} 字，超過約 ${IG_CAPTION_PREVIEW} 字會被收合。時間地點或 Hook 應留在第一行。`
          : `第一行 ${meter.previewChars} 字，摺疊前看得到。`,
      ),
      item(
        "貼文有沒有超過 Instagram 字數？",
        !meter.overCharLimit && !meter.overHashtags,
        meter.overCharLimit || meter.overHashtags
          ? `目前 ${meter.chars}/${IG_CAPTION_LIMIT} 字、${meter.hashtags}/${IG_HASHTAG_LIMIT} 個 hashtag。`
          : `目前 ${meter.chars}/${IG_CAPTION_LIMIT} 字、${meter.hashtags} 個 hashtag。`,
      ),
      item(
        "時間地點一眼找不找得到？",
        hasTime && /時間|地點|\d{1,2}\/\d{1,2}|:\d{2}/.test(converted.caption),
        hasTime ? "時間與地點有寫進文案。" : "仍缺時間或地點，發布前必須補上。",
      ),
    ];
  }

  if (surface === "story") {
    const long = converted.overlay.filter((frame) => countChars(frame) > STORY_FRAME_LIMIT);
    return [
      ...shared,
      item(
        "限動是不是 3 到 5 則、每則一句？",
        converted.overlay.length >= 3 && converted.overlay.length <= 5 && long.length === 0,
        converted.overlay.length < 3
          ? "少於 3 則，同學還沒進入活動就結束。"
          : converted.overlay.length > 5
            ? "超過 5 則，限動會被划掉。"
            : long.length
              ? `有 ${long.length} 則超過 ${STORY_FRAME_LIMIT} 字，手機上看起來像作文。`
              : `${converted.overlay.length} 則，每則一句。`,
      ),
      item(
        "最後一則有沒有時間或行動？",
        /時間|地點|來|報名|保留/.test(converted.overlay.at(-1) ?? ""),
        /時間|地點|來|報名|保留/.test(converted.overlay.at(-1) ?? "")
          ? "最後一則把行動說清楚。"
          : "最後一則還在氣氛句，同學不知道要幹嘛。",
      ),
    ];
  }

  if (surface === "reels") {
    const hook = converted.overlay[0] ?? firstCaptionLine(converted.caption);
    return [
      ...shared,
      item(
        "前 3 秒有沒有 Hook？",
        Boolean(hook) && countChars(hook) <= REELS_HOOK_LIMIT,
        !hook
          ? "還沒有 Reels 字幕，封面不會自己說話。"
          : countChars(hook) > REELS_HOOK_LIMIT
            ? `前 3 秒字幕 ${countChars(hook)} 字，會唸不完。`
            : "前 3 秒有一句學生聽得懂的 Hook。",
      ),
      item(
        "有沒有完整 5 段節奏？",
        converted.overlay.length >= 5,
        converted.overlay.length >= 5
          ? "有開頭、生活、現場、細節與行動。"
          : "腳本還不完整，不要假裝能直接上傳。",
      ),
    ];
  }

  const pageCount = extras?.pageCount ?? converted.overlay.length;
  const last = converted.overlay.at(-1) ?? "";
  return [
    ...shared,
    item(
      "輪播有沒有把一件事說完？",
      pageCount >= 5 && pageCount <= 8,
      pageCount < 2
        ? "現在只有單張。要輪播請先在企劃勾選 Carousel 再生成頁面，不會假裝已有 6 頁。"
        : pageCount < 5
          ? `目前 ${pageCount} 頁，同學還沒看懂活動。`
          : `${pageCount} 頁，夠說完一個主題。`,
    ),
    item(
      "末頁有沒有明確行動？",
      /時間|地點|來|報名|保留|找朋友/.test(last),
      /時間|地點|來|報名|保留|找朋友/.test(last)
        ? "末頁把時間與行動收在一起。"
        : "末頁還在收感情，沒有告訴同學下一步。",
    ),
  ];
}

export function reviewStudentCaption(input: {
  caption: string;
  hook?: string;
  cta?: string;
  schedule?: string;
  location?: string;
  registrationUrl?: string;
  hashtags?: string[];
}): StudentReviewItem[] {
  const caption = input.caption;
  const meter = captionMeter(caption, input.hashtags);
  const literary = /詩意|靈魂深處|與自己和解|在這個快節奏|一場心靈|讓我們一起/.test(caption);
  const religious = /殊勝|法喜|開悟|修行|佛學/.test(caption);
  const aiish = /在這個快節奏|賦能|開啟一段|讓我們一起/.test(caption);
  return [
    item("我會停下來嗎？", Boolean(input.hook) && !/誠摯邀請/.test(input.hook ?? ""), "第一句先說學生正在經歷的事。"),
    item("我看得懂活動在做什麼嗎？", caption.length > 12, "用生活語言說明，不要只留抽象情緒。"),
    item("是不是太宗教或太嚴肅？", !religious, religious ? "還有佛學詞，禪要轉成慢下來與整理情緒。" : "沒有艱澀佛學詞。"),
    item("是不是太文青？", !literary, literary ? "句子太像文青金句，淡江同學會覺得不是在跟他說話。" : "口吻像社團同學，不是散文。"),
    item("是不是太像 AI？", !aiish, aiish ? "句型太工整，把其中一句改成口語。" : "句型有長短與口語。"),
    item(
      "是不是太長？",
      !meter.overCharLimit && !meter.overPreview,
      meter.overCharLimit
        ? `全文 ${meter.chars} 字，超過 Instagram ${IG_CAPTION_LIMIT} 字上限。`
        : meter.overPreview
          ? `第一行 ${meter.previewChars} 字，重點會被「更多」收起來。`
          : `全文 ${meter.chars} 字，第一行 ${meter.previewChars} 字。`,
    ),
    item(
      "時間地點清楚嗎？",
      Boolean(input.schedule && input.location),
      input.schedule && input.location ? "時間與地點有寫進去。" : "仍缺時間或地點，發布前必須補上。",
    ),
    item("我會想找朋友嗎？", /朋友|一起來|揪/.test(`${input.cta ?? ""} ${caption}`), /朋友|一起來|揪/.test(`${input.cta ?? ""} ${caption}`) ? "有找朋友的理由。" : "還缺一句值得轉傳或揪人的話。"),
    item(
      "我知道怎麼報名嗎？",
      Boolean(input.registrationUrl),
      input.registrationUrl ? "已附報名連結。" : "尚未提供報名連結，文案不會假裝已完成。",
    ),
    item(
      "Hashtag 有沒有超標？",
      !meter.overHashtags,
      meter.overHashtags
        ? `${meter.hashtags} 個 hashtag，Instagram 上限 ${IG_HASHTAG_LIMIT}。`
        : `${meter.hashtags} 個 hashtag。`,
    ),
  ];
}

export function imageNoteFromPlan(plan?: CampaignPlan | null, pageIndex = 0) {
  const pageNote = plan?.carouselPages[pageIndex]?.visualNote?.trim();
  return [
    plan?.visualTheme,
    plan?.visualDirection,
    pageNote,
  ].filter(Boolean).join("\n");
}

export function scheduleReminder(input: {
  schedule?: string;
  location?: string;
  content?: ContentItem | null;
}) {
  const planned = input.content?.plannedAt
    ? `節奏上建議 ${input.content.plannedAt.replace("T", " ").slice(0, 16)} 貼這則${input.content.type ? `（${input.content.type}）` : ""}。`
    : "這則還沒排進日曆。貼之前先到排程對一下活動當天。";
  const event = [input.schedule ? `活動時間 ${input.schedule}` : "", input.location ? `地點 ${input.location}` : ""]
    .filter(Boolean)
    .join("，");
  return [event || "活動時間地點還沒寫進 Brief。", planned, "貼完用現場筆記記下誰來了，不要填假讚數。"].join("\n");
}

export function projectImageNote(project: Project) {
  return imageNoteFromPlan(project.plan, project.slideIndex ?? 0)
    || project.copy.altText
    || "還沒有畫面備註。進 Studio 看主視覺再補一句拍攝／排版提醒。";
}

function overlayFromPlan(project: Project, surface: IgSurface): string[] {
  const pack = project.plan?.copyPack;
  if (surface === "story") {
    if (pack?.storyFrames?.length) return pack.storyFrames.map((frame) => frame.trim()).filter(Boolean);
    return (project.plan?.storyBeats ?? []).map((beat) => beat.trim()).filter(Boolean);
  }
  if (surface === "reels") {
    return (pack?.reelsScript ?? []).map((beat) => beat.subtitle.trim()).filter(Boolean);
  }
  if (surface === "carousel") {
    if (pack?.carouselPages?.length) return pack.carouselPages.map((page) => page.trim()).filter(Boolean);
    return (project.plan?.carouselPages ?? []).map((page) => page.headline.trim()).filter(Boolean);
  }
  return [];
}

export function livePreviewCopy(project: Project, surface: IgSurface, _pageCount = 1): SurfaceCopy {
  const converted = convertCopyForSurface(
    project.plan?.copyPack,
    surface,
    project.copy.caption,
    project.copy.hashtags,
    project.activeFormatId,
  );
  const planOverlay = overlayFromPlan(project, surface);
  const overlay = converted.overlay.length ? converted.overlay : planOverlay;
  const liveHashtags = project.copy.hashtags.length ? project.copy.hashtags : converted.hashtags;
  const onFeedCanvas =
    project.activeFormatId === "feed-square"
    || project.activeFormatId === "feed-portrait"
    || project.activeFormatId === "feed-landscape";
  const onThisCanvas =
    (surface === "story" && project.activeFormatId === "story")
    || (surface === "reels" && project.activeFormatId === "reels-cover")
    || ((surface === "feed" || surface === "carousel") && onFeedCanvas);
  if (onThisCanvas && project.copy.caption.trim()) {
    return {
      ...converted,
      overlay,
      caption: composeCaption(project.copy.caption, liveHashtags),
      hashtags: liveHashtags,
    };
  }
  if (overlay.length && (surface === "story" || converted.overlay.length === 0)) {
    return {
      ...converted,
      overlay,
      caption: surface === "story" ? overlay.join("\n") : converted.caption,
      hashtags: liveHashtags,
    };
  }
  return { ...converted, overlay, hashtags: converted.hashtags.length ? converted.hashtags : liveHashtags };
}

export function surfaceConversionPatch(project: Project, surface: IgSurface) {
  const converted = livePreviewCopy(project, surface);
  return {
    converted,
    formatId: converted.formatId,
    copy: copyPatchForSurface(converted, project.copy),
    planPatch: project.plan
      ? {
          captions: [
            { style: surface === "feed" ? "學生版" : surface, text: converted.caption },
            ...(project.plan.captions ?? []).slice(0, 3),
          ],
          hashtags: converted.hashtags,
        }
      : null,
  };
}
