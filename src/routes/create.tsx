import { createFileRoute } from "@tanstack/react-router";
import { CreateStudio } from "@/components/create/create-studio";

type Search = {
  q?: string;
  go?: string;
  auto?: string;
  mode?: string;
  campaign?: string;
  asset?: string;
  day?: string;
  ok?: string;
  notice?: string;
};

export const Route = createFileRoute("/create")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    go: typeof s.go === "string" ? s.go : typeof s.auto === "string" ? s.auto : undefined,
    mode: typeof s.mode === "string" ? s.mode : undefined,
    campaign: typeof s.campaign === "string" ? s.campaign : undefined,
    asset: typeof s.asset === "string" ? s.asset : undefined,
    day: typeof s.day === "string" ? s.day : undefined,
    ok: typeof s.ok === "string" ? s.ok : undefined,
    notice: typeof s.notice === "string" ? s.notice : undefined,
  }),
  component: CreatePage,
});

function CreatePage() {
  const search = Route.useSearch();
  return (
    <CreateStudio
      initialQuery={search.q}
      autoRun={search.go === "1"}
      mode={search.mode}
      campaignId={search.campaign}
      initialAssetId={search.asset}
      initialDay={search.day}
      connected={search.ok}
      notice={search.notice}
    />
  );
}
