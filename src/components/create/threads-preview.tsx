import { Check, Copy as CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { packStats, THREADS_LIMIT, threadsPostText } from "@/lib/studio/post-pack";
import type { CopyDeck } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { CLUB_HANDLE, CLUB_NAME } from "@/lib/zen/club";

/** Threads 發文預覽：純文字、500 字上限。不編造讚數。 */
export function ThreadsPreview({ copy }: { copy: CopyDeck }) {
  const text = threadsPostText(copy);
  const stats = packStats(text, THREADS_LIMIT, THREADS_LIMIT);
  const [copied, setCopied] = useState(false);

  async function copyCaption() {
    if (!text.trim()) {
      toast.error("還沒有文案可以複製。先套用一版。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("已複製 Threads 文案");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("複製失敗，改用手選文字。");
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="mb-2 text-xs text-subtle">Threads 預覽 · {CLUB_HANDLE}</p>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-lift)]">
        <div className="flex items-start gap-2 px-3 py-3">
          <span className="three-lights size-9 shrink-0 rounded-full" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{CLUB_HANDLE}</p>
            <p className="truncate text-xs text-subtle">{CLUB_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
              {text || "套用一版文案之後，這裡會出現 Threads 要貼的字。"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
          <p className={cn("text-xs tabular-nums", stats.over ? "text-danger" : "text-muted")}>
            {stats.length} / {THREADS_LIMIT} 字
            {stats.over ? "，超過上限了" : ""}
          </p>
          <Button size="sm" variant="secondary" onClick={() => void copyCaption()} disabled={!text.trim()}>
            {copied ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
            {copied ? "已複製" : "複製 Threads 文案"}
          </Button>
        </div>
        <p className="px-3 pb-3 text-xs text-subtle">讚、轉發是 Threads 上的，這裡不編造數字。</p>
      </div>
    </div>
  );
}
