import { createFileRoute } from "@tanstack/react-router";
import { CreateHub } from "@/components/create/create-hub";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

function AssistantPage() {
  const lastProjectId = useStudio((s) => s.lastProjectId);
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="淡江大學禪學社 AI 創作助手"
        title="一人 AI 創作中控台"
        description="針對迎新茶會、日常社課或校園生活痛點生成企劃、文案與畫布指令。結合淡江受眾視角模擬，確保無宗教沉重感與 AI 塑料味。"
      />
      <div className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <AssistantForm variant="page" projectId={lastProjectId} />
      </div>
    </main>
  );
}
