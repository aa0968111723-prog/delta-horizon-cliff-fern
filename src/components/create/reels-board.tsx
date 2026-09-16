import { generateStudioImage, toImageFormat } from "@/lib/ai/image-studio";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { blobFromBase64 } from "@/lib/studio/bytes";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import type { ReelsScript } from "@/lib/studio/types";
import { HeroVisual } from "@/components/create/hero-visual";
import { Button } from "@/components/ui/button";
import { useStudio } from "@/stores/studio-store";
import { toast } from "sonner";
import { useState } from "react";

export function ReelsBoard({
  script,
  eventName,
  onSchedule,
}: {
  script: ReelsScript;
  eventName?: string;
  onSchedule?: () => void;
}) {
  const addAsset = useStudio((s) => s.addAsset);
  const [busy, setBusy] = useState(false);
  const [lastCover, setLastCover] = useState<{ base64: string; mime: string } | null>(null);

  async function cover() {
    setBusy(true);
    try {
      const result = await generateStudioImage({
        data: {
          prompt: `Reels cover, 9:16, quiet Tamsui night, three soft colored lights, almost no text, Tamkang student life, ${eventName || script.hook}, not temple`,
          format: toImageFormat("reels-cover"),
          headline: script.hook,
          subhead: eventName,
          name: "Reels 封面",
          palette: "靜水、琥珀點",
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const spec = formatById("reels-cover");
      const blob = blobFromBase64(result.imageBase64, result.mime);
      const id = uid("asset");
      await putAssetBlob(id, blob);
      addAsset({
        id,
        name: `Reels 封面 · ${eventName || "禪光"}`,
        kind: "image",
        category: "reels",
        mime: result.mime,
        width: spec.width,
        height: spec.height,
        tags: ["AI 生成", "Reels", eventName || "封面"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "generated",
        licenseNotes: "來源：AI Generated",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: Date.now(),
        useCount: 0,
      });
      toast.success("Reels 封面已進素材庫（AI Generated）");
      setLastCover({ base64: result.imageBase64, mime: result.mime });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">Reels 0–20 秒</h2>
      <p className="mt-1 text-sm text-muted">Hook：{script.hook}</p>
      {lastCover ? (
        <div className="mt-3 max-w-48">
          <HeroVisual base64={lastCover.base64} mime={lastCover.mime} headline={script.hook} />
        </div>
      ) : null}
      <ol className="mt-3 space-y-2">
        {script.beats.map((beat) => (
          <li key={`${beat.start}-${beat.end}`} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs tracking-[0.14em] text-muted uppercase">
              {beat.start}–{beat.end} 秒
            </p>
            <p className="mt-1 text-sm">畫面 {beat.onScreen}</p>
            <p className="text-sm text-muted">字幕 {beat.caption}</p>
            <p className="text-sm text-muted">旁白 {beat.voice}</p>
            <p className="mt-1 text-xs text-subtle">
              轉場 {beat.transition} · 素材 {beat.assetHint}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void cover()}>
          生成 Reels 封面
        </Button>
        {onSchedule ? (
          <Button size="sm" variant="secondary" onClick={onSchedule}>
            排入 Calendar
          </Button>
        ) : null}
      </div>
    </section>
  );
}
