import { completeCarouselPages, copyForCarouselPage, stampSlideMeta } from "../studio/carousel.ts";
import { formatsFromBrief, migrateBrief } from "../studio/brief.ts";
import { withBoilerplate } from "../studio/copy.ts";
import { buildLayout, extractImageAssetId } from "../studio/layout.ts";
import { MAX_SLIDES } from "../studio/layers.ts";
import type {
  Artboard,
  BrandKit,
  Brief,
  CampaignPlan,
  CarouselPagePlan,
  CopyDeck,
  FormatId,
  Project,
} from "../studio/types.ts";

export { copyForCarouselPage, formatsFromBrief };

export function copyFromCampaign(plan: CampaignPlan, brand: BrandKit): CopyDeck {
  return withBoilerplate(
    {
      eyebrow: plan.eyebrow,
      headline: plan.headline,
      subhead: plan.subhead,
      body: plan.body,
      cta: plan.cta,
      handle: brand.handle,
      caption: plan.captions[0]?.text ?? "",
      hashtags: plan.hashtags,
      altText: plan.altText,
    },
    brand.boilerplate,
  );
}

function storyCopy(base: CopyDeck, plan: CampaignPlan): CopyDeck {
  const beats = plan.storyBeats;
  return {
    ...base,
    eyebrow: "STORY",
    headline: plan.hook || base.headline,
    subhead: beats[0] || base.subhead,
    body: beats.slice(1).join("\n") || base.body,
    cta: plan.cta || base.cta,
  };
}

function carouselPlans(plan: CampaignPlan, copy: CopyDeck, carousel: boolean): CarouselPagePlan[] {
  if (!carousel) {
    return [
      {
        role: "cover",
        headline: copy.headline,
        subhead: copy.subhead,
        body: copy.body,
        cta: copy.cta,
        visualNote: "",
        templateId: plan.templateId,
      },
    ];
  }
  return completeCarouselPages(plan.carouselPages, {
    headline: copy.headline,
    subhead: copy.subhead,
    body: copy.body,
    cta: copy.cta,
    hook: plan.hook,
    insight: plan.insight,
    templateId: plan.templateId,
  }).slice(0, MAX_SLIDES);
}

function withUniqueLayerIds(board: Artboard, prefix: string): Artboard {
  const seen = new Set<string>();
  return {
    ...board,
    layers: board.layers.map((layer, index) => {
      const nextId = layer.id && !seen.has(layer.id) ? layer.id : `${prefix}_${index}`;
      seen.add(nextId);
      return { ...layer, id: nextId };
    }),
  };
}

export function buildCampaignBoards(input: {
  project: Project;
  brand: BrandKit;
  plan: CampaignPlan;
  brief: Brief;
}): {
  copy: CopyDeck;
  slides: Partial<Record<FormatId, Artboard[]>>;
  artboards: Partial<Record<FormatId, Artboard>>;
  activeFormatId: FormatId;
} {
  const brief = migrateBrief(input.brief);
  const copy = copyFromCampaign(input.plan, input.brand);
  const imageAssetId = extractImageAssetId(
    input.project.artboards[input.project.activeFormatId] ??
      Object.values(input.project.artboards).find(Boolean),
  );
  const formats = formatsFromBrief(brief, input.project.activeFormatId);
  const slides: Partial<Record<FormatId, Artboard[]>> = { ...input.project.slides };
  const artboards: Partial<Record<FormatId, Artboard>> = { ...input.project.artboards };
  const pages = carouselPlans(input.plan, copy, brief.deliverables.carousel);

  for (const formatId of formats) {
    if (brief.deliverables.carousel) {
          const boards = stampSlideMeta(
            pages.map((page, pageIndex) => {
              const board = buildLayout(
                formatId,
                copyForCarouselPage(copy, page, input.plan),
                input.brand,
                page.templateId || input.plan.templateId,
                { imageAssetId },
              );
              board.role = page.role;
              board.templateId = page.templateId || input.plan.templateId;
              return withUniqueLayerIds(board, `${formatId}_${pageIndex}`);
            }),
          );
          slides[formatId] = boards;
          artboards[formatId] = boards[0];
          continue;
        }
        const pageCopy =
          formatId === "story" || formatId === "reels-cover" || formatId === "line-promo"
            ? storyCopy(copy, input.plan)
            : copy;
        const board = withUniqueLayerIds(
          buildLayout(formatId, pageCopy, input.brand, input.plan.templateId, { imageAssetId }),
          formatId,
        );
    board.role = "cover";
    board.templateId = input.plan.templateId;
    slides[formatId] = [board];
    artboards[formatId] = board;
  }

  return {
    copy,
    slides,
    artboards,
    activeFormatId: formats[0] ?? input.project.activeFormatId,
  };
}
