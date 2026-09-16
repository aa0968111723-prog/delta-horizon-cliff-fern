import type { CampaignPlan, CitedSource, ContentKind, ProjectStatus, StudentReview } from "../studio/types.ts";

export type CampaignType =
  | "tea"
  | "class"
  | "recruit"
  | "talk"
  | "light"
  | "retreat"
  | "review"
  | "other";

export type WaveKind =
  | "tease"
  | "emotion"
  | "key-visual"
  | "info"
  | "reason"
  | "countdown"
  | "day-of"
  | "recap";

export type CampaignWave = {
  id: string;
  kind: WaveKind;
  title: string;
  scheduledAt: number;
  projectId: string | null;
  status: ProjectStatus;
  notes: string;
  copyPreview?: string;
  visualIndex?: number;
  angleIndex?: number;
};

export type CreateIntent = {
  idea: string;
  kind: string;
  autoGenerate: boolean;
};

export type ClubCampaign = {
  id: string;
  name: string;
  type: CampaignType;
  date: string;
  time: string;
  location: string;
  tagline: string;
  description: string;
  theme: string;
  studentPain: string;
  cta: string;
  signupUrl: string;
  coverAssetId: string | null;
  relatedAssetIds: string[];
  projectIds: string[];
  waves: CampaignWave[];
  createdAt: number;
  updatedAt: number;
};

export type ScheduleItem = {
  id: string;
  title: string;
  contentKind: ContentKind;
  status: ProjectStatus;
  scheduledAt: number;
  publishedAt: number | null;
  projectId: string | null;
  campaignId: string | null;
  captionPreview: string;
};

export type IgMemoryPost = {
  id: string;
  mediaType: "image" | "carousel" | "reels";
  caption: string;
  postedAt: number;
  assetId: string;
  likes: number;
  comments: number;
  saves: number;
  reach: number;
  permalink?: string;
  hook?: string;
  analysis?: string;
  mediaUrl?: string;
};

export type MemoryItem = {
  id: string;
  source: CitedSource["source"];
  title: string;
  subtitle: string;
  thumbAssetId?: string;
  tags: string[];
  year?: number;
  kind: string;
  url?: string;
};

export type ConnectionId = "drive" | "canva" | "instagram";

export type ConnectionState = {
  id: ConnectionId;
  status: "disconnected" | "connected" | "needs-auth" | "unavailable";
  label: string;
  detail: string;
  lastSyncAt: number | null;
  accountName: string | null;
};

export type CopyPack = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  variants: { style: string; text: string }[];
  studentReview: StudentReview;
};

export type CreativePack = {
  campaignName: string;
  insight: string;
  studentContext: string;
  foundCount: number;
  citedSources: CitedSource[];
  directions: CampaignPlan["visualDirections"];
  plan: CampaignPlan;
  copy: CopyPack;
};

export const CAMPAIGN_TYPES: { id: CampaignType; label: string }[] = [
  { id: "tea", label: "茶會" },
  { id: "class", label: "社課" },
  { id: "recruit", label: "招生" },
  { id: "talk", label: "講座" },
  { id: "light", label: "燈光／夜晚" },
  { id: "retreat", label: "一日禪／靜心" },
  { id: "review", label: "活動回顧" },
  { id: "other", label: "其他" },
];

export const WAVE_LABEL: Record<WaveKind, string> = {
  tease: "預熱",
  emotion: "情緒共鳴",
  "key-visual": "主視覺",
  info: "活動介紹",
  reason: "參加理由",
  countdown: "倒數",
  "day-of": "當日 Story",
  recap: "活動回顧",
};

export const CONTENT_KIND_LABEL: Record<ContentKind, string> = {
  "ig-post": "IG 貼文",
  carousel: "Carousel",
  story: "Story",
  reels: "Reels",
  threads: "Threads",
  line: "LINE",
  poster: "海報",
  recap: "活動回顧",
  "member-story": "社員故事",
  countdown: "倒數",
  qa: "Q&A",
  poll: "互動投票",
  knowledge: "知識內容",
};
