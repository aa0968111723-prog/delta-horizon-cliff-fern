import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/ig/instagram-center";
import { igSearchParams, type IgSearch } from "@/lib/studio/ig-search";

export type { IgSearch };

export const Route = createFileRoute("/ig")({
  validateSearch: (search: Record<string, unknown>): IgSearch => {
    return igSearchParams({
      posted: typeof search.posted === "string" ? search.posted : undefined,
      campaign: typeof search.campaign === "string" ? search.campaign : undefined,
    });
  },
  component: InstagramCenter,
});
