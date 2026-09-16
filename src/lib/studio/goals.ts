import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "讓同學知道", hint: "讓淡江學生停下來，知道有這場活動" },
  { id: "traffic", label: "引導報名／到場", hint: "IG、表單或集合資訊" },
  { id: "conversion", label: "真的來參加", hint: "保留時段、找朋友一起來" },
  { id: "ugc", label: "傳給一位朋友", hint: "留言、標註、值得轉傳" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
