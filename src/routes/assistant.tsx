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
        kicker="淡江禪學社 Creative Brain"
        title="今天想創作什麼？"
        description="從活動或一句想法開始。AI 會先代入淡江學生的生活，再生成 Hook、IG 文案、視覺方向、Carousel、Story 與 Reels 封面草案。"
      />
      <div className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <AssistantForm variant="page" projectId={lastProjectId} />
      </div>
    </main>
  );
}
