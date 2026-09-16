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
  updatedAt: number;
};

export type AssetKind = "image" | "logo" | "pattern";

export type AssetCategory =
  | "photo"
  | "people"
  | "background"
  | "illustration"
  | "icon"
  | "logo"
  | "template"
  | "history";

export type AssetSourceKind = "upload" | "seed" | "generated";

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

export type CopyTone = "短版" | "一般版" | "感性版" | "學生版" | "生活版" | "幽默版";

export type CopyVariant = {
  tone: CopyTone;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
};

export type StudentReviewItem = {
  question: string;
  pass: boolean;
  feedback: string;
};

export type ReelsBeat = {
  timing: string;
  visual: string;
  subtitle: string;
  voiceover: string;
  transition: string;
  assetSuggestion: string;
};

export type CopyPack = {
  variants: CopyVariant[];
  studentReview: StudentReviewItem[];
  revisedCaption: string;
  threads: string;
  line: string;
  storyFrames: string[];
  carouselPages: string[];
  reelsScript: ReelsBeat[];
  generatedAt: number;
  source: PlanSource;
};

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
  copyPack?: CopyPack;
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

export type Project = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  brandId: string;
  templateId: TemplateId;
  activeFormatId: FormatId;
  status: ProjectStatus;
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

export type PersistSlice = {
  brands: BrandKit[];
  assets: AssetMeta[];
  projects: Project[];
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
