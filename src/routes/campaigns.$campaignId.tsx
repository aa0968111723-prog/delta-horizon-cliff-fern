import { createFileRoute } from "@tanstack/react-router";
import { CampaignDetailPage } from "@/components/campaigns/campaign-detail";

export const Route = createFileRoute("/campaigns/$campaignId")({ component: CampaignRoute });

function CampaignRoute() {
  const { campaignId } = Route.useParams();
  return <CampaignDetail campaignId={campaignId} />;
}
