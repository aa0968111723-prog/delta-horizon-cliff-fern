/** Vision `next` 是下一步動作，不能當素材標籤。 */
const ACTION_TAG = /延續這個風格|做成限動|做成 Carousel|做成 Reels|生成相似|重新設計|保留內容/;

const VOCAB: Array<[RegExp, string]> = [
  [/龜/, "龜龜"],
  [/茶|杯/, "茶會"],
  [/浮游|禪光/, "浮游禪光"],
  [/三色/, "三色光"],
  [/夜|黃昏/, "夜間"],
  [/淡水|河岸|捷運/, "淡水"],
  [/校園|圖書館|淡江/, "淡江校園"],
  [/海報/, "海報"],
  [/宿舍/, "宿舍"],
  [/社員|同學|人像|互動/, "社員"],
];

const CATEGORY_TAGS: Record<string, string> = {
  turtle: "龜龜",
  photo: "活動照片",
  people: "社員",
  campus: "淡江校園",
  tamsui: "淡水",
  poster: "海報",
  story: "Story",
  reels: "Reels",
  logo: "Logo",
  archive: "歷屆活動",
  background: "背景",
  illustration: "三色光",
};

function unique(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag && !ACTION_TAG.test(tag)))];
}

export function tagsFromText(blob: string): string[] {
  const tags: string[] = [];
  for (const [re, tag] of VOCAB) {
    if (re.test(blob)) tags.push(tag);
  }
  return unique(tags);
}

export function tagsFromVision(report: {
  scene: string;
  people: string;
  color: string;
  light: string;
  studentFit: string;
  tooReligious: boolean;
  tooOld: boolean;
  tooAi: boolean;
  next?: string[];
}): string[] {
  const blob = `${report.scene} ${report.people} ${report.color} ${report.light} ${report.studentFit}`;
  return unique([
    ...tagsFromText(blob),
    report.tooReligious ? "偏宗教" : "生活感",
    report.tooOld ? "偏老氣" : "",
    report.tooAi ? "偏AI" : "",
  ]);
}

/** 名稱與分類抽出內容標籤，不要截檔名當 tag。 */
export function tagsFromAssetText(name: string, category: string, extra = ""): string[] {
  return unique([...tagsFromText(`${name} ${extra}`), CATEGORY_TAGS[category] ?? ""]);
}
