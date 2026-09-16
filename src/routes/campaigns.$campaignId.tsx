import { createFileRoute } from "@tanstack/react-router";
import { CampaignDesk } from "@/components/campaigns/campaign-desk";

export const Route = createFileRoute("/campaigns/$campaignId")({
  component: CampaignDetail,
});

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  return <CampaignDesk campaignId={campaignId} />;
}
