import { createFileRoute } from "@tanstack/react-router";
import { CreateStudio } from "@/components/create/create-studio";

type Search = {
  q?: string;
  run?: string;
  mode?: string;
  campaign?: string;
};

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    run: typeof s.run === "string" ? s.run : undefined,
    mode: typeof s.mode === "string" ? s.mode : undefined,
    campaign: typeof s.campaign === "string" ? s.campaign : undefined,
  }),
  component: CreatePage,
});

function CreatePage() {
  const search = Route.useSearch();
  return (
    <CreateStudio
      initialQuery={search.q}
      autoRun={search.run === "1"}
      mode={search.mode}
      campaignId={search.campaign}
    />
  );
}
