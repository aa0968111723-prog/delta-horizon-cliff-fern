import { Button } from "@/components/ui/button";
import type { ReelsBeat, StoryFrame } from "@/lib/studio/types";

export function ReelsDesk({
  beats,
  coverSrc,
  busy,
  onCover,
}: {
  beats: ReelsBeat[];
  coverSrc?: string | null;
  busy?: boolean;
  onCover?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs tracking-[0.14em] text-muted uppercase">Reels 20 秒</p>
        {onCover ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={onCover}>
            生成封面 9:16
          </Button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <div className="mx-auto aspect-9/16 w-28 overflow-hidden rounded-2xl bg-linear-to-b from-surface-2 to-bg">
          {coverSrc ? <img src={coverSrc} alt="" className="size-full object-cover" /> : (
            <p className="flex size-full items-end p-3 font-display text-sm leading-snug">{beats[0]?.caption}</p>
          )}
        </div>
        <ol className="space-y-2">
          {beats.map((beat) => (
            <li key={`${beat.start}-${beat.end}`} className="rounded-xl bg-bg px-3 py-2">
              <p className="text-xs text-subtle">
                {beat.start}–{beat.end}
              </p>
              <p className="text-sm font-medium">{beat.caption}</p>
              <p className="text-xs text-muted">畫面：{beat.visual}</p>
              <p className="text-xs text-muted">旁白：{beat.voice} · {beat.transition}</p>
              <p className="text-xs text-subtle">素材：{beat.assetHint}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function StoryStrip({ frames }: { frames: StoryFrame[] }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs tracking-[0.14em] text-muted uppercase">Story {frames.length} 張</p>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {frames.map((frame, index) => (
          <li key={`${frame.headline}-${index}`} className="w-36 shrink-0">
            <div className="flex aspect-9/16 flex-col justify-between rounded-2xl bg-fg p-3 text-bg">
              <p className="text-[10px] opacity-80">{index + 1}/{frames.length}</p>
              <div>
                <p className="font-display text-base leading-snug">{frame.headline}</p>
                <p className="mt-2 text-[11px] leading-relaxed opacity-90">{frame.body}</p>
              </div>
              <p className="text-[10px] opacity-80">{frame.visualNote}</p>
            </div>
            {frame.cta ? <p className="mt-1 text-center text-xs text-muted">{frame.cta}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
