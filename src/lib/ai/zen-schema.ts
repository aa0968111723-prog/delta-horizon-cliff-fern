import { z } from "zod";

const str = (max = 400) => z.string().max(max).catch("");
const strList = (max = 12) => z.array(z.string().max(200)).max(max).catch([]);

export const ToneSchema = z.enum(["short", "normal", "warm", "student", "life", "humor"]);

export const ContentTypeSchema = z.enum([
  "ig-post",
  "carousel",
  "story",
  "reels",
  "threads",
  "line",
  "poster",
  "recap",
  "member-story",
  "countdown",
  "qa",
  "poll",
  "knowledge",
]);

export const CampaignTypeSchema = z.enum([
  "tea",
  "meditation",
  "lecture",
  "class",
  "welcome",
  "retreat",
  "showcase",
  "recruit",
  "other",
]);

export const PainPointSchema = z.enum([
  "stress",
  "lonely",
  "lost",
  "sleep",
  "focus",
  "friends",
  "curious",
  "belonging",
]);

/** 活動 + 品牌 + 情境的共同輸入。 */
export const CampaignContextSchema = z.object({
  name: z.string().min(1).max(120),
  type: CampaignTypeSchema,
  date: z.string().max(20),
  time: z.string().max(40),
  location: z.string().max(120),
  oneLiner: z.string().max(200),
  description: z.string().max(1200),
  theme: z.string().max(200),
  painPoints: z.array(PainPointSchema).max(4),
  cta: z.string().max(40),
  signupUrl: z.string().max(300),
  brandContext: z.string().max(3000),
  studentContext: z.string().max(1500),
  igDna: z.string().max(1500).optional(),
  sourceNotes: z.string().max(1500).optional(),
});
export type CampaignContextInput = z.infer<typeof CampaignContextSchema>;

export const CopyRequestSchema = z.object({
  campaign: CampaignContextSchema,
  contentType: ContentTypeSchema,
  tone: ToneSchema,
  angle: z.string().max(300).optional(),
  waveRole: z.string().max(40).optional(),
  idea: z.string().max(400).optional(),
  forceMock: z.boolean().optional(),
});
export type CopyRequest = z.infer<typeof CopyRequestSchema>;

export const CopyDraftJsonSchema = z.object({
  hook: str(120),
  body: str(1200),
  cta: str(80),
  hashtags: strList(15),
});

export const CopyResponseSchema = z.object({
  variants: z
    .array(
      z.object({
        tone: ToneSchema.catch("normal"),
        hook: str(120),
        body: str(1200),
        cta: str(80),
        hashtags: strList(15),
      }),
    )
    .max(6)
    .catch([]),
  imagePrompt: str(800),
  visualDirection: str(400),
  altText: str(300),
});

export const StrategyRequestSchema = z.object({
  campaign: CampaignContextSchema,
  forceMock: z.boolean().optional(),
});

export const StrategyJsonSchema = z.object({
  axis: str(300),
  rhythmNote: str(400),
  directions: z
    .array(
      z.object({
        title: str(40),
        concept: str(300),
        palette: strList(5),
        composition: str(200),
        typography: str(120),
        imagePrompt: str(700),
        headline: str(40),
        subhead: str(80),
        mood: str(80),
      }),
    )
    .max(3)
    .catch([]),
  waves: z
    .array(
      z.object({
        role: z
          .enum([
            "teaser",
            "empathy",
            "keyvisual",
            "info",
            "reason",
            "life",
            "interactive",
            "knowledge",
            "story",
            "countdown",
            "dayof",
            "recap",
          ])
          .catch("info"),
        offsetDays: z.number().int().min(-60).max(30).catch(-7),
        contentType: ContentTypeSchema.catch("ig-post"),
        title: str(60),
        hook: str(120),
        angle: str(240),
      }),
    )
    .max(14)
    .catch([]),
});

export const ConvertRequestSchema = z.object({
  campaign: CampaignContextSchema,
  from: z.object({
    hook: z.string().max(200),
    body: z.string().max(2000),
    cta: z.string().max(80),
    hashtags: z.array(z.string()).max(20),
  }),
  to: ContentTypeSchema,
  forceMock: z.boolean().optional(),
});

