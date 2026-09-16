import { FORBIDDEN_CLUB_PHRASES } from "../club/identity.ts";
import type { CampaignPlan, StudentReview } from "../studio/types.ts";
import type { CopyPack } from "./pack.ts";

const MOTIVATIONAL = /勇敢成為|綻放人生|相信自己|閃耀未來|開啟人生|心靈成長|活出最好的自己|每一天都是新的開始/;
const DASH = /[—–－]|--/g;

function scrub(text: string) {
  let next = text;
  for (const phrase of FORBIDDEN_CLUB_PHRASES) next = next.split(phrase).join("");
  next = next.replace(/勇敢成為|綻放人生|相信自己|閃耀未來|開啟人生|心靈成長|活出最好的自己|每一天都是新的開始/g, "");
  next = next.replace(DASH, "，");
  return next.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

function ensureTimeNearCta(text: string, whenWhere: string, cta: string) {
  const tokens = whenWhere.split(/[·,，\s]+/).filter((item) => item.length >= 2);
  const hasWhen = tokens.some((token) => text.includes(token));
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line !== cta);
  if (!hasWhen && whenWhere) lines.push(whenWhere);
  if (cta) lines.push(cta);
  return lines.join("\n");
}

function ensureFriend(text: string, review?: StudentReview | null) {
  if (/朋友/.test(text)) return text;
  if (review && /沒|不清楚/.test(review.wouldBringFriend)) {
    return `${text}\n想帶朋友來也可以。`;
  }
  if (!review || /有/.test(review.wouldBringFriend)) {
    return /朋友/.test(text) ? text : `${text}\n想帶朋友來也可以。`;
  }
  return text;
}

function rewrite(text: string, whenWhere: string, cta: string, review?: StudentReview | null) {
  return ensureFriend(ensureTimeNearCta(scrub(text), whenWhere, cta), review);
}

export function applyStudentReviewToPlan(plan: CampaignPlan): { plan: CampaignPlan; applied: string[] } {
  const review = plan.studentReview;
  const applied: string[] = [];
  const whenWhere = (review?.knowsWhenWhere || plan.subhead || "").replace(/\s+/g, " ").trim();
  const cta = scrub(plan.cta) || plan.cta;
  const revisions = review?.revisions ?? [];

  const hook = scrub(plan.hook);
  if (hook !== plan.hook.trim()) applied.push("去掉公文腔");

  const captions = plan.captions.map((item) => ({
    ...item,
    text: rewrite(item.text, whenWhere, cta, review),
  }));
  if (captions.some((item, index) => item.text !== plan.captions[index]?.text)) {
    applied.push("時間靠近 CTA");
  }

  const body = rewrite(plan.body, whenWhere, cta, review);
  const threadsPost = plan.threadsPost
    ? { ...plan.threadsPost, caption: rewrite(plan.threadsPost.caption, whenWhere, cta, review) }
    : plan.threadsPost;
  const lineCopy = plan.lineCopy
    ? { ...plan.lineCopy, body: rewrite(plan.lineCopy.body, whenWhere, cta, review), cta }
    : plan.lineCopy;
  const storyBeats = plan.storyBeats.map((beat) => scrub(beat));

  if (revisions.some((item) => /勵志/.test(item)) || MOTIVATIONAL.test(`${plan.hook}${plan.body}`)) {
    applied.push("不要再加勵志句");
  }
  if (revisions.some((item) => /破折號/.test(item))) applied.push("避免破折號");
  if (!applied.length) applied.push("淡江學生視角已對過一輪");

  return {
    applied: [...new Set(applied)],
    plan: {
      ...plan,
      hook,
      cta,
      body,
      captions,
      storyBeats,
      threadsPost,
      lineCopy,
      qaNotes: [...plan.qaNotes.filter((note) => !note.includes("已套用淡江學生視角")), "已套用淡江學生視角"],
      studentReview: review
        ? {
            ...review,
            tooAi: "已再砍金句與破折號。",
            tooLong: "CTA 放在最後，時間地點靠近結尾。",
            revisions: applied.map((item) => `已套用：${item}`),
          }
        : review,
    },
  };
}

export function applyStudentReviewToPack(pack: CopyPack): { pack: CopyPack; applied: string[] } {
  const whenWhere = pack.studentReview.knowsWhenWhere;
  const cta = scrub(pack.cta) || pack.cta;
  const hook = scrub(pack.hook);
  const body = rewrite(pack.body, whenWhere, cta, pack.studentReview);
  const variants = pack.variants.map((item) => ({
    ...item,
    hook: scrub(item.hook),
    body: rewrite(item.body, whenWhere, item.cta || cta, pack.studentReview),
    cta: scrub(item.cta) || item.cta,
  }));
  const applied = ["時間靠近結尾", "避免破折號"].filter((item) =>
    pack.studentReview.revisions.some((revision) => revision.includes(item.slice(0, 2)) || revision.includes(item)),
  );
  if (!applied.length) applied.push("淡江學生視角已對過一輪");
  return {
    applied,
    pack: {
      ...pack,
      hook,
      body,
      cta,
      variants,
      studentReview: {
        ...pack.studentReview,
        tooAi: "已再砍金句。",
        revisions: applied.map((item) => `已套用：${item}`),
      },
    },
  };
}
