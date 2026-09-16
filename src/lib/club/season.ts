export type AcademicMomentId =
  | "start"
  | "settle"
  | "midterm"
  | "recover"
  | "finals"
  | "break"
  | "summer";

export type AcademicMoment = {
  id: AcademicMomentId;
  label: string;
  studentNow: string;
  weather: string;
  contentHint: string;
};

function at(month: number, day: number) {
  return month * 100 + day;
}

/** 以台灣大學學期節奏估算，不裝成官方校曆。 */
export function academicMoment(date: Date = new Date()): AcademicMoment {
  const md = at(date.getMonth() + 1, date.getDate());

  if (md >= at(9, 1) && md <= at(9, 25)) {
    return {
      id: "start",
      label: "開學適應期",
      studentNow: "大一剛到淡水，課表還沒穩，想認識人又怕熱場。舊生在把生活撿回來。",
      weather: "淡水還熱，午後常陣雨，傍晚河岸開始有風。",
      contentHint: "少講招生話術，多講「有一個可以坐下來的晚上」。",
    };
  }
  if (md >= at(9, 26) && md <= at(10, 20)) {
    return {
      id: "settle",
      label: "學期前段",
      studentNow: "課開始堆，社團也開始選。有人找到圈，有人還沒。",
      weather: "天氣轉乾涼，淡水夕陽變得好看。",
      contentHint: "生活感、社員日常、小型茶會，比大聲招生有效。",
    };
  }
  if (md >= at(10, 21) && md <= at(11, 20)) {
    return {
      id: "midterm",
      label: "期中前後",
      studentNow: "期中壓過來，宿舍燈很晚才關。人際也容易卡住。",
      weather: "東北季風，淡水濕涼，通勤更累。",
      contentHint: "陪伴、喘口氣、不要一直發活動廣告。",
    };
  }
  if (md >= at(11, 21) && md <= at(12, 15)) {
    return {
      id: "recover",
      label: "期中過後",
      studentNow: "鬆一口氣，但又開始想這學期有沒有交到朋友。",
      weather: "更涼，晚上適合熱茶。",
      contentHint: "回顧、故事、下一次小聚。",
    };
  }
  if (md >= at(12, 16) || md <= at(1, 20)) {
    return {
      id: "finals",
      label: "期末",
      studentNow: "報告、考試、回家的車票。未來迷惘也在這時候浮上來。",
      weather: "淡水冬天濕冷，風大。",
      contentHint: "安靜、陪伴、不要說教。",
    };
  }
  if (md >= at(1, 21) && md <= at(2, 20)) {
    return {
      id: "break",
      label: "寒假",
      studentNow: "有人回家，有人留校。開學焦慮會提前出現。",
      weather: "濕冷，河岸空曠。",
      contentHint: "輕、短、可收藏。不必密集發文。",
    };
  }
  if (md >= at(2, 21) && md <= at(3, 15)) {
    return {
      id: "start",
      label: "下學期開學",
      studentNow: "新學期，轉社、找方向、想重新開始的人變多。",
      weather: "還冷，偶有陽光。",
      contentHint: "重新認識自己，而不是重新招生話術。",
    };
  }
  if (md >= at(6, 1) && md <= at(8, 31)) {
    return {
      id: "summer",
      label: "暑假",
      studentNow: "有人實習，有人留淡水。節奏慢，內容不要裝忙。",
      weather: "潮濕炎熱，午後雷雨。",
      contentHint: "生活切片、龜龜、河岸，少倒數。",
    };
  }
  return {
    id: "settle",
    label: "學期中",
    studentNow: "上課、社團、人際同時進行。需要一點空間。",
    weather: "淡水多風，天氣一天變好幾次。",
    contentHint: "生活與活動穿插，不要連續招生。",
  };
}

function ymdTaipei(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function daysUntil(isoDate: string, from: Date = new Date()): number {
  const [ty, tm, td] = isoDate.split("-").map(Number);
  const [fy, fm, fd] = ymdTaipei(from).split("-").map(Number);
  const target = Date.UTC(ty, tm - 1, td);
  const start = Date.UTC(fy, fm - 1, fd);
  return Math.round((target - start) / 86400000);
}
