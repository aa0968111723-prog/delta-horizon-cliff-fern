import { createFileRoute } from "@tanstack/react-router";
import { CreateStudio } from "@/components/create/create-studio";
import { isCreateMode, type CreateMode } from "@/lib/zen/create-modes";

export type CreateSearch = {
  mode?: CreateMode;
  campaignId?: string;
  waveId?: string;
  contentId?: string;
  idea?: string;
};

export const Route = createFileRoute("/create")({
  validateSearch: (raw: Record<string, unknown>): CreateSearch => ({
    mode: isCreateMode(raw.mode) ? raw.mode : undefined,
    campaignId: typeof raw.campaignId === "string" ? raw.campaignId : undefined,
    waveId: typeof raw.waveId === "string" ? raw.waveId : undefined,
    contentId: typeof raw.contentId === "string" ? raw.contentId : undefined,
    idea: typeof raw.idea === "string" ? raw.idea : undefined,
  }),
  component: CreatePage,
});

function CreatePage() {
  const search = Route.useSearch();
  return <CreateStudio search={search} />;
}