export const ConvertJsonSchema = z.object({
  carousel: z
    .array(
      z.object({
        role: str(20),
        title: str(40),
        text: str(200),
        visualNote: str(160),
      }),
    )
    .max(8)
    .catch([]),
  storyFrames: z
    .array(
      z.object({
        text: str(120),
        sticker: str(40),
        visualNote: str(160),
      }),
    )
    .max(6)
    .catch([]),
  reels: z
    .array(
      z.object({
        from: z.number().catch(0),
        to: z.number().catch(3),
        visual: str(160),
        caption: str(80),
        voiceover: str(120),
        transition: str(40),
        assetHint: str(120),
      }),
    )
    .max(8)
    .catch([]),
  threads: str(500),
  line: str(600),
  caption: str(1200),
});

export const ReviewRequestSchema = z.object({
  campaign: CampaignContextSchema,
  hook: z.string().max(200),
  body: z.string().max(2000),
  cta: z.string().max(80),
  forceMock: z.boolean().optional(),
});

export const ReviewJsonSchema = z.object({
  wouldStop: z.boolean().catch(false),
  understandable: z.boolean().catch(true),
  tooReligious: z.boolean().catch(false),
  tooSerious: z.boolean().catch(false),
  tooArtsy: z.boolean().catch(false),
  tooAi: z.boolean().catch(false),
  tooLong: z.boolean().catch(false),
  knowsWhat: z.boolean().catch(true),
  knowsWhenWhere: z.boolean().catch(true),
  wouldBringFriend: z.boolean().catch(false),
  knowsHowToSignup: z.boolean().catch(true),
  verdict: str(200),
  suggestions: strList(6),
  rewriteHook: str(120),
  score: z.number().min(0).max(100).catch(60),
});

export const VisualRequestSchema = z.object({
  campaign: CampaignContextSchema,
  idea: z.string().max(400).optional(),
  referenceNotes: z.string().max(800).optional(),
  forceMock: z.boolean().optional(),
});

export const VisualJsonSchema = z.object({
  directions: StrategyJsonSchema.shape.directions,
});

export const ImageAnalyzeRequestSchema = z.object({
  brandContext: z.string().max(3000),
  imageDataUrl: z.string().max(6_000_000).optional(),
  imageUrl: z.string().max(2000).optional(),
  fileName: z.string().max(200).optional(),
  hints: z.string().max(400).optional(),
  forceMock: z.boolean().optional(),
});

export const ImageAnalyzeJsonSchema = z.object({
  summary: str(300),
  subjects: strList(8),
  palette: strList(5),
  mood: str(80),
  studentFit: z.number().min(0).max(100).catch(60),
  brandFit: z.number().min(0).max(100).catch(60),
  stopPower: z.number().min(0).max(100).catch(60),
  warnings: strList(5),
  suggestions: strList(5),
  tags: strList(10),
  extendPrompt: str(600),
});

export const ImageGenerateRequestSchema = z.object({
  prompt: z.string().min(4).max(1500),
  brandContext: z.string().max(2000),
  aspect: z.enum(["4:5", "1:1", "9:16", "1.91:1"]).catch("4:5"),
  quality: z.enum(["fast", "quality"]).catch("fast"),
});

export const IgAnalyzeRequestSchema = z.object({
  caption: z.string().max(2200),
  kind: z.string().max(40).optional(),
  metrics: z
    .object({
      reach: z.number().optional(),
      likes: z.number().optional(),
      comments: z.number().optional(),
      saves: z.number().optional(),
      shares: z.number().optional(),
    })
    .optional(),
  brandContext: z.string().max(2000),
  forceMock: z.boolean().optional(),
});

export const IgAnalyzeJsonSchema = z.object({
  hook: str(160),
  visual: str(200),
  theme: str(80),
  captionLength: z.number().catch(0),
  cta: str(80),
  direction: str(200),
  improvements: strList(6),
});

export const InspirationRequestSchema = z.object({
  studentContext: z.string().max(1500),
  brandContext: z.string().max(2000),
  forceMock: z.boolean().optional(),
});

export const InspirationJsonSchema = z.object({
  patterns: z
    .array(
      z.object({
        observed: str(200),
        composition: str(120),
        color: str(120),
        layout: str(120),
        hook: str(120),
        form: str(80),
        zenUse: str(240),
      }),
    )
    .max(6)
    .catch([]),
});
