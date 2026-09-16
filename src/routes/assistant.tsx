import { createFileRoute } from "@tanstack/react-router";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { PageHeader } from "@/components/shared/page-header";
import { useStudio } from "@/stores/studio-store";

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
  const lastProjectId = useStudio((s) => s.lastProjectId);
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI 助手"
        title="畫布與企劃"
        description="對目前編輯器下指令（放大標題、換圖、改尺寸），或填活動需求生成企劃。大幅修改會先預覽，每次操作都可撤銷。"
      />
      <div className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <AssistantForm variant="page" projectId={lastProjectId} />
      </div>
    </main>
  );
}
