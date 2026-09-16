import { z } from "zod";
import { extractJsonObject } from "./grok.ts";
import {
  auditStudentPerspective,
  buildLocalCreativeWave,
  convertContentMultimodal,
  type CreativeWaveContext,
  type MultimodalConversionResult,
  type StudentPerspectiveAudit,
  type ZenVisualDirection,
} from "../studio/zen-prompt-engine.ts";

const DirectionIdSchema = z.enum(["direction-a", "direction-b", "direction-c"]);

const PaletteSchema = z.object({
  name: z.string().catch(""),
  hex: z.string().catch("#1E3A4C"),
});

const DirectionJsonSchema = z.object({
  id: DirectionIdSchema.catch("direction-a"),
  name: z.string().catch(""),
  concept: z.string().catch(""),
  colorPalette: z.array(PaletteSchema).max(5).catch([]),
  composition: z.string().catch(""),
  typography: z.string().catch(""),
  imagePrompt: z.string().catch(""),
  headline: z.string().catch(""),
  subhead: z.string().catch(""),
  atmosphere: z.string().catch(""),
  aspectRatio: z.enum(["4:5", "1:1", "9:16"]).catch("4:5"),
});

const WaveJsonSchema = z.object({
  directions: z.array(DirectionJsonSchema).min(1).max(3).catch([]),
  hook: z.string().catch(""),
  caption: z.string().catch(""),
  cta: z.string().catch(""),
});

export type CreativeWave = {
  directions: ZenVisualDirection[];
  conversion: MultimodalConversionResult;
  audit: StudentPerspectiveAudit;
};

const FALLBACK_PALETTE: ZenVisualDirection["colorPalette"] = [
  { name: "淡水夜青", hex: "#1E3A4C" },
  { name: "暖宣紙白", hex: "#F7F6F2" },
  { name: "晨曦暖光", hex: "#D97736" },
];

function asDirection(raw: z.infer<typeof DirectionJsonSchema>, index: number, local: ZenVisualDirection): ZenVisualDirection {
  const ids = ["direction-a", "direction-b", "direction-c"] as const;
  const palette = raw.colorPalette.filter((c) => /^#([0-9a-fA-F]{6})$/.test(c.hex)).slice(0, 3);
  return {
    id: raw.id || ids[index] || local.id,
    name: raw.name || local.name,
    concept: raw.concept || local.concept,
    colorPalette: palette.length ? palette : local.colorPalette.length ? local.colorPalette : FALLBACK_PALETTE,
    composition: raw.composition || local.composition,
    typography: raw.typography || local.typography,
    imagePrompt: raw.imagePrompt || local.imagePrompt,
    headline: raw.headline || local.headline,
    subhead: raw.subhead || local.subhead,
    atmosphere: raw.atmosphere || local.atmosphere,
    aspectRatio: raw.aspectRatio || local.aspectRatio,
  };
}

export function assembleWaveFromDirections(
  ctx: CreativeWaveContext,
  directions: ZenVisualDirection[],
  extras?: { caption?: string; cta?: string },
): CreativeWave {
  const selected = directions[0];
  const conversion = convertContentMultimodal({
    topic: ctx.topic,
    headline: selected.headline,
    caption: extras?.caption ?? "",
    date: ctx.date,
    location: ctx.location,
  });
  if (extras?.cta) conversion.igPost.cta = extras.cta;
  else if (ctx.cta) conversion.igPost.cta = ctx.cta;
  const audit = auditStudentPerspective({
    headline: selected.headline,
    caption: conversion.igPost.caption,
    cta: conversion.igPost.cta,
    location: ctx.location,
    time: ctx.date,
  });
  return { directions, conversion, audit };
}

export function parseLiveWave(text: string, ctx: CreativeWaveContext): CreativeWave | null {
  try {
    const parsed = WaveJsonSchema.parse(extractJsonObject(text));
    const local = buildLocalCreativeWave(ctx);
    if (!parsed.directions.length) return null;
    const merged = [0, 1, 2].map((i) => {
      const live = parsed.directions[i];
      const fallback = local.directions[i] ?? local.directions[0];
      return live ? asDirection(live, i, fallback) : fallback;
    }) as ZenVisualDirection[];
    const uniqueIds = new Set(merged.map((d) => d.id));
    if (uniqueIds.size < 3) {
      merged[0].id = "direction-a";
      merged[1].id = "direction-b";
      merged[2].id = "direction-c";
    }
    return assembleWaveFromDirections(ctx, merged, {
      caption: parsed.caption || undefined,
      cta: parsed.cta || ctx.cta,
    });
  } catch {
    return null;
  }
}
