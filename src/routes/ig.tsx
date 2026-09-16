import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/ig/instagram-center";

export type IgSearch = {
  posted?: string;
};

export const Route = createFileRoute("/ig")({
  validateSearch: (search: Record<string, unknown>): IgSearch => {
    const next: IgSearch = {};
    if (typeof search.posted === "string") next.posted = search.posted;
    return next;
  },
  component: InstagramCenter,
});
