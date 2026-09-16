import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Images,
  Instagram,
  Sparkles,
  Tent,
} from "lucide-react";
import { useMemo } from "react";
import { QuickStartGrid } from "@/components/create/quick-start";
import { TodayIdeas } from "@/components/home/today-ideas";
import { TodayPosts } from "@/components/home/today-posts";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeader } from "@/components/shared/page-header";
import { ProjectCard } from "@/components/shared/project-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { countdownLabel, formatCampaignDate, nextCampaign, sortByUpcoming } from "@/lib/studio/campaign";
import { localTodayIdeas } from "@/lib/studio/ideas";
import { assetPreviewFitClass } from "@/lib/studio/assets";
import { contentKindLabel } from "@/lib/studio/status";
import { upcomingScheduledPacks, publishedPacks, recentPacks } from "@/lib/studio/today-post";
import { waveCreateSearch, waveProjectFields } from "@/lib/studio/wave-draft";
import type { Campaign, CampaignWave, Project } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { APP_TAGLINE, CLUB_NAME, eventKindLabel } from "@/lib/zen/club";
import { semesterPhaseAt, tamsuiContextAt } from "@/lib/zen/semester";
import { useStudio } from "@/stores/studio-store";

/** 今天最該做的那一篇：從最近活動的宣傳節奏裡挑出還沒做的那一波。 */
function pickTodaysWave(campaign: Campaign | null): CampaignWave | null {
  if (!campaign) return null;
  const pending = campaign.waves.filter((w) => !w.contentId);
  if (!pending.length) return null;
  const days = campaign.date
    ? Math.round((Date.parse(`${campaign.date}T00:00:00`) - Date.now()) / 86_400_000)
    : null;
  if (days == null) return pending[0];
  const due = pending.filter((w) => w.offsetDays >= -days - 1);
  return due[0] ?? pending[0];
}

function packLine(members: Project[]): string {
  if (members.length < 2) return contentKindLabel(members[0]!.contentKind);
  return `全套 · ${members.map((item) => contentKindLabel(item.contentKind)).join(" · ")}`;
}

