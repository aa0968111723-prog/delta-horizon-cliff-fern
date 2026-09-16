export const CLUB = {
  name: "淡江大學禪學社",
  shortName: "禪學社",
  studioName: "禪光工作室",
  handle: "@tku.zen",
  website: "淡江大學禪學社",
  campus: "淡江大學",
  city: "淡水",
  mascot: "龜龜",
  lights: "三色光",
} as const;

export const CLUB_AUDIENCE = [
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

export const ZEN_TRANSLATION = {
  prefer: ["安定", "專注", "慢下來", "認識自己", "整理情緒", "陪伴", "自我探索", "生活感", "喘口氣", "重新看見自己"],
  avoid: ["宗教廣告", "玄學", "艱澀佛學名詞", "說教", "過度正式的宗教語氣", "誠摯邀請您"],
} as const;

export const FORBIDDEN_CLUB_PHRASES = [
  "誠摯邀請您",
  "歡迎蒞臨",
  "限時瘋搶",
  "錯過就沒有",
  "心靈雞湯",
  "開啟人生新篇章",
  "踏上覺醒之路",
];

export const DEFAULT_HASHTAGS = [
  "#淡江禪學社",
  "#淡江大學",
  "#淡水",
  "#社團",
  "#自我探索",
  "#慢下來",
];

export const DEFAULT_CTAS = ["來坐一下", "帶朋友一起來", "看活動時間", "我要報名"];

export function isZenClub(name: string) {
  return /禪學社|淡江|tku\.zen|禪光/i.test(name);
}

export function clubVoice() {
  return "像社團的人在限動裡講話：自然、有學生感、偶爾口語。先讓淡江學生覺得「這好像在講我」，再帶出活動。禪轉譯成安定、專注、慢下來、認識自己，不要一開始就宗教、玄學或說教。";
}
