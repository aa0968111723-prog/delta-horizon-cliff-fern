import { HOOK_BANK } from "./identity.ts";
import { engagement } from "./insights.ts";
import type { AcademicMoment, AcademicMomentId } from "./season.ts";
import type { ClubCampaign, IgMemoryPost } from "../creative/types.ts";

const OTHER_SEASON: Record<AcademicMomentId, RegExp> = {
  start: /下學期開學/,
  settle: /選社選到累/,
  midterm: /期中/,
  recover: /期中過後/,
  finals: /期末|考試週|報告週/,
  break: /寒假|車票回家/,
  summer: /暑假|實習開始/,
};

const SEASON_OWN: Record<AcademicMomentId, RegExp> = {
  start: /開學|新生|課表還沒|剛到淡水|第一週/,
  settle: /課表|選社|夕陽/,
  midterm: /期中/,
  recover: /鬆一口氣|交到朋友/,
  finals: /期末|考試|報告/,
  break: /寒假|回家/,
  summer: /暑假|實習/,
};

const BANK_FOR: Record<AcademicMomentId, string[]> = {
  start: [HOOK_BANK[3], HOOK_BANK[5], HOOK_BANK[6]],
  settle: [HOOK_BANK[3], HOOK_BANK[0], HOOK_BANK[4]],
  midterm: [HOOK_BANK[7], HOOK_BANK[0], HOOK_BANK[3]],
  recover: [HOOK_BANK[1], HOOK_BANK[3], HOOK_BANK[2]],
  finals: [HOOK_BANK[0], HOOK_BANK[1], HOOK_BANK[3]],
  break: [HOOK_BANK[1], HOOK_BANK[5], HOOK_BANK[3]],
  summer: [HOOK_BANK[1], HOOK_BANK[4], HOOK_BANK[3]],
};

function firstLine(text: string) {
  return text.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

/** 過季詞不能拿來當今天的第一句。生活問句沒有學期詞就算通過。 */
export function hookFitsSeason(text: string, seasonId: AcademicMomentId) {
  for (const [id, pattern] of Object.entries(OTHER_SEASON) as [AcademicMomentId, RegExp][]) {
    if (id === seasonId) continue;
    if (pattern.test(text)) return false;
  }
  return true;
}

function motifScore(text: string, campaign?: Pick<ClubCampaign, "name" | "oneLiner" | "theme" | "studentPain">) {
  if (!campaign) return 0;
  const blob = `${campaign.name} ${campaign.oneLiner} ${campaign.theme} ${campaign.studentPain}`;
  let n = 0;
  if (/坐/.test(blob) && /坐/.test(text)) n += 8;
  if (/茶/.test(blob) && /茶/.test(text)) n += 4;
  if (/光/.test(blob) && /光|晚上/.test(text)) n += 3;
  if (/朋友/.test(blob) && /朋友/.test(text)) n += 3;
  if (/淡水/.test(text) || /宿舍|捷運|課表/.test(text)) n += 2;
  return n;
}

export type FeaturedSuggestion = {
  hook: string;
  why: string;
  query: string;
};

export function featuredHookForNow(input: {
  season: AcademicMoment;
  campaign?: Pick<ClubCampaign, "name" | "oneLiner" | "theme" | "studentPain">;
  posts?: Array<Pick<IgMemoryPost, "caption" | "saves" | "comments" | "reach" | "likes" | "shares" | "analysis">>;
}): FeaturedSuggestion {
  const season = input.season;
  const bank = BANK_FOR[season.id] ?? HOOK_BANK;
  const ranked = [...(input.posts ?? [])]
    .map((post) => ({
      hook: post.analysis?.hook || firstLine(post.caption),
      score: engagement(post) / 10,
    }))
    .filter((item) => item.hook && hookFitsSeason(item.hook, season.id));

  const candidates = [
    ...ranked.map((item) => ({
      hook: item.hook,
      score: item.score + motifScore(item.hook, input.campaign) + (SEASON_OWN[season.id].test(item.hook) ? 4 : 0),
      why: "過去 IG 有效，而且跟現在學期合",
    })),
    ...bank.map((hook, index) => ({
      hook,
      score: 36 - index * 2 + motifScore(hook, input.campaign) + (SEASON_OWN[season.id].test(hook) ? 6 : 0),
      why: `${season.label}，先講生活再進活動`,
    })),
  ].filter((item) => hookFitsSeason(item.hook, season.id));

  candidates.sort((a, b) => b.score - a.score);
  const picked = candidates[0] ?? {
    hook: input.campaign?.oneLiner || HOOK_BANK[3],
    why: season.contentHint,
  };
  const name = input.campaign?.name?.trim();
  const query = name
    ? `幫我做 ${name} 完整宣傳。第一句：「${picked.hook}」`
    : `第一句：「${picked.hook}」幫我寫一篇 IG。`;
  return { hook: picked.hook, why: picked.why, query: query.slice(0, 360) };
}

export function seasonCreateNote(season: AcademicMoment, lastHook?: string) {
  const stale = lastHook && !hookFitsSeason(lastHook, season.id);
  return `現在是${season.label}。${season.studentNow} ${season.contentHint}${
    stale ? ` 不要沿用「${lastHook}」這種過季語氣。` : ""
  } Hook 必須跟淡江學生現在的生活有關，不要抽象客群。`;
}

/** 給創作入口用的短註，避免把整段學期說明塞進 360 字 query。 */
export function compactSeasonSteer(season: AcademicMoment, lastHook?: string) {
  const hook = lastHook?.replace(/\s+/g, " ").slice(0, 24);
  if (hook && !hookFitsSeason(lastHook ?? "", season.id)) {
    return `現在是${season.label}，不要沿用「${hook}」。下一篇寫現在的生活。`;
  }
  return `現在是${season.label}。下一篇不要重複「${hook || "同一句"}」。`;
}
