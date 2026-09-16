import { createFileRoute } from "@tanstack/react-router";
import { CreateHub, type CreateTab } from "@/components/create/create-hub";

function parseTab(value: unknown): CreateTab {
  if (value === "copy" || value === "image" || value === "vision" || value === "convert" || value === "campaign") {
    return value;
  }
  return "campaign";
}

export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseTab(search.tab),
  }),
  component: CreatePage,
});

function CreatePage() {
  const { tab } = Route.useSearch();
  return <CreateHub initialTab={tab} />;
}
