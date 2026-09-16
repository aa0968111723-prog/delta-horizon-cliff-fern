import { createFileRoute } from "@tanstack/react-router";
import { CampaignListPage } from "@/components/campaigns/campaign-pages";

export const Route = createFileRoute("/campaigns/")({ component: CampaignListPage });
