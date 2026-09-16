/** IG 無障礙說明：給視障同學聽畫面，不是行銷文案。 */
export function localAltText(input: {
  hook?: string;
  eventName?: string;
  schedule?: string;
  location?: string;
}): string {
  const hook = (input.hook ?? "").replace(/\s+/g, " ").trim();
  const title = hook.slice(0, 28);
  const event = (input.eventName ?? "").replace(/\s+/g, " ").trim();
  const when = [input.schedule, input.location].map((part) => (part ?? "").trim()).filter(Boolean).join("，");
  const parts = ["淡江大學禪學社的宣傳畫面"];
  if (title) parts.push(`標題寫著「${title}」`);
  if (event && event !== title) parts.push(event);
  if (when) parts.push(when);
  parts.push("畫面是淡江校園日常的光與人，不是海報。");
  return parts.join("，").slice(0, 200);
}
