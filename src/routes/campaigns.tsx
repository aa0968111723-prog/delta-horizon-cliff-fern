import { createFileRoute } from "@tanstack/react-router";
import { CampaignCenter } from "@/components/campaigns/campaign-center";

export const Route = createFileRoute("/campaigns")({ component: CampaignCenter });
