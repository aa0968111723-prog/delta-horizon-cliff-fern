import { Check, Copy as CopyIcon, Download, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [copied, setCopied] = useState<PackChannel | null>(null);
  const channel = packChannelForKind(kind);
  const primary = packText(copy, channel);
  const stats = packStats(primary, packLimit(channel));
  const ig = packText(copy, "ig");
  const threads = packText(copy, "threads");
  const line = packText(copy, "line");

  async function copyChannel(next: PackChannel, text: string) {
    const ok = await copyText(text, `已複製${packChannelLabel(next)}文案`);
    if (!ok) return;
    setCopied(next);
    window.setTimeout(() => setCopied((current) => (current === next ? null : current)), 1600);
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

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void copyChannel(channel, primary)} disabled={!primary}>
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
          <Button size="sm" variant="secondary" asChild>
            <Link to="/export">
              <Download className="size-4" />
              下載圖
            </Link>
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
      文案跟圖分開貼：先複製、再下載。
    </p>
  );
}
