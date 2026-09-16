import { createFileRoute } from "@tanstack/react-router";
import { CampaignList } from "@/components/campaigns/campaign-list";

export const Route = createFileRoute("/campaigns/")({
  validateSearch: (raw: Record<string, unknown>): { new?: number } => ({
    new: raw.new === 1 || raw.new === "1" ? 1 : undefined,
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const search = Route.useSearch();
  return <CampaignList openNew={search.new === 1} />;
}
