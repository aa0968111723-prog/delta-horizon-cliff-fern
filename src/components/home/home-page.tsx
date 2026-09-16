import { Link, useNavigate } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Images, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { ProjectCard } from "@/components/shared/project-card";
import { SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { IgThumb } from "@/components/create/ig-thumb";
import { lastPackPreviewSrc, packAssetIds } from "@/lib/club/last-pack";
import { lessonsFromIg, nextCreateIdeaFromLessons } from "@/lib/club/insights";
import { FEATURED_EVENT, featuredCampaignIdea } from "@/lib/club/memory";
import { publishScheduleRow } from "@/lib/club/run-schedule-publish";
import { publishableScheduleRows } from "@/lib/club/schedule";
import { handoffFromQuickStart, QUICK_STARTS } from "@/lib/club/quick-starts";
import { formatDaysUntil, studentContext } from "@/lib/club/season";
import { writeHandoff } from "@/lib/create/handoff";
import { CONTENT_KIND_META, contentStatusOf } from "@/lib/studio/status";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

export function HomePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const campaigns = useCreative((s) => s.campaigns);
  const schedule = useCreative((s) => s.schedule);
  const igPosts = useCreative((s) => s.igPosts);
  const lastPack = useCreative((s) => s.lastPack);
  const ingestIg = useCreative((s) => s.ingestIg);
  const setScheduleStatus = useCreative((s) => s.setScheduleStatus);
  const updateProject = useStudio((s) => s.updateProject);
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const setLastSearch = useCreative((s) => s.setLastSearch);
  const [open, setOpen] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const ctx = studentContext();
  const featured = campaigns.find((c) => c.id === FEATURED_EVENT.id) ?? campaigns[0];

  const urls = useAssetUrls([...assets.map((a) => a.id), ...packAssetIds(lastPack)]);
  const recent = useMemo(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6), [projects]);
  const due = useMemo(() => publishableScheduleRows(schedule), [schedule]);
  const upcoming = [...schedule].sort((a, b) => a.plannedAt - b.plannedAt).filter((row) => row.status !== "published").slice(0, 4);
  const strong = [...igPosts].sort((a, b) => (b.metrics?.saves ?? 0) - (a.metrics?.saves ?? 0))[0];
  const lessons = lessonsFromIg(igPosts);

  async function publishDue(row: (typeof schedule)[number]) {
    setPublishingId(row.id);
    try {
      const result = await publishScheduleRow({ row, lastPack, assetUrls: urls });
      ingestIg([result.post]);
      setScheduleStatus(row.id, "published");
      if (row.projectId) {
        updateProject(row.projectId, { contentStatus: "published", publishedAt: Date.now() });
      }
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "發布失敗");
    } finally {
      setPublishingId(null);
    }
  }

  function startFeatured() {
    if (!featured) return;
    writeHandoff({
      idea: featuredCampaignIdea({
        ...FEATURED_EVENT,
        name: featured.name,
        date: featured.date,
        time: featured.time,
        location: featured.location,
        oneLiner: featured.oneLiner || FEATURED_EVENT.oneLiner,
      }),
      tab: "campaign",
      autoRun: true,
      sourceLabel: `活動 / ${featured.name}`,
    });
    void navigate({ to: "/create", search: { tab: "campaign" } });
  }

  return (
    <main className="hero-wash min-h-full">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.2em] text-muted">淡江大學禪學社 · AI CREATIVE STUDIO</p>
            <h1 className="mt-2 font-display text-3xl tracking-tight md:text-5xl">今天可以創作什麼？</h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              {ctx.phaseLabel}。{ctx.calendarNote}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" aria-label="搜尋" onClick={() => setSearchOpen(true)}>
              <Search className="size-4" />
            </Button>
            <Button className="hidden sm:inline-flex" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              AI 創作
            </Button>
          </div>
        </div>

        {featured ? (
          <section className="glass-card mt-8 rounded-3xl p-5 md:p-8">
            <p className="text-xs tracking-[0.16em] text-muted">今天推薦創作</p>
            <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm text-muted">
                  {featured.date.slice(5).replace("-", "/")} {featured.name}
                  <span className="ml-2 text-accent">{formatDaysUntil(featured.date)}</span>
                </p>
                <h2 className="mt-2 max-w-xl font-display text-2xl md:text-4xl">「{featured.oneLiner}」</h2>
                <p className="mt-3 text-sm text-muted">AI 建議做成 IG Carousel · {featured.location}</p>
              </div>
              <Button size="lg" className="h-12 rounded-full px-6" data-testid="home-featured-create" onClick={startFeatured}>
                <Sparkles className="size-4" />
                AI 幫我創作
              </Button>
            </div>
            <p className="mt-4 text-xs text-subtle">會一次產出 IG 文案、圖片 Prompt、主視覺方向、Carousel、Story、Threads、Reels Script。</p>
          </section>
        ) : null}

        <section className="mt-8">
          <SectionHeader title="快速開始" hint="從一個動作進入創作" />
          <div className="flex flex-wrap gap-2">
            {QUICK_STARTS.map((item) => (
              <Button
                key={item.id}
                variant="secondary"
                className="shrink-0 rounded-full"
                onClick={() => {
                  if (item.openSearch) {
                    setLastSearch(item.id === "canva" ? "找以前茶會 Canva" : "找以前晚上的茶會照片");
                    setSearchOpen(true);
                    return;
                  }
                  if (item.to === "/create") {
                    writeHandoff(handoffFromQuickStart(item));
                    void navigate({ to: "/create", search: { tab: item.tab ?? "campaign" } });
                    return;
                  }
                  void navigate({ to: item.to });
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <SectionHeader
              title="今日靈感"
              hint={ctx.weatherNote}
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/inspiration">研究趨勢</Link>
                </Button>
              }
            />
            <ul className="space-y-2 text-sm">
              {ctx.whoIsListening.map((who) => (
                <li key={who} className="rounded-2xl bg-bg px-3 py-2">
                  {who}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <SectionHeader
              title="近期活動"
              hint="沒有負責人，只有你"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/campaigns">全部</Link>
                </Button>
              }
            />
            <ul className="space-y-2">
              {campaigns.slice(0, 3).map((campaign) => (
                <li key={campaign.id}>
                  <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }} className="block rounded-2xl bg-bg px-3 py-3">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-muted">
                      {campaign.date} · {campaign.time} · {campaign.location}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {due.length ? (
          <section className="mt-10" data-testid="home-due">
            <SectionHeader title="今天可以發布" hint="到時間就發，沒有審核人" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {due.slice(0, 4).map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-3xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted">
                      {formatDate(row.plannedAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_META[row.contentKind].label}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium">{row.title}</p>
                  </div>
                  <Button
                    className="shrink-0 rounded-full"
                    data-testid="home-due-publish"
                    disabled={publishingId === row.id}
                    onClick={() => void publishDue(row)}
                  >
                    現在發布
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10">
          <SectionHeader
            title="已排程內容"
            hint="服務創作與發布"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/calendar">月曆</Link>
              </Button>
            }
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((row) => (
              <li key={row.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {formatDate(row.plannedAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_META[row.contentKind].label}
                </p>
                <p className="mt-1 text-sm font-medium">{row.title}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <SectionHeader title="最近 AI 生成" hint="依最後編輯" />
          {lastPack ? (
            <Link to="/instagram" className="mb-3 block overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]" data-testid="home-last-pack">
              <div className="grid gap-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <IgThumb src={lastPackPreviewSrc(lastPack, urls)} caption={lastPack.hook} className="aspect-[4/5] sm:aspect-square" />
                <div className="p-4">
                  <p className="text-xs text-muted">剛生成 · {lastPack.eventName}</p>
                  <p className="mt-1 font-medium">{lastPack.hook}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{lastPack.caption}</p>
                </div>
              </div>
            </Link>
          ) : null}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} brand={brands.find((b) => b.id === project.brandId)} urls={urls} />
                <p className="mt-1 px-1 text-xs text-subtle">
                  {CONTENT_KIND_META[project.contentKind].label} · {contentStatusOf(project)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <SectionHeader
              title="過去表現不錯"
              hint="用來改善下一次，不是報表牆"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/instagram">IG 記憶</Link>
                </Button>
              }
            />
            {strong ? (
              <div className="flex gap-3">
                <img src={strong.thumb} alt="" className="size-20 rounded-xl object-cover" />
                <div>
                  <p className="text-sm">{strong.caption.split("\n")[0]}</p>
                  <p className="mt-1 text-xs text-muted">{strong.analysis}</p>
                </div>
              </div>
            ) : null}
            <Button
              className="mt-3 min-h-11"
              data-testid="home-lesson-create"
              onClick={() => {
                writeHandoff({
                  idea: nextCreateIdeaFromLessons(
                    igPosts,
                    featured ? `${featured.date.slice(5).replace("-", "/")} ${featured.name}` : undefined,
                  ),
                  tab: "campaign",
                  autoRun: true,
                  sourceLabel: strong ? `Instagram / ${strong.caption.split("\n")[0]}` : "Instagram / 成效",
                });
                void navigate({ to: "/create", search: { tab: "campaign" } });
              }}
            >
              用這個 Hook 創作
            </Button>
            <ul className="mt-3 space-y-2 text-sm" data-testid="home-ig-lessons">
              <li>Hook：{lessons.hook}</li>
              <li>圖片：{lessons.visual}</li>
              <li>Carousel：{lessons.carousel}</li>
            </ul>
          </article>
          <article className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <SectionHeader
              title="最近素材"
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link to="/assets">素材庫</Link>
                </Button>
              }
            />
            <ul className="grid grid-cols-4 gap-2">
              {assets.slice(0, 8).map((asset) => (
                <li key={asset.id} className="overflow-hidden rounded-xl bg-bg">
                  <Link to="/assets">
                    {urls[asset.id] ? (
                      <img src={urls[asset.id]} alt={asset.name} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-[10px] text-muted">
                        <Images className="size-4" />
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <p className="mt-8 text-center text-xs text-subtle">參考來源來自 Brand / Drive / Canva / Instagram 記憶，不會隱藏 AI 用了什麼。</p>
        <NewProjectDialog open={open} onOpenChange={setOpen} />
      </div>
    </main>
  );
}
