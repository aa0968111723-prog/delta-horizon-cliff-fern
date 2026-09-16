import { useNavigate } from "@tanstack/react-router";
import { Repeat2, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CONVERT_TARGETS, remainingConvertTargets } from "@/lib/studio/convert";
import type { ContentKind, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function ConvertBar({
  project,
  className,
  variant = "full",
}: {
  project: Project;
  className?: string;
  variant?: "full" | "compact";
}) {
  const navigate = useNavigate();
  const convertProject = useStudio((s) => s.convertProject);
  const remaining = remainingConvertTargets(project.contentKind);

  function run(kind: ContentKind) {
    const next = convertProject(project.id, kind);
    if (!next) {
      toast.error("轉不出來，先把這則內容打開再試。");
      return;
    }
    toast.success(`已做成${CONVERT_TARGETS.find((t) => t.id === kind)?.label}`);
    void navigate({ to: "/studio/$projectId", params: { projectId: next.id } });
  }

  function runPack() {
    const made = remaining
      .map((item) => convertProject(project.id, item.id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (!made.length) {
      toast.info("沒有其他型態可以做。");
      return;
    }
    toast.success(`已做成 ${made.map((item) => CONVERT_TARGETS.find((t) => t.id === item.contentKind)?.label).join("、")}。原本那則還在。`);
  }

  if (!remaining.length) return null;

  return (
    <div className={cn(variant === "full" ? "space-y-2" : "flex min-w-0 flex-wrap items-center gap-2", className)}>
      {variant === "full" ? (
        <>
          <p className="text-sm font-medium">做成其他型態</p>
          <p className="text-xs text-muted">一則內容可以變成貼文、輪播、限動、Threads、LINE 圖或 Reels，原本那則不會被蓋掉。</p>
        </>
      ) : (
        <p className="text-xs text-subtle">做成</p>
      )}
      <div className="flex flex-wrap gap-2">
        {remaining.map((item) => (
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
        {remaining.length > 1 ? (
          <Button size="sm" variant="ghost" aria-label="一次做成全套" onClick={runPack}>
            <Layers className="size-4" aria-hidden />
            一次做成全套
          </Button>
        ) : null}
      </div>
    </div>
  );
}
