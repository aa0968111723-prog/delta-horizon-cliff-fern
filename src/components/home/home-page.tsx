import { Link, useNavigate } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Clapperboard,
  Cloud,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Instagram,
  Lightbulb,
  MessageSquareText,
  Palette,
  Sparkles,
  Tent,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { ContentCard } from "@/components/content/content-card";
import { SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import {
  campaignDaysLeft,
  nextCampaign,
  nextWave,
  recentGenerated,
  scheduledContents,
  topPerforming,
  upcomingCampaigns,
} from "@/lib/studio/campaigns";
import type { Campaign, ContentType } from "@/lib/studio/types";
import { formatDateLabel, studentContext } from "@/lib/zen/context";
import type { CreateMode } from "@/lib/zen/create-modes";
import { inspirationForToday } from "@/lib/zen/inspiration";
import { ASSET_CATEGORY_LABELS, campaignTypeLabel, contentTypeLabel, WAVE_ROLES } from "@/lib/zen/labels";
import { pickHooks } from "@/lib/zen/voice";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

const QUICK: { mode: CreateMode | "campaign"; label: string; icon: LucideIcon; tone?: "night" }[] = [
  { mode: "post", label: "生成 IG 貼文", icon: MessageSquareText },
  { mode: "image", label: "生成圖片", icon: ImageIcon },
  { mode: "story", label: "生成 Story", icon: Sparkles },
  { mode: "carousel", label: "生成 Carousel", icon: GalleryHorizontalEnd },
  { mode: "reels", label: "生成 Reels", icon: Clapperboard },
  { mode: "campaign", label: "建立活動", icon: Tent, tone: "night" },
  { mode: "idea", label: "從一句想法開始", icon: Lightbulb },
  { mode: "photo", label: "從一張圖片開始", icon: Camera },
  { mode: "drive", label: "從 Google Drive 素材開始", icon: Cloud },
  { mode: "canva", label: "從 Canva 設計開始", icon: Palette },
  { mode: "ig", label: "從以前 IG 貼文開始", icon: Instagram },
];

function suggestedTypeFor(campaign: Campaign | null): ContentType {
  if (!campaign) return "ig-post";
  const wave = nextWave(campaign);
  if (wave) return wave.contentType;
  const days = campaignDaysLeft(campaign);
  if (days == null) return "ig-post";
  if (days <= 1) return "story";
  if (days <= 3) return "reels";
  if (days <= 7) return "carousel";
  return "ig-post";
}

export function HomePage() {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const campaigns = useStudio((s) => s.campaigns);
  const contents = useStudio((s) => s.contents);
  const assets = useStudio((s) => s.assets);
  const brand = useStudio((s) => s.brands[0]);
  const setCreateOpen = useUi((s) => s.setCreateOpen);

  const ctx = useMemo(() => studentContext(), []);
  const campaign = useMemo(() => nextCampaign(campaigns), [campaigns]);
  const daysLeft = campaign ? campaignDaysLeft(campaign) : null;
  const wave = campaign ? nextWave(campaign) : null;
  const suggestedType = suggestedTypeFor(campaign);
  const hooks = useMemo(
    () =>
      pickHooks({
        painPoints: campaign?.painPoints.length ? campaign.painPoints : ["belonging", "stress"],
        type: campaign?.type ?? "other",
        seed: new Date().getDate(),
      }),
    [campaign],
  );
  const suggestedHook = wave?.hook || hooks[0];
  const inspirations = useMemo(() => inspirationForToday().slice(0, 2), []);

  const upcoming = useMemo(() => upcomingCampaigns(campaigns).slice(0, 4), [campaigns]);
  const scheduled = useMemo(() => scheduledContents(contents).slice(0, 4), [contents]);
  const generated = useMemo(() => recentGenerated(contents, 4), [contents]);
  const top = useMemo(() => topPerforming(contents, 3), [contents]);
  const recentAssets = useMemo(() => [...assets].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8), [assets]);

  const assetIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of contents) if (c.coverAssetId) ids.add(c.coverAssetId);
    for (const c of campaigns) if (c.coverAssetId) ids.add(c.coverAssetId);
    for (const a of recentAssets) ids.add(a.id);
    return [...ids];
  }, [contents, campaigns, recentAssets]);
  const urls = useAssetUrls(assetIds);

  function startCreate(mode: CreateMode | "campaign") {
    if (mode === "campaign") {
      void navigate({ to: "/campaigns", search: { new: 1 } });
      return;
    }
    void navigate({ to: "/create", search: { mode } });
  }

  function createForCampaign() {
    if (!campaign) {
      setCreateOpen(true);
      return;
    }
    void navigate({
      to: "/create",
      search: {
        mode: suggestedType === "story" ? "story" : suggestedType === "carousel" ? "carousel" : suggestedType === "reels" ? "reels" : "post",
        campaignId: campaign.id,
        waveId: wave?.id,
      },
    });
  }

  return (
    <main className="bg-glow min-h-full">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 md:px-8 md:pt-10">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted uppercase">{brand?.name ?? "淡江大學禪學社"}</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">今天可以創作什麼？</h1>
            <p className="mt-2 text-sm text-muted">
              {ctx.monthDay} · {ctx.phaseLabel}。{ctx.studentMood.split("。")[0]}。
            </p>
          </div>
          <Button className="hidden rounded-full sm:inline-flex" onClick={() => setCreateOpen(true)}>
            <Sparkles className="size-4" />
            AI 創作
          </Button>
        </header>

        {/* 今天推薦創作 */}
        <section className="mt-6 overflow-hidden rounded-[28px] bg-night text-night-fg shadow-[var(--shadow-float)]">
          <div className="bg-night px-5 py-6 md:px-8 md:py-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-night-fg/70">
              <span className="rounded-full bg-night-fg/10 px-2.5 py-1">今天推薦創作</span>
              {campaign ? (
                <>
                  <span className="rounded-full bg-night-fg/10 px-2.5 py-1">
                    {formatDateLabel(campaign.date)} {campaign.name}
                  </span>
                  {daysLeft != null ? (
                    <span className="rounded-full bg-glow-amber/20 px-2.5 py-1 text-glow-amber">
                      {daysLeft === 0 ? "就是今天" : daysLeft > 0 ? `還有 ${daysLeft} 天` : `${-daysLeft} 天前`}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="rounded-full bg-night-fg/10 px-2.5 py-1">目前沒有排定的活動</span>
              )}
            </div>
            <p className="mt-5 text-xs tracking-[0.18em] text-night-fg/60 uppercase">AI 建議</p>
            <p className="mt-2 font-display text-2xl leading-snug md:text-[2rem]">「{suggestedHook}」</p>
            <p className="mt-3 text-sm text-night-fg/80">
              做一篇 <span className="font-medium text-night-fg">{contentTypeLabel(suggestedType)}</span>
              {wave ? `，這一波是「${WAVE_ROLES[wave.role].label}」：${wave.angle}` : campaign ? `，先讓學生覺得「這在講我」，再帶到 ${campaign.name}。` : "，不宣傳活動，只陪伴期中前的同學。"}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full bg-night-fg text-night hover:bg-night-fg/90" onClick={createForCampaign}>
                <Sparkles className="size-4" />
                AI 幫我創作
              </Button>
              {campaign ? (
                <Button asChild variant="ghost" className="rounded-full text-night-fg hover:bg-night-fg/10">
                  <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }}>
                    看活動宣傳策略
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" className="rounded-full text-night-fg hover:bg-night-fg/10">
                  <Link to="/campaigns" search={{ new: 1 }}>
                    建立活動
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
            <p className="mt-4 text-xs text-night-fg/50">
              點下去會一次產生：IG 文案 · 圖片 Prompt · 主視覺方向 · Carousel 結構 · Story · Threads · Reels Script
            </p>
          </div>
        </section>

        {/* 快速開始 */}
        <section className="mt-8">
          <SectionHeader title="快速開始" hint="每個入口都先讀 Brand Memory 與淡江學生情境" />
          <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {QUICK.map((q) => (
              <li key={q.mode} className="min-w-[10.5rem] sm:min-w-0">
                <button
                  type="button"
                  onClick={() => startCreate(q.mode)}
                  className={
                    q.tone === "night"
                      ? "flex h-full w-full items-center gap-3 rounded-2xl bg-night px-4 py-3.5 text-left text-night-fg shadow-[var(--shadow-glow)]"
                      : "flex h-full w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
                  }
                >
                  <span
                    className={
                      q.tone === "night"
                        ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-night-fg/15"
                        : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"
                    }
                  >
                    <q.icon className="size-4" />
                  </span>
                  <span className="text-sm font-medium leading-tight">{q.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* 今日靈感 */}
          <section>
            <SectionHeader
              title="今日靈感"
              hint={`${ctx.phaseLabel} · 淡江學生現在大概在想什麼`}
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/instagram" search={{ tab: "inspire" }}>
                    更多靈感
                  </Link>
                </Button>
              }
            />
            <ul className="space-y-2">
              {ctx.suggestedTopics.map((topic, i) => (
                <li key={topic}>
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: topic } })}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
                  >
                    <span>
                      <span className="block text-sm font-medium">{topic}</span>
                      <span className="mt-0.5 block text-xs text-muted">{hooks[(i + 1) % hooks.length]}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-subtle" />
                  </button>
                </li>
              ))}
              {inspirations.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: p.zenUse } })}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-glow-card px-4 py-3 text-left shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
                  >
                    <span>
                      <span className="block text-sm font-medium">{p.zenUse}</span>
                      <span className="mt-0.5 block text-xs text-muted">抽象手法 · {p.abstract.form}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-subtle" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 近期活動 */}
          <section>
            <SectionHeader
              title="近期活動"
              hint="每個活動都可以一鍵生成完整宣傳"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/campaigns">全部活動</Link>
                </Button>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyRow icon={Tent} text="還沒有活動。建立第一個，AI 會幫你排好整段宣傳。" action={<Link to="/campaigns" search={{ new: 1 }}>建立活動</Link>} />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((c) => {
                  const d = campaignDaysLeft(c);
                  const cover = c.coverAssetId ? urls[c.coverAssetId] : undefined;
                  return (
                    <li key={c.id}>
                      <Link
                        to="/campaigns/$campaignId"
                        params={{ campaignId: c.id }}
                        className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
                      >
                        <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-glow-card">
                          {cover ? <img src={cover} alt="" className="size-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            {formatDateLabel(c.date)} {c.time} · {campaignTypeLabel(c.type)}
                            {c.strategy ? ` · ${c.strategy.waves.filter((w) => w.contentId).length}/${c.strategy.waves.length} 波已建` : " · 尚未生成策略"}
                          </p>
                        </div>
                        {d != null ? (
                          <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent tabular-nums">
                            {d === 0 ? "今天" : `${d} 天`}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* 已排程內容 */}
          <section>
            <SectionHeader
              title="已排程內容"
              hint="接下來要發的"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/calendar">開啟排程</Link>
                </Button>
              }
            />
            {scheduled.length === 0 ? (
              <EmptyRow icon={CalendarDays} text="還沒有排程。完成一篇內容後，在排程頁拖到日期就好。" />
            ) : (
              <ul className="space-y-2">
                {scheduled.map((c) => (
                  <li key={c.id}>
                    <ContentCard content={c} urls={urls} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 最近 AI 生成 */}
          <section>
            <SectionHeader title="最近 AI 生成" hint="可以直接接著改" />
            {generated.length === 0 ? (
              <EmptyRow icon={Sparkles} text="還沒有生成過內容。從上面任何一個入口開始。" />
            ) : (
              <ul className="space-y-2">
                {generated.map((c) => (
                  <li key={c.id}>
                    <ContentCard content={c} urls={urls} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 表現不錯 */}
        {top.length ? (
          <section className="mt-10">
            <SectionHeader title="過去表現不錯的內容" hint="AI 下次生成會參考這些" />
            <ul className="grid gap-2 sm:grid-cols-3">
              {top.map((c) => (
                <li key={c.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                  <p className="line-clamp-2 text-sm font-medium">{c.copy.hook}</p>
                  <p className="mt-1 text-xs text-muted">
                    {contentTypeLabel(c.type)} · {c.publishedAt ? formatDate(c.publishedAt, "M/d", { locale: zhTW }) : ""}
                  </p>
                  {c.metrics ? (
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <Metric label="觸及" value={c.metrics.reach} />
                      <Metric label="收藏" value={c.metrics.saves} />
                      <Metric label="分享" value={c.metrics.shares} />
                    </dl>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* 最近素材 */}
        <section className="mt-10">
          <SectionHeader
            title="最近素材"
            hint="龜龜、三色光、校園、淡水、歷屆活動"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/assets">素材庫</Link>
              </Button>
            }
          />
          {!hydrated ? null : recentAssets.length === 0 ? (
            <EmptyRow icon={ImageIcon} text="還沒有素材。上傳照片，或連接 Google Drive。" />
          ) : (
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {recentAssets.map((asset) => (
                <li key={asset.id}>
                  <Link to="/assets" className="block overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                    <div className="aspect-square bg-glow-card">
                      {urls[asset.id] ? <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" /> : null}
                    </div>
                    <p className="truncate px-2 py-1.5 text-[11px]">{asset.name}</p>
                    <p className="truncate px-2 pb-1.5 text-[10px] text-subtle">
                      {ASSET_CATEGORY_LABELS[asset.category as keyof typeof ASSET_CATEGORY_LABELS] ?? asset.category}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-2 py-2">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}

function EmptyRow({ icon: Icon, text, action }: { icon: LucideIcon; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface/70 px-4 py-4 text-sm text-muted shadow-[var(--shadow-border)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-subtle">
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{text}</span>
      {action ? <span className="text-sm font-medium text-accent">{action}</span> : null}
    </div>
  );
}
