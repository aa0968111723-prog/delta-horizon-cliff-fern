import type {
  CampaignPainPoint,
  CampaignType,
  ContentStatus,
  ContentType,
  ToneId,
  WaveRole,
} from "../studio/types.ts";

export const APP_NAME = "禪光 Studio";
export const CLUB_NAME = "淡江大學禪學社";
export const CLUB_HANDLE = "@tku.zen";

export const CAMPAIGN_TYPES: { id: CampaignType; label: string; hint: string }[] = [
  { id: "tea", label: "茶會", hint: "晚上、慢下來、聊聊天" },
  { id: "meditation", label: "靜坐體驗", hint: "第一次也可以" },
  { id: "class", label: "社課", hint: "每週固定" },
  { id: "lecture", label: "講座", hint: "來聽一個晚上" },
  { id: "welcome", label: "迎新", hint: "開學、新生、認識人" },
  { id: "retreat", label: "一日禪 / 營隊", hint: "離開校園一天" },
  { id: "showcase", label: "成果展 / 期末", hint: "回顧、分享" },
  { id: "recruit", label: "招生 / 社博", hint: "社團博覽會、招生週" },
  { id: "other", label: "其他", hint: "自訂" },
];

export function campaignTypeLabel(id: CampaignType) {
  return CAMPAIGN_TYPES.find((t) => t.id === id)?.label ?? id;
}

export const PAIN_POINTS: { id: CampaignPainPoint; label: string; line: string }[] = [
  { id: "stress", label: "課業壓力", line: "報告、期中、期末一直來，連休息都有罪惡感。" },
  { id: "lonely", label: "一個人", line: "剛到淡水，還沒找到可以一起吃晚餐的人。" },
  { id: "lost", label: "對未來迷惘", line: "大學好像很自由，但不知道自己要什麼。" },
  { id: "sleep", label: "睡不好", line: "躺在宿舍床上滑到兩點，腦袋停不下來。" },
  { id: "focus", label: "無法專注", line: "打開書十分鐘，手機已經拿起來三次。" },
  { id: "friends", label: "人際困擾", line: "在人群裡很累，但一個人又有點空。" },
  { id: "curious", label: "對禪好奇", line: "聽過禪，但完全不知道那是什麼。" },
  { id: "belonging", label: "想找歸屬感", line: "想要一個地方，去了不用表現什麼。" },
];

export function painPointLabel(id: CampaignPainPoint) {
  return PAIN_POINTS.find((p) => p.id === id)?.label ?? id;
}

export const CONTENT_TYPES: { id: ContentType; label: string; short: string; hint: string }[] = [
  { id: "ig-post", label: "IG 貼文", short: "貼文", hint: "單張 4:5 或 1:1" },
  { id: "carousel", label: "IG Carousel", short: "輪播", hint: "5–6 頁說完一件事" },
  { id: "story", label: "IG Story", short: "限動", hint: "3–5 張 9:16" },
  { id: "reels", label: "Reels", short: "Reels", hint: "20 秒腳本 + 封面" },
  { id: "threads", label: "Threads", short: "Threads", hint: "短文字 + 一張圖" },
  { id: "line", label: "LINE 宣傳", short: "LINE", hint: "群組轉發用" },
  { id: "poster", label: "海報", short: "海報", hint: "校園張貼" },
  { id: "recap", label: "活動回顧", short: "回顧", hint: "活動後隔天" },
  { id: "member-story", label: "社員故事", short: "故事", hint: "一個人為什麼來" },
  { id: "countdown", label: "倒數", short: "倒數", hint: "還有 N 天" },
  { id: "qa", label: "Q&A", short: "Q&A", hint: "大家常問的" },
  { id: "poll", label: "互動投票", short: "投票", hint: "限動投票 / 問答" },
  { id: "knowledge", label: "知識內容", short: "知識", hint: "生活化的禪" },
];

export function contentTypeLabel(id: ContentType) {
  return CONTENT_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function contentTypeShort(id: ContentType) {
  return CONTENT_TYPES.find((t) => t.id === id)?.short ?? id;
}

export const CONTENT_STATUS: Record<
  ContentStatus,
  { label: string; tone: "default" | "warn" | "success" | "accent" }
> = {
  idea: { label: "想法", tone: "default" },
  drafting: { label: "創作中", tone: "warn" },
  done: { label: "完成", tone: "accent" },
  scheduled: { label: "已排程", tone: "accent" },
  published: { label: "已發布", tone: "success" },
};

export const CONTENT_STATUS_ORDER: ContentStatus[] = ["idea", "drafting", "done", "scheduled", "published"];

export const TONES: { id: ToneId; label: string; hint: string }[] = [
  { id: "short", label: "短版", hint: "三行內講完" },
  { id: "normal", label: "一般版", hint: "完整但不囉唆" },
  { id: "warm", label: "感性版", hint: "多一點陪伴感" },
  { id: "student", label: "學生版", hint: "像同學在發文" },
  { id: "life", label: "生活版", hint: "淡水、宿舍、課表" },
  { id: "humor", label: "幽默版", hint: "自嘲一點，但不油" },
];

export function toneLabel(id: ToneId) {
  return TONES.find((t) => t.id === id)?.label ?? id;
}

export const WAVE_ROLES: Record<WaveRole, { label: string; hint: string }> = {
  teaser: { label: "預熱", hint: "先丟一個問題，不講活動" },
  empathy: { label: "情緒共鳴", hint: "讓學生覺得「這在講我」" },
  keyvisual: { label: "主視覺", hint: "活動正式登場" },
  info: { label: "活動介紹", hint: "時間、地點、怎麼參加" },
  reason: { label: "參加理由", hint: "三個來的理由" },
  life: { label: "生活內容", hint: "不宣傳，只陪伴" },
  interactive: { label: "互動", hint: "投票、問答" },
  knowledge: { label: "知識", hint: "生活化的禪" },
  story: { label: "社員故事", hint: "一個人的來由" },
  countdown: { label: "倒數", hint: "還有 N 天" },
  dayof: { label: "當日", hint: "限動提醒" },
  recap: { label: "回顧", hint: "隔天的照片與感謝" },
};

export const ASSET_CATEGORY_LABELS = {
  logo: "Logo",
  mascot: "龜龜",
  photo: "活動照片",
  people: "社員照片",
  campus: "淡江校園",
  tamsui: "淡水",
  poster: "海報",
  background: "背景",
  generated: "AI 生成",
  ig: "IG",
  story: "Story",
  reels: "Reels",
  archive: "歷屆活動",
  illustration: "插圖",
  icon: "圖示",
} as const;
