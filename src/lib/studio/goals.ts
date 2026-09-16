import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "讓學生停下來", hint: "先被看見，再看到活動" },
  { id: "traffic", label: "來參加", hint: "時間地點清楚，走得動" },
  { id: "conversion", label: "完成報名", hint: "CTA 與連結一眼看懂" },
  { id: "ugc", label: "找朋友來", hint: "留言、標註、一起出現" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
