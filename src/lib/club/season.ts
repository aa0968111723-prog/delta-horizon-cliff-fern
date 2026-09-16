export type AcademicPhase = "orientation" | "midterm" | "finals" | "break" | "term";

export type StudentContext = {
  now: Date;
  phase: AcademicPhase;
  phaseLabel: string;
  calendarNote: string;
  campusLife: string[];
  weatherNote: string;
  whoIsListening: string[];
  wouldTheyStop: string;
};

function atTaipei(date: Date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
  return new Date(utc + 8 * 3600_000);
}

export function academicPhase(date: Date): AcademicPhase {
  const local = atTaipei(date);
  const month = local.getMonth() + 1;
  const day = local.getDate();
  if (month === 2 || (month === 1 && day >= 20) || (month === 6 && day >= 20) || month === 7 || month === 8) {
    return "break";
  }
  if ((month === 9 && day <= 30) || (month === 2 && day >= 15 && day <= 28)) return "orientation";
  if (month === 11 || (month === 4 && day >= 10) || (month === 10 && day >= 20)) return "midterm";
  if (month === 1 || month === 6 || (month === 12 && day >= 10) || (month === 5 && day >= 20)) return "finals";
  return "term";
}

export function studentContext(date: Date = new Date()): StudentContext {
  const local = atTaipei(date);
  const phase = academicPhase(local);
  const month = local.getMonth() + 1;
  const phaseLabel =
    phase === "orientation"
      ? "開學／迎新"
      : phase === "midterm"
        ? "期中"
        : phase === "finals"
          ? "期末"
          : phase === "break"
            ? "假期"
            : "學期中";

  const calendarNote =
    phase === "orientation"
      ? "很多大一新生剛到淡水，課表還沒穩，想認識人、想找一個不會很吵的地方。"
      : phase === "midterm"
        ? "期中前後，學生比較需要喘口氣，而不是再被催一次。"
        : phase === "finals"
          ? "期末壓力高，內容要短、要具體，讓人覺得可以坐下來一下。"
          : phase === "break"
            ? "假期裡還在淡水或回家的人都有。活動要講清楚誰適合來。"
            : "一般上課週。通勤、宿舍、社團、作業同時發生。";

  const weatherNote =
    month >= 6 && month <= 9
      ? "淡水還偏熱，傍晚河邊比較宜人。夜間活動比正午更有停留感。"
      : month === 10 || month === 11
        ? "秋天的淡水風大、日落早。室內暖光、茶、坐下來，比戶外大場面更真。"
        : month === 12 || month <= 2
          ? "冬天濕冷。強調室內、熱飲、有伴、不用硬撐。"
          : "春雨與開學交錯。濕氣、捷運、還沒熟的校園路都是真實生活。";

  const campusLife = [
    "淡水捷運通勤或從宿舍走去活動",
    "課表空堂不知道要做什麼",
    "想交朋友但不想硬社交",
    "對禪沒有預設，只是想找一個能坐下的晚上",
  ];

  const whoIsListening =
    phase === "orientation"
      ? ["剛到淡水的大一", "社團新鮮人", "想交朋友的人"]
      : phase === "finals"
        ? ["課業壓力大的學生", "想喘口氣的人", "住宿生"]
        : ["淡江學生", "通勤生與住宿生", "對自我探索有興趣、但不想被說教的人"];

  return {
    now: local,
    phase,
    phaseLabel,
    calendarNote,
    campusLife,
    weatherNote,
    whoIsListening,
    wouldTheyStop: "先問：這跟淡江學生這週的生活有關嗎？會不會停下來？時間地點清不清楚？",
  };
}

export function isoTaipei(from: Date = new Date()) {
  const local = atTaipei(from);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysUntil(isoDate: string, from: Date = new Date()) {
  const local = atTaipei(from);
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  const start = new Date(local.getFullYear(), local.getMonth(), local.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function formatDaysUntil(isoDate: string, from: Date = new Date()) {
  const n = daysUntil(isoDate, from);
  if (n === 0) return "就是今天";
  if (n === 1) return "還有 1 天";
  if (n > 1) return `還有 ${n} 天`;
  if (n === -1) return "昨天";
  return `${Math.abs(n)} 天前`;
}
