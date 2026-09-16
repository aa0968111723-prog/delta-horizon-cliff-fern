/** School-year context for Tamkang (Taiwan). Today in this workspace is 2026-09-16. */

export type SeasonBeat =
  | "orientation"
  | "settling"
  | "midterm"
  | "after-midterm"
  | "finals"
  | "break"
  | "summer";

export type SeasonContext = {
  todayIso: string;
  label: string;
  beat: SeasonBeat;
  campus: string;
  weather: string;
  studentNow: string;
  contentHint: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function todayIso(now = new Date()) {
  const tpe = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  return `${tpe.getFullYear()}-${pad(tpe.getMonth() + 1)}-${pad(tpe.getDate())}`;
}

export function daysUntil(isoDate: string, now = new Date()) {
  const tpe = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  tpe.setHours(0, 0, 0, 0);
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target.getTime() - tpe.getTime()) / 86400000);
}

export function formatMd(isoDate: string) {
  const [, m, d] = isoDate.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export function seasonContext(now = new Date()): SeasonContext {
  const iso = todayIso(now);
  const tpe = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const month = tpe.getMonth() + 1;
  const date = tpe.getDate();

  let beat: SeasonBeat = "settling";
  let label = "學期進行中";
  let studentNow = "課表開始固定，人還在互相認臉。";
  let contentHint = "少一點招生腔，多一點『今晚可以停一下』。";
  let weather = "淡水九月還暖，晚上河風開始涼，斜坡校園黃昏很長。";

  if (month === 9 && date <= 20) {
    beat = "orientation";
    label = "開學季";
    studentNow = "大一剛到淡水，學長姐在找人，舊生在把課表填滿。捷運紅樹林到淡水這段，每天都有人提著還沒拆的行李。";
    contentHint = "先講生活，再講活動。新生看得懂、舊生也不會覺得被說教。";
    weather = "午後仍熱，晚上淡水風會起來。適合夜燈、茶、坐下來。";
  } else if ((month === 10 && date >= 20) || (month === 11 && date <= 15)) {
    beat = "midterm";
    label = "期中前後";
    studentNow = "圖書館、教室、宿舍桌都被報告佔據。休息會有罪惡感。";
    contentHint = "不要再塞活動廣告。給一個短的、可參加的出口。";
    weather = "淡水開始明顯轉涼，校園葉子與河岸黃昏很好拍。";
  } else if (month === 11 || month === 12) {
    beat = "after-midterm";
    label = "期中過後";
    studentNow = "學期過半，有人開始消失在社團，有人開始找下一個歸屬。";
    contentHint = "故事、社員、日常，比連續招生更像這個帳號。";
  } else if (month === 1 || (month === 12 && date >= 20)) {
    beat = "finals";
    label = "期末";
    studentNow = "只想撐完。任何超過 15 秒的文案都會被划走。";
    contentHint = "極短、具體、時間地點一眼看完。";
  } else if (month === 2 || month === 7 || month === 8) {
    beat = month === 2 ? "break" : "summer";
    label = month === 2 ? "寒假" : "暑假";
    studentNow = "人離開淡水，內容要能讓還在的人覺得沒被忘記。";
    contentHint = "回顧、預告、淡水生活，而不是空教室招生。";
  }

  return {
    todayIso: iso,
    label,
    beat,
    campus: "淡江大學淡水校園 · 紅樹林／淡水線 · 斜坡、宮燈、河岸",
    weather,
    studentNow,
    contentHint,
  };
}
