import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatScriptClipboard, type FormatScript, type FormatScriptRow } from "@/lib/zen/convert";

export function FormatScriptPanel({
  script,
  busyId,
  onMakeVisual,
  onMakeAll,
}: {
  script: FormatScript;
  busyId: string | null;
  onMakeVisual?: (row: FormatScriptRow) => void | Promise<void>;
  onMakeAll?: () => void | Promise<void>;
}) {
  const [copying, setCopying] = useState(false);
  const actionable = script.kind === "reels" || script.kind === "story" || script.kind === "carousel";
  if (!actionable) return null;

  async function copyAll() {
    const text = formatScriptClipboard(script);
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製分鏡");
    } catch {
      toast.message(text.slice(0, 80));
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">{script.label}</p>
        <div className="flex flex-wrap gap-2">
          {onMakeAll ? (
            <Button size="sm" disabled={busyId !== null} onClick={() => void onMakeAll()}>
              {busyId === "all" ? "生成中…" : "做成全部畫面"}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" disabled={copying} onClick={() => void copyAll()}>
            複製全部分鏡
          </Button>
        </div>
      </div>
      <ol className="space-y-2">
        {script.rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-bg p-3">
            <p className="text-xs text-muted">{row.kicker}</p>
            <p className="mt-1 text-sm font-medium">{row.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{row.body}</p>
            {onMakeVisual ? (
              <Button
                className="mt-2"
                size="sm"
                variant="secondary"
                disabled={busyId !== null}
                onClick={() => void onMakeVisual(row)}
              >
                {busyId === row.id ? "生成中…" : "做成這一拍畫面"}
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
