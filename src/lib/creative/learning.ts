import type { InstagramInsightRow } from "../connections/types.ts";
import type { AssetMeta, BrandKit, CopyPack, StudentReviewItem } from "../studio/types.ts";
import type { Campaign, ContentItem, PostOutcome } from "./types.ts";

export function mergeLearnedPatterns(existing: string[] | undefined, incoming: string[], limit = 12) {
  const next: string[] = [];
  for (const item of [...incoming, ...(existing ?? [])]) {
    const text = item.trim();
    if (!text) continue;
    if (next.some((row) => row === text)) continue;
    next.push(text);
    if (next.length >= limit) break;
  }
  return next;
}

function reviewLessons(reviews: StudentReviewItem[] | undefined) {
  if (!reviews?.length) return [];
  const failed = reviews.filter((item) => !item.pass).map((item) => `學生視角未過「${item.question}」：${item.feedback}`);
  if (failed.length) return failed.slice(0, 4);
  return ["學生視角檢查通過：第一句先說生活，時間地點清楚，不假裝已有報名連結。"];
}

function assetLessons(assets: AssetMeta[]) {
  return assets.flatMap((asset) => {
    const risks = asset.analysis?.risks ?? [];
    if (risks.some((risk) => /宗教|佛像|蓮花|老氣|AI/.test(risk))) {
      return [`素材「${asset.name}」：避開${risks.slice(0, 2).join("、")}，優先用真實社員與校園生活。`];
    }
    if (asset.analysis?.studentFit) {
      return [`素材「${asset.name}」適合淡江學生：${asset.analysis.studentFit}`];
    }
    return [];
  }).slice(0, 4);
}

function rhythmLessons(contentItems: ContentItem[]) {
  const done = contentItems.filter((item) => item.status === "complete" || item.status === "published");
  const types = new Set(done.map((item) => item.type));
  const lessons: string[] = [];
  if (types.has("社員故事") || types.has("活動回顧")) {
    lessons.push("完成內容裡已有社員故事或回顧，下一檔不要整波都只剩活動廣告。");
  }
  if (types.has("Carousel") && types.has("Story")) {
    lessons.push("同一檔活動用 Carousel 說清楚、用 Story 做當日提醒，比重複貼同一張主視覺有效。");
  }
  return lessons;
}

export function lessonsFromInsights(rows: InstagramInsightRow[] | undefined) {
  if (!rows?.length) return [];
  return rows.slice(0, 4).map((row) => (
    `官方 Insights（${row.period}）${row.label}：${row.value.toLocaleString("zh-TW")}。這是授權後的真實數字，不是模擬成效。`
  ));
}

export function lessonsFromOutcomes(outcomes: PostOutcome[] | undefined) {
  if (!outcomes?.length) return [];
  return outcomes.flatMap(formatOutcomeLesson).slice(0, 8);
}

export function formatOutcomeLesson(outcome: PostOutcome) {
  const title = outcome.title.trim() || "這則內容";
  const lines: string[] = [];
  const hook = outcome.hookThatFeltTamkang.trim();
  const who = outcome.whoShowedUp.trim();
  const remember = outcome.remember.trim();
  if (hook) lines.push(`現場：「${title}」覺得像淡江的 Hook「${hook}」`);
  if (who) lines.push(`現場：「${title}」實際來的人／反應：${who}`);
  if (remember) lines.push(`現場：「${title}」下次要記得：${remember}`);
  return lines;
}

export function applyOutcomeToPatterns(existing: string[] | undefined, outcome: PostOutcome) {
  return mergeLearnedPatterns(existing, formatOutcomeLesson(outcome));
}

export function lessonsFromLocalWork(input: {
  brand: BrandKit;
  assets: AssetMeta[];
  campaigns: Campaign[];
  contentItems: ContentItem[];
  copyPacks?: CopyPack[];
  styleNotes?: string[];
  outcomes?: PostOutcome[];
  insights?: InstagramInsightRow[] | null;
}) {
  const copyLessons = (input.copyPacks ?? []).flatMap((pack) => reviewLessons(pack.studentReview));
  const styleLessons = (input.styleNotes ?? []).slice(0, 3).map((note) => `延續已分析的畫面語言：${note}`);
  const campaignLesson = input.campaigns[0]
    ? `最近活動「${input.campaigns[0].name}」先回應：${input.campaigns[0].studentPain}`
    : "";
  return mergeLearnedPatterns(input.brand.memory?.learnedPatterns, [
    ...lessonsFromOutcomes(input.outcomes),
    ...copyLessons,
    ...assetLessons(input.assets),
    ...rhythmLessons(input.contentItems),
    ...styleLessons,
    campaignLesson,
    ...lessonsFromInsights(input.insights ?? undefined),
  ]);
}
