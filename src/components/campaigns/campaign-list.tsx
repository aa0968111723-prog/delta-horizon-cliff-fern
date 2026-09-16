import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Sparkles, Tent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CampaignFormDialog } from "@/components/campaigns/campaign-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { campaignDaysLeft, pastCampaigns, upcomingCampaigns } from "@/lib/studio/campaigns";
import type { Campaign } from "@/lib/studio/types";
import { formatDateLabel } from "@/lib/zen/context";
import { campaignTypeLabel, painPointLabel } from "@/lib/zen/labels";
import { useStudio } from "@/stores/studio-store";

export function CampaignList({ openNew }: { openNew?: boolean }) {
  const navigate = useNavigate();
  const campaigns = useStudio((s) => s.campaigns);
  const contents = useStudio((s) => s.contents);
  const [open, setOpen] = useState(Boolean(openNew));
  useEffect(() => {
    if (openNew) setOpen(true);
  }, [openNew]);

  const upcoming = useMemo(() => upcomingCampaigns(campaigns), [campaigns]);
  const past = useMemo(() => pastCampaigns(campaigns), [campaigns]);
  const urls = useAssetUrls(campaigns.map((c) => c.coverAssetId ?? "").filter(Boolean));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Campaign"
        title="活動"
        description="每個活動建立後，AI 可以一鍵生成完整宣傳：預熱、情緒共鳴、主視覺、活動介紹、參加理由、倒數、當日 Story、回顧。"
        actions={
          <Button onClick={() => setOpen(true)} className="rounded-full">
            <Plus className="size-4" />
            建立活動
          </Button>
        }
      />

      <section className="mt-8">
        <SectionHeader title="即將到來" hint="依日期排序" />
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Tent}
            title="還沒有活動"
            description="建立第一個活動，AI 會依活動類型排出整段宣傳節奏。"
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                建立活動
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((c) => (
              <li key={c.id}>
                <CampaignCard campaign={c} urls={urls} contentCount={contents.filter((x) => x.campaignId === c.id).length} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length ? (
        <section className="mt-10">
          <SectionHeader title="過去活動" hint="可以「延伸成新活動」" />
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {past.map((c) => (
              <li key={c.id}>
                <CampaignCard campaign={c} urls={urls} contentCount={contents.filter((x) => x.campaignId === c.id).length} past />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CampaignFormDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={(c) => void navigate({ to: "/campaigns/$campaignId", params: { campaignId: c.id } })}
      />
    </main>
  );
}

function CampaignCard({
  campaign,
  urls,
  contentCount,
  past,
}: {
  campaign: Campaign;
  urls: Record<string, string>;
  contentCount: number;
  past?: boolean;
}) {
  const d = campaignDaysLeft(campaign);
  const cover = campaign.coverAssetId ? urls[campaign.coverAssetId] : undefined;
  const waves = campaign.strategy?.waves ?? [];
  const built = waves.filter((w) => w.contentId).length;
  return (
    <Link
      to="/campaigns/$campaignId"
      params={{ campaignId: campaign.id }}
      className="group block overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-float)]"
    >
      <div className="relative h-36 bg-glow-card">
        {cover ? <img src={cover} alt="" className="size-full object-cover" /> : null}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between text-xs">
          <span className="rounded-full bg-night/75 px-2.5 py-1 text-night-fg">{campaignTypeLabel(campaign.type)}</span>
          {d != null && !past ? (
            <span className="rounded-full bg-surface/90 px-2.5 py-1 font-medium text-fg tabular-nums">
              {d === 0 ? "今天" : `還有 ${d} 天`}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-4">
        <p className="font-display text-lg leading-tight">{campaign.name}</p>
        <p className="mt-1 text-xs text-muted">
          {formatDateLabel(campaign.date)} {campaign.time} · {campaign.location || "地點未定"}
        </p>
        {campaign.oneLiner ? <p className="mt-2 line-clamp-2 text-sm text-fg/80">{campaign.oneLiner}</p> : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {campaign.painPoints.slice(0, 3).map((p) => (
            <span key={p} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
              {painPointLabel(p)}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>
            {campaign.strategy ? `${built}/${waves.length} 波已建 · ${contentCount} 則內容` : `${contentCount} 則內容`}
          </span>
          {!campaign.strategy ? (
            <span className="inline-flex items-center gap-1 text-accent">
              <Sparkles className="size-3.5" />
              可生成宣傳
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
