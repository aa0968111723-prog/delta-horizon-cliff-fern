import { encodeReelsFromPng } from "@/lib/ai/reels-encode";
import { saveReelsAtmosphere, saveReelsFilm } from "@/lib/ai/reels-persist";
import { AssetMedia } from "@/components/shared/asset-media";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { ReelsScript } from "@/lib/studio/types";

export function ReelsBoard({
  script,
  eventName,
  campaignId,
  onSchedule,
}: {
  script: ReelsScript;
  eventName?: string;
  campaignId?: string | null;
  onSchedule?: () => void;
}) {
  const schedule = useStudio((s) => s.schedule);
  const campaigns = useStudio((s) => s.campaigns);
  const stored = useMemo(() => {
    const row = campaignId
      ? schedule.find((item) => item.campaignId === campaignId && item.kind === "reels")
      : schedule.find((item) => item.kind === "reels");
    const videoId = campaignId
      ? (campaigns.find((row) => row.id === campaignId)?.videoAssetId ?? row?.videoAssetId)
      : row?.videoAssetId;
    return { videoId: videoId ?? undefined, coverId: row?.imageAssetId };
  }, [schedule, campaigns, campaignId]);
  const [busy, setBusy] = useState(false);
  const [localVideoId, setLocalVideoId] = useState<string | null>(null);
  const [localCoverId, setLocalCoverId] = useState<string | null>(null);
  const videoId = localVideoId ?? stored.videoId ?? null;
  const coverId = localCoverId ?? stored.coverId ?? null;
  const urls = useAssetUrls([videoId, coverId].filter((id): id is string => Boolean(id)));

  async function film() {
    setBusy(true);
    try {
      const cover = await saveReelsAtmosphere(
        { colorMood: "靜水、琥珀點", campaignName: eventName || "禪光" },
        { eventName, campaignId },
      );
      setLocalCoverId(cover.id);
      if (cover.mime !== "image/png") {
        toast.error("這台瀏覽器還不能編成 Reels 影片。氣氛封面已進素材庫。");
        return;
      }
      const encoded = await encodeReelsFromPng(cover.base64, script, script.hook);
      if (!encoded) {
        toast.error("這台瀏覽器還不能編成 Reels 影片。氣氛封面已進素材庫。");
        return;
      }
      const id = await saveReelsFilm(encoded, { eventName, campaignId });
      setLocalVideoId(id);
      toast.success("短影音已編成。畫面是氣氛，Hook 只在字幕。來源：AI Generated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8" data-testid="reels-board">
      <h2 className="text-sm font-medium">Reels 0–20 秒</h2>
      <p className="mt-1 text-sm text-muted">Hook：{script.hook}</p>
      <p className="mt-1 text-xs text-muted">
        片頭是氣氛畫面，不燒主標。字幕才是學生 Hook。編成後先在 IG Preview 看 9:16，到期發布走官方 Reels。
      </p>
      {videoId && urls[videoId] ? (
        <div className="mx-auto mt-4 w-full max-w-[14rem] overflow-hidden rounded-[1.6rem] bg-surface shadow-[var(--shadow-artboard)]">
          <AssetMedia src={urls[videoId]} video controls className="aspect-[9/16] w-full" testId="reels-film" />
        </div>
      ) : coverId && urls[coverId] ? (
        <div className="mx-auto mt-4 w-full max-w-[14rem] overflow-hidden rounded-[1.6rem] bg-surface shadow-[var(--shadow-artboard)]">
          <AssetMedia src={urls[coverId]} className="aspect-[9/16] w-full" testId="reels-cover" />
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
        {videoId || coverId ? (
          <Button size="sm" variant="secondary" asChild>
            <Link to="/ig" search={campaignId ? { campaign: campaignId } : {}}>
              看 IG Preview
            </Link>
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
