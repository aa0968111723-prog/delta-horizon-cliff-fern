import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Tent } from "lucide-react";
import { useState } from "react";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { countdownLabel, emptyCampaign, formatCampaignDate, sortByUpcoming } from "@/lib/studio/campaign";
import type { Campaign } from "@/lib/studio/types";
import { eventKindLabel } from "@/lib/zen/club";
import { useStudio } from "@/stores/studio-store";

export function CampaignListPage({ openNew }: { openNew?: boolean }) {
  const navigate = useNavigate();
  const campaigns = useStudio((s) => s.campaigns);
  const createCampaign = useStudio((s) => s.createCampaign);
  const fillDefaultWaves = useStudio((s) => s.fillDefaultWaves);
  const [open, setOpen] = useState(Boolean(openNew));
  const [draft, setDraft] = useState<Campaign>(() => emptyCampaign());

  const list = sortByUpcoming(campaigns);

  function submit() {
    if (!draft.name.trim()) return;
    const created = createCampaign(draft);
    fillDefaultWaves(created.id);
    setOpen(false);
    setDraft(emptyCampaign());
    void navigate({ to: "/campaigns/$campaignId", params: { campaignId: created.id } });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="活動"
        title="社課與活動"
        description="建立活動之後，AI 可以一次排出整場宣傳的節奏，每一波都能單獨重新生成。"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            建立活動
          </Button>
        }
      />

      {list.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Tent}
            title="還沒有活動"
            description="社課、茶會、迎新、講座都算。建立後 AI 會依活動類型與剩下的天數安排宣傳節奏。"
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                建立活動
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {list.map((campaign) => {
            const made = campaign.waves.filter((w) => w.contentId).length;
            return (
              <li key={campaign.id}>
                <Link
                  to="/campaigns/$campaignId"
                  params={{ campaignId: campaign.id }}
                  className="flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
                      {formatCampaignDate(campaign)} {campaign.time}
                    </span>
                    <span className="text-muted">{countdownLabel(campaign)}</span>
                  </span>
                  <span className="font-display text-xl">{campaign.name || "未命名活動"}</span>
                  <span className="text-xs text-muted">
                    {eventKindLabel(campaign.kind)}
                    {campaign.location ? ` · ${campaign.location}` : ""}
                  </span>
                  <span className="line-clamp-2 text-sm text-muted">{campaign.oneLiner}</span>
                  <span className="mt-auto flex items-center gap-2 pt-2 text-xs text-subtle">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="three-lights block h-full rounded-full"
                        style={{
                          width: `${campaign.waves.length ? (made / campaign.waves.length) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    {made}/{campaign.waves.length} 篇
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>建立活動</DialogTitle>
          </DialogHeader>
          <CampaignForm
            value={draft}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            onDone={submit}
            doneLabel="建立並排宣傳節奏"
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
