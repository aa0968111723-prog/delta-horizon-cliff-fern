/**
 * 淡江學生情境推斷：學期階段、淡水季節、當下學生大概在經歷什麼。
 * 純函式，client / server 都可用；AI prompt 與本機生成都會讀。
 */

export type SemesterPhase =
  | "summer-break"
  | "orientation"
  | "early-fall"
  | "midterm-fall"
  | "late-fall"
  | "final-fall"
  | "winter-break"
  | "early-spring"
  | "midterm-spring"
  | "late-spring"
  | "final-spring";

export type StudentContext = {
  phase: SemesterPhase;
  phaseLabel: string;
  studentMood: string;
  weather: string;
  campusScene: string;
  suggestedTopics: string[];
  monthDay: string;
};

const PHASES: Record<SemesterPhase, Omit<StudentContext, "phase" | "monthDay">> = {
  "summer-break": {
    phaseLabel: "暑假",
    studentMood: "有人在打工、有人回家，也有人留在淡水發呆。節奏鬆，但也容易空。",
    weather: "淡水悶熱，午後常有雷陣雨，傍晚河邊風很大。",
    campusScene: "校園很空，宮燈大道人少，捷運淡水站下車的多是觀光客。",
    suggestedTopics: ["暑假的一個人時間", "開學前想重新開始", "漁人碼頭看夕陽", "留在淡水的夏天"],
  },
  orientation: {
    phaseLabel: "開學 / 新生週",
    studentMood: "大一剛到淡水，什麼都新，但也什麼都不確定。學長姐忙社博、忙招生。",
    weather: "九月還很熱，晚上開始有一點風。",
    campusScene: "社團博覽會、海報牆滿的、宿舍剛搬進去、加退選在跑。",
    suggestedTopics: ["剛到淡水的第一週", "還沒交到朋友很正常", "社團要選什麼", "第一次一個人住"],
  },
  "early-fall": {
    phaseLabel: "開學初（9–10 月）",
    studentMood: "課表穩定下來了，新鮮感開始退，慢慢感受到真實的大學生活。",
    weather: "十月的淡水開始舒服，傍晚很適合走路。",
    campusScene: "社課開始、分組報告開始、宿舍夜晚很吵也很安靜。",
    suggestedTopics: ["開學一個月你還好嗎", "社課初體驗", "河邊散步", "從熱鬧回到一個人"],
  },
  "midterm-fall": {
    phaseLabel: "期中考（11 月）",
    studentMood: "壓力頂點。圖書館滿座，熬夜，情緒容易崩。",
    weather: "淡水開始降溫，有時陰雨、風很大。",
    campusScene: "覺生圖書館排隊、便利商店咖啡、深夜的宿舍走廊。",
    suggestedTopics: ["期中前的五分鐘", "考前睡不著", "焦慮不是你的錯", "讀不下去的時候"],
  },
  "late-fall": {
    phaseLabel: "期中後（11–12 月）",
    studentMood: "考完有點鬆、有點空。開始想「這學期到底在幹嘛」。",
    weather: "淡水冬天很冷，風雨天多，河邊霧氣重。",
    campusScene: "期末報告排開、聖誕活動、社團期末準備。",
    suggestedTopics: ["考完之後的空", "淡水的冷", "年底盤點", "一個安靜的晚上"],
  },
  "final-fall": {
    phaseLabel: "期末考（1 月）",
    studentMood: "最後衝刺，睡眠很少，想快點放假，也怕成績。",
    weather: "淡水一月很冷，常下雨，走去教室很痛苦。",
    campusScene: "圖書館通宵、印報告、宿舍收行李。",
    suggestedTopics: ["期末最後一週", "回家前的自己", "熬夜之後", "今年謝謝自己"],
  },
  "winter-break": {
    phaseLabel: "寒假",
    studentMood: "回家、過年、打工。跟家人相處久了會有自己的情緒。",
    weather: "冬天。",
    campusScene: "校園空，社團多在準備下學期。",
    suggestedTopics: ["過年被問的問題", "回家的距離感", "寒假一個人的練習", "新學期想怎麼開始"],
  },
  "early-spring": {
    phaseLabel: "下學期開學（2–3 月）",
    studentMood: "重新開始的感覺，但比上學期少了新鮮感，多了現實。",
    weather: "淡水春天潮濕多雨，偶爾放晴很珍貴。",
    campusScene: "加退選、社團招新第二輪、櫻花、大四開始焦慮出路。",
    suggestedTopics: ["下學期想改變的一件事", "雨天的淡水", "大四的迷惘", "重新認識自己"],
  },
  "midterm-spring": {
    phaseLabel: "期中考（4 月）",
    studentMood: "第二次期中，比較習慣了，但累積的疲勞更多。",
    weather: "春末開始熱，午後雷陣雨。",
    campusScene: "圖書館、報告、實習面試、研究所放榜。",
    suggestedTopics: ["累積的疲勞", "面試前的深呼吸", "放榜的等待", "撐一下就好"],
  },
  "late-spring": {
    phaseLabel: "期中後（5 月）",
    studentMood: "畢業季情緒、社團交接、對關係的不安。",
    weather: "熱，日照長，傍晚河邊很多人。",
    campusScene: "畢業照、社團成果展、社長交接、期末專題。",
    suggestedTopics: ["交接的心情", "畢業前想說的話", "關係的結束與開始", "五月的夕陽"],
  },
  "final-spring": {
    phaseLabel: "期末考（6 月）",
    studentMood: "一學年的尾巴。有人畢業，有人搬離宿舍，有人開始害怕暑假太空。",
    weather: "很熱，雷陣雨。",
    campusScene: "期末考、退宿、畢業典禮、暑假計畫。",
    suggestedTopics: ["這一年謝謝你", "退宿的那天", "暑假要幹嘛", "一年後的自己"],
  },
};

