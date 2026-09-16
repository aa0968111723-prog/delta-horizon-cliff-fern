import type { CampaignWaveKind, CopyPack } from "../studio/types.ts";
import { waveLabel } from "../zen/schedule.ts";
import { tidyCopy } from "../zen/review.ts";

export type WaveDraft = {
  kind: CampaignWaveKind;
  title: string;
  hook: string;
  body: string;
  cta: string;
  visualNote: string;
  angle: string;
};

export const WAVE_ANGLE: Record<CampaignWaveKind, string> = {
  warmup: "生活感，幾乎不提活動全名。",
  emotion: "讓學生覺得被看見，再輕輕碰到活動。",
  hero: "主視覺進 Feed，Hook 先問生活。",
  detail: "時間地點內容一次講完，仍像同學在說。",
  reason: "為什麼今晚要出門，可以揪人。",
  countdown: "短、限動感、現在。",
  dayof: "今天、怎麼走、現在。",
  recap: "人、光、一句話，不要通稿。",
};

export function mockWaveDraft(input: {
  kind: CampaignWaveKind;
  name: string;
  schedule?: string;
  location?: string;
  idea?: string;
  learnedHook?: string;
  body?: string;
}): WaveDraft {
  const when = [input.schedule, input.location].filter(Boolean).join(" · ");
  const hooks: Record<CampaignWaveKind, string> = {
    warmup: "最近是不是連休息都覺得有罪惡感？",
    emotion: "大學生活很自由，但你最近真的有比較快樂嗎？",
    hero: input.learnedHook || "最近是不是很久沒有好好坐下來？",
    detail: `${input.name}是什麼？一個可以坐下的晚上。`,
    reason: "可以自己來，也可以把這則傳給他。",
    countdown: "明天晚上，淡水。",
    dayof: "今晚有位子。",
    recap: "有時候我們需要的不是答案，只是一個安靜的晚上。",
  };
  const bodies: Record<CampaignWaveKind, string> = {
    warmup: "行程一直往前加，連躺平都會心虛。先讓自己有一個晚上，不用交作業。",
    emotion: "不是來聽課，也不是來變正能量。就是找一個晚上，把身體先放下來。",
    hero: input.body || "不需要會禪，來坐一下就好。",
    detail: `${input.name}${when ? `，${when}` : ""}。不需要會禪，來坐一下就好。`,
    reason: "想找人一起的話，把這則傳給他。可以自己來。",
    countdown: "短一則就好。明天晚上。",
    dayof: when ? `今天。${when}。現在過來就好。` : "今晚有位子，現在過來就好。",
    recap: "燈還在，人比較慢。下一次想去的話，把這則留給自己。",
  };
  const hook = hooks[input.kind];
  return {
    kind: input.kind,
    title: `${waveLabel(input.kind)} · ${input.name}`,
    hook,
    body: bodies[input.kind],
    cta: input.kind === "dayof" ? "現在過來" : "來坐一下",
    visualNote: WAVE_ANGLE[input.kind],
    angle: WAVE_ANGLE[input.kind],
  };
}

export function captionFromWave(draft: WaveDraft) {
  return tidyCopy([draft.hook, draft.body, draft.cta].filter(Boolean).join("\n"));
}

export function waveToPack(draft: WaveDraft): CopyPack {
  return {
    tone: "student",
    hook: draft.hook,
    body: draft.body,
    cta: draft.cta,
    hashtags: ["#淡江禪學社", "#淡江", "#淡水"],
  };
}
