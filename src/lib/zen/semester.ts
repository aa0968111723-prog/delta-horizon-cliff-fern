/**
 * 淡江學期節奏與淡水生活情境。內容策略要知道「現在是開學還是期末」，
 * 同一句文案在迎新週跟期末週的效果完全不同。
 */

export type SemesterPhaseId =
  | "pre-semester"
  | "orientation"
  | "club-fair"
  | "settling"
  | "midterm"
  | "post-midterm"
  | "final"
  | "winter-break"
  | "summer-break";

export type SemesterPhase = {
  id: SemesterPhaseId;
  label: string;
  /** 學生這段時間在經歷什麼 */
  mood: string;
  /** 這段時間內容該怎麼下手 */
  angle: string;
};

export const SEMESTER_PHASES: Record<SemesterPhaseId, SemesterPhase> = {
  "pre-semester": {
    id: "pre-semester",
    label: "開學前",
    mood: "還在放假但已經開始緊張，課表跟租屋剛安排好。",
    angle: "用「重新開始」的語氣，先建立期待，不急著推活動細節。",
  },
  orientation: {
    id: "orientation",
    label: "開學迎新",
    mood: "什麼都新、資訊爆量，急著找朋友跟落腳的地方。",
    angle: "說清楚「第一次來也可以」，降低門檻，強調有人陪。",
  },
  "club-fair": {
    id: "club-fair",
    label: "社團博覽會期間",
    mood: "同時被十幾個社團招手，比較誰真的適合自己。",
    angle: "不要喊招生口號，直接讓人看到社課現場長什麼樣。",
  },
  settling: {
    id: "settling",
    label: "學期穩定期",
    mood: "作息成形，開始感覺到累，但還撐得住。",
    angle: "適合生活感內容、社員故事、知識型貼文，養帳號的信任。",
  },
  midterm: {
    id: "midterm",
    label: "期中考週",
    mood: "考試與報告疊在一起，睡不夠，腦袋停不下來。",
    angle: "只給「喘口氣」的內容，不要塞活動資訊，讓人覺得被理解。",
  },
  "post-midterm": {
    id: "post-midterm",
    label: "期中後",
    mood: "剛喘過來，成績出來後有些人受挫，開始想找出口。",
    angle: "最好的活動宣傳檔期，情緒共鳴接活動邀請效果最好。",
  },
  final: {
    id: "final",
    label: "期末考週",
    mood: "全面趕工，情緒緊繃，時間完全被切碎。",
    angle: "短內容、限動為主，給五分鐘的靜心練習就夠。",
  },
  "winter-break": {
    id: "winter-break",
    label: "寒假",
    mood: "離開淡水回家，節奏鬆下來，也容易和學校斷線。",
    angle: "回顧一學期、預告下學期，維持關係而不是推活動。",
  },
  "summer-break": {
    id: "summer-break",
    label: "暑假",
    mood: "打工、實習、旅行，跟學校的連結最弱。",
    angle: "整理內容資產、社員故事、為迎新做準備。",
  },
};

/** 由日期推學期階段。台灣大學行事曆：9 月開學、1 月與 6 月期末。 */
export function semesterPhaseAt(date: Date = new Date()): SemesterPhase {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const md = month * 100 + day;

  if (md >= 815 && md <= 908) return SEMESTER_PHASES["pre-semester"];
  if (md >= 909 && md <= 921) return SEMESTER_PHASES.orientation;
  if (md >= 922 && md <= 1005) return SEMESTER_PHASES["club-fair"];
  if (md >= 1006 && md <= 1031) return SEMESTER_PHASES.settling;
  if (md >= 1101 && md <= 1120) return SEMESTER_PHASES.midterm;
  if (md >= 1121 && md <= 1215) return SEMESTER_PHASES["post-midterm"];
  if (md >= 1216 || md <= 118) return SEMESTER_PHASES.final;
  if (md >= 119 && md <= 215) return SEMESTER_PHASES["winter-break"];
  if (md >= 216 && md <= 308) return SEMESTER_PHASES["pre-semester"];
  if (md >= 309 && md <= 331) return SEMESTER_PHASES.settling;
  if (md >= 401 && md <= 420) return SEMESTER_PHASES.midterm;
  if (md >= 421 && md <= 525) return SEMESTER_PHASES["post-midterm"];
  if (md >= 526 && md <= 620) return SEMESTER_PHASES.final;
  return SEMESTER_PHASES["summer-break"];
}

export type TamsuiContext = {
  season: string;
  weather: string;
  campus: string;
};

/** 淡水與校園的季節感，讓畫面與文案有地方感。 */
export function tamsuiContextAt(date: Date = new Date()): TamsuiContext {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return {
      season: "春天",
      weather: "回暖但常下雨，濕氣重，傍晚天空偏灰藍。",
      campus: "宮燈大道兩側樹色轉綠，克難坡走上來會出汗。",
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      season: "夏天",
      weather: "曬、悶熱，午後有雷雨，傍晚有海風。",
      campus: "校園人少，樹蔭與圖書館冷氣是避難所，河邊夕陽最好看。",
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      season: "秋天",
      weather: "開始起風，早晚溫差大，天空清透。",
      campus: "開學人潮回來，宮燈大道與操場傍晚最熱鬧。",
    };
  }
  return {
    season: "冬天",
    weather: "濕冷的雨連下好幾天，海風很大，體感比溫度更冷。",
    campus: "從捷運站走上坡很費力，室內活動與熱飲特別有吸引力。",
  };
}

/** 給 AI prompt 用的當下情境段落。 */
export function describeMoment(date: Date = new Date()): string {
  const phase = semesterPhaseAt(date);
  const tamsui = tamsuiContextAt(date);
  const stamp = `${date.getMonth() + 1}/${date.getDate()}`;
  return [
    `今天：${stamp}`,
    `學期階段：${phase.label}｜學生狀態：${phase.mood}`,
    `這個階段的內容原則：${phase.angle}`,
    `淡水：${tamsui.season}，${tamsui.weather}`,
    `校園：${tamsui.campus}`,
  ].join("\n");
}
