import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PackExportHint({
  projectId,
  className,
}: {
  projectId: string;
  className?: string;
}) {
  return (
    <p className={cn("text-xs text-muted", className)} data-project-id={projectId}>
      Threads 只寫進文案檔，其他格式會一起打包下載。
    </p>
  );
}

export function DownloadPackButton({ projectId }: { projectId: string }) {
  return (
    <Button type="button" variant="secondary" className="shrink-0" data-project-id={projectId}>
      <Download className="size-4" />
      一次下載全套
    </Button>
  );
}
