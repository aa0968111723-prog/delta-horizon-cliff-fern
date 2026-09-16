import { createFileRoute } from "@tanstack/react-router";
import { CreateStudio } from "@/components/create/create-studio";

export type CreateSearch = {
  mode?: string;
  idea?: string;
};

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>): CreateSearch => {
    const next: CreateSearch = {};
    if (typeof search.mode === "string") next.mode = search.mode;
    if (typeof search.idea === "string") next.idea = search.idea;
    return next;
  },
  component: CreateStudio,
});
