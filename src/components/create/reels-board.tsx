import { encodeReelsFromPng } from "@/lib/ai/reels-encode";
import { saveReelsFilm } from "@/lib/ai/reels-persist";
import { generateStudioImage, toImageFormat } from "@/lib/ai/image-studio";
import { getAssetBlob, putAssetBlob } from "@/lib/studio/assets-idb";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { bytesToBase64 } from "@/lib/studio/bytes";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import type { ReelsScript } from "@/lib/studio/types";
import { HeroVisual } from "@/components/create/hero-visual";
import { AssetMedia } from "@/components/shared/asset-media";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";
import { toast } from "sonner";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function ReelsBoard({
  script,
  eventName,
  campaignId,
  posterAssetId,
  onSchedule,
}: {
  script: ReelsScript;
  eventName?: string;
  campaignId?: string | null;
  posterAssetId?: string;
  onSchedule?: () => void;
}) {
  const addAsset = useStudio((s) => s.addAsset);
  const storedVideoId = useStudio((s) => {
    if (campaignId) return s.campaigns.find((row) => row.id === campaignId)?.videoAssetId;
    return s.schedule.find((item) => item.kind === "reels")?.videoAssetId;
  });
  const [busy, setBusy] = useState(false);
  const [lastCover, setLastCover] = useState<{ base64: string; mime: string } | null>(null);
  const [localVideoId, setLocalVideoId] = useState<string | null>(null);
  const videoId = localVideoId ?? storedVideoId ?? null;
  const urls = useAssetUrls(videoId ? [videoId] : []);

  async function makeCover() {
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
      return null;
    }
    const spec = formatById("reels-cover");
    const png = await persistGeneratedImage({
      base64: result.imageBase64,
      mime: result.mime,
      width: spec.width,
      height: spec.height,
    });
    const id = uid("asset");
    await putAssetBlob(id, png.blob);
    addAsset({
      id,
      name: `Reels 封面 · ${eventName || "禪光"}`,
      kind: "image",
      category: "reels",
      mime: png.mime,
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
    setLastCover({ base64: png.base64, mime: png.mime });
    toast.success("Reels 封面已進素材庫（AI Generated）");
    return png.base64;
  }

  async function posterPng() {
    if (lastCover?.base64) return lastCover.base64;
    if (posterAssetId) {
      const blob = await getAssetBlob(posterAssetId);
      if (blob && !blob.type.startsWith("video/")) {
        return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
      }
    }
    return makeCover();
  }

  async function film() {
    setBusy(true);
    try {
      const poster = await posterPng();
      if (!poster) return;
      const encoded = await encodeReelsFromPng(poster, script, script.hook);
      if (!encoded) {
        toast.error("這台瀏覽器還不能編成 Reels 影片。");
        return;
      }
      const id = await saveReelsFilm(encoded, { eventName, campaignId });
      setLocalVideoId(id);
      toast.success("短影音已編成，可在 IG Preview 看 9:16 影片。來源：AI Generated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8" data-testid="reels-board">
      <h2 className="text-sm font-medium">Reels 0–20 秒</h2>
      <p className="mt-1 text-sm text-muted">Hook：{script.hook}</p>
      <p className="mt-1 text-xs text-muted">編成短影音後，先在 IG Preview 看 9:16，再排入 Calendar。到期發布會走官方 Reels。</p>
      {urls[videoId ?? ""] ? (
        <div className="mx-auto mt-4 w-full max-w-[14rem] overflow-hidden rounded-[1.6rem] bg-surface shadow-[var(--shadow-artboard)]">
          <AssetMedia
            src={urls[videoId!]}
            video
            controls
            className="aspect-[9/16] w-full"
            testId="reels-film"
          />
        </div>
      ) : lastCover ? (
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
        <Button size="sm" disabled={busy} data-testid="reels-encode" onClick={() => void film()}>
          {busy ? "編成中…" : videoId ? "重新編成短影音" : "編成短影音"}
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void makeCover()}>
          生成 Reels 封面
        </Button>
        {videoId ? (
          <Button size="sm" variant="secondary" asChild>
            <Link to="/ig">看 IG Preview</Link>
          </Button>
        ) : null}
        {onSchedule ? (
          <Button size="sm" variant="secondary" onClick={onSchedule}>
            排入 Calendar
          </Button>
        ) : null}
      </div>
    </section>
  );
}
