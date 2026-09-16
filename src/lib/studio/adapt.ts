import { copyForCarouselPage, copyFromArtboard, remapLayerToFormat, roleTemplate, stampSlideMeta } from "./carousel.ts";
import { buildLayout, extractImageAssetId } from "./layout.ts";
import type { Artboard, BrandKit, CopyDeck, FormatId, TemplateId } from "./types.ts";

export function adaptArtboard(
  source: Artboard,
  targetFormatId: FormatId,
  brand: BrandKit,
  opts: { templateId?: TemplateId; copy?: CopyDeck } = {},
): Artboard {
  const copy = opts.copy ?? copyFromArtboard(source);
  const templateId = opts.templateId ?? source.templateId ?? roleTemplate(source.role);
  const imageAssetId = extractImageAssetId(source);
  const next = buildLayout(targetFormatId, copy, brand, templateId, { imageAssetId });
  next.role = source.role;
  next.templateId = templateId;
  const extras = source.layers.filter((layer) => !layer.fromLayout);
  if (!extras.length) return next;
  const mapped =
    source.formatId === targetFormatId
      ? extras.map((layer) => ({ ...layer }))
      : extras.map((layer) => remapLayerToFormat(layer, source.formatId, targetFormatId));
  next.layers = [...next.layers, ...mapped];
  return next;
}

export function adaptPages(
  pages: Artboard[],
  targetFormatId: FormatId,
  brand: BrandKit,
  fallbackTemplate?: TemplateId,
): Artboard[] {
  return stampSlideMeta(pages).map((page) =>
    adaptArtboard(page, targetFormatId, brand, {
      templateId: page.templateId ?? fallbackTemplate,
    }),
  );
}

export { copyForCarouselPage, copyFromArtboard };
