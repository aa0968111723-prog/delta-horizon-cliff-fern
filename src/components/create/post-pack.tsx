import { Check, Copy as CopyIcon, Download, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadProjectPages } from "@/lib/studio/export-download";
import {
  IG_PREVIEW_CHARS,
  packChannelForKind,
  packChannelLabel,
  packLimit,
  packStats,
  packText,
  type PackChannel,
} from "@/lib/studio/post-pack";
import type { ContentKind, CopyDeck } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

async function copyText(text: string, ok: string) {
  if (!text.trim()) {
    toast.error("還沒有文案可以複製。先套用一版。");
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success(ok);
    return true;
  } catch {
    toast.error("複製失敗，改用手選文字。");
    return false;
  }
}

export function PostPackBar({
  copy,
  kind,
  projectId,
  className,
}: {
  copy: CopyDeck;
  kind: ContentKind;
  projectId?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState<PackChannel | "alt" | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const project = useStudio((s) => s.projects.find((item) => item.id === projectId) ?? null);
  const brand = useStudio((s) => s.brands[0]);
  const assets = useStudio((s) => s.assets);
  const recordExport = useStudio((s) => s.recordExport);
  const channel = packChannelForKind(kind);
  const primary = packText(copy, channel);
  const stats = packStats(primary, packLimit(channel));
  const ig = packText(copy, "ig");
  const threads = packText(copy, "threads");
  const line = packText(copy, "line");
  const alt = (copy.altText ?? "").trim();

  async function copyChannel(next: PackChannel, text: string) {
    const ok = await copyText(text, `已複製${packChannelLabel(next)}文案`);
    if (!ok) return;
    setCopied(next);
    window.setTimeout(() => setCopied((current) => (current === next ? null : current)), 1600);
  }

  async function downloadPng() {
    if (!project || !brand) {
      toast.error("還沒有畫面可以下載。先套用一版、放上主視覺。");
      return false;
    }
    setDownloadBusy(true);
    try {
      const result = await downloadProjectPages({
        project,
        brand,
        assets,
        onRecord: (version) => recordExport(project.id, version),
      });
      toast.success(result.count > 1 ? `已下載 ${result.count} 頁` : "已開始下載圖");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "下載失敗");
      return false;
    } finally {
      setDownloadBusy(false);
    }
  }

  async function copyAndDownload() {
    const copiedOk = await copyText(primary, `已複製${packChannelLabel(channel)}文案`);
    if (copiedOk) {
      setCopied(channel);
      window.setTimeout(() => setCopied((current) => (current === channel ? null : current)), 1600);
    }
    await downloadPng();
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium">發這則</p>
        <p className="mt-1 text-xs text-muted">
          複製文案、下載圖，到 IG、Threads 或 LINE 貼上。沒有審核，一個人就能發。
        </p>
      </div>

      <div className="rounded-xl bg-surface-2/60 p-3">
        <p className="text-xs text-subtle">
          {packChannelLabel(channel)}前 {IG_PREVIEW_CHARS} 字
          {stats.hasMore ? "（後面要點「更多」才看得到）" : ""}
        </p>
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
          {stats.preview || "套用一版文案之後，這裡會出現貼文預覽。"}
          {stats.hasMore ? "…" : ""}
        </p>
        <p className={cn("mt-2 text-xs tabular-nums", stats.over ? "text-danger" : "text-muted")}>
          {stats.length} / {stats.limit} 字
          {stats.over ? "，超過上限了" : stats.remaining < 80 ? `，還剩 ${stats.remaining}` : ""}
        </p>
      </div>

      {alt ? (
        <div className="rounded-xl bg-surface-2/60 p-3">
          <p className="text-xs text-subtle">無障礙說明（發 IG 時貼到 Alt）</p>
          <p className="mt-1 text-sm leading-relaxed">{alt}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void copyAndDownload()} disabled={!primary || !projectId || downloadBusy}>
          {downloadBusy ? <Loader2 className="size-4 animate-spin" /> : copied === channel ? <Check className="size-4" /> : <Download className="size-4" />}
          {downloadBusy ? "下載中…" : "複製並下載"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void copyChannel(channel, primary)} disabled={!primary}>
          {copied === channel ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
          {copied === channel ? "已複製" : "複製發文文案"}
        </Button>
        {channel !== "ig" ? (
          <Button size="sm" variant="secondary" onClick={() => void copyChannel("ig", ig)} disabled={!ig}>
            複製 IG 文案
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => void copyChannel("threads", threads)} disabled={!threads}>
            複製 Threads
          </Button>
        )}
        {channel !== "line" ? (
          <Button size="sm" variant="ghost" onClick={() => void copyChannel("line", line)} disabled={!line}>
            複製 LINE
          </Button>
        ) : null}
        {projectId ? (
          <Button size="sm" variant="secondary" onClick={() => void downloadPng()} disabled={downloadBusy}>
            {downloadBusy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            下載圖
          </Button>
        ) : null}
        {alt ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void copyText(alt, "已複製無障礙說明").then((ok) => {
                if (!ok) return;
                setCopied("alt");
                window.setTimeout(() => setCopied((current) => (current === "alt" ? null : current)), 1600);
              });
            }}
          >
            {copied === "alt" ? "已複製 Alt" : "複製 Alt"}
          </Button>
        ) : null}
        {projectId ? (
          <Button size="sm" variant="ghost" asChild>
            <Link to="/export">進匯出頁</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function PostPackHint() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted">
      <Send className="size-3.5" />
      文案跟圖可以一次帶走：複製並下載。
    </p>
  );
}
