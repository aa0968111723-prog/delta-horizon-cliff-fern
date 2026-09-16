import { HASHTAG_BANK } from "../club/identity.ts";
import { academicMoment } from "../club/season.ts";
import { mockReels, mockStoryFrames } from "../ai/pack-mock.ts";
import type { CampaignPlan, ContentKind, CopyTone, CreativeDirection, SourceRef } from "../studio/types.ts";

export function eventNameFromQuery(query: string, fallback = "茶會") {
  const q = query.replace(/\s+/g, " ").trim();
  const named = q.match(/浮游禪光|三色光|茶會|坐禪|社課|迎新|招新/);
  if (named) return named[0];
  const stripped = q
    .replace(/^(我要|幫我|想要)?/, "")
    .replace(/^(宣傳|做一篇|生成|做)/, "")
    .replace(/完整宣傳$/, "")
    .trim();
  if (stripped.length >= 2 && stripped.length <= 18 && !/https?:/.test(stripped)) return stripped;
  return fallback;
}

export function posterKindFromAspect(aspect: "4:5" | "1:1" | "9:16"): ContentKind {
  return aspect === "9:16" ? "story" : "ig-post";
}

function hookOf(dir: CreativeDirection) {
  return dir.headline.replace(/\n/g, "").trim();
}

function copiesFromPlan(plan: CampaignPlan) {
  const tones: CopyTone[] = ["short", "normal", "emotional", "student", "life", "humor"];
  const hook = plan.hook;
  const when = plan.subhead;
  return tones.map((tone) => {
    const map: Record<CopyTone, string> = {
      short: `${hook}\n${when}`,
      normal: plan.captions[0]?.text ?? hook,
      emotional: `有時候我們需要的不是答案，只是一個安靜的晚上。\n${plan.campaignName}。${when}`,
      student: `課表有了，人還在趕路。\n${hook}\n${when}，帶一個朋友來就好。`,
      life: `捷運上滑完手機，回到宿舍更累。\n${plan.campaignName}只是讓你坐下。\n${when}`,
      humor: `不是要你頓悟。真的只是喝茶。\n${when}`,
    };
    return {
      tone,
      hook,
      body: map[tone],
      cta: plan.cta,
      hashtags: plan.hashtags.length ? plan.hashtags : [...HASHTAG_BANK],
    };
  });
}

/** Image Studio 生成主視覺後就能進 Canva／IG／月曆，不必先跑完整宣傳。 */
export function posterPackFromDirection(input: {
  query: string;
  direction: CreativeDirection;
  directions: CreativeDirection[];
  sources?: SourceRef[];
  eventName?: string;
  when?: string;
  where?: string;
}) {
  const name = input.eventName?.trim() || eventNameFromQuery(input.query);
  const hook = hookOf(input.direction);
  const when = input.when?.trim() || "近期晚上";
  const where = input.where?.trim() || "淡江校園";
  const dir = input.direction;
  const sources = input.sources ?? [];
  const season = academicMoment();
  const caption = [
    hook,
    "",
    dir.concept,
    `${when}，${where}。`,
    "想來的話帶一個朋友就好。",
  ].join("\n");
  const plan: CampaignPlan = {
    campaignName: name,
    concept: dir.concept,
    insight: dir.concept,
    hook,
    visualTheme: dir.palette,
    visualDirection: `${dir.composition}。${dir.concept}`,
    templateId: "editorial",
    colorMood: dir.palette,
    eyebrow: "TONIGHT",
    headline: dir.headline,
    subhead: dir.subhead || `${when} · ${where}`,
    body: dir.concept,
    cta: "晚上來坐一下",
    captions: [
      { style: "學生版", text: caption },
      { style: "短版", text: `${hook}\n${when} ${where}` },
    ],
    hashtags: HASHTAG_BANK.slice(0, 8),
    storyBeats: mockStoryFrames(name, when, where).map((frame) => `${frame.headline}｜${frame.body}`),
    carouselPages: [
      {
        role: "cover",
        headline: dir.headline,
        subhead: dir.subhead,
        body: hook,
        cta: "晚上來坐一下",
        visualNote: dir.composition,
        templateId: "product",
      },
    ],
    assetNeeds: [{ kind: "photo", title: "主視覺", detail: dir.composition, required: true }],
    checklist: ["Hook 是生活不是邀請函", "時間地點清楚"],
    altText: `${name}主視覺，標題「${hook}」。`,
    qaNotes: ["先讓學生停下來"],
    generatedAt: Date.now(),
    source: "mock",
    directions: input.directions,
    threadsPost: `${hook}\n${name}。${when}，${where}。`,
    lineCopy: `【${name}】${when} ${where}\n${hook}`,
    reelsScript: mockReels(name, when),
    sources,
    scheduleNotes: "這一張先排成單篇 IG，完整宣傳再補節奏。",
  };
  return {
    query: input.query,
    sourceSummary: sources.length ? `找到 ${sources.length} 個相關素材` : "先用品牌記憶生成",
    sources,
    studentContext: `${season.label}。${season.studentNow}`,
    directions: input.directions,
    plan: { ...plan, directions: input.directions, sources },
    copyVariants: copiesFromPlan(plan),
    conversions: {
      carousel: plan.carouselPages,
      story: mockStoryFrames(name, when, where),
      threads: plan.threadsPost || `${hook}\n${when}`,
      line: plan.lineCopy || `【${name}】${when}\n${hook}`,
      reels: plan.reelsScript ?? mockReels(name, when),
    },
    adapter: "mock" as const,
  };
}
