import { saveStoryStills } from "@/lib/ai/story-persist";
import { storyFrameLines } from "@/lib/ai/story-frames";
import type { CampaignPlan } from "@/lib/studio/types";
import { AssetMedia } from "@/components/shared/asset-media";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

export function StoryBoard({
  plan,
  eventName,
  campaignId,
  onSchedule,
}: {
  plan: CampaignPlan;
  eventName?: string;
  campaignId?: string | null;
  onSchedule?: () => void;
}) {
  const frames = useMemo(() => storyFrameLines(plan), [plan]);
  const schedule = useStudio((s) => s.schedule);
  const storedIds = useMemo(
    () =>
      campaignId
        ? schedule
            .filter((item) => item.campaignId === campaignId && item.kind === "story")
            .sort((a, b) => a.scheduledAt - b.scheduledAt)
            .map((item) => item.imageAssetId)
            .filter((id): id is string => Boolean(id))
        : [],
    [schedule, campaignId],
  );
  const [busy, setBusy] = useState(false);
  const [localIds, setLocalIds] = useState<string[]>([]);
  const ids = localIds.length ? localIds : storedIds;
  const urls = useAssetUrls(ids);

  async function film() {
    setBusy(true);
    try {
      const next = await saveStoryStills(plan, { eventName, campaignId });
      setLocalIds(next);
      toast.success("限動 3–5 張已編成 9:16。來源：AI Generated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8" data-testid="story-board">
      <h2 className="text-sm font-medium">Story 3–5 則</h2>
      <p className="mt-1 text-xs text-muted">第一則只放學生 Hook，後面才給活動名與時間地點。編成後 IG 限動圈會是 9:16。</p>
      <ol className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {frames.map((frame, index) => {
          const src = ids[index] ? urls[ids[index]!] : undefined;
          return (
            <li
              key={`${index}-${frame}`}
              className="w-28 shrink-0 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]"
            >
              {src ? (
                <AssetMedia src={src} className="aspect-[9/16] w-full" testId={index === 0 ? "story-frame-0" : undefined} />
              ) : (
                <div className="flex aspect-[9/16] items-end bg-surface-2 p-3">
                  <p className="text-xs">{frame}</p>
                </div>
              )}
              <p className="px-2 py-2 text-xs text-muted">{index + 1}. {frame}</p>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} data-testid="story-encode" onClick={() => void film()}>
          {busy ? "編成中…" : ids.length ? "重新編成限動" : "編成限動"}
        </Button>
        {ids.length ? (
          <Button size="sm" variant="secondary" asChild>
            <Link to="/ig">看 IG 限動圈</Link>
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
