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
  status: "connected" | "disconnected" | "syncing";
  accountName: string;
  accountDetail: string;
  lastSyncedAt: number;
  itemCount: number;
};

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
  meta?: Record<string, unknown>;
};
