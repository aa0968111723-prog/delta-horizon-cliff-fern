import { Check, Copy as CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ReelsScript } from "@/lib/studio/types";

export function reelsScriptText(reels: ReelsScript): string {
  const beats = reels.beats
    .map(
      (beat) =>
        `${beat.range}\n畫面：${beat.visual}\n字幕：${beat.caption}\n旁白：${beat.voice}\n轉場：${beat.transition}\n素材：${beat.asset}`,
    )
    .join("\n\n");
  return [`Hook：${reels.hook}`, `封面：${reels.cover}`, beats].join("\n\n");
}

export function ReelsTimeline({
  reels,
  adapter,
}: {
  reels: ReelsScript;
  adapter?: "live" | "local" | "mock";
}) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(reelsScriptText(reels));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg leading-snug">{reels.hook}</p>
          <p className="mt-1 text-xs text-muted">封面：{reels.cover}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={copyAll}>
          {copied ? <Check className="size-4" /> : <CopyIcon className="size-4" />}
          {copied ? "已複製腳本" : "複製整支腳本"}
        </Button>
      </div>
      {adapter === "local" || adapter === "mock" ? (
        <p className="text-xs text-subtle">這是本機草稿，可以直接改；不是線上模型的回覆。</p>
      ) : null}
      <ol className="relative space-y-2 border-l border-border pl-4">
        {reels.beats.map((beat) => (
          <li key={beat.range} className="relative rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <span className="absolute -left-[21px] top-5 size-2.5 rounded-full bg-accent" />
            <p className="text-xs font-medium tracking-wide text-[var(--color-accent)]">{beat.range}</p>
            <p className="mt-1 text-sm font-medium">{beat.caption}</p>
            <dl className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
              <div>
                <dt className="text-subtle">畫面</dt>
                <dd>{beat.visual}</dd>
              </div>
              <div>
                <dt className="text-subtle">旁白</dt>
                <dd>{beat.voice}</dd>
              </div>
              <div>
                <dt className="text-subtle">轉場</dt>
                <dd>{beat.transition}</dd>
              </div>
              <div>
                <dt className="text-subtle">素材</dt>
                <dd>{beat.asset}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
