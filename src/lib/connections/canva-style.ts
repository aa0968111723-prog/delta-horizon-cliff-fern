import { inferCanvaCollection } from "./canva-normalize.ts";
import { canvaProvenanceLabel, type CanvaStyleAnalysis } from "./types.ts";

export function styleAnalysisFromCanvaMetadata(input: {
  title: string;
  collection?: string;
  snippet?: string;
  pageCount?: string;
}): CanvaStyleAnalysis {
  const collection = input.collection || inferCanvaCollection(input.title);
  return {
    summary: `${canvaProvenanceLabel(collection)}「${input.title}」的既有設計索引。這是從官方 metadata 整理的風格摘要，不是像素分析，也不是 Enterprise Autofill。`,
    colors: [],
    composition: input.pageCount
      ? `官方資料顯示約 ${input.pageCount} 頁。版面以 Canva 原稿為準，這裡不會假裝已讀取每個元件。`
      : "尚未讀取像素。延續既有 Canva 版面時，請以原稿為準。",
    studentFit: "適合當歷屆活動的風格錨點，讓淡江學生認得出是同一系列，而不是重新發明一套畫面。",
    recommendations: [
      "在 Canva 開啟原稿，核對標題安全區與夜晚校園感",
      "不要把宗教符號、佛像或蓮花堆砌加回畫面",
      "Design Autofill 需要 Canva Enterprise，目前未開通，請手動套用 brief",
    ],
    suggestedTags: [collection, "Canva", "歷屆視覺"].filter(Boolean),
  };
}

export function styleSnippetFromAnalysis(collection: string, analysis: CanvaStyleAnalysis) {
  return `${canvaProvenanceLabel(collection)}｜${analysis.summary}`;
}
