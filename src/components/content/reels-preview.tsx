import { Heart, MessageCircle, Pause, Play, Send } from "lucide-react";
import type { ReelsBeat } from "@/lib/studio/types";
import { CLUB_HANDLE } from "@/lib/zen/labels";
import { beatIndexAt, beatRole, reelsDuration } from "@/lib/zen/reels";
import { cn } from "@/lib/utils";

export function ReelsPreview({
  beats,
  cover,
  handle = CLUB_HANDLE,
  time = 0,
  playing = false,
  onTogglePlay,
  onSeek,
  className,
}: {
  beats: ReelsBeat[];
  cover?: string;
  handle?: string;
  time?: number;
  playing?: boolean;
  onTogglePlay?: () => void;
  onSeek?: (t: number) => void;
  className?: string;
}) {
  const duration = reelsDuration(beats);
  const active = beatIndexAt(beats, time);
  const beat = beats[active];
  const progress = duration ? Math.min(1, time / duration) : 0;

  return (
    <div className={cn("mx-auto w-full max-w-[min(18rem,100%)]", className)}>
      <div className="relative overflow-hidden rounded-[28px] bg-night text-night-fg shadow-[var(--shadow-float)]">
        <div className="relative aspect-[9/16] w-full">
          {cover ? <img src={cover} alt="" className="absolute inset-0 size-full object-cover" /> : <div className="absolute inset-0 bg-glow-card" />}
          <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-night/30" />

          <div className="absolute inset-x-2 top-2 z-10 flex items-center gap-1">
            {beats.length
              ? beats.map((b, i) => (
                  <button
                    key={`${b.from}-${i}`}
                    type="button"
                    aria-label={`跳到 ${beatRole(i).label} ${b.from}–${b.to} 秒`}
                    className="flex h-7 flex-1 items-center"
                    onClick={() => onSeek?.(b.from + 0.05)}
                  >
                    <span className="block h-0.5 w-full overflow-hidden rounded-full bg-night-fg/25">
                      <span
                        className="block h-full bg-night-fg"
                        style={{
                          width: i < active ? "100%" : i === active ? `${Math.min(100, ((time - b.from) / Math.max(0.1, b.to - b.from)) * 100)}%` : "0%",
                        }}
                      />
                    </span>
                  </button>
                ))
              : <span className="h-0.5 w-full rounded-full bg-night-fg/40" />}
          </div>

          <p className="absolute top-9 left-3 z-10 text-[10px] tracking-[0.18em] text-night-fg/70 uppercase">
            {beat ? `${beatRole(active).label} · ${Math.floor(time)}s` : "Reels · 20s"}
          </p>

          {!playing ? (
            <>
              <button
                type="button"
                onClick={onTogglePlay}
                className="absolute inset-x-0 top-10 bottom-28 z-[4] md:hidden"
                aria-label="在畫面裡預覽"
              />
              <button
                type="button"
                onClick={onTogglePlay}
                className="absolute top-1/2 left-1/2 z-[5] hidden size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-night/55 text-night-fg backdrop-blur-sm md:flex"
                aria-label="在畫面裡預覽"
              >
                <Play className="size-6 fill-current" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onTogglePlay}
              className="absolute top-9 right-3 z-10 flex size-11 items-center justify-center rounded-full bg-night/40"
              aria-label="暫停"
            >
              <Pause className="size-3.5" />
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-xs font-semibold">{handle.replace(/^@/, "")}</p>
            <p className="mt-1 font-display text-xl leading-tight">{beat?.caption || "還沒有字幕。先生成 20 秒腳本。"}</p>
            {beat?.visual ? <p className="mt-2 text-[11px] text-night-fg/70">畫面：{beat.visual}</p> : null}
            <div className="mt-3 flex items-center gap-3 text-night-fg">
              <Heart className="size-5" />
              <MessageCircle className="size-5" />
              <Send className="size-5" />
              <span className="ml-auto text-[11px] tabular-nums text-night-fg/70">
                {Math.floor(time).toString().padStart(2, "0")}s / {duration}s
              </span>
            </div>
          </div>
        </div>
        <div className="h-1 bg-night-fg/15">
          <div className="h-full bg-glow-amber" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
