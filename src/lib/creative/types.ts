import type { ContentKind, ProjectStatus, SourceRef, StudentSim } from "../studio/types.ts";

export type CampaignType =
  | "tea"
  | "light"
  | "workshop"
  | "recruit"
  | "talk"
  | "outing"
  | "recap"
  | "other";

export const CAMPAIGN_TYPES: { id: CampaignType; label: string }[] = [
  { id: "tea", label: "茶會" },
  { id: "light", label: "光／靜心" },
  { id: "workshop", label: "社課／工作坊" },
  { id: "recruit", label: "招生" },
  { id: "talk", label: "分享／對談" },
  { id: "outing", label: "外出" },
  { id: "recap", label: "回顧" },
  { id: "other", label: "其他" },
];

export type CampaignWave = {
  id: string;
  offsetDays: number;
  intent: string;
  topic: string;
  contentKind: ContentKind;
  projectId: string | null;
  scheduledAt: number | null;
  publishedAt?: number | null;
  status: ProjectStatus;
};

export type ClubCampaign = {
  id: string;
  name: string;
  type: CampaignType;
  date: string;
  time: string;
  location: string;
  oneLiner: string;
  fullIntro: string;
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

export type ConnectionId = "google-drive" | "canva" | "instagram";

export type ConnectionStatus = "connected" | "disconnected" | "memory";

export type ConnectionState = {
  id: ConnectionId;
  status: ConnectionStatus;
  accountLabel: string;
  folderHint: string;
  folderId?: string;
  lastSyncAt: number | null;
};

export type MemorySource = SourceRef["source"];

export type MemoryItem = {
  id: string;
  source: MemorySource;
  sourceLabel: string;
  title: string;
  kind: "photo" | "doc" | "design" | "video" | "poster" | "logo" | "post";
  tags: string[];
  assetId?: string;
  summary: string;
  thumbUrl?: string;
  openUrl?: string;
  createdAt: number;
};

export type IgMemoryPost = {
  id: string;
  source: "instagram" | "seed";
  mediaType: "image" | "carousel" | "reels";
  caption: string;
  takenAt: number;
  permalink?: string;
  assetIds: string[];
  likes?: number;
  comments?: number;
  saves?: number;
  reach?: number;
  shares?: number;
  mediaUrl?: string;
  analysis?: {
    hook: string;
    visual: string;
    theme: string;
    captionLength: number;
    cta: string;
    direction: string;
    improve: string[];
    studentSim?: StudentSim;
  };
};

export type LastLearn = {
  at: number;
  hook: string;
  mixLesson: string;
  hookLesson: string;
  visualLesson?: string;
};

export type Inspiration = {
  id: string;
  title: string;
  pattern: string;
  composition: string;
  color: string;
  hookShape: string;
  form: string;
  clubTurn: string;
};

export type SearchHit = {
  id: string;
  title: string;
  summary: string;
  source: MemorySource;
  sourceLabel: string;
  kind: string;
  assetId?: string;
  href?: string;
  thumbUrl?: string;
};

export type CalendarItem = {
  id: string;
  date: string;
  title: string;
  kind: ContentKind | "event";
  status: ProjectStatus;
  projectId?: string;
  campaignId?: string;
  waveId?: string;
  publishedAt?: number;
  coverAssetId?: string;
  coverUrl?: string;
  coverFromCanva?: boolean;
};
