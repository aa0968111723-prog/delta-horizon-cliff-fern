import type { ContentKind, FormatId } from "../studio/types.ts";
import type { VisionReport } from "./analyze.ts";

export function tagsFromVision(report: VisionReport, extra: string[] = []): string[] {
  const blob = [report.content, report.color, report.light, report.composition, report.brandFeel, report.studentFeel, report.people]
    .join(" ");
  const tags = new Set<string>(["AI標籤", ...extra]);
  if (/茶會/.test(blob)) tags.add("茶會");
  if (/浮游|禪光|燈/.test(blob)) tags.add("浮游禪光");
  if (/三色光|青|暖|玫瑰/.test(blob)) tags.add("三色光");
  if (/龜龜/.test(blob)) tags.add("龜龜");
  if (/夜間|晚上|暖光/.test(blob)) tags.add("夜間");
  if (/淡水|捷運/.test(blob)) tags.add("淡水");
  if (/校園|淡江|教室/.test(blob)) tags.add("淡江校園");
  if (/海報|文宣/.test(blob)) tags.add("海報");
  if (/人|社員|側臉/.test(report.people)) tags.add("人物");
  if (/宗教/.test(report.tooReligious) && /沒|避免/.test(report.tooReligious)) tags.add("不太宗教");
  return [...tags].slice(0, 10);
}

export function mergeAssetTags(existing: string[], extra: string[]) {
  return [...new Set([...existing, ...extra].map((item) => item.trim()).filter(Boolean))].slice(0, 12);
}

export function ideaFromVision(action: string, report: VisionReport, note: string) {
  const hint = note.trim();
  if (action === "continue") {
    return `延續這個風格做新的淡江禪學社活動。配色：${report.color}。構圖：${report.composition}。${hint}`.trim();
  }
  if (action === "redesign") {
    return `保留內容重新設計：${report.content}。層級：${report.hierarchy}。${hint}`.trim();
  }
  if (action === "similar") {
    return `生成相似視覺，同氣氛、新構圖。${report.content}。${hint}`.trim();
  }
  if (action === "story") {
    return `把這張做成限動。${report.content}。${hint}`.trim();
  }
  if (action === "carousel") {
    return `把這張做成 Carousel。${report.content}。${hint}`.trim();
  }
  if (action === "reels") {
    return `把這張做成 Reels Cover。${report.content}。${hint}`.trim();
  }
  return hint || report.content;
}

export function promptFromVision(report: VisionReport, action = "similar") {
  return `${ideaFromVision(action, report, "")}. Soft paper light, Tamkang / Tamsui student life, tricolor cyan amber rose, not temple, not golden buddha, not AI-smooth skin.`;
}

export function convertKindFromAction(action: string): ContentKind | undefined {
  if (action === "story") return "story";
  if (action === "carousel") return "carousel";
  if (action === "reels") return "reels";
  return undefined;
}

export function formatFromVisionAction(action: string): FormatId | undefined {
  if (action === "story") return "story";
  if (action === "reels") return "reels-cover";
  if (action === "similar" || action === "continue" || action === "redesign") return "feed-portrait";
  return undefined;
}

export function isImageVisionAction(action: string) {
  return action === "similar" || action === "continue" || action === "redesign";
}
