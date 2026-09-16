import { Check, Copy as CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { pagesOf } from "@/lib/studio/layers";
import { linePostText } from "@/lib/studio/post-pack";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CLUB_HANDLE, CLUB_NAME } from "@/lib/zen/club";

/** LINE 發文預覽：橫式圖 + 可複製的一句話。不編造已讀。 */
export function LinePreview({
  project,
  brand,
  urls,
}: {
  project: Project;
  brand?: BrandKit;
  urls: Record<string, string>;
}) {
  const page = pagesOf(project)[0];
  const text = linePostText(project.copy);
  const [copied, setCopied] = useState(false);

  async function copyCaption() {
    if (!text.trim()) {
      toast.error("還沒有文案可以複製。先套用一版。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("已複製 LINE 文案");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("複製失敗，改用手選文字。");
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="mb-2 text-xs text-subtle">LINE 預覽 · {CLUB_HANDLE}</p>
      <div className="space-y-2 rounded-3xl bg-surface p-3 shadow-[var(--shadow-lift)]">
        <p className="text-xs text-subtle">{CLUB_NAME}</p>
        <div className="overflow-hidden rounded-2xl bg-surface-2">
          {page && brand ? (
            <span className="flex w-full justify-center">
              <ArtboardView artboard={page} brand={brand} urls={urls} width={320} />
            </span>
          ) : (
            <span className="flex aspect-[191/100] items-center justify-center text-xs text-muted">
              {project.name}
            </span>
          )}
        </div>
        <p className="rounded-2xl bg-surface-2 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {text || "套用一版文案之後，這裡會出現貼到 LINE 的字。"}
        </p>
        <Button size="sm" variant="secondary" onClick={() => void copyCaption()} disabled={!text.trim()}>
          {copied ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
          {copied ? "已複製" : "複製 LINE 文案"}
        </Button>
        <p className="text-xs text-subtle">已讀與按讚是 LINE 上的，這裡不編造數字。</p>
      </div>
    </div>
  );
}
