export type CampaignType =
  | "茶會"
  | "社課"
  | "招生"
  | "講座"
  | "工作坊"
  | "社員活動"
  | "其他";

export type ContentType =
  | "IG Post"
  | "Carousel"
  | "Story"
  | "Reels"
  | "Threads"
  | "LINE"
  | "海報"
  | "活動回顧"
  | "社員故事"
  | "倒數"
  | "Q&A"
  | "互動投票"
  | "知識內容";

export type ContentStatus = "idea" | "creating" | "complete" | "scheduled" | "published";

export type Campaign = {
  id: string;
  name: string;
  type: CampaignType;
  eventDate: string;
  eventTime: string;
  location: string;
  oneLiner: string;
  description: string;
  theme: string;
  studentPain: string;
  cta: string;
  registrationUrl: string;
  assetIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type ContentItem = {
  id: string;
  campaignId: string;
  title: string;
  angle: string;
  type: ContentType;
  status: ContentStatus;
  plannedAt: string;
  publishedAt: string | null;
  projectId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type PostOutcome = {
  id: string;
  contentItemId: string | null;
  campaignId: string | null;
  title: string;
  whoShowedUp: string;
  hookThatFeltTamkang: string;
  remember: string;
  createdAt: number;
};

export type OutcomeInput = Omit<PostOutcome, "id" | "createdAt">;

export type CampaignInput = Omit<Campaign, "id" | "assetIds" | "createdAt" | "updatedAt">;
