export type ImageVisionAnalysis = {
  contentSummary: string;
  detectedElements: string[];
  colorPalette: { hex: string; name: string }[];
  lighting: string;
  composition: string;
  textToImageRatio: string;
  visualHierarchy: string;
  brandFitScore: number; // 0 - 100
  studentRelevanceScore: number; // 0 - 100
  stopScrollingScore: number; // 0 - 100
  critique: {
    isTooReligious: boolean;
    isTooOldFashioned: boolean;
    isTooAiFlavored: boolean;
    fitsTamkangStudents: boolean;
    feedbackList: string[];
  };
  adaptationActions: {
    id: string;
    label: string;
    description: string;
    targetFormat: string;
  }[];
};

export function analyzeZenImageVisual(
  imageName: string,
  imageCategory = "photo"
): ImageVisionAnalysis {
  const isPoster = imageName.includes("海報") || imageCategory === "template";
  const isCup = imageName.includes("杯") || imageName.includes("茶");
  const isTurtle = imageName.includes("龜") || imageName.includes("logo");

  return {
    contentSummary: isCup
      ? "畫面主角為溫潤陶杯手捧熱茶，具有濃厚的日系生活感與慢步調氛圍，光線溫和。"
      : isTurtle
      ? "淡江禪學社吉祥物安靜龜龜矢量插畫，造型年輕可愛，自帶親民幽默感。"
      : "淡江校園與淡水傍晚微光，帶有靜心與安定空氣感，視野開闊留白充足。",
    detectedElements: isCup
      ? ["溫熱茶水", "陶瓷茶杯", "手部特寫", "自然漫射光", "木質桌面"]
      : isTurtle
      ? ["吉祥物龜龜", "三色光微光光暈", "極簡線條", "手繪貼圖風"]
      : ["校園綠意", "夕陽餘暉", "宮燈教室長廊", "柔和光斑"],
    colorPalette: [
      { hex: "#1E3A4C", name: "淡水夜青" },
      { hex: "#F7F6F2", name: "暖宣紙白" },
      { hex: "#D97736", name: "晨曦暖光" },
      { hex: "#4A7C72", name: "松竹淡綠" },
    ],
    lighting: "柔和窗邊自然側光與傍晚漫射光，無刺眼死黑高光，呈現放鬆減壓感。",
    composition: "主體偏左上放置，右側與下方留出 40% 以上留白呼吸區，極度適合排入 IG 大標題與副標。",
    textToImageRatio: isPoster ? "文字比例約 35%（適中）" : "圖片為主，留白率約 45%",
    visualHierarchy: "主視覺光線聚焦點 → 一級大標題 → 說明副標題 → 右下角社團標誌與 CTA。",
    brandFitScore: 95,
    studentRelevanceScore: 92,
    stopScrollingScore: 88,
    critique: {
      isTooReligious: false,
      isTooOldFashioned: false,
      isTooAiFlavored: false,
      fitsTamkangStudents: true,
      feedbackList: [
        "✅ 零宗教包袱：無金碧輝煌或神聖莊嚴距離感，完全貼近大學生日常咖啡店或宿舍手沖情境。",
        "✅ 停留感強烈：色調舒緩溫潤，在以短影音與強烈對比為主的 IG 動態牆上能給人眼睛喘口氣的停留感。",
        "💡 建議延伸：可在右下角輕點綴『三色光微光光暈』或安靜龜龜浮水印，強化淡江禪學社品牌記憶度。",
      ],
    },
    adaptationActions: [
      {
        id: "extend-style",
        label: "延續這個視覺風格",
        description: "提取此圖片的調色、光線與構圖參數，套用到接下來的茶會文宣。",
        targetFormat: "所有格式",
      },
      {
        id: "make-story",
        label: "一鍵做成 IG 限動 (Story 9:16)",
        description: "自動上下延伸夜青色漸層底板，中央保留主體，上方置入互動投票問卷。",
        targetFormat: "9:16 Story",
      },
      {
        id: "make-carousel",
        label: "做成 5 頁情緒共鳴 Carousel",
        description: "將此圖作為封面主視覺，自動生成後續四頁的痛點解構與活動資訊。",
        targetFormat: "4:5 Carousel",
      },
      {
        id: "make-reels-cover",
        label: "做成 Reels 短影音封面",
        description: "裁切為 9:16，中心 1:1 安全框加粗大字標題『淡江通勤減壓法』。",
        targetFormat: "9:16 Reels Cover",
      },
      {
        id: "make-similar-visual",
        label: "生成同風格新素材",
        description: "以 AI Multimodal Prompt 生成同樣晨曦暖光手繪感的其他校園場景。",
        targetFormat: "AI Generated Asset",
      },
    ],
  };
}
