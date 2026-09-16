import { createFileRoute } from "@tanstack/react-router";
import { CampaignList } from "@/components/campaigns/campaign-list";

export const Route = createFileRoute("/campaigns/")({
  component: CampaignList,
});
