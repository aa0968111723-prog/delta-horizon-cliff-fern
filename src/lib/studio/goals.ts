import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "讓學生停下來", hint: "先被看見，再認識社團" },
  { id: "traffic", label: "來現場／看時間", hint: "報名連結或到活動教室" },
  { id: "conversion", label: "完成報名", hint: "填表、帶朋友來" },
  { id: "ugc", label: "互動分享", hint: "留言、投票、標註" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
