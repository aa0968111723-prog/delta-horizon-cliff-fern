import { Clapperboard, Copy, Pause, Play, RefreshCw, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ReelsPreview } from "@/components/content/reels-preview";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { AssetMeta, ReelsBeat } from "@/lib/studio/types";
import { CLUB_HANDLE } from "@/lib/zen/labels";
import {
  REELS_TRANSITIONS,
  beatIndexAt,
  beatRole,
  formatReelsScript,
  reelsDuration,
  suggestAssetsForBeat,
} from "@/lib/zen/reels";
import { cn } from "@/lib/utils";

export function ReelsPanel({
  beats,
  cover,
  handle = CLUB_HANDLE,
  assets,
  assetUrls,
  busy,
  onGenerate,
  onPatchBeat,
  onGenerateCover,
}: {
  beats: ReelsBeat[];
  cover?: string;
  handle?: string;
  assets: AssetMeta[];
  assetUrls: Record<string, string>;
  busy: boolean;
  onGenerate: () => void;
  onPatchBeat: (index: number, patch: Partial<ReelsBeat>) => void;
  onGenerateCover: () => void;
}) {
  const duration = reelsDuration(beats);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(0);
  const raf = useRef(0);
  const origin = useRef(0);

  const active = beatIndexAt(beats, time);

  useEffect(() => {
    if (!playing || !beats.length) return;
    origin.current = performance.now() - time * 1000;
    const tick = (now: number) => {
      const next = Math.min(duration, (now - origin.current) / 1000);
      setTime(next);
      if (next >= duration) {
        setPlaying(false);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, beats.length, duration]);

  useEffect(() => {
    setOpen(active);
  }, [active]);

  async function copyScript() {
    if (!beats.length) return;
    try {
      await navigator.clipboard.writeText(formatReelsScript(beats));
      toast.success("拍攝腳本已複製，可以照秒數拍");
    } catch {
      toast.error("無法複製，請手動選取。");
    }
  }

  function togglePlay() {
    if (!beats.length) {
      toast.message("先生成 20 秒腳本，才能預覽。");
      return;
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    setTime((t) => (t >= duration - 0.05 ? 0 : t));
    setPlaying(true);
  }

  return (
    <section className="min-w-0 rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Reels 工作台</h2>
          <p className="text-xs text-muted">20 秒：Hook → 情境 → 停下來 → 現場 → 時間地點。先寫腳本，再拍、再出封面。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" onClick={onGenerate} disabled={busy}>
            {busy ? <RefreshCw className="size-3.5 animate-spin" /> : <Clapperboard className="size-3.5" />}
            {busy ? "AI 正在寫腳本…" : beats.length ? "重寫腳本" : "AI 生成 20 秒腳本"}
          </Button>
          <Button size="sm" variant="secondary" className="rounded-full" onClick={onGenerateCover} disabled={busy}>
            <Wand2 className="size-3.5" />
            {cover ? "重出封面" : "生成封面"}
          </Button>
        </div>
      </div>

      {!beats.length ? (
        <p className="mt-4 rounded-2xl bg-surface-2/70 px-4 py-6 text-center text-sm text-muted">
          按「AI 生成 20 秒腳本」。會依 Brand Memory 與淡江學生情境，拆成 0–3 / 3–7 / 7–12 / 12–17 / 17–20 秒，每段都有畫面、字幕、旁白與要準備的素材。
        </p>
      ) : (
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,16.5rem)_1fr] lg:items-start">
            <div className="mx-auto w-full max-w-[9.5rem] md:max-w-[min(16.5rem,100%)]">
            <ReelsPreview
              beats={beats}
              cover={cover}
              handle={handle}
              time={time}
              playing={playing}
              onTogglePlay={togglePlay}
              onSeek={(t) => {
                setPlaying(false);
                setTime(t);
              }}
            />
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="secondary" className="rounded-full" onClick={togglePlay}>
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {playing ? "暫停" : "預覽 20 秒"}
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => void copyScript()}>
                <Copy className="size-3.5" />
                複製拍攝腳本
              </Button>
            </div>
          </div>

            <ol className="min-w-0 space-y-2">
            {beats.map((beat, i) => (
              <BeatCard
                key={`${beat.from}-${i}`}
                beat={beat}
                index={i}
                active={i === active}
                open={open === i}
                assets={assets}
                assetUrls={assetUrls}
                onOpen={() => {
                  setPlaying(false);
                  setOpen(i);
                  setTime(beat.from + 0.05);
                }}
                onPatch={(patch) => onPatchBeat(i, patch)}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function BeatCard({
  beat,
  index,
  active,
  open,
  assets,
  assetUrls,
  onOpen,
  onPatch,
}: {
  beat: ReelsBeat;
  index: number;
  active: boolean;
  open: boolean;
  assets: AssetMeta[];
  assetUrls: Record<string, string>;
  onOpen: () => void;
  onPatch: (patch: Partial<ReelsBeat>) => void;
}) {
  const role = beatRole(index);
  const suggestions = useMemo(() => suggestAssetsForBeat(beat, assets), [beat, assets]);
  const picked = beat.assetId ? assets.find((a) => a.id === beat.assetId) : null;
  const thumb = beat.assetId ? assetUrls[beat.assetId] : undefined;

  return (
    <li
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl bg-surface-2/70 shadow-[var(--shadow-border)]",
        active && "ring-2 ring-accent/40",
      )}
    >
      <button type="button" onClick={onOpen} className="flex w-full min-h-11 items-center gap-3 px-3 py-3 text-left" aria-label={`編輯 ${role.label} ${beat.from}–${beat.to} 秒`}>
        <span className="w-12 shrink-0 font-display text-sm tabular-nums">
          {beat.from}–{beat.to}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] tracking-[0.12em] text-muted uppercase">
              {role.label}
            </span>
            <span className="truncate text-sm">{beat.caption || role.hint}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">{beat.visual || "還沒寫畫面"}</span>
        </span>
        {thumb ? <img src={thumb} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : null}
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border/70 px-3 py-3">
          <label className="block text-xs text-muted">
            畫面
            <Textarea
              rows={2}
              value={beat.visual}
              onChange={(e) => onPatch({ visual: e.target.value })}
              className="mt-1 rounded-2xl text-sm"
            />
          </label>
          <label className="block text-xs text-muted">
            字幕（畫面上的字，短）
            <Input value={beat.caption} onChange={(e) => onPatch({ caption: e.target.value })} className="mt-1 rounded-2xl" />
          </label>
          <label className="block text-xs text-muted">
            旁白
            <Input value={beat.voiceover} onChange={(e) => onPatch({ voiceover: e.target.value })} className="mt-1 rounded-2xl" />
          </label>
          <div>
            <p className="text-xs text-muted">轉場</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {REELS_TRANSITIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onPatch({ transition: t })}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs",
                    beat.transition === t ? "bg-fg text-bg" : "bg-surface text-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-xs text-muted">
            要準備的素材
            <Input value={beat.assetHint} onChange={(e) => onPatch({ assetHint: e.target.value })} className="mt-1 rounded-2xl" />
          </label>
          {suggestions.length || picked ? (
            <div>
              <p className="text-xs text-muted">素材庫裡可能用得上的</p>
              <ul className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((asset) => {
                  const url = assetUrls[asset.id];
                  const selected = beat.assetId === asset.id;
                  return (
                    <li key={asset.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => onPatch({ assetId: selected ? null : asset.id })}
                        className={cn(
                          "w-20 overflow-hidden rounded-xl bg-surface text-left shadow-[var(--shadow-border)]",
                          selected && "ring-2 ring-accent",
                        )}
                      >
                        <span className="block aspect-square bg-glow-card">
                          {url ? <img src={url} alt="" className="size-full object-cover" /> : null}
                        </span>
                        <span className="block truncate px-1.5 py-1 text-[10px]">{asset.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
