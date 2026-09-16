import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Pencil,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBrandMemory } from "@/lib/studio/brand";
import { generateCampaignStrategy } from "@/lib/ai/campaign-ai";
import {
  campaignTitle,
  countdownLabel,
  daysUntil,
  defaultWavePlan,
  formatCampaignDate,
  waveDateLabel,
} from "@/lib/studio/campaign";
import { CONTENT_KIND_META, contentKindLabel } from "@/lib/studio/status";
import type { Campaign, CampaignWave } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { eventKindLabel } from "@/lib/zen/club";
import { useStudio } from "@/stores/studio-store";

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const navigate = useNavigate();
  const campaign = useStudio((s) => s.campaigns.find((c) => c.id === campaignId));
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const updateCampaign = useStudio((s) => s.updateCampaign);
  const deleteCampaign = useStudio((s) => s.deleteCampaign);
  const createProject = useStudio((s) => s.createProject);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  if (!campaign) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16">
        <EmptyState
          icon={CalendarDays}
          title="找不到這場活動"
          description="它可能已經被刪除了。"
          action={
            <Button asChild>
              <Link to="/campaigns">回活動列表</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const brand = brands[0];
  const made = campaign.waves.filter((w) => w.contentId).length;

  async function runStrategy() {
    setBusy(true);
    try {
      const res = await generateCampaignStrategy({
        data: {
          name: campaign!.name,
          kind: campaign!.kind,
          date: campaign!.date,
          time: campaign!.time,
          location: campaign!.location,
          oneLiner: campaign!.oneLiner,
          intro: campaign!.intro,
          theme: campaign!.theme,
          painPoint: campaign!.painPoint,
          cta: campaign!.cta,
          signupUrl: campaign!.signupUrl,
          audienceIds: campaign!.audienceIds,
          daysUntil: daysUntil(campaign!) ?? 14,
          availableAssets: [],
          brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
        },
      });
      if (!res.ok) {
        // 沒有 AI 時仍然給一份可以編輯的節奏，並誠實標成本機草稿。
        updateCampaign(campaign!.id, {
          waves: mergeWaves(campaign!.waves, defaultWavePlan(campaign!)),
          planSource: "mock",
        });
        toast.warning(`${res.error}已放上本機節奏草稿。`);
        return;
      }
      updateCampaign(campaign!.id, {
        axis: res.axis,
        directions: res.directions,
        waves: mergeWaves(campaign!.waves, res.waves),
        planSource: "live",
      });
      toast.success("已生成完整宣傳");
    } catch {
      toast.error("生成宣傳時出錯了，再試一次。");
    } finally {
      setBusy(false);
    }
  }

  function createContentForWave(wave: CampaignWave) {
    if (!brand || !campaign) return;
    const meta = CONTENT_KIND_META[wave.kind];
    const project = createProject({
      name: wave.title || `${campaign.name} · ${wave.stage}`,
      brandId: brand.id,
      formatId: meta.formatId,
      contentKind: wave.kind,
      campaignId: campaign.id,
      status: "making",
      brief: {
        product: campaign.name,
        eventName: campaign.name,
        schedule: `${campaign.date} ${campaign.time}`.trim(),
        location: campaign.location,
        offer: campaign.oneLiner,
        audience: campaign.audienceIds.join("、"),
        goal: "awareness",
        features: campaign.intro,
        style: "安靜、具體、不說教",
        notes: wave.note,
        deliverables: {
          post: wave.kind === "ig-post",
          story: wave.kind === "story" || wave.kind === "countdown",
          carousel: wave.kind === "carousel",
          reels: wave.kind === "reels",
        },
      },
      sources: [{ kind: "local", label: `活動 / ${campaign.name}`, detail: `${wave.stage}·${wave.title}` }],
    });
    updateCampaign(campaign.id, {
      waves: campaign.waves.map((w) => (w.id === wave.id ? { ...w, contentId: project.id } : w)),
    });
    void navigate({
      to: "/create",
      search: { contentId: project.id, kind: wave.kind, campaignId: campaign.id, seed: wave.hook },
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker={`${eventKindLabel(campaign.kind)} · ${countdownLabel(campaign)}`}
        title={campaignTitle(campaign)}
        description={campaign.oneLiner || campaign.theme}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={runStrategy} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              AI 生成完整宣傳
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              活動資訊
            </Button>
            <Button variant="ghost" size="icon" aria-label="刪除活動" onClick={() => setPendingDelete(true)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        }
      />

      <dl className="mt-6 grid gap-2 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)] sm:grid-cols-2">
        <Row label="日期" value={`${formatCampaignDate(campaign)} ${campaign.time}`.trim()} />
        <Row label="地點" value={campaign.location || "未定"} />
        <Row label="主要行動" value={campaign.cta} />
        <Row label="報名" value={campaign.signupUrl || "直接到現場"} />
        <Row label="學生痛點" value={campaign.painPoint || "還沒填"} />
        <Row label="想打到誰" value={campaign.audienceIds.length ? `${campaign.audienceIds.length} 個族群` : "還沒選"} />
      </dl>

      {campaign.axis ? (
        <section className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">宣傳主軸</p>
            <Badge variant={campaign.planSource === "live" ? "accent" : "default"}>
              {campaign.planSource === "live" ? "AI 生成" : "本機草稿"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">{campaign.axis}</p>
        </section>
      ) : null}

      {campaign.directions.length ? (
        <section className="mt-6">
          <SectionHeader title="創意方向" hint="選一個往下做，其他留著換角度" />
          <ul className="grid gap-3 sm:grid-cols-3">
            {campaign.directions.map((dir) => (
              <li key={dir.id} className="flex flex-col gap-2 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="font-display text-lg">{dir.title}</p>
                <p className="text-xs text-muted">{dir.concept}</p>
                {dir.visual ? <p className="text-xs text-subtle">視覺：{dir.visual}</p> : null}
                {dir.sampleHook ? (
                  <p className="mt-auto rounded-xl bg-surface-2/60 p-2 text-xs">「{dir.sampleHook}」</p>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    void navigate({
                      to: "/create",
                      search: { campaignId: campaign.id, seed: dir.sampleHook || dir.concept },
                    })
                  }
                >
                  用這個方向創作
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeader
          title="宣傳節奏"
          hint={`${made}/${campaign.waves.length} 篇已建立，刻意穿插生活與互動內容`}
          action={
            campaign.waves.length ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/calendar">在日曆上看</Link>
              </Button>
            ) : null
          }
        />
        {campaign.waves.length === 0 ? (
          <EmptyState
            icon={Wand2}
            title="還沒有宣傳節奏"
            description="按「AI 生成完整宣傳」，會依活動類型與剩下的天數排出每一篇要講什麼。"
            action={
              <Button onClick={runStrategy} disabled={busy}>
                AI 生成完整宣傳
              </Button>
            }
          />
        ) : (
          <ol className="space-y-2">
            {campaign.waves.map((wave) => {
              const content = projects.find((p) => p.id === wave.contentId);
              return (
                <li
                  key={wave.id}
                  className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium">
                          {waveDateLabel(campaign, wave)}
                        </span>
                        <span className="text-[var(--color-accent)]">{wave.stage}</span>
                        <span className="text-muted">{contentKindLabel(wave.kind)}</span>
                      </p>
                      <p className="mt-1.5 text-sm font-medium">{wave.title}</p>
                      {wave.hook ? (
                        <p className="mt-1 font-display text-base leading-snug">「{wave.hook}」</p>
                      ) : null}
                      {wave.note ? <p className="mt-1 text-xs text-muted">{wave.note}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {content ? (
                        <>
                          <StatusBadge status={content.status} />
                          <Button asChild size="sm" variant="secondary">
                            <Link to="/studio/$projectId" params={{ projectId: content.id }}>
                              打開
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => createContentForWave(wave)}>
                          <Sparkles className="size-4" />
                          建立這篇
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[86dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>活動資訊</DialogTitle>
          </DialogHeader>
          <CampaignForm
            value={campaign}
            onChange={(patch) => updateCampaign(campaign.id, patch)}
            onDone={() => setEditing(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這場活動？</AlertDialogTitle>
            <AlertDialogDescription>
              已經做好的內容會保留，只是不再連到這場活動。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteCampaign(campaign.id);
                void navigate({ to: "/campaigns" });
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

/** 重新生成節奏時，保留已經建立內容的那幾波。 */
function mergeWaves(current: CampaignWave[], next: CampaignWave[]): CampaignWave[] {
  const kept = current.filter((w) => w.contentId);
  const merged = [...kept];
  for (const wave of next) {
    const clash = kept.some((k) => k.offsetDays === wave.offsetDays && k.kind === wave.kind);
    if (!clash) merged.push(wave);
  }
  return merged.sort((a, b) => a.offsetDays - b.offsetDays);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("flex gap-2")}>
      <dt className="w-16 shrink-0 text-subtle">{label}</dt>
      <dd className="min-w-0 text-muted">{value}</dd>
    </div>
  );
}
