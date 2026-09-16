import { createFileRoute } from "@tanstack/react-router";
import { CampaignDetailPage } from "@/components/campaigns/campaign-pages";

export const Route = createFileRoute("/campaigns/$campaignId")({
  component: CampaignDetail,
});

function CampaignDetail() {
  const { campaignId } = Route.useParams();
  return <CampaignDetailPage campaignId={campaignId} />;
}
