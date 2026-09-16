import { createFileRoute } from "@tanstack/react-router";
import { CreateHub } from "@/components/create/create-hub";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

function AssistantPage() {
  const lastProjectId = useStudio((s) => s.lastProjectId);
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI 助手"
        title="畫布與企劃"
        description="對目前編輯器下指令（放大標題、換圖、改尺寸），或填活動需求生成企劃。大幅修改會先預覽，每次操作都可撤銷。"
      />
      <div className="mt-8 rounded-2xl surface-card p-4 sm:p-6">
        <AssistantForm variant="page" projectId={lastProjectId} />
      </div>
    </main>
  );
}
