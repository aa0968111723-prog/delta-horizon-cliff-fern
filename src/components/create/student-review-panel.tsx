import { AlertTriangle, CheckCircle2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentReview } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

/**
 * 反向學生模擬的結果。AI 生成完之後自動切換成淡江學生視角，
 * 一題一題回答「我會停下來嗎、我知道時間地點嗎」，再給修改建議。
 */
export function StudentReviewPanel({
  review,
  onApplyHook,
  onClose,
}: {
  review: StudentReview;
  onApplyHook?: (hook: string) => void;
  onClose?: () => void;
}) {
  const risks = review.items.filter((item) => item.verdict === "risk");

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--color-night)_16%,transparent)] text-[var(--color-night)]">
            <GraduationCap className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">淡江學生視角</p>
            <p className="text-xs text-muted">
              {review.source === "live" ? "AI 切換身分重看一次" : "本機規則檢查"}·會停下來的可能 {review.score}%
            </p>
          </div>
        </div>
        {onClose ? (
          <Button size="sm" variant="ghost" onClick={onClose}>
            收起
          </Button>
        ) : null}
      </header>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="three-lights h-full rounded-full transition-[width] duration-300"
          style={{ width: `${Math.max(6, Math.min(100, review.score))}%` }}
        />
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {review.items.map((item) => (
          <li
            key={item.question}
            className={cn(
              "flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs",
              item.verdict === "risk"
                ? "bg-[color-mix(in_oklab,var(--color-warn)_12%,transparent)]"
                : "bg-surface-2/60",
            )}
          >
            {item.verdict === "risk" ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--color-warn)]" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[var(--color-success)]" />
            )}
            <span className="min-w-0">
              <span className="block font-medium">{item.question}</span>
              <span className="block text-muted">{item.note}</span>
            </span>
          </li>
        ))}
      </ul>

      {review.rewriteHook ? (
        <div className="mt-4 rounded-2xl bg-surface-2/60 p-3">
          <p className="text-xs text-muted">學生更想看的第一句</p>
          <p className="mt-1 font-display text-base leading-snug">「{review.rewriteHook}」</p>
          {onApplyHook ? (
            <Button size="sm" variant="secondary" className="mt-2" onClick={() => onApplyHook(review.rewriteHook)}>
              換成這句
            </Button>
          ) : null}
        </div>
      ) : null}

      {review.suggestions.length ? (
        <ul className="mt-3 space-y-1 text-xs text-muted">
          {review.suggestions.map((s) => (
            <li key={s}>· {s}</li>
          ))}
        </ul>
      ) : null}

      {risks.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--color-success)]">學生視角沒有明顯問題，可以進畫面了。</p>
      ) : null}
    </section>
  );
}
