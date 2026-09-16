import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "讓學生停下來", hint: "先被看見，再被記住" },
  { id: "traffic", label: "帶到現場", hint: "教室、河岸、報到點" },
  { id: "conversion", label: "完成報名", hint: "連結、時間、找朋友" },
  { id: "ugc", label: "找朋友一起來", hint: "留言、標註、轉傳" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
