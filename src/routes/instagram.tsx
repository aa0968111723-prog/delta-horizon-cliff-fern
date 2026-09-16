import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/instagram/instagram-center";

const TABS = ["grid", "feed", "dna", "inspire", "stats"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/instagram")({
  validateSearch: (raw: Record<string, unknown>): { tab?: Tab } => ({
    tab: typeof raw.tab === "string" && (TABS as readonly string[]).includes(raw.tab) ? (raw.tab as Tab) : undefined,
  }),
  component: InstagramRoute,
});

function InstagramRoute() {
  const search = Route.useSearch();
  return <InstagramCenter initialTab={search.tab} />;
}
