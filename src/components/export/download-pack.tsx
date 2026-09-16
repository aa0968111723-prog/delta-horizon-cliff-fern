import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertPackOf } from "@/lib/studio/convert-pack";
import { downloadConvertPack } from "@/lib/studio/export-download";
import { packDownloadableMembers, packTextOnlyMembers } from "@/lib/studio/pack-export";
import { contentKindLabel } from "@/lib/studio/status";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

async function copyCaptions(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function DownloadPackButton({
  projectId,
  className,
  size = "default",
  variant = "default",
}: {
  projectId: string;
  className?: string;
  size?: "default" | "sm";
  variant?: "default" | "secondary" | "ghost";
}) {
  const projects = useStudio((s) => s.projects);
  const brand = useStudio((s) => s.brands[0]);
  const assets = useStudio((s) => s.assets);
  const recordExport = useStudio((s) => s.recordExport);
  const [busy, setBusy] = useState(false);
  const pack = convertPackOf(projects, projectId);
  if (pack.length < 2) return null;

  async function run() {
    if (!brand) {
      toast.error("還沒有品牌可以套用。先打開品牌頁。");
      return;
    }
    setBusy(true);
    try {
      const result = await downloadConvertPack({
        members: pack,
        brand,
        assets,
        onRecord: (id, version) => recordExport(id, version),
      });
      const copied = await copyCaptions(result.captionsText);
      const skippedLabel = result.skipped.map((kind) => contentKindLabel(kind)).join("、");
      const failLabel = result.failed.map((item) => contentKindLabel(item.kind)).join("、");
      if (result.failed.length && result.pageCount === 0) {
        toast.error(failLabel ? `${failLabel}還沒有畫面。文案檔已下載。` : "圖沒匯出，文案檔已下載。");
      } else if (result.failed.length) {
        toast.success(`已下載 ${result.pageCount} 張圖，${failLabel}先跳過。`);
      } else {
        toast.success(
          result.pageCount
            ? `已下載 ${result.pageCount} 張圖${copied ? "，文案也複製了" : ""}。${skippedLabel ? `${skippedLabel}在文案檔裡。` : ""}`
            : "已下載全套文案。",
          { duration: 8000 },
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "全套下載失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={busy}
      aria-label="下載全套"
      onClick={() => void run()}
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
      {busy ? "下載中…" : "下載全套"}
    </Button>
  );
}

export function PackExportHint({ projectId, className }: { projectId: string; className?: string }) {
  const projects = useStudio((s) => s.projects);
  const pack = convertPackOf(projects, projectId);
  if (pack.length < 2) return null;
  const visual = packDownloadableMembers(pack);
  const textOnly = packTextOnlyMembers(pack);
  return (
    <p className={cn("text-xs text-muted", className)}>
      {visual.length} 種畫面會下載圖
      {textOnly.length ? `，${textOnly.map((item) => contentKindLabel(item.contentKind)).join("、")}只寫進文案檔` : ""}
      。
    </p>
  );
}
