import { buildMockPlan } from "../ai/mock.ts";
import type { VisualDirection } from "../studio/types.ts";
import { CONVERT_TARGETS, captionForTarget, convertFromPlan } from "./convert.ts";
import { applyStudentRewrite } from "./review.ts";
import { todayIso } from "./season.ts";
import { applyPackToWaves, emptyCampaign, suggestWaves } from "./schedule.ts";
import type { CampaignType, ClubCampaign, CreativePack } from "./types.ts";
import { completeCopyVariants } from "./voice.ts";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export type ParsedEventIdea = {
  name: string;
  type: CampaignType;
  date: string;
  time: string;
  location: string;
  idea: string;
};

export function parseEventIdea(idea: string, now = new Date()): ParsedEventIdea {
  const text = idea.trim();
  const today = todayIso(now);
  let type: CampaignType = "other";
  if (/茶會|喝茶|茶席|來喝茶/.test(text)) type = "tea";
  else if (/浮游|禪光|三色光|夜燈/.test(text)) type = "light";
  else if (/招生|招新|迎新/.test(text)) type = "recruit";
  else if (/社課|例會/.test(text)) type = "class";
  else if (/講座|分享會|對談/.test(text)) type = "talk";
  else if (/一日禪|靜心|坐禪/.test(text)) type = "retreat";
  else if (/回顧/.test(text)) type = "review";

  let date = today;
  const md = text.match(/(\d{1,2})\s*[\/月.]\s*(\d{1,2})/);
  if (md) {
    const tpe = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    date = `${tpe.getFullYear()}-${pad(Number(md[1]))}-${pad(Number(md[2]))}`;
  } else if (/今晚|今天/.test(text)) {
    date = today;
  } else if (/明天/.test(text)) {
    date = addDaysIso(today, 1);
  } else if (/下週|下周|下星期/.test(text)) {
    date = addDaysIso(today, 7);
  }

  let name = text
    .replace(/下週|下周|下星期|今晚|今天|明天/g, " ")
    .replace(/有一場|幫我做|請幫我|我要|我想|新的|宣傳|完整/g, " ")
    .replace(/(\d{1,2})\s*[\/月.]\s*(\d{1,2})日?/g, " ")
    .replace(/[，。,.!?！？]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (/浮游禪光/.test(text)) name = "浮游禪光";
  else if (type === "tea" && /茶會/.test(text)) {
    const leftover = name.replace(/茶會/g, "").trim();
    name = leftover.length > 6 ? name : "茶會";
  } else if (!name || name.length > 24) {
    name = type === "tea" ? "茶會" : type === "light" ? "浮游禪光" : name.slice(0, 16) || "活動";
  }
  if (type === "tea" && /茶會/.test(name) === false && name.length <= 6) name = "茶會";

  return {
    name,
    type,
    date,
    time: type === "tea" || type === "light" ? "19:30" : "19:00",
    location: "淡江大學淡水校園",
    idea: text,
  };
}

export function isCreateQuery(query: string) {
  const q = query.trim();
  if (!q) return false;
  if (/^找/.test(q) && !/幫我做|生成|宣傳/.test(q)) return false;
  return /幫我做|生成完整|宣傳|有一場|下週有|下周有|我要|做成新的|新的茶會|新的活動/.test(q);
}

export function packFromVisualDirections(input: {
  idea: string;
  directions: VisualDirection[];
  pickedId?: string;
  now?: Date;
}): CreativePack {
  const parsed = parseEventIdea(input.idea, input.now);
  const dir = input.directions.find((row) => row.id === input.pickedId) ?? input.directions[0];
  const hook = (dir?.headline || "").replace(/\n/g, " ").trim() || "最近是不是很久沒有好好坐下來？";
  const plan = buildMockPlan({
    eventName: parsed.name,
    schedule: `${parsed.date} ${parsed.time}`,
    location: parsed.location,
    product: input.idea,
    offer: "",
    audience: "淡江大學學生",
    goal: "awareness",
    features: dir?.concept ?? parsed.idea,
    style: "生活、空氣、淡水夜晚",
    notes: input.idea.slice(0, 400),
    wantPost: true,
    wantStory: true,
    wantCarousel: true,
    wantReels: true,
    wantThreads: true,
    wantLine: true,
    brandName: "淡江大學禪學社",
    handle: "@tkuzen",
    voice: "像社團的人在發 IG",
    doSay: "淡江學生、淡水晚上、坐好",
    dontSay: "誠摯邀請",
    forbiddenWords: ["誠摯邀請"],
    slogans: dir?.headline.replace(/\n/g, " "),
    preferredCtas: "晚上見",
    imageStyle: dir?.palette,
    forceMock: true,
  });
  const body = dir?.concept || plan.insight;
  const copy = applyStudentRewrite({
    hook,
    body,
    cta: plan.cta || "晚上見",
    hashtags: plan.hashtags.length ? plan.hashtags : ["#淡江禪學社", "#淡江", "#淡水"],
    variants: completeCopyVariants({ hook, body, cta: plan.cta || "晚上見" }),
    studentReview: {
      wouldStop: plan.studentReview?.wouldStop ?? "第一句會停。",
      understandable: plan.studentReview?.understandable ?? "看得懂。",
      tooReligious: plan.studentReview?.tooReligious ?? "沒有。",
      tooSerious: plan.studentReview?.tooSerious ?? "還好。",
      tooLiterary: plan.studentReview?.tooLiterary ?? "還好。",
      tooAi: plan.studentReview?.tooAi ?? "沒有金句連發。",
      tooLong: plan.studentReview?.tooLong ?? "剛好。",
      knowsWhat: plan.studentReview?.knowsWhat ?? `知道是${parsed.name}。`,
      knowsWhenWhere: plan.studentReview?.knowsWhenWhere ?? `${parsed.date}、${parsed.location}有寫。`,
      wouldBringFriend: plan.studentReview?.wouldBringFriend ?? "可以。",
      knowsSignup: plan.studentReview?.knowsSignup ?? "CTA 有了。",
      notes: plan.studentReview?.notes ?? [],
      rewriteHook: "",
    },
  });
  return {
    campaignName: plan.campaignName || parsed.name,
    insight: dir?.concept || plan.insight,
    studentContext: "淡江大學學生",
    foundCount: 0,
    citedSources: plan.citedSources ?? [],
    directions: input.directions,
    plan: {
      ...plan,
      hook: copy.hook,
      headline: dir?.headline || plan.headline,
      subhead: dir?.subhead || plan.subhead,
      visualDirection: dir?.composition || plan.visualDirection,
      visualTheme: dir?.palette || plan.visualTheme,
      visualDirections: input.directions,
    },
    copy,
  };
}

export function materializeCampaignFromPack(input: {
  idea: string;
  pack: CreativePack;
  campaigns: ClubCampaign[];
}): ClubCampaign {
  const parsed = parseEventIdea(input.idea);
  const reusable = input.campaigns.find((campaign) => {
    if (parsed.name === "浮游禪光" && campaign.name.includes("浮游禪光")) return true;
    return campaign.name === parsed.name && campaign.date === parsed.date;
  });
  const base = reusable
    ? { ...reusable, updatedAt: Date.now() }
    : emptyCampaign({
        name: input.pack.campaignName || parsed.name,
        type: parsed.type,
        date: parsed.date,
        time: parsed.time,
        location: parsed.location,
        tagline: input.pack.copy.hook,
        description: input.pack.insight,
      });
  const named: ClubCampaign = {
    ...base,
    name: reusable?.name || input.pack.campaignName || parsed.name,
    type: reusable?.type || parsed.type,
    date: reusable?.date && reusable.name.includes(parsed.name) ? reusable.date : parsed.date,
    time: reusable?.time || parsed.time,
    location: reusable?.location || parsed.location,
  };
  if (!named.waves.length) {
    named.waves = suggestWaves({ date: named.date, type: named.type, name: named.name });
  }
  return applyPackToWaves(named, input.pack);
}

export function convertStaggerDays(id: string) {
  if (id === "story") return 1;
  if (id === "threads") return 2;
  if (id === "carousel") return 3;
  if (id === "line") return 4;
  if (id === "reels") return 5;
  return 0;
}

export type SuiteMode = "generate" | "sequence" | "reuse";

export function formatSuitePlan(pack: CreativePack) {
  const converted = convertFromPlan(pack.plan);
  return CONVERT_TARGETS.map((target) => {
    const mode: SuiteMode =
      target.id === "carousel" || target.id === "story" || target.id === "reels"
        ? "sequence"
        : target.id === "line"
          ? "reuse"
          : "generate";
    return {
      id: target.id,
      label: target.label,
      formatId: target.formatId,
      contentKind: target.contentKind,
      days: convertStaggerDays(target.id),
      caption: captionForTarget(converted, target.id),
      mode,
      generate: mode === "generate",
      reuseFrom: target.id === "line" ? ("threads" as const) : null,
    };
  });
}
