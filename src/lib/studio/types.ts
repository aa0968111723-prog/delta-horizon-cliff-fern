export type FormatId =
  | "feed-square"
  | "feed-portrait"
  | "feed-landscape"
  | "story"
  | "reels-cover"
  | "threads"
  | "line-promo";

export type ContentKind =
  | "ig-post"
  | "carousel"
  | "story"
  | "reels"
  | "threads"
  | "line"
  | "poster"
  | "recap"
  | "member-story"
  | "countdown"
  | "qa"
  | "poll"
  | "knowledge";

export type ContentStatus = "idea" | "creating" | "done" | "scheduled" | "published";

export type CreativeSourceKind = "drive" | "canva" | "instagram" | "generated" | "brand";

export type SourceRef = {
  kind: CreativeSourceKind;
  label: string;
  id?: string;
};

export type CreativeDirection = {
  id: string;
  name: string;
  concept: string;
  palette: string;
  composition: string;
  typeDirection: string;
  imagePrompt: string;
  headline: string;
  subhead: string;
};

export type WavePurpose =
  | "tease"
  | "emotion"
  | "hero"
  | "info"
  | "reason"
  | "story"
  | "countdown"
  | "dayof"
  | "recap"
  | "life"
  | "interact"
  | "knowledge";

export type CampaignWave = {
  id: string;
  offsetDays: number;
  label: string;
  purpose: WavePurpose;
  contentKind: ContentKind;
  topic: string;
  hook: string;
};

export type StudentReview = {
  wouldStop: string;
  understood: string;
  tooReligious: string;
  tooSerious: string;
  tooLiterary: string;
  tooAi: string;
  tooLong: string;
  knowsWhat: string;
  knowsWhenWhere: string;
  wouldBringFriend: string;
  knowsSignup: string;
  revisions: string[];
};

export type ReelsBeat = {
  start: number;
  end: number;
  visual: string;
  caption: string;
  voiceover: string;
  transition: string;
  assetHint: string;
};

export type ThreadsPost = {
  caption: string;
  visualNote: string;
};

export type LineCopy = {
  title: string;
  body: string;
  cta: string;
};

export type TemplateId = "editorial" | "product" | "offer" | "quote";

export type CampaignGoal = "awareness" | "traffic" | "conversion" | "ugc";

export type LayerType = "text" | "shape" | "image" | "logo" | "line";

export type TextRole =
  | "eyebrow"
  | "headline"
  | "subhead"
  | "body"
  | "cta"
  | "handle"
  | "custom";

export type ShapeKind = "rect" | "ellipse" | "pill";

export type Align = "left" | "center" | "right";

export type ColorRole = "primary" | "secondary" | "accent" | "background" | "ink";

export type ProjectStatus = "draft" | "ready" | "exported";

export type EditorTool = "select" | "text" | "rect" | "ellipse" | "line";

export type AlignMode =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "safe-left"
  | "safe-center"
  | "safe-right"
  | "safe-top"
  | "safe-middle"
  | "safe-bottom";

export type HandleId = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type BrandColor = {
  id: string;
  hex: string;
  role: ColorRole;
  label: string;
};

export type BrandBoilerplate = {
  cta: string;
  disclaimer: string;
  hashtags: string[];
  captionClose: string;
};

export type LogoUsage = "primary" | "light" | "dark" | "mark" | "horizontal";

export type LogoVariant = {
  id: string;
  name: string;
  assetId: string;
  usage: LogoUsage;
};

export type ImageStyle = {
  mood: string;
  lighting: string;
  paletteHint: string;
  composition: string;
  do: string;
  dont: string;
};

export type BrandRules = {
  noCompetitorMarks: boolean;
  noWatermark: boolean;
  noLowRes: boolean;
  notes: string;
};

/**
 * Brand Memory — what the AI reads before every generation.
 * 淡江禪學社專用：龜龜角色、三色光、社團理念、固定介紹、喜歡 / 不喜歡的風格。
 */
export type BrandMemory = {
  mission: string;
  fixedIntro: string;
  mascotName: string;
  mascotDescription: string;
  mascotAssetId: string | null;
  signatureVisual: string;
  likedStyles: string[];
  dislikedStyles: string[];
  audienceNotes: string;
  toneExamples: string[];
  recurringEvents: string[];
  /** IG DNA 摘要：生成新內容時優先參考自己的 IG。 */
  igDna: string;
};

export type BrandKit = {
  id: string;
  name: string;
  handle: string;
  website: string;
  voice: string;
  doSay: string;
  dontSay: string;
  forbiddenWords: string[];
  colors: BrandColor[];
  fontDisplay: string;
  fontBody: string;
  logoAssetId: string | null;
  logos: LogoVariant[];
  slogans: string[];
  ctas: string[];
  imageStyle: ImageStyle;
  rules: BrandRules;
  boilerplate: BrandBoilerplate;
  memory: BrandMemory;
  updatedAt: number;
};

