import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { resolveProjectId, useStudio } from "@/stores/studio-store";

export const Route = createFileRoute("/studio/")({ component: StudioIndex });

function StudioIndex() {
  const hydrated = useStudio((s) => s.hydrated);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  useStudio((s) => s.projects);
  if (!hydrated) return null;
  const id = resolveProjectId(lastProjectId);
  if (id) {
    return <Navigate to="/studio/$projectId" params={{ projectId: id }} />;
  }
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-16">
      <EmptyState
        icon={FolderKanban}
        title="還沒有可編輯的專案"
        description="先從首頁建立作品，或用 AI 助手寫一份活動需求。"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link to="/">回首頁</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/assistant">開啟助手</Link>
            </Button>
          </div>
        }
      />
    </main>
  );
}
