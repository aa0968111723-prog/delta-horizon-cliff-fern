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
    .max(8)
    .catch([]),
  hashtags: z.array(z.string()).max(20).catch([]),
  storyBeats: z.array(z.string()).max(5).catch([]),
  carouselPages: z.array(CarouselPageSchema).max(8).catch([]),
  assetNeeds: z.array(AssetNeedSchema).max(8).catch([]),
  checklist: z.array(z.string()).max(10).catch([]),
  altText: z.string().catch(""),
  qaNotes: z.array(z.string()).max(8).catch([]),
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
  notes: z.string().max(400),
  wantPost: z.boolean(),
  wantStory: z.boolean(),
  wantCarousel: z.boolean(),
  wantReels: z.boolean(),
  wantThreads: z.boolean().optional(),
  wantLine: z.boolean().optional(),
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
  dnaNotes: z.string().max(2000).optional(),
  memoryNotes: z.string().max(4000).optional(),
  foundCount: z.number().int().min(0).max(99).optional(),
  citedSources: z
    .array(
      z.object({
        source: z.enum(["drive", "canva", "instagram", "generated", "brand"]).catch("brand"),
        label: z.string().max(80).catch(""),
        detail: z.string().max(160).catch(""),
      }),
    )
    .max(16)
    .optional(),
});

export type BriefInput = z.infer<typeof BriefInputSchema>;
export type PlanJson = z.infer<typeof PlanJsonSchema>;
