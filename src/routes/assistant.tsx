import { createFileRoute } from "@tanstack/react-router";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { PageHeader } from "@/components/shared/page-header";
import { useStudio } from "@/stores/studio-store";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

function AssistantPage() {
  const lastProjectId = useStudio((s) => s.lastProjectId);
  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="禪作所"
        title="今天這則網宣"
        description="一人完成企劃、文案與畫面。Brand Memory 已在裡面，不用另開聊天室。"
      />
      <div className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <AssistantForm variant="page" projectId={lastProjectId} />
      </div>
    </main>
  );
}
