import type { CampaignGoal } from "./types";

export const GOALS: {
  id: CampaignGoal;
  label: string;
  hint: string;
}[] = [
  { id: "awareness", label: "讓人認識", hint: "讓學生覺得「這在講我」" },
  { id: "traffic", label: "來活動", hint: "知道時間地點，願意出門" },
  { id: "conversion", label: "報名 / 加入", hint: "填表、進社團、當社員" },
  { id: "ugc", label: "互動分享", hint: "留言、轉發、帶朋友來" },
];

export function goalLabel(id: CampaignGoal): string {
  return GOALS.find((g) => g.id === id)?.label ?? id;
}