export function HomePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const duplicateProject = useStudio((s) => s.duplicateProject);
  const createProject = useStudio((s) => s.createProject);
  const updateCampaign = useStudio((s) => s.updateCampaign);

  const phase = semesterPhaseAt();
  const tamsui = tamsuiContextAt();
  const upcoming = useMemo(() => sortByUpcoming(campaigns).slice(0, 3), [campaigns]);
  const focus = useMemo(() => nextCampaign(campaigns), [campaigns]);
  const todaysWave = useMemo(() => pickTodaysWave(focus), [focus]);

  const recent = useMemo(() => recentPacks(projects), [projects]);
  const scheduled = useMemo(() => upcomingScheduledPacks(projects), [projects]);
  const published = useMemo(() => publishedPacks(projects), [projects]);

  const assetIds = useMemo(() => assets.map((a) => a.id), [assets]);
  const urls = useAssetUrls(assetIds);
  const brand = brands[0];

  function createFromWave() {
    if (!brand || !focus || !todaysWave) return;
    const project = createProject(waveProjectFields({ brandId: brand.id, campaign: focus, wave: todaysWave }));
    updateCampaign(focus.id, {
      waves: focus.waves.map((wave) =>
        wave.id === todaysWave.id ? { ...wave, contentId: project.id } : wave,
      ),
    });
    void navigate({ to: "/create", search: waveCreateSearch(project.id, todaysWave, focus.id) });
  }

  const suggestion =
    todaysWave?.hook ||
    focus?.painPoint ||
    localTodayIdeas()[0]?.hook ||
    "第一次來，會經歷什麼？";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header className="min-w-0">
        <p className="text-xs tracking-[0.18em] text-muted uppercase">{APP_TAGLINE}</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-balance md:text-4xl">
          今天可以創作什麼？
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          現在是{phase.label}。{phase.mood}
          <span className="block text-subtle">
            淡水{tamsui.season}：{tamsui.weather}
          </span>
        </p>
      </header>

      {/* 第一屏：今天推薦創作 */}
      <section className="mt-6">
        <div className="glass relative overflow-hidden rounded-3xl p-5 md:p-7">
          <span className="three-lights absolute inset-x-0 top-0 h-1" aria-hidden />
          {focus ? (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
                    {formatCampaignDate(focus)} {focus.name}
                  </span>
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--color-warm)_22%,transparent)] px-2.5 py-1 font-medium">
                    {countdownLabel(focus)}
                  </span>
                  <span className="text-muted">{eventKindLabel(focus.kind)}</span>
                </div>

                <p className="mt-4 text-xs tracking-[0.14em] text-muted uppercase">AI 建議這篇</p>
                <p className="mt-1 font-display text-2xl leading-snug text-balance md:text-3xl">
                  「{suggestion}」
                </p>
                {todaysWave ? (
                  <p className="mt-3 text-sm text-muted">
                    {todaysWave.stage}·{contentKindLabel(todaysWave.kind)}
                    {todaysWave.note ? ` — ${todaysWave.note}` : ""}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    這場活動的宣傳節奏都已經有對應內容了。可以往下看今日靈感。
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={createFromWave} disabled={!todaysWave}>
                    <Sparkles className="size-4" />
                    AI 幫我創作
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/campaigns/$campaignId" params={{ campaignId: focus.id }}>
                      看整場宣傳
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl bg-surface-2/60 p-4">
                <p className="text-xs font-medium tracking-wide text-muted">這場活動的節奏</p>
                <ol className="mt-3 space-y-2">
                  {focus.waves.slice(0, 5).map((wave) => (
                    <li key={wave.id} className="flex items-start gap-2 text-xs">
                      <span
                        className={cn(
                          "mt-1 size-1.5 shrink-0 rounded-full",
                          wave.contentId ? "bg-[var(--color-clear)]" : "bg-border-strong",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {wave.offsetDays === 0
                            ? "當天"
                            : `${wave.offsetDays < 0 ? "前" : "後"} ${Math.abs(wave.offsetDays)} 天`}
                          ·{wave.stage}
                        </span>
                        <span className="block truncate text-muted">{wave.title}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Tent}
              title="還沒有排定的活動"
              description="先建立一場活動，AI 就能幫你排出完整宣傳節奏。也可以直接從一句想法開始寫一篇。"
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link to="/campaigns" search={{ new: "1" }}>
                      建立活動
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to="/create" search={{ from: "idea" }}>
                      從一句想法開始
                    </Link>
                  </Button>
                </div>
              }
            />
          )}
        </div>
      </section>

      {/* 快速開始 */}
      <section className="mt-8">
        <SectionHeader title="快速開始" hint="每一個入口都會帶著品牌記憶與學生情境" />
        <QuickStartGrid />
      </section>

      <TodayIdeas />
      <TodayPosts />

      {/* 近期活動 */}
      {upcoming.length > 0 ? (
        <section className="mt-10">
          <SectionHeader
            title="近期活動"
            hint="依接近程度排序"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/campaigns">全部活動</Link>
              </Button>
            }
          />
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {upcoming.map((campaign) => (
              <li key={campaign.id} className="min-w-[15rem] sm:min-w-0">
                <Link
                  to="/campaigns/$campaignId"
                  params={{ campaignId: campaign.id }}
                  className="flex h-full flex-col gap-2 surface-card rounded-2xl p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">{formatCampaignDate(campaign)}</span>
                    <span className="text-muted">{countdownLabel(campaign)}</span>
                  </span>
                  <span className="font-display text-lg">{campaign.name || "未命名活動"}</span>
                  <span className="line-clamp-2 text-xs text-muted">{campaign.oneLiner}</span>
                  <span className="mt-auto text-xs text-subtle">
                    {campaign.waves.filter((w) => w.contentId).length}/{campaign.waves.length} 篇已建立
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 已排程內容 */}
      <section className="mt-10">
        <SectionHeader
          title="已排程內容"
          hint="同一套併一列。今天要發的在上面，這裡是之後幾晚。"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/calendar">看日曆</Link>
            </Button>
          }
        />
        {scheduled.length === 0 ? (
          <p className="rounded-2xl surface-card px-4 py-8">
            還沒有排到後面的晚上。做完一篇後在日曆上排時間。
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {scheduled.map((pack) => (
              <li key={pack.rootId}>
                <Link
                  to="/studio/$projectId"
                  params={{ projectId: pack.primary.id }}
                  className="flex items-center gap-3 rounded-2xl surface-card p-3 transition-shadow hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
                    <CalendarDays className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{pack.primary.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {new Date(pack.primary.scheduledAt ?? 0).toLocaleString("zh-TW", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      ·{packLine(pack.members)}
                    </span>
                  </span>
                  <StatusBadge status={pack.primary.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 最近 AI 生成 */}
      <section className="mt-10">
        <SectionHeader title="最近做的內容" hint="依最後編輯排列" />
        {recent.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="還沒有內容"
            description="從一句想法開始，AI 會幫你寫第一版。"
            action={
              <Button asChild>
                <Link to="/create" search={{ from: "idea" }}>
                  開始創作
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((pack) => (
              <li key={pack.rootId}>
                <ProjectCard
                  project={pack.primary}
                  brand={brands.find((b) => b.id === pack.primary.brandId)}
                  urls={urls}
                  onDuplicate={() => duplicateProject(pack.primary.id)}
                />
                {pack.members.length > 1 ? (
                  <p className="mt-1.5 truncate px-1 text-xs text-muted">{packLine(pack.members)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 過去表現不錯的內容 */}
      <section className="mt-10">
        <SectionHeader
          title="過去表現不錯的內容"
          hint="串接 IG 後會用真實成效排序"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/instagram">IG 中心</Link>
            </Button>
          }
        />
        {published.length === 0 ? (
          <div className="rounded-2xl surface-card px-4 py-8">
            <Instagram className="mx-auto size-5 text-subtle" />
            <p className="mt-2 text-sm text-muted">還沒有標記為已發布的內容。</p>
            <p className="mt-1 text-xs text-subtle">
              在 IG 貼完之後，打開那則內容點「已發出去」。連接 {CLUB_NAME} 的 Instagram
              後，這裡會改用真實成效排序。
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {published.map((pack) => (
              <li key={pack.rootId}>
                <Link
                  to="/studio/$projectId"
                  params={{ projectId: pack.primary.id }}
                  className="flex items-center gap-3 rounded-2xl surface-card p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{pack.primary.name}</span>
                    <span className="block truncate text-xs text-muted">{packLine(pack.members)}</span>
                  </span>
                  <StatusBadge status={pack.primary.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 最近素材 */}
      <section className="mt-10">
        <SectionHeader
          title="最近素材"
          hint="Logo、龜龜、校園與淡水"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/assets">素材庫</Link>
            </Button>
          }
        />
        {assets.length === 0 ? (
          <EmptyState
            icon={Images}
            title="還沒有素材"
            description="上傳活動照片與 Logo，排版時會直接取用。"
            action={
              <Button asChild variant="secondary">
                <Link to="/assets">前往素材庫</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {assets.slice(0, 12).map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                <Link to="/assets" className="block">
                  <div className="aspect-square bg-surface-2">
                    {urls[asset.id] ? (
                      <img src={urls[asset.id]} alt={asset.name} className={cn("size-full", assetPreviewFitClass(asset, urls[asset.id]))} />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted">載入中</div>
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs">{asset.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
