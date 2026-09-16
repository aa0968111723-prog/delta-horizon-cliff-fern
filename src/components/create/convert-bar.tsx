import { useNavigate } from "@tanstack/react-router";
import { Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CONVERT_TARGETS } from "@/lib/studio/convert";
import type { ContentKind, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function ConvertBar({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  const navigate = useNavigate();
  const convertProject = useStudio((s) => s.convertProject);

  function run(kind: ContentKind) {
    const next = convertProject(project.id, kind);
    if (!next) {
      toast.error("轉不出來，先把這則內容打開再試。");
      return;
    }
    toast.success(`已做成${CONVERT_TARGETS.find((t) => t.id === kind)?.label}`);
    void navigate({ to: "/studio/$projectId", params: { projectId: next.id } });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium">做成其他型態</p>
      <p className="text-xs text-muted">一則貼文可以變成輪播、限動、Threads、LINE 圖或 Reels，原本那則不會被蓋掉。</p>
      <div className="flex flex-wrap gap-2">
        {CONVERT_TARGETS.filter((item) => item.id !== project.contentKind).map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant="secondary"
            aria-label={`做成${item.label}`}
            onClick={() => run(item.id)}
          >
            <Repeat2 className="size-4" aria-hidden />
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
