import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "讓學生停下來", hint: "先被看見，再進活動" },
  { id: "traffic", label: "來現場", hint: "淡水、教室、那一晚" },
  { id: "conversion", label: "完成報名", hint: "連結、時間、找朋友" },
  { id: "ugc", label: "互動分享", hint: "留言、投票、標註" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
