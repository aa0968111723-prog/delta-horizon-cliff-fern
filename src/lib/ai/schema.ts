import { z } from "zod";

const TemplateIdSchema = z.enum(["editorial", "product", "offer", "quote"]).catch("editorial");

export const CarouselPageSchema = z.object({
  role: z.enum(["cover", "problem", "detail", "proof", "cta", "close"]).catch("detail"),
  headline: z.string().catch(""),
  subhead: z.string().catch(""),
  body: z.string().catch(""),
  cta: z.string().catch(""),
  visualNote: z.string().catch(""),
  templateId: TemplateIdSchema,
});

export const AssetNeedSchema = z.object({
  kind: z.enum(["photo", "people", "background", "logo", "illustration"]).catch("photo"),
  title: z.string().catch(""),
  detail: z.string().catch(""),
  required: z.boolean().catch(true),
});

export const PlanJsonSchema = z.object({
  campaignName: z.string().catch(""),
  concept: z.string().catch(""),
  insight: z.string().catch(""),
  hook: z.string().catch(""),
  visualTheme: z.string().catch(""),
  visualDirection: z.string().catch(""),
  templateId: TemplateIdSchema,
  colorMood: z.string().catch(""),
  eyebrow: z.string().catch(""),
  headline: z.string().catch(""),
  subhead: z.string().catch(""),
  body: z.string().catch(""),
  cta: z.string().catch(""),
  captions: z
    .array(
      z.object({
        style: z.string().catch("敘事"),
        text: z.string().catch(""),
      }),
    )
    .max(4)
    .catch([]),
  hashtags: z.array(z.string()).max(20).catch([]),
  storyBeats: z.array(z.string()).max(5).catch([]),
  carouselPages: z.array(CarouselPageSchema).max(8).catch([]),
  assetNeeds: z.array(AssetNeedSchema).max(8).catch([]),
  checklist: z.array(z.string()).max(10).catch([]),
  altText: z.string().catch(""),
  qaNotes: z.array(z.string()).max(8).catch([]),
  directions: z
    .array(
      z.object({
        id: z.string().catch(""),
        name: z.string().catch(""),
        concept: z.string().catch(""),
        palette: z.string().catch(""),
        composition: z.string().catch(""),
        typeDirection: z.string().catch(""),
        imagePrompt: z.string().catch(""),
        headline: z.string().catch(""),
        subhead: z.string().catch(""),
      }),
    )
    .max(3)
    .optional()
    .catch([]),
  waves: z
    .array(
      z.object({
        id: z.string().catch(""),
        offsetDays: z.number().catch(0),
        label: z.string().catch(""),
        purpose: z
          .enum([
            "tease",
            "emotion",
            "hero",
            "info",
            "reason",
            "story",
            "countdown",
            "dayof",
            "recap",
            "life",
            "interact",
            "knowledge",
          ])
          .catch("info"),
        contentKind: z.string().catch("ig-post"),
        topic: z.string().catch(""),
        hook: z.string().catch(""),
      }),
    )
    .max(12)
    .optional()
    .catch([]),
  studentReview: z
    .object({
      wouldStop: z.string().catch(""),
      understood: z.string().catch(""),
      tooReligious: z.string().catch(""),
      tooSerious: z.string().catch(""),
      tooLiterary: z.string().catch(""),
      tooAi: z.string().catch(""),
      tooLong: z.string().catch(""),
      knowsWhat: z.string().catch(""),
      knowsWhenWhere: z.string().catch(""),
      wouldBringFriend: z.string().catch(""),
      knowsSignup: z.string().catch(""),
      revisions: z.array(z.string()).catch([]),
    })
    .optional()
    .nullable()
    .catch(null),
  reelsScript: z
    .array(
      z.object({
        start: z.number().catch(0),
        end: z.number().catch(0),
        visual: z.string().catch(""),
        caption: z.string().catch(""),
        voiceover: z.string().catch(""),
        transition: z.string().catch(""),
        assetHint: z.string().catch(""),
      }),
    )
    .max(6)
    .optional()
    .catch([]),
  threadsPost: z
    .object({
      caption: z.string().catch(""),
      visualNote: z.string().catch(""),
    })
    .optional()
    .nullable()
    .catch(null),
  lineCopy: z
    .object({
      title: z.string().catch(""),
      body: z.string().catch(""),
      cta: z.string().catch(""),
    })
    .optional()
    .nullable()
    .catch(null),
  sources: z
    .array(
      z.object({
        kind: z.enum(["drive", "canva", "instagram", "generated", "brand"]).catch("brand"),
        label: z.string().catch(""),
        id: z.string().optional(),
      }),
    )
    .optional()
    .catch([]),
});

export const BriefInputSchema = z.object({
  eventName: z.string().min(1).max(200),
  schedule: z.string().max(120),
  location: z.string().max(120),
  product: z.string().max(200),
  offer: z.string().max(200),
  audience: z.string().min(1).max(200),
  goal: z.enum(["awareness", "traffic", "conversion", "ugc"]),
  features: z.string().max(400),
  style: z.string().max(200),
  notes: z.string().max(1200),
  wantPost: z.boolean(),
  wantStory: z.boolean(),
  wantCarousel: z.boolean(),
  wantReels: z.boolean(),
  brandName: z.string().min(1).max(80),
  handle: z.string().max(60),
  voice: z.string().max(400),
  doSay: z.string().max(200),
  dontSay: z.string().max(200),
  forbiddenWords: z.array(z.string().max(40)).max(20),
  slogans: z.string().max(240).optional(),
  preferredCtas: z.string().max(160).optional(),
  imageStyle: z.string().max(400).optional(),
  forceMock: z.boolean().optional(),
});

export type BriefInput = z.infer<typeof BriefInputSchema>;
export type PlanJson = z.infer<typeof PlanJsonSchema>;
