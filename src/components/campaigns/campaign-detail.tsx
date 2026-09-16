import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  Pencil,
  RefreshCw,
  Shuffle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CampaignFormDialog } from "@/components/campaigns/campaign-form";
import { ContentCard } from "@/components/content/content-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/page-header";
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
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { generateZenStrategy } from "@/lib/ai/zen";
import { campaignDaysLeft, campaignToContext, waveDateIso } from "@/lib/studio/campaigns";
import type { CampaignWave, CreativeDirection } from "@/lib/studio/types";
import { formatDateLabel } from "@/lib/zen/context";
import { campaignTypeLabel, contentTypeLabel, painPointLabel, WAVE_ROLES } from "@/lib/zen/labels";
import { pickHooks } from "@/lib/zen/voice";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const campaign = useStudio((s) => s.campaigns.find((c) => c.id === campaignId));
  const brand = useStudio((s) => s.brands[0]);
  const contents = useStudio((s) => s.contents.filter((c) => c.campaignId === campaignId));
  const updateCampaign = useStudio((s) => s.updateCampaign);
  const deleteCampaign = useStudio((s) => s.deleteCampaign);
  const createContent = useStudio((s) => s.createContent);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const coverIds = useMemo(
    () => [campaign?.coverAssetId ?? "", ...contents.map((c) => c.coverAssetId ?? "")].filter(Boolean),
    [campaign, contents],
  );
  const urls = useAssetUrls(coverIds);

  if (!hydrated) return null;
  if (!campaign || !brand) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-16">
        <EmptyState
          icon={Sparkles}
          title="找不到這個活動"
          action={
            <Button asChild>
              <Link to="/campaigns">回活動列表</Link>
            </Button>
          }
        />
      </main>
    );
  }

  const days = campaignDaysLeft(campaign);
  const strategy = campaign.strategy;
  const cover = campaign.coverAssetId ? urls[campaign.coverAssetId] : undefined;

  async function generate() {
    if (!campaign || !brand) return;
    setBusy(true);
    try {
      const result = await generateZenStrategy({ data: { campaign: campaignToContext(campaign, brand) } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const prev = campaign.strategy;
      const merged = prev
        ? {
            ...result.strategy,
            waves: result.strategy.waves.map((w) => {
              const old = prev.waves.find((o) => o.role === w.role && o.offsetDays === w.offsetDays);
              return old?.contentId ? { ...w, contentId: old.contentId } : w;
            }),
          }
        : result.strategy;
      updateCampaign(campaign.id, { strategy: merged });
      toast.success(result.strategy.source === "live" ? "AI 已生成完整宣傳策略" : "已用本機規則排出宣傳草案");
    } finally {
      setBusy(false);
    }
  }

  function chooseDirection(id: string) {
    if (!campaign?.strategy) return;
    updateCampaign(campaign.id, { strategy: { ...campaign.strategy, chosenDirectionId: id } });
  }

  function shuffleHook(wave: CampaignWave) {
    if (!campaign?.strategy) return;
    const pool = pickHooks({ painPoints: campaign.painPoints, type: campaign.type, seed: Math.floor(Math.random() * 20) });
    const next = pool.find((h) => h !== wave.hook) ?? pool[0];
    updateCampaign(campaign.id, {
      strategy: {
        ...campaign.strategy,
        waves: campaign.strategy.waves.map((w) => (w.id === wave.id ? { ...w, hook: next } : w)),
      },
    });
  }

  function scheduleAll() {
    if (!campaign?.strategy) return;
    let created = 0;
    const waves = campaign.strategy.waves.map((w) => {
      if (w.contentId) return w;
      const date = waveDateIso(campaign, w);
      const at = new Date(`${date}T20:00:00`).getTime();
      const content = createContent({
        campaignId: campaign.id,
        type: w.contentType,
        status: "idea",
        title: `${campaign.name} · ${w.title}`,
        copy: { hook: w.hook, body: "", cta: campaign.cta, hashtags: [], tone: "normal" },
        visualDirection: w.angle,
        scheduledAt: at,
        sources: [{ kind: "ai", label: `AI 宣傳策略 / ${WAVE_ROLES[w.role].label}` }],
      });
      created += 1;
      return { ...w, contentId: content.id };
    });
    updateCampaign(campaign.id, { strategy: { ...campaign.strategy, waves } });
    toast.success(`已把 ${created} 波排進 Calendar，狀態是「想法」，之後逐篇 AI 生成。`);
  }

  function openWave(wave: CampaignWave) {
    const mode =
      wave.contentType === "story" ? "story" : wave.contentType === "carousel" ? "carousel" : wave.contentType === "reels" ? "reels" : "post";
    if (wave.contentId) {
      void navigate({ to: "/create", search: { contentId: wave.contentId, campaignId: campaign?.id, waveId: wave.id, mode } });
    } else {
      void navigate({ to: "/create", search: { campaignId: campaign?.id, waveId: wave.id, mode } });
    }
  }

  const sortedWaves = strategy ? [...strategy.waves].sort((a, b) => a.offsetDays - b.offsetDays) : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/campaigns">
            <ArrowLeft className="size-4" />
            活動
          </Link>
        </Button>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            編輯
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} aria-label="刪除活動">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <section className="mt-4 overflow-hidden rounded-[28px] bg-surface shadow-[var(--shadow-float)]">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-52 bg-glow-card md:min-h-full">
            {cover ? <img src={cover} alt="" className="absolute inset-0 size-full object-cover" /> : null}
          </div>
          <div className="p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-surface-2 px-2.5 py-1">{campaignTypeLabel(campaign.type)}</span>
              {days != null ? (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 font-medium text-accent tabular-nums">
                  {days === 0 ? "就是今天" : days > 0 ? `還有 ${days} 天` : `${-days} 天前`}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 font-display text-3xl tracking-tight">{campaign.name}</h1>
            <p className="mt-2 text-sm text-muted">
              {formatDateLabel(campaign.date)} {campaign.time} · {campaign.location || "地點未定"}
            </p>
            {campaign.oneLiner ? <p className="mt-3 text-base">{campaign.oneLiner}</p> : null}
            {campaign.description ? <p className="mt-2 text-sm text-muted">{campaign.description}</p> : null}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {campaign.painPoints.map((p) => (
                <span key={p} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
                  接住：{painPointLabel(p)}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button className="rounded-full" onClick={() => void generate()} disabled={busy}>
                {busy ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {busy ? "AI 正在排宣傳…" : strategy ? "重新生成完整宣傳" : "AI 生成完整宣傳"}
              </Button>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => void navigate({ to: "/create", search: { campaignId: campaign.id, mode: "post" } })}
              >
                直接寫一篇
              </Button>
            </div>
          </div>
        </div>
      </section>

      {strategy ? (
        <>
          {/* 宣傳主軸 */}
          <section className="mt-8 rounded-[24px] bg-night p-5 text-night-fg md:p-7">
            <p className="text-xs tracking-[0.18em] text-night-fg/60 uppercase">宣傳主軸</p>
            <p className="mt-2 font-display text-xl leading-snug md:text-2xl">{strategy.axis}</p>
            <p className="mt-3 text-sm text-night-fg/75">{strategy.rhythmNote}</p>
            <p className="mt-3 text-xs text-night-fg/50">
              {strategy.source === "live" ? "由 AI 依 Brand Memory 與淡江學生情境生成" : "本機規則草案（AI 連線後可重新生成）"}
            </p>
          </section>

          {/* 三個創意方向 */}
          <section className="mt-8">
            <SectionHeader title="3 個創意方向" hint="選一個，之後所有內容的視覺會跟著走" />
            <ul className="grid gap-3 md:grid-cols-3">
              {strategy.directions.map((d) => (
                <li key={d.id}>
                  <DirectionCard direction={d} chosen={strategy.chosenDirectionId === d.id} onChoose={() => chooseDirection(d.id)} />
                </li>
              ))}
            </ul>
          </section>

          {/* 發布節奏 */}
          <section className="mt-8">
            <SectionHeader
              title="發布節奏"
              hint="每一波可以單獨生成、換 Hook、換角度"
              action={
                <Button variant="secondary" size="sm" onClick={scheduleAll} disabled={sortedWaves.every((w) => w.contentId)}>
                  <CalendarPlus className="size-4" />
                  全部排入 Calendar
                </Button>
              }
            />
            <ol className="relative space-y-2 border-l border-border pl-5">
              {sortedWaves.map((w) => {
                const date = waveDateIso(campaign, w);
                const linked = w.contentId ? contents.find((c) => c.id === w.contentId) : undefined;
                return (
                  <li key={w.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[1.55rem] top-4 size-3 rounded-full ring-4 ring-bg",
                        linked ? "bg-accent" : "bg-border-strong",
                      )}
                    />
                    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-medium text-fg tabular-nums">{formatDateLabel(date)}</span>
                        <span>{w.offsetDays === 0 ? "當天" : w.offsetDays > 0 ? `活動後 ${w.offsetDays} 天` : `提前 ${-w.offsetDays} 天`}</span>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5">{WAVE_ROLES[w.role].label}</span>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5">{contentTypeLabel(w.contentType)}</span>
                        {linked ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">已建內容</span> : null}
                      </div>
                      <p className="mt-2 text-sm font-medium">{w.title}</p>
                      <p className="mt-1 text-base leading-snug">「{w.hook}」</p>
                      <p className="mt-1 text-xs text-muted">{w.angle}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" className="rounded-full" onClick={() => openWave(w)}>
                          <Sparkles className="size-3.5" />
                          {linked ? "打開內容" : "AI 生成這一波"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => shuffleHook(w)}>
                          <Shuffle className="size-3.5" />
                          換 Hook
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      ) : (
        <section className="mt-8 rounded-[24px] bg-glow-card p-6 text-center">
          <p className="font-display text-xl">按一下「AI 生成完整宣傳」</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            AI 會產生：宣傳主軸、3 個創意方向、發布節奏、每一波的主題與 Hook。之後每一波都能單獨生成 Caption、圖片 Prompt、Carousel、Story、Threads、Reels Script。
          </p>
        </section>
      )}

      {/* 內容 */}
      <section className="mt-10">
        <SectionHeader title="這個活動的內容" hint={`${contents.length} 則`} />
        {contents.length === 0 ? (
          <p className="rounded-2xl bg-surface/70 px-4 py-6 text-center text-sm text-muted shadow-[var(--shadow-border)]">
            還沒有內容。生成策略後把每一波排進 Calendar，或直接寫一篇。
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {[...contents]
              .sort((a, b) => (a.scheduledAt ?? a.createdAt) - (b.scheduledAt ?? b.createdAt))
              .map((c) => (
                <li key={c.id}>
                  <ContentCard content={c} urls={urls} />
                </li>
              ))}
          </ul>
        )}
      </section>

      <CampaignFormDialog open={editing} onOpenChange={setEditing} campaign={campaign} />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這個活動？</AlertDialogTitle>
            <AlertDialogDescription>內容會保留，只是不再屬於這個活動。</AlertDialogDescription>
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

export function DirectionCard({
  direction,
  chosen,
  onChoose,
  compact,
}: {
  direction: CreativeDirection;
  chosen?: boolean;
  onChoose?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[22px] bg-surface p-4 shadow-[var(--shadow-border)] ring-2 ring-transparent transition-shadow",
        chosen && "ring-accent shadow-[var(--shadow-glow)]",
      )}
    >
      <div className="flex h-10 overflow-hidden rounded-xl">
        {direction.palette.slice(0, 4).map((hex, i) => (
          <span key={`${hex}-${i}`} className="flex-1" style={{ backgroundColor: hex }} />
        ))}
      </div>
      <p className="mt-3 font-medium">{direction.title}</p>
      <p className="mt-1 text-sm text-muted">{direction.concept}</p>
      {!compact ? (
        <dl className="mt-3 space-y-1.5 text-xs text-muted">
          <div>
            <dt className="inline font-medium text-fg">構圖：</dt>
            <dd className="inline">{direction.composition}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-fg">字體：</dt>
            <dd className="inline">{direction.typography}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-fg">氣氛：</dt>
            <dd className="inline">{direction.mood}</dd>
          </div>
        </dl>
      ) : null}
      <div className="mt-3 rounded-xl bg-surface-2 p-3">
        <p className="font-display text-lg leading-tight">{direction.headline}</p>
        <p className="mt-1 text-xs text-muted">{direction.subhead}</p>
      </div>
      {onChoose ? (
        <Button variant={chosen ? "default" : "secondary"} size="sm" className="mt-3 rounded-full" onClick={onChoose}>
          {chosen ? <Check className="size-3.5" /> : null}
          {chosen ? "已選這個方向" : "選這個方向"}
        </Button>
      ) : null}
    </div>
  );
}
