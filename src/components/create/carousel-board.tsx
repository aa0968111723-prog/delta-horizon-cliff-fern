import { saveCarouselStills } from "@/lib/ai/carousel-persist";
import { carouselPagesFromPlan, encodedCarouselIds } from "@/lib/ai/carousel-pages";
import type { CampaignPlan } from "@/lib/studio/types";
import { AssetMedia } from "@/components/shared/asset-media";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

export function CarouselBoard({
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
  const pages = useMemo(() => carouselPagesFromPlan(plan), [plan]);
  const schedule = useStudio((s) => s.schedule);
  const storedIds = useMemo(() => {
    if (!campaignId) return [];
    const item = schedule.find((row) => itemMatches(row, campaignId));
    return encodedCarouselIds(item);
  }, [schedule, campaignId]);
  const [busy, setBusy] = useState(false);
  const [localIds, setLocalIds] = useState<string[]>([]);
  const ids = localIds.length >= 2 ? localIds : storedIds;
  const urls = useAssetUrls(ids);

  async function film() {
    setBusy(true);
    try {
      const next = await saveCarouselStills(plan, { eventName, campaignId });
      setLocalIds(next);
      toast.success("Carousel 5–6 頁已編成 4:5。來源：AI Generated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8" data-testid="carousel-board">
      <h2 className="text-sm font-medium">Carousel 5–6 頁</h2>
      <p className="mt-1 text-xs text-muted">第一頁只放學生 Hook，後面才給情境、痛點、活動與 CTA。編成後 IG Feed 會是多頁。</p>
      <ol className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {pages.map((page, index) => {
          const src = ids[index] ? urls[ids[index]!] : undefined;
          return (
            <li
              key={`${index}-${page.role}`}
              className="w-36 shrink-0 overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]"
            >
              {src ? (
                <AssetMedia src={src} className="aspect-[4/5] w-full" testId={index === 0 ? "carousel-page-0" : undefined} />
              ) : (
                <div className="flex aspect-[4/5] items-end bg-surface-2 p-3">
                  <p className="text-xs">{page.headline}</p>
                </div>
              )}
              <p className="px-2 py-2 text-xs text-muted">
                {index + 1}. {page.headline}
              </p>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} data-testid="carousel-encode" onClick={() => void film()}>
          {busy ? "編成中…" : ids.length ? "重新編成 Carousel" : "編成 Carousel"}
        </Button>
        {ids.length ? (
          <Button size="sm" variant="secondary" asChild>
            <Link to="/ig">看 IG Feed</Link>
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

function itemMatches(row: { campaignId: string | null; kind: string }, campaignId: string) {
  return row.campaignId === campaignId && row.kind === "carousel";
}
