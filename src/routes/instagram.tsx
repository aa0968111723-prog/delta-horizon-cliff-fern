import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/instagram/instagram-center";

export type InstagramSearch = {
  project?: string;
  content?: string;
  surface?: IgSurface;
};

function parseInstagramSearch(search: Record<string, unknown>): InstagramSearch {
  const surface = search.surface;
  return {
    project: typeof search.project === "string" && search.project ? search.project : undefined,
    content: typeof search.content === "string" && search.content ? search.content : undefined,
    surface:
      surface === "feed" || surface === "story" || surface === "reels" || surface === "carousel"
        ? surface
        : undefined,
  };
}

export const Route = createFileRoute("/instagram")({
  validateSearch: parseInstagramSearch,
  component: InstagramPage,
});

function InstagramPage() {
  const search = Route.useSearch();
  return <InstagramCenter projectId={search.project} surface={search.surface} />;
}
