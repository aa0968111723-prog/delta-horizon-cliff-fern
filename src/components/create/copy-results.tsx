import { Check, Copy as CopyIcon, RefreshCw, Wand2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toneLabel } from "@/lib/ai/copy-local";
import type { CopyDraft } from "@/lib/studio/types";
import { scanCopyIssues } from "@/lib/zen/voice";

export function copyDraftText(draft: CopyDraft): string {
  return [draft.hook, draft.body, draft.cta, draft.hashtags.join(" ")].filter(Boolean).join("\n\n");
}

export function CopyDraftCard({
  draft,
  onUse,
  onReview,
  onRegenerate,
  used,
}: {
  draft: CopyDraft;
  onUse?: () => void;
  onReview?: () => void;
  onRegenerate?: () => void;
  used?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const issues = scanCopyIssues(copyDraftText(draft));

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(copyDraftText(draft));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="flex items-center justify-between gap-2">
        <Badge variant={draft.source === "live" ? "accent" : "default"}>{toneLabel(draft.tone)}</Badge>
        <span className="text-xs text-subtle">
          {draft.source === "live" ? "AI 生成" : "本機草稿"}
        </span>
      </header>

      <p className="font-display text-lg leading-snug text-balance">{draft.hook}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{draft.body}</p>

      <div className="mt-auto space-y-3">
        <p className="text-sm font-medium">{draft.cta}</p>
        {draft.hashtags.length ? (
          <p className="text-xs break-words text-[var(--color-accent)]">{draft.hashtags.join(" ")}</p>
        ) : null}
        {draft.altText?.trim() ? (
          <p className="text-xs leading-relaxed text-subtle">無障礙：{draft.altText.trim()}</p>
        ) : null}

        {issues.length ? (
          <ul className="space-y-1 rounded-xl bg-[color-mix(in_oklab,var(--color-warn)_10%,transparent)] p-2.5 text-xs text-muted">
            {issues.map((issue) => (
              <li key={issue}>· {issue}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {onUse ? (
            <Button size="sm" onClick={onUse} disabled={used}>
              {used ? <Check className="size-4" /> : <Wand2 className="size-4" />}
              {used ? "已套用" : "用這版"}
            </Button>
          ) : null}
          {onReview ? (
            <Button size="sm" variant="secondary" onClick={onReview}>
              學生視角檢查
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={copyToClipboard}>
            {copied ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
            {copied ? "已複製" : "複製"}
          </Button>
          {onRegenerate ? (
            <Button size="sm" variant="ghost" onClick={onRegenerate} aria-label="重新生成這版">
              <RefreshCw className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
