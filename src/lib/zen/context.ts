/** 淡江大學禪學社 Creative Brain — brand, audience, season, voice. */

export const CLUB_NAME = "淡江大學禪學社";
export const APP_NAME = "禪光";
export const APP_TITLE = "禪光工作室";
export const APP_KICKER = "淡江大學禪學社";
export const IG_HANDLE = "@tamkang.zen";

export const STUDENT_SEGMENTS = [
  "淡江大一新生",
  "大二到大四學生",
  "研究生",
  "住宿生",
  "通勤生",
  "剛到淡水生活的人",
  "社團新鮮人",
  "想交朋友的人",
  "課業壓力大的學生",
  "人際困擾的人",
  "對未來迷惘的人",
  "想找歸屬感的人",
  "對自我探索有興趣的人",
  "對禪完全不了解的人",
] as const;

export const ZEN_TRANSLATION = [
  "安定",
  "專注",
  "慢下來",
  "認識自己",
  "整理情緒",
  "陪伴",
  "自我探索",
  "生活感",
  "喘口氣",
  "重新看見自己",
  "在人際和壓力中找到空間",
] as const;

export const RELIGIOUS_AVOID = [
  "宗教",
  "玄學",
  "佛法",
  "涅槃",
  "般若",
  "禪宗",
  "開示",
  "法會",
  "虔誠",
  "修行成就",
  "業力",
  "輪迴",
];

export const AI_TASTE_AVOID = [
  "破折號堆疊",
  "每句金句",
  "過度勵志",
  "過度詩意",
  "過度工整",
  "誠摯邀請您",
  "不容錯過",
  "開啟全新篇章",
];

export const BRAND_MOTIFS = ["龜龜", "三色光", "淡水夜晚", "校園角落", "坐下來", "茶", "燈"];

export type AcademicBeat =
  | "orientation"
  | "midterm"
  | "finals"
  | "break"
  | "summer"
  | "winter"
  | "ordinary";

export function academicBeat(now = new Date()): AcademicBeat {
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (m === 9 && d <= 30) return "orientation";
  if (m === 10 || (m === 11 && d <= 15)) return "midterm";
  if (m === 1 || m === 6) return "finals";
  if (m === 7 || m === 8) return "summer";
  if (m === 2) return "winter";
  if (m === 12 && d >= 20) return "winter";
  return "ordinary";
}

export function academicBeatLabel(beat: AcademicBeat): string {
  switch (beat) {
    case "orientation":
      return "開學季";
    case "midterm":
      return "期中前後";
    case "finals":
      return "期末週";
    case "break":
      return "假期";
    case "summer":
      return "暑假";
    case "winter":
      return "寒假／過年";
    default:
      return "學期日常";
  }
}

export function studentSituation(now = new Date()): string {
  const beat = academicBeat(now);
  const map: Record<AcademicBeat, string> = {
    orientation: "大一還在認路，舊生剛回淡水。課表還沒穩，人很多但未必比較不孤單。",
    midterm: "圖書館開始滿，捷運上有人在背書。很多人覺得自己該更努力，卻更喘。",
    finals: "期限疊在一起，睡眠變少。這時候需要的不是雞湯，是被允許停一下。",
    break: "離開校園節奏，有人回家、有人留宿。想被記得，但不想被催。",
    summer: "淡水比較空，社團容易消失。適合輕、生活感、讓人記得還有這個地方。",
    winter: "天氣濕冷，回淡水的路變長。適合溫的、短的、像一盞燈的內容。",
    ordinary: "課、社團、捷運、宿舍來回。內容要像同學傳訊息，不要像公告欄。",
  };
  return map[beat];
}

export const DEFAULT_AUDIENCE =
  "淡江大學學生：大一新生、住宿與通勤生、剛到淡水的人、想交朋友或暫時喘口氣的人。他們多半對禪不熟，先要覺得這跟自己的生活有關。";

export function zenSystemPrompt(now = new Date()): string {
  const beat = academicBeat(now);
  return `你是淡江大學禪學社的一人網宣創作導演。使用者同時是企劃、文案、設計、社群編輯與排程者。只服務這個社團與淡江學生，不要寫成通用品牌或企業行銷。

社團：${CLUB_NAME}
輸出平台以 Instagram 為主，可延伸 Story、Carousel、Reels、Threads、LINE。

禪的轉譯（優先使用）：${ZEN_TRANSLATION.join("、")}
不要一開始就用：${RELIGIOUS_AVOID.join("、")}。目標不是宗教廣告，而是讓學生覺得「這好像跟我的生活有關」。

現在時序：${academicBeatLabel(beat)}。淡江學生最近：${studentSituation(now)}

創作時必須想：
- 這跟淡江學生生活有什麼關係？淡水、捷運、宿舍、課表、天氣會不會影響？
- 學生真的會停下來看嗎？
- Hook 先讓人覺得「這好像在講我」，再進活動。禁止「淡江大學禪學社誠摯邀請您」。
- 文案要自然、有學生感、偶爾口語，像真的社團人在發。不要${AI_TASTE_AVOID.join("、")}。
- 視覺可含龜龜、三色光、夜晚、校園、朋友感、品牌色。不要老氣、過度宗教、過度 AI 光滑。
- 時間地點與報名必須清楚，但不要連發招生廣告；節奏要有生活、互動、故事、知識。

受眾請具體寫淡江學生，不要寫「年輕人／Z 世代」。

只輸出要求的 JSON，繁體中文。`;
}

export const HOOK_EXAMPLES = [
  "最近是不是連休息都覺得有罪惡感？",
  "有時候我們需要的不是答案，只是一個安靜的晚上。",
  "大學生活很自由，但你最近真的有比較快樂嗎？",
  "最近是不是很久沒有好好坐下來？",
];

export function daysUntil(isoDate: string, now = new Date()): number {
  const target = new Date(`${isoDate}T00:00:00+08:00`);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export function isZenClubBrief(brandName: string, audience: string) {
  return /禪|淡江/.test(`${brandName} ${audience}`);
}
