import { createFileRoute } from "@tanstack/react-router";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { PageHeader } from "@/components/shared/page-header";
import { useStudio } from "@/stores/studio-store";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

function AssistantPage() {
  const lastProjectId = useStudio((s) => s.lastProjectId);
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="畫布指令"
        title="改畫面"
        description="對目前編輯器下指令。完整多模態創作請用 AI 創作台。"
      />
      <div className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <AssistantForm variant="page" projectId={lastProjectId} />
      </div>
    </main>
  );
}
