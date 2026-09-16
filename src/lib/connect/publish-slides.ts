import type { CarouselPagePlan } from "../studio/types.ts";

export function carouselPosterInputs(
  pages: Array<Pick<CarouselPagePlan, "headline" | "subhead" | "body" | "visualNote">>,
  opts: { title: string; name?: string },
) {
  return pages.slice(0, 6).map((page) => ({
    headline: (page.headline || opts.title).trim(),
    subhead: page.subhead || page.body,
    concept: page.visualNote,
    name: opts.name,
    width: 1080,
    height: 1350 as const,
  }));
}

export function pickCarouselPages(
  projects: Array<{
    id: string;
    campaignId: string | null;
    plan?: { carouselPages?: CarouselPagePlan[] } | null;
  }>,
  item: { projectId?: string | null; campaignId?: string | null },
): CarouselPagePlan[] {
  const byId = item.projectId ? projects.find((project) => project.id === item.projectId) : undefined;
  const byCampaign =
    !byId && item.campaignId
      ? projects.find(
          (project) => project.campaignId === item.campaignId && (project.plan?.carouselPages?.length ?? 0) >= 2,
        )
      : undefined;
  return byId?.plan?.carouselPages ?? byCampaign?.plan?.carouselPages ?? [];
}
