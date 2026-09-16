import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "品牌認知", hint: "讓人停下來記住你" },
  { id: "traffic", label: "引導到店", hint: "網站、地圖或門市" },
  { id: "conversion", label: "轉換購買", hint: "下單、預約、兌換" },
  { id: "ugc", label: "互動分享", hint: "留言、標註、轉發" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
