export type FormatId =
  | "feed-square"
  | "feed-portrait"
  | "feed-landscape"
  | "story"
  | "reels-cover";

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

/** 一人創作流程只需要這五個狀態。沒有審核、沒有負責人。 */
export type ContentStatus = "idea" | "making" | "done" | "scheduled" | "published";

/** 禪學社實際會發的內容型態。 */
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

/** AI 讀過這個帳號過去內容之後留下的整理，生成時會優先延續。 */
export type IgHistoryReading = {
  voice: string;
  continueWith: string[];
  avoid: string[];
  nextPost: string;
  analyzedAt: number;
  sampleCount: number;
  adapter: "live" | "local";
};

/**
 * 品牌記憶裡「不是規範、而是社團自己的東西」：理念、固定介紹、龜龜、三色光的意義、
 * 喜歡與不喜歡的風格、歷屆文宣。AI 每次生成前都會先讀這一段。
 */
export type BrandMemory = {
  mission: string;
  introShort: string;
  introLong: string;
  mascotName: string;
  mascotLook: string;
  mascotPersonality: string;
  mascotUsage: string;
  lights: { label: string; hex: string; meaning: string }[];
  likedStyles: string;
  dislikedStyles: string;
  /** 歷屆海報／文宣，AI 參考品牌 DNA 時會看 */
  legacyAssetIds: string[];
  /** 讀過過去 IG／本機內容後的整理。沒讀過就沒有。 */
  igReading?: IgHistoryReading;
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
  /** 社團自己的記憶：龜龜、三色光、理念、歷屆文宣。AI 每次都會先讀。 */
  memory: BrandMemory;
  updatedAt: number;
};

export type AssetKind = "image" | "logo" | "pattern";

export type AssetCategory =
  | "mascot"
  | "campus"
  | "poster"
  | "photo"
  | "people"
  | "background"
  | "illustration"
  | "icon"
  | "logo"
  | "template"
  | "history";

export type AssetSourceKind = "upload" | "seed" | "generated" | "drive" | "canva" | "instagram";

export type AssetUsageStatus = "in-use" | "used" | "unused";

/** AI 讀過這張圖之後留下的理解，方便延續風格或寫文案。 */
export type AssetInsight = {
  summary: string;
  stylePrompt: string;
  captionIdea: string;
  tooReligious: boolean;
  tooAi: boolean;
  fitsTku: boolean;
  nextSteps: string[];
  analyzedAt: number;
};

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
  insight?: AssetInsight;
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

/** IG 文案 AI 的語氣版本。 */
export type CopyTone = "short" | "normal" | "emotional" | "student" | "life" | "humor";

export type CopyDraft = {
  id: string;
  tone: CopyTone;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  /** IG 無障礙說明。舊草稿可能沒有。 */
  altText?: string;
  createdAt: number;
  source: PlanSource;
};

/** 反向學生模擬：生成後用淡江學生視角重看一次。 */
export type StudentReviewItem = {
  question: string;
  verdict: "ok" | "risk";
  note: string;
};

export type StudentReview = {
  score: number;
  items: StudentReviewItem[];
  rewriteHook: string;
  suggestions: string[];
  createdAt: number;
  source: PlanSource;
};

export type ReelsBeat = {
  range: string;
  visual: string;
  caption: string;
  voice: string;
  transition: string;
  asset: string;
};

export type ReelsScript = {
  hook: string;
  cover: string;
  /** 依腳本生成、存進素材庫的封面圖 */
  coverAssetId?: string | null;
  beats: ReelsBeat[];
  createdAt: number;
  source: PlanSource;
};

/** AI 參考過的素材來源，一定要能顯示給使用者看。 */
export type CreativeSourceKind = "drive" | "canva" | "instagram" | "generated" | "local";

export type CreativeSourceRef = {
  kind: CreativeSourceKind;
  label: string;
  detail: string;
  href?: string;
  assetId?: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  brandId: string;
  templateId: TemplateId;
  activeFormatId: FormatId;
  status: ContentStatus;
  contentKind: ContentKind;
  campaignId: string | null;
  scheduledAt: number | null;
  publishedAt: number | null;
  brief: Brief;
  copy: CopyDeck;
  plan: CampaignPlan | null;
  copyDrafts: CopyDraft[];
  studentReview: StudentReview | null;
  reels: ReelsScript | null;
  sources: CreativeSourceRef[];
  artboards: Partial<Record<FormatId, Artboard>>;
  slides: Partial<Record<FormatId, Artboard[]>>;
  slideIndex: number;
  snapshots: Snapshot[];
  planVersions: PlanVersion[];
  exports: ExportVersion[];
};

/** 活動（Campaign）。沒有負責人、沒有審核人。 */
export type CampaignDirection = {
  id: string;
  title: string;
  concept: string;
  visual: string;
  sampleHook: string;
};

export type CampaignWave = {
  id: string;
  /** 相對活動日的天數，負數代表提前幾天 */
  offsetDays: number;
  stage: string;
  title: string;
  kind: ContentKind;
  hook: string;
  note: string;
  contentId: string | null;
};

export type Campaign = {
  id: string;
  name: string;
  kind: string;
  date: string;
  time: string;
  location: string;
  oneLiner: string;
  intro: string;
  theme: string;
  painPoint: string;
  cta: string;
  signupUrl: string;
  coverAssetId: string | null;
  assetIds: string[];
  audienceIds: string[];
  axis: string;
  directions: CampaignDirection[];
  waves: CampaignWave[];
  createdAt: number;
  updatedAt: number;
  planSource: PlanSource | null;
};

export type PersistSlice = {
  brands: BrandKit[];
  assets: AssetMeta[];
  projects: Project[];
  campaigns: Campaign[];
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
