export type VisionNotesInput = {
  scene: string;
  people: string;
  color: string;
  light: string;
  composition: string;
  brandFit: string;
  studentFit: string;
  stay: string;
  tooReligious: boolean;
  tooOld: boolean;
  tooAi: boolean;
  imagePrompt: string;
};

/** 丟圖後的理解，必須進下一次生成，不能只停在分析卡片。 */
export function visionPromptBlock(report: VisionNotesInput) {
  return `這張圖看到的（延續風格，不要複製原圖）：
畫面：${report.scene}
人物：${report.people}
色彩：${report.color}
光線：${report.light}
構圖：${report.composition}
品牌感：${report.brandFit}
學生會停：${report.studentFit}
停留感：${report.stay}
太宗教 ${report.tooReligious ? "是，請降宗教、改生活" : "沒有"} · 太老氣 ${report.tooOld ? "是，請年輕一點" : "沒有"} · 太 AI ${report.tooAi ? "是，請更像同學拍的" : "沒有"}
畫面方向：${report.imagePrompt}`;
}
