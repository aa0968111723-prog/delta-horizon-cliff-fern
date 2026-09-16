import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { PageHeader } from "@/components/shared/page-header";
import type { CreationDesk } from "@/stores/ui-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export type AssistantSearch = {
  project?: string;
  desk?: CreationDesk;
};

function parseAssistantSearch(search: Record<string, unknown>): AssistantSearch {
  const desk = search.desk;
  return {
    project: typeof search.project === "string" && search.project ? search.project : undefined,
    desk: desk === "plan" || desk === "copy" || desk === "art" ? desk : undefined,
  };
}

export const Route = createFileRoute("/assistant")({
  validateSearch: parseAssistantSearch,
  component: AssistantPage,
});

function AssistantPage() {
  const search = Route.useSearch();
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const creativePreset = useUi((s) => s.creativePreset);
  const contentLinkId = useUi((s) => s.contentLinkId);
  const setCreationDesk = useUi((s) => s.setCreationDesk);
  const projectId = search.project ?? (creativePreset || contentLinkId ? null : lastProjectId);

  useEffect(() => {
    if (search.desk) setCreationDesk(search.desk);
  }, [search.desk, setCreationDesk]);

  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="禪作所"
        title="今天這則網宣"
        description="一人完成企劃、文案與畫面。Brand Memory 已在裡面，不用另開聊天室。"
      />
      <div className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <AssistantForm variant="page" projectId={projectId} />
      </div>
    </main>
  );
}
