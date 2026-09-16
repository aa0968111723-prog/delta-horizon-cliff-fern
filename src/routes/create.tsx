import { createFileRoute } from "@tanstack/react-router";
import { CreateStudio } from "@/components/create/create-studio";

type Search = {
  q?: string;
  auto?: string;
  mode?: string;
  campaign?: string;
};

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    auto: typeof s.auto === "string" ? s.auto : undefined,
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
      autoRun={search.auto === "1"}
      mode={search.mode}
      campaignId={search.campaign}
    />
  );
}