export type AssetKind = "image" | "logo" | "pattern";

/**
 * AI Creative Library 分類。
 * 舊分類 (photo / people / background / illustration / icon) 仍可讀取，
 * 新增禪學社專用：mascot(龜龜) / campus(淡江校園) / tamsui(淡水) / poster(海報) /
 * generated(AI 生成) / ig / story / reels / archive(歷屆活動)。
 */
export type AssetCategory =
  | "photo"
  | "people"
  | "background"
  | "illustration"
  | "icon"
  | "logo"
  | "mascot"
  | "campus"
  | "tamsui"
  | "poster"
  | "generated"
  | "ig"
  | "story"
  | "reels"
  | "archive"
  | "template"
  | "history"
  | "campus"
  | "tamsui"
  | "poster"
  | "story-asset"
  | "reels-asset"
  | "event";

export type AssetSourceKind = "upload" | "seed" | "generated" | "drive" | "canva" | "instagram";

/** AI 對素材的理解（Vision AI 結果或本機推斷）。 */
export type AssetInsight = {
  summary: string;
  subjects: string[];
  palette: string[];
  mood: string;
  studentFit: number;
  brandFit: number;
  stopPower: number;
  warnings: string[];
  suggestions: string[];
  analyzedAt: number;
  source: "live" | "mock";
};

export type AssetUsageStatus = "in-use" | "used" | "unused";

export type AssetMeta = {
  id: string;
  name: string;
  kind: AssetKind;
  category: AssetCategory;
  mime: string;
  width: number;
  height: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  /** Public path used to hydrate IndexedDB on first run. */
  seedSrc?: string;
  source: AssetSourceKind;
  licenseNotes: string;
  licenseOwner: string;
  favorite: boolean;
  lastUsedAt: number | null;
  useCount: number;
  insight?: AssetInsight | null;
  /** 外部來源的參照（Drive 檔案 id、Canva design id、IG media id）。 */
  externalRef?: { provider: "drive" | "canva" | "instagram"; id: string; url?: string; label?: string } | null;
};

export type Background = {
  type: "solid" | "gradient" | "image";
  color: string;
  color2?: string;
  angle?: number;
  assetId?: string;
};

export type ImageFilter = {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  grayscale: number;
};

export type ImageCrop = {
  x: number;
  y: number;
  zoom: number;
};

export type LayerShadow = {
  enabled: boolean;
  x: number;
  y: number;
  blur: number;
  color: string;
};

export type BaseLayer = {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  fromLayout: boolean;
  radius?: number;
  shadow?: LayerShadow;
};

export type TextLayer = BaseLayer & {
  type: "text";
  text: string;
  role: TextRole;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  align: Align;
};

export type ShapeLayer = BaseLayer & {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
};

export type ImageLayer = BaseLayer & {
  type: "image";
  assetId: string;
  objectFit: "cover" | "contain";
  crop: ImageCrop;
  filter: ImageFilter;
  radius: number;
};

export type LogoLayer = BaseLayer & {
  type: "logo";
  assetId?: string;
  radius?: number;
};

export type LineLayer = BaseLayer & {
  type: "line";
  stroke: string;
  strokeWidth: number;
};

export type Layer = TextLayer | ShapeLayer | ImageLayer | LogoLayer | LineLayer;

export type Artboard = {
  formatId: FormatId;
  background: Background;
  layers: Layer[];
  role?: CarouselPageRole;
  templateId?: TemplateId;
};

export type Snapshot = {
  id: string;
  name: string;
  createdAt: number;
  kind: "auto" | "manual" | "format";
  formatId: FormatId;
  slideIndex: number;
  artboard: Artboard;
  pages?: Artboard[];
};

export type Brief = {
  product: string;
  eventName: string;
  schedule: string;
  location: string;
  offer: string;
  audience: string;
  goal: CampaignGoal;
  features: string;
  style: string;
  notes: string;
  deliverables: DeliverableFlags;
};

export type DeliverableFlags = {
  post: boolean;
  story: boolean;
  carousel: boolean;
  reels: boolean;
};

export type CaptionVariant = {
  style: string;
  text: string;
};

export type CarouselPageRole = "cover" | "problem" | "detail" | "proof" | "cta" | "close";

export type CarouselPagePlan = {
  role: CarouselPageRole;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  visualNote: string;
  templateId: TemplateId;
};

export type AssetNeedKind = "photo" | "people" | "background" | "logo" | "illustration";

export type AssetNeed = {
  kind: AssetNeedKind;
  title: string;
  detail: string;
  required: boolean;
};

export type PlanSource = "live" | "mock";

