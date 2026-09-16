import { Copy, RefreshCw, Shuffle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContentItem } from "@/lib/studio/types";

type FormatTab = "carousel" | "story" | "reels" | "threads" | "line";

export function FormatsPanel({
  content,
  busy,
  hideReels,
  onConvert,
  onOpenReels,
}: {
  content: ContentItem;
  busy: boolean;
  hideReels?: boolean;
  onConvert: () => void;
  onOpenReels?: () => void;
}) {
  const [tab, setTab] = useState<FormatTab>(
    hideReels
      ? "carousel"
      : content.type === "story"
        ? "story"
        : content.type === "reels"
          ? "reels"
          : content.type === "threads"
            ? "threads"
            : content.type === "line"
              ? "line"
              : "carousel",
  );
  const has = content.carousel.length || content.storyFrames.length || content.reels.length || content.threads || content.line;

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已複製");
    } catch {
      toast.error("無法複製，請手動選取。");
    }
  }

  return (
    <section className="rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">一鍵轉換</h2>
          <p className="text-xs text-muted">同一篇，變成 Carousel、Story、Reels 腳本、Threads、LINE</p>
        </div>
        <Button size="sm" variant={has ? "secondary" : "default"} className="rounded-full" onClick={onConvert} disabled={busy || !(content.copy.hook || content.copy.body)}>
          {busy ? <RefreshCw className="size-3.5 animate-spin" /> : <Shuffle className="size-3.5" />}
          {busy ? "AI 正在轉…" : has ? "重新轉換" : "AI 一鍵轉換"}
        </Button>
      </div>

      {!has ? (
        <p className="mt-4 rounded-2xl bg-surface-2/70 px-4 py-6 text-center text-sm text-muted">
          先有文案，再按「AI 一鍵轉換」。Carousel 會拆成 Hook → 情境 → 痛點 → 活動 → CTA；Reels 會拆成 0–3 / 3–7 / 7–12 / 12–17 / 17–20 秒。
        </p>
      ) : (
        <Tabs value={hideReels && tab === "reels" ? "carousel" : tab} onValueChange={(v) => setTab(v as FormatTab)} className="mt-3">
          <TabsList className="no-scrollbar h-auto w-full justify-start overflow-x-auto">
            <TabsTrigger value="carousel">Carousel {content.carousel.length ? `· ${content.carousel.length}` : ""}</TabsTrigger>
            <TabsTrigger value="story">Story {content.storyFrames.length ? `· ${content.storyFrames.length}` : ""}</TabsTrigger>
            {hideReels ? null : <TabsTrigger value="reels">Reels</TabsTrigger>}
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="line">LINE</TabsTrigger>
          </TabsList>

          <TabsContent value="carousel" className="mt-3">
            <ol className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {content.carousel.map((s) => (
                <li key={s.index} className="w-[70%] shrink-0 snap-start sm:w-56">
                  <div className="flex aspect-[4/5] flex-col rounded-2xl bg-glow-card p-4">
                    <span className="text-[11px] tracking-[0.16em] text-muted uppercase">
                      {s.index + 1} · {s.role}
                    </span>
                    <p className="mt-2 font-display text-xl leading-tight">{s.title}</p>
                    <p className="mt-2 text-sm leading-snug">{s.text}</p>
                    <p className="mt-auto pt-3 text-[11px] text-muted">畫面：{s.visualNote}</p>
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="story" className="mt-3">
            <ol className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {content.storyFrames.map((f) => (
                <li key={f.index} className="w-[46%] shrink-0 snap-start sm:w-40">
                  <div className="flex aspect-[9/16] flex-col rounded-2xl bg-night p-3 text-night-fg">
                    <span className="text-[10px] text-night-fg/60">{f.index + 1}</span>
                    <p className="mt-auto font-display text-base leading-tight">{f.text}</p>
                    {f.sticker ? <span className="mt-2 self-start rounded-full bg-night-fg/15 px-2 py-0.5 text-[10px]">{f.sticker}</span> : null}
                    <p className="mt-2 text-[10px] text-night-fg/60">{f.visualNote}</p>
                  </div>
                </li>
              ))}
            </ol>
          </TabsContent>

          <TabsContent value="reels" className="mt-3">
            <ol className="space-y-2">
              {content.reels.map((b, i) => (
                <li key={i} className="grid gap-2 rounded-2xl bg-surface-2/70 p-3 text-sm sm:grid-cols-[4rem_1fr]">
                  <span className="font-display text-base tabular-nums">
                    {b.from}–{b.to}s
                  </span>
                  <div className="space-y-1">
                    <p>
                      <span className="text-xs text-muted">畫面：</span>
                      {b.visual}
                    </p>
                    <p>
                      <span className="text-xs text-muted">字幕：</span>
                      {b.caption}
                    </p>
                    {b.voiceover ? (
                      <p>
                        <span className="text-xs text-muted">旁白：</span>
                        {b.voiceover}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted">
                      轉場 {b.transition || "直切"} · 素材 {b.assetHint || "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {content.reels.length && onOpenReels ? (
              <Button size="sm" className="mt-3 rounded-full" onClick={onOpenReels}>
                在 Reels 工作台編輯
              </Button>
            ) : null}
          </TabsContent>

          <TabsContent value="threads" className="mt-3">
            <TextBlock text={content.threads} onCopy={copyText} />
          </TabsContent>
          <TabsContent value="line" className="mt-3">
            <TextBlock text={content.line} onCopy={copyText} />
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}

function TextBlock({ text, onCopy }: { text: string; onCopy: (t: string) => void }) {
  if (!text) return <p className="text-sm text-muted">尚未生成。</p>;
  return (
    <div className="relative rounded-2xl bg-surface-2/70 p-4">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={() => onCopy(text)} aria-label="複製">
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}