export function semesterPhase(date: Date): SemesterPhase {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (m === 7 || m === 8 || (m === 9 && d < 8)) return "summer-break";
  if (m === 9 && d < 22) return "orientation";
  if (m === 9 || (m === 10 && d < 28)) return "early-fall";
  if (m === 10 || (m === 11 && d < 16)) return "midterm-fall";
  if (m === 11 || (m === 12 && d < 28)) return "late-fall";
  if (m === 12 || (m === 1 && d < 18)) return "final-fall";
  if (m === 1 || (m === 2 && d < 15)) return "winter-break";
  if (m === 2 || (m === 3) || (m === 4 && d < 8)) return "early-spring";
  if (m === 4 && d < 28) return "midterm-spring";
  if (m === 4 || m === 5) return "late-spring";
  return "final-spring";
}

export function studentContext(date = new Date()): StudentContext {
  const phase = semesterPhase(date);
  return {
    phase,
    ...PHASES[phase],
    monthDay: `${date.getMonth() + 1}/${date.getDate()}`,
  };
}

/** 給 AI prompt 用的一段文字。 */
export function studentContextPrompt(date = new Date()): string {
  const c = studentContext(date);
  return [
    `今天 ${c.monthDay}，淡江目前處於「${c.phaseLabel}」。`,
    `學生狀態：${c.studentMood}`,
    `淡水天氣 / 校園：${c.weather} ${c.campusScene}`,
    `可能有共鳴的主題：${c.suggestedTopics.join("、")}`,
  ].join("\n");
}

/** 淡江學生的分眾，AI 要真正想到「誰」會看。 */
export const STUDENT_PERSONAS = [
  { id: "freshman", label: "大一新生", line: "剛到淡水、什麼都新、還沒找到人一起吃飯" },
  { id: "upper", label: "大二到大四", line: "課業、實習、感情、未來一次來" },
  { id: "grad", label: "研究生", line: "論文壓力、一個人的研究室、跟指導教授的距離" },
  { id: "dorm", label: "住宿生", line: "宿舍夜晚很吵也很安靜，想找一個安靜的地方" },
  { id: "commuter", label: "通勤生", line: "每天捷運來回兩小時，校園只是路過" },
  { id: "newcomer", label: "剛到淡水的人", line: "還不知道哪裡好吃、哪裡可以發呆" },
  { id: "club-fresh", label: "社團新鮮人", line: "想試試看，但怕太宗教、怕被推銷" },
  { id: "seeker", label: "想認識自己的人", line: "對自我探索有興趣，但不知道從哪開始" },
  { id: "zero", label: "對禪完全不了解的人", line: "以為禪＝打坐＝宗教，其實就是想喘口氣" },
] as const;

export function personasPrompt() {
  return STUDENT_PERSONAS.map((p) => `- ${p.label}：${p.line}`).join("\n");
}

export function daysUntil(dateIso: string, from = new Date()): number {
  const target = new Date(`${dateIso}T00:00:00`);
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function formatDateLabel(dateIso: string) {
  const [, m, d] = dateIso.split("-");
  if (!m || !d) return dateIso;
  return `${m}/${d}`;
}

export function todayIso(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysIso(dateIso: string, days: number) {
  const d = new Date(`${dateIso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}
