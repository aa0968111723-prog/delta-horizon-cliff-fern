import { Check, RefreshCw, Sparkles, UserRound, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { CopyDraft, StudentReview, ToneId } from "@/lib/studio/types";
import { TONES } from "@/lib/zen/labels";
import { detectAiSmell } from "@/lib/zen/voice";
import { cn } from "@/lib/utils";

export function CopyPanel({
  copy,
  variants,
  busy,
  reviewBusy,
  review,
  onTone,
  onRegenerate,
  onChange,
  onReview,
  onApplyRewrite,
}: {
  copy: CopyDraft;
  variants: CopyDraft[];
  busy: boolean;
  reviewBusy: boolean;
  review: StudentReview | null;
  onTone: (tone: ToneId) => void;
  onRegenerate: () => void;
  onChange: (patch: Partial<CopyDraft>) => void;
  onReview: () => void;
  onApplyRewrite: () => void;
}) {
  const smell = detectAiSmell(`${copy.hook}\n${copy.body}`);
  const hasCopy = Boolean(copy.hook || copy.body);

  return (
    <section className="min-w-0 rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">IG 文案</h2>
          <p className="text-xs text-muted">Hook · 正文 · CTA · Hashtags，切換語氣不會丟掉別的版本</p>
        </div>
        <Button size="sm" className="rounded-full" onClick={onRegenerate} disabled={busy}>
          {busy ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {busy ? "AI 正在寫…" : hasCopy ? "重新生成" : "AI 寫文案"}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TONES.map((t) => {
          const has = variants.some((v) => v.tone === t.id);
          const active = copy.tone === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTone(t.id)}
              className={cn(
                "flex min-h-8 items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors",
                active ? "bg-fg text-bg" : has ? "bg-surface-2 text-fg" : "bg-surface-2/60 text-muted",
              )}
              title={t.hint}
            >
              {t.label}
              {has && !active ? <span className="size-1.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted" htmlFor="copy-hook">
              第一句 Hook
            </label>
            <span className="text-[11px] text-subtle tabular-nums">{copy.hook.length} 字</span>
          </div>
          <Input
            id="copy-hook"
            value={copy.hook}
            onChange={(e) => onChange({ hook: e.target.value })}
            placeholder="最近是不是很久沒有好好坐下來？"
            className="mt-1 h-12 rounded-2xl text-base"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted" htmlFor="copy-body">
            正文
          </label>
          <Textarea
            id="copy-body"
            value={copy.body}
            onChange={(e) => onChange({ body: e.target.value })}
            rows={7}
            placeholder="時間、地點、怎麼參加，像同學在講話。"
            className="mt-1 rounded-2xl text-sm leading-relaxed"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <div>
            <label className="text-xs font-medium text-muted" htmlFor="copy-cta">
              CTA
            </label>
            <Input id="copy-cta" value={copy.cta} onChange={(e) => onChange({ cta: e.target.value })} placeholder="直接來就好" className="mt-1 rounded-2xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted" htmlFor="copy-tags">
              Hashtags
            </label>
            <Input
              id="copy-tags"
              value={copy.hashtags.join(" ")}
              onChange={(e) =>
                onChange({
                  hashtags: e.target.value
                    .split(/[\s,，]+/)
                    .filter(Boolean)
                    .map((h) => (h.startsWith("#") ? h : `#${h}`)),
                })
              }
              placeholder="#淡江大學禪學社 #淡江 #慢下來"
              className="mt-1 rounded-2xl"
            />
          </div>
        </div>
        {smell.flags.length ? (
          <p className="rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn">AI 味提醒：{smell.flags.join("；")}</p>
        ) : null}
      </div>

      {/* 反向學生模擬 */}
      <div className="mt-5 rounded-2xl bg-glow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-surface text-accent">
              <UserRound className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">淡江學生視角</p>
              <p className="text-xs text-muted">AI 切換成滑 IG 的同學，重新看一次</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={onReview} disabled={reviewBusy || !hasCopy}>
            {reviewBusy ? <RefreshCw className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            {review ? "再檢查一次" : "幫我看一次"}
          </Button>
        </div>
        {review ? <ReviewBody review={review} onApplyRewrite={onApplyRewrite} /> : null}
      </div>
    </section>
  );
}

const REVIEW_ROWS: { key: keyof StudentReview; label: string; goodWhen: boolean }[] = [
  { key: "wouldStop", label: "我會停下來", goodWhen: true },
  { key: "understandable", label: "我看得懂", goodWhen: true },
  { key: "knowsWhat", label: "知道活動在幹嘛", goodWhen: true },
  { key: "knowsWhenWhere", label: "知道時間地點", goodWhen: true },
  { key: "knowsHowToSignup", label: "知道怎麼參加", goodWhen: true },
  { key: "wouldBringFriend", label: "會想找朋友來", goodWhen: true },
  { key: "tooReligious", label: "太宗教", goodWhen: false },
  { key: "tooSerious", label: "太嚴肅", goodWhen: false },
  { key: "tooArtsy", label: "太文青", goodWhen: false },
  { key: "tooAi", label: "太 AI", goodWhen: false },
  { key: "tooLong", label: "太長", goodWhen: false },
];

function ReviewBody({ review, onApplyRewrite }: { review: StudentReview; onApplyRewrite: () => void }) {
  return (
    <div className="mt-4">
      <div className="flex items-start gap-3">
        <span className="font-display text-3xl tabular-nums">{Math.round(review.score)}</span>
        <p className="pt-1 text-sm leading-snug">「{review.verdict}」</p>
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {REVIEW_ROWS.map((row) => {
          const v = Boolean(review[row.key]);
          const good = v === row.goodWhen;
          if (!row.goodWhen && !v) return null;
          return (
            <li
              key={row.key}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs",
                good ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
              )}
            >
              {good ? <Check className="size-3" /> : <X className="size-3" />}
              {row.label}
            </li>
          );
        })}
      </ul>
      {review.suggestions.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {review.suggestions.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted">·</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {review.rewriteHook ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2">
          <p className="text-sm">
            <span className="text-xs text-muted">學生會寫成：</span>
            <br />「{review.rewriteHook}」
          </p>
          <Button size="sm" variant="ghost" onClick={onApplyRewrite}>
            用這句
          </Button>
        </div>
      ) : null}
    </div>
  );
}
