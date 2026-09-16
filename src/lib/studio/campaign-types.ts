export type ContentType =
  | "ig-post"
  | "carousel"
  | "story"
  | "reels"
  | "threads"
  | "line"
  | "poster"
  | "review"
  | "member-story"
  | "countdown"
  | "qa"
  | "poll"
  | "knowledge";

export type ContentStatus = "idea" | "creating" | "completed" | "scheduled" | "published";

export type TamkangAudiencePain =
  | "freshman-friendship"
  | "commuter-tired"
  | "dorm-lonely"
  | "midterm-pressure"
  | "future-lost"
  | "emotion-overload"
  | "need-quiet-space"
  | "curious-self-exploration";

export type Campaign = {
  id: string;
  name: string;
  type: "tea-party" | "lecture" | "camp" | "exhibition" | "daily" | "recruitment" | "special";
  date: string;
  time: string;
  location: string;
  oneLiner: string;
  description: string;
  theme: string;
  studentPain: string;
  mainCta: string;
  signupUrl: string;
  coverImage?: string;
  relatedAssetIds: string[];
  createdAt: number;
  updatedAt: number;
  status: "upcoming" | "in-progress" | "concluded";
};

export type ScheduledPost = {
  id: string;
  campaignId?: string;
  projectId?: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  scheduledAt: string; // ISO string or YYYY-MM-DD HH:mm
  publishedAt?: string;
  caption: string;
  hashtags: string[];
  hook: string;
  cta: string;
  visualDirection: string;
  previewImageUrl?: string;
  slidesCount?: number;
  sourceKind: "google-drive" | "canva" | "instagram" | "ai-generated" | "brand-memory";
  sourceRef?: string;
  insights?: {
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    hookEffectiveness?: string;
  };
};

export type ThirdPartyConnection = {
  id: "google-drive" | "canva" | "instagram";
  name: string;
  status: "connected" | "disconnected" | "syncing" | "demo";
  accountName: string;
  accountDetail: string;
  lastSyncedAt: number;
  itemCount: number;
  honesty: string;
};

export const CAMPAIGN_TYPE_LABELS: Record<Campaign["type"], string> = {
  "tea-party": "迎新茶會",
  lecture: "講座",
  camp: "營隊",
  exhibition: "展覽",
  daily: "日常社課",
  recruitment: "招生",
  special: "特別企劃",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  "ig-post": "IG 單張",
  carousel: "Carousel",
  story: "限動",
  reels: "Reels",
  threads: "Threads",
  line: "LINE",
  poster: "海報",
  review: "回顧",
  "member-story": "社員故事",
  countdown: "倒數",
  qa: "問答",
  poll: "投票",
  knowledge: "知識卡",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  idea: "靈感",
  creating: "製作中",
  completed: "已就緒",
  scheduled: "已排程",
  published: "已發布",
};

export const STUDENT_PAIN_PRESETS: { id: TamkangAudiencePain; label: string; hint: string }[] = [
  { id: "freshman-friendship", label: "大一交朋友", hint: "剛到淡水，想找一個不用硬社交的角落" },
  { id: "commuter-tired", label: "通勤疲憊", hint: "克難坡與紅線捷運把人掏空" },
  { id: "dorm-lonely", label: "宿舍孤單", hint: "下雨天房間很靜，心卻很吵" },
  { id: "midterm-pressure", label: "期中壓力", hint: "報告與分數以外，還想好好呼吸" },
  { id: "future-lost", label: "未來迷惘", hint: "課表排滿，方向卻不清楚" },
  { id: "emotion-overload", label: "情緒過載", hint: "不是不夠努力，只是太久沒停下來" },
  { id: "need-quiet-space", label: "需要安靜空間", hint: "給自己一個不被評分的晚上" },
  { id: "curious-self-exploration", label: "想認識自己", hint: "穩定、專注、陪自己看看內在" },
];

export type CreativeSourceItem = {
  id: string;
  source: "google-drive" | "canva" | "instagram" | "ai-generated";
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  date: string;
  metrics?: string;
  meta?: Record<string, string>;
};