export type CampaignPlan = {
  campaignName: string;
  concept: string;
  insight: string;
  hook: string;
  visualTheme: string;
  visualDirection: string;
  templateId: TemplateId;
  colorMood: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  captions: CaptionVariant[];
  hashtags: string[];
  storyBeats: string[];
  carouselPages: CarouselPagePlan[];
  assetNeeds: AssetNeed[];
  checklist: string[];
  altText: string;
  qaNotes: string[];
  generatedAt: number;
  source: PlanSource;
  directions?: CreativeDirection[];
  waves?: CampaignWave[];
  studentReview?: StudentReview | null;
  reelsScript?: ReelsBeat[];
  threadsPost?: ThreadsPost | null;
  lineCopy?: LineCopy | null;
  sources?: SourceRef[];
};

export type PlanVersion = {
  id: string;
  createdAt: number;
  source: PlanSource;
  name: string;
  plan: CampaignPlan;
};

export type CopyDeck = {
  eyebrow: string;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  handle: string;
  caption: string;
  hashtags: string[];
  altText: string;
};

export type ExportVersion = {
  id: string;
  createdAt: number;
  formatId: FormatId;
  scale: 1 | 2 | 3;
  mime: "image/png" | "image/jpeg";
  width: number;
  height: number;
  filename: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  brandId: string;
  templateId: TemplateId;
  activeFormatId: FormatId;
  status: ProjectStatus;
  campaignId: string | null;
  contentKind: ContentKind;
  contentStatus: ContentStatus;
  scheduledAt: number | null;
  publishedAt: number | null;
  brief: Brief;
  copy: CopyDeck;
  plan: CampaignPlan | null;
  artboards: Partial<Record<FormatId, Artboard>>;
  slides: Partial<Record<FormatId, Artboard[]>>;
  slideIndex: number;
  snapshots: Snapshot[];
  planVersions: PlanVersion[];
  exports: ExportVersion[];
};

/* ------------------------------------------------------------------ */
/* Campaign（活動）                                                     */
/* ------------------------------------------------------------------ */

export type CampaignType =
  | "tea"
  | "meditation"
  | "lecture"
  | "class"
  | "welcome"
  | "retreat"
  | "showcase"
  | "recruit"
  | "other";

export type CampaignPainPoint =
  | "stress"
  | "lonely"
  | "lost"
  | "sleep"
  | "focus"
  | "friends"
  | "curious"
  | "belonging";

export type Campaign = {
  id: string;
  name: string;
  type: CampaignType;
  /** ISO yyyy-mm-dd */
  date: string;
  time: string;
  location: string;
  oneLiner: string;
  description: string;
  theme: string;
  painPoints: CampaignPainPoint[];
  cta: string;
  signupUrl: string;
  coverAssetId: string | null;
  assetIds: string[];
  strategy: CampaignStrategy | null;
  createdAt: number;
  updatedAt: number;
};

/** 一波宣傳的角色（節奏），不硬寫死日期，由 AI 依活動型態調整。 */
export type WaveRole =
  | "teaser"
  | "empathy"
  | "keyvisual"
  | "info"
  | "reason"
  | "life"
  | "interactive"
  | "knowledge"
  | "story"
  | "countdown"
  | "dayof"
  | "recap";

export type CreativeDirection = {
  id: string;
  title: string;
  concept: string;
  palette: string[];
  composition: string;
  typography: string;
  imagePrompt: string;
  headline: string;
  subhead: string;
  mood: string;
};

export type CampaignWave = {
  id: string;
  role: WaveRole;
  /** 距活動日的天數（負數 = 之前，0 = 當天，正數 = 之後）。 */
  offsetDays: number;
  contentType: ContentType;
  title: string;
  hook: string;
  angle: string;
  contentId: string | null;
};

export type CampaignStrategy = {
  axis: string;
  directions: CreativeDirection[];
  chosenDirectionId: string | null;
  waves: CampaignWave[];
  rhythmNote: string;
  generatedAt: number;
  source: PlanSource;
};

/* ------------------------------------------------------------------ */
/* Content（內容）                                                      */
/* ------------------------------------------------------------------ */

export type ContentType =
  | "ig-post"
  | "carousel"
  | "story"
  | "reels"
  | "threads"
  | "line"
  | "poster"
  | "recap"
  | "member-story"
  | "countdown"
  | "qa"
  | "poll"
  | "knowledge";

/** 只有這五個狀態：想法 / 創作中 / 完成 / 已排程 / 已發布。 */
export type ContentStatus = "idea" | "drafting" | "done" | "scheduled" | "published";

export type ToneId = "short" | "normal" | "warm" | "student" | "life" | "humor";

export type ContentSourceKind = "drive" | "canva" | "instagram" | "ai" | "library" | "brand";

