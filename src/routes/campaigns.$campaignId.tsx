import { createFileRoute } from "@tanstack/react-router";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

export const Route = createFileRoute("/campaigns/$campaignId")({
  component: CampaignPage,
});

function CampaignPage() {
  const { campaignId } = Route.useParams();
  return <CampaignDetail campaignId={campaignId} />;
}