export type ContentSource = {
  kind: ContentSourceKind;
  label: string;
  refId?: string;
  url?: string;
};

export type CopyDraft = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  tone: ToneId;
};

export type CarouselSlideDraft = {
  index: number;
  role: string;
  title: string;
  text: string;
  visualNote: string;
};

export type StoryFrameDraft = {
  index: number;
  text: string;
  sticker: string;
  visualNote: string;
};

export type ReelsBeat = {
  from: number;
  to: number;
  visual: string;
  caption: string;
  voiceover: string;
  transition: string;
  assetHint: string;
  /** 素材庫裡對應這一秒的畫面，可空。 */
  assetId?: string | null;
};

export type StudentReview = {
  wouldStop: boolean;
  understandable: boolean;
  tooReligious: boolean;
  tooSerious: boolean;
  tooArtsy: boolean;
  tooAi: boolean;
  tooLong: boolean;
  knowsWhat: boolean;
  knowsWhenWhere: boolean;
  wouldBringFriend: boolean;
  knowsHowToSignup: boolean;
  verdict: string;
  suggestions: string[];
  rewriteHook: string;
  score: number;
};

export type ContentItem = {
  id: string;
  campaignId: string | null;
  type: ContentType;
  status: ContentStatus;
  title: string;
  copy: CopyDraft;
  /** 其他語氣版本。 */
  variants: CopyDraft[];
  imagePrompt: string;
  visualDirection: string;
  carousel: CarouselSlideDraft[];
  storyFrames: StoryFrameDraft[];
  reels: ReelsBeat[];
  threads: string;
  line: string;
  review: StudentReview | null;
  sources: ContentSource[];
  /** 對應的畫布專案（可為 null，先寫文案再做圖）。 */
  projectId: string | null;
  coverAssetId: string | null;
  scheduledAt: number | null;
  publishedAt: number | null;
  metrics: ContentMetrics | null;
  createdAt: number;
  updatedAt: number;
  generatedBy: PlanSource | null;
};

export type ContentMetrics = {
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  views: number;
  clicks: number;
  syncedAt: number;
};

/* ------------------------------------------------------------------ */
/* Connections（Drive / Canva / Instagram）                             */
/* ------------------------------------------------------------------ */

export type ConnectionProvider = "drive" | "canva" | "instagram";

export type ConnectionStatus = "disconnected" | "connected" | "expired" | "unconfigured";

export type ConnectionInfo = {
  provider: ConnectionProvider;
  status: ConnectionStatus;
  accountLabel: string | null;
  lastSyncAt: number | null;
  itemCount: number;
  rootLabel: string | null;
};

export type PersistSlice = {
  brands: BrandKit[];
  assets: AssetMeta[];
  projects: Project[];
  campaigns: Campaign[];
  contents: ContentItem[];
  lastProjectId: string | null;
};

export type QaSeverity = "fail" | "warn" | "pass";

export type QaCheckId =
  | "headline"
  | "hierarchy"
  | "type-size"
  | "contrast"
  | "crowding"
  | "whitespace"
  | "align"
  | "image-stretch"
  | "logo-size"
  | "cta"
  | "safe"
  | "carousel"
  | "overflow";

export type QaFix =
  | { kind: "grow-type"; pageIndex: number; layerId: string; fontSize: number }
  | { kind: "set-text-color"; pageIndex: number; layerId: string; color: string }
  | { kind: "add-text-backing"; pageIndex: number; layerId: string; fill: string }
  | { kind: "move-safe"; pageIndex: number; layerId: string }
  | { kind: "expand-textbox"; pageIndex: number; layerId: string }
  | { kind: "align-column"; pageIndex: number }
  | { kind: "fit-image"; pageIndex: number; layerId: string }
  | { kind: "resize-logo"; pageIndex: number; layerId: string; size: number }
  | { kind: "nudge-whitespace"; pageIndex: number }
  | { kind: "unify-carousel" }
  | { kind: "emphasize-headline"; pageIndex: number; layerId: string; fontSize: number }
  | { kind: "boost-cta"; pageIndex: number; layerId?: string };

export type QaIssue = {
  id: string;
  check: QaCheckId;
  severity: QaSeverity;
  title: string;
  location: string;
  detail: string;
  suggestion: string;
  layerId?: string;
  pageIndex: number;
  fix?: QaFix;
  fixLabel?: string;
};

export type QaCheckSummary = {
  id: QaCheckId;
  label: string;
  status: QaSeverity;
  count: number;
};

export type QaReport = {
  score: number;
  summary: string;
  checks: QaCheckSummary[];
  issues: QaIssue[];
  fixable: number;
};

export type LayerBox = Pick<Layer, "x" | "y" | "w" | "h" | "rotation">;

export type GuideLine = {
  axis: "v" | "h";
  pos: number;
};
