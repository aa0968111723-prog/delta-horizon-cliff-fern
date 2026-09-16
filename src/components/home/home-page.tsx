import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowRight, Images, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { calendarSearchFromScheduled, calendarSearchParams } from "@/lib/studio/calendar-search";
import { contentKindLabel } from "@/lib/studio/content";
import { academicBeat, academicBeatLabel, daysUntil } from "@/lib/zen/context";
import { ideaFromInspiration, inspirationForBeat } from "@/lib/zen/inspiration";
import { clubCreativeDna } from "@/lib/zen/dna";
import { feelLabel, type PostFeel } from "@/lib/zen/feel";
import { awaitingFeel, hookLine, learnFromIg } from "@/lib/zen/insights";
import { recommendCampaign, recommendHook, isEventCampaign } from "@/lib/zen/recommend";
import { isDue, homeScheduled } from "@/lib/zen/schedule";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";
import { ProjectCard } from "@/components/shared/project-card";
import { SectionHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/empty-state";

export function HomePage() {
  const navigate = useNavigate();
  const setCreateOpen = useUi((s) => s.setCreateOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const rateIgMemory = useStudio((s) => s.rateIgMemory);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const campaigns = useStudio((s) => s.campaigns);
  const schedule = useStudio((s) => s.schedule);
  const igMemory = useStudio((s) => s.igMemory);
  const brand = brands[0];

  const upcoming = useMemo(() => recommendCampaign(campaigns), [campaigns]);
  const days = upcoming ? daysUntil(upcoming.date) : null;
  const pieceIds = useMemo(
    () => campaigns.filter((row) => !isEventCampaign(row)).map((row) => row.id),
    [campaigns],
  );
  const eventCampaigns = useMemo(() => campaigns.filter(isEventCampaign), [campaigns]);
  const scheduled = homeScheduled(schedule, { eventId: upcoming?.id, pieceIds });
  const calendarSearch = calendarSearchFromScheduled(scheduled);
  const generated = [...projects].filter((p) => p.plan).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const generatedLooks = assets.filter((asset) => asset.source === "generated").slice(0, 4);
  const dna = useMemo(
    () => clubCreativeDna({ brand, igMemory, campaigns, assets }),
    [brand, igMemory, campaigns, assets],
  );
  const learning = useMemo(() => learnFromIg(igMemory), [igMemory]);
  const strong = learning.ranked[0];
  const strongHook = strong ? hookLine(strong.caption) : "";
  const pendingFeel = awaitingFeel(igMemory)[0];
  const beat = academicBeat();
  const inspiration = useMemo(() => inspirationForBeat(beat), [beat]);

  const urls = useAssetUrls(assets.map((a) => a.id));
  const heroProject = projects.find((p) => p.campaignId === upcoming?.id) ?? projects[0];
  const board = heroProject?.artboards[heroProject.activeFormatId];
  const hydrated = useStudio((s) => s.hydrated);

  if (!hydrated) {
    return <LoadingState label="讀取禪光…" />;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-nav md:px-8 md:py-10" data-testid="home-ready">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">淡江大學禪學社</p>
      <p className="mt-2 text-xs text-subtle">{academicBeatLabel(academicBeat())} · 一人完成網宣</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">今天可以創作什麼？</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        一人完成網宣。AI 幫你想、寫、畫、排，Instagram 是主要出口。
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)} className="min-h-11">
          <Sparkles className="size-4" />
          AI 創作
        </Button>
        <Button variant="secondary" data-testid="home-search" onClick={() => setSearchOpen(true)}>
          搜尋素材
        </Button>
      </div>

      {upcoming ? (
        <section
          className="relative mt-8 overflow-hidden rounded-[1.75rem] bg-accent text-accent-fg shadow-[var(--shadow-lift)]"
          data-testid="home-recommend"
        >
          <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-amber/50 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 right-16 size-32 rounded-full bg-dusk/40 blur-xl" />
          <div className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-8">
            <div>
              <p className="text-xs tracking-[0.18em] uppercase text-accent-fg/70">今天推薦創作</p>
              <p className="mt-3 font-display text-3xl md:text-4xl" data-testid="home-recommend-name">
                {format(new Date(`${upcoming.date}T00:00:00`), "MM/dd", { locale: zhTW })} {upcoming.name}
              </p>
              <p className="mt-2 text-sm text-accent-fg/80" data-testid="home-recommend-days">
                {days !== null && days >= 0 ? `還有 ${days} 天` : days !== null && days < 0 ? "活動已過，可以做回顧" : null}
              </p>
              <p className="mt-5 text-lg leading-snug">
                AI 建議做一篇
                <span className="mt-1 block font-display text-2xl" data-testid="home-recommend-hook">
                  「{recommendHook(upcoming, learning.bestHookShape)}」
                </span>
              </p>
              <p className="mt-2 text-sm text-accent-fg/75">IG Carousel · 讓淡江學生覺得這跟自己有關</p>
              {upcoming.imageAssetId && urls[upcoming.imageAssetId] ? (
                <img
                  src={urls[upcoming.imageAssetId]}
                  alt=""
                  className="mt-4 size-16 rounded-2xl object-cover sm:hidden"
                />
              ) : null}
              <Button
                className="mt-6 min-h-11 bg-surface text-fg hover:bg-surface-2"
                onClick={() => {
                  void navigate({
                    to: "/create",
                    search: {
                      mode: "campaign",
                      idea: upcoming.name,
                      campaign: upcoming.id,
                    },
                  });
                }}
              >
                AI 幫我創作
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <div className="hidden items-center justify-center sm:flex">
              {upcoming.imageAssetId && urls[upcoming.imageAssetId] ? (
                <img
                  src={urls[upcoming.imageAssetId]}
                  alt={upcoming.name}
                  className="w-40 rounded-2xl bg-bg/20 object-cover shadow-[var(--shadow-artboard)]"
                />
              ) : board && brand && heroProject ? (
                <div className="rounded-2xl bg-bg/20 p-3">
                  <ArtboardView artboard={board} brand={brand} urls={urls} width={160} />
                </div>
              ) : (
                <div className="aspect-[4/5] w-40 rounded-2xl bg-bg/20" />
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-10" data-testid="home-inspiration">
        <SectionHeader
          title="今日靈感"
          hint={`${academicBeatLabel(beat)} · 研究構圖與 Hook，不要抄別人`}
          action={
            <Link to="/inspire" className="text-sm text-muted">
              靈感研究
            </Link>
          }
        />
        <ul className="flex gap-3 overflow-x-auto pb-3">
          {inspiration.map((card) => (
            <li key={card.id} className="min-w-[15.5rem] snap-start rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">{card.title}</p>
              <p className="mt-2 text-xs text-muted">{card.hookShape}</p>
              <p className="mt-1 text-xs text-subtle">{card.composition}</p>
              <Button
                className="mt-3 min-h-11"
                size="sm"
                variant="secondary"
                onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: ideaFromInspiration(card) } })}
              >
                用這個形狀創作
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <SectionHeader
          title="近期活動"
          hint="沒有負責人、沒有審核"
          action={
            <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/create", search: { mode: "campaign" } })}>
              建立活動
            </Button>
          }
        />
        <ul className="grid gap-3 sm:grid-cols-2" data-testid="home-events">
          {eventCampaigns.map((c) => (
            <li key={c.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">{c.date} · {c.time}</p>
              <p className="mt-1 font-medium" data-testid="home-event-name">
                {c.name}
              </p>
              <p className="mt-1 text-sm text-muted">{c.oneLiner}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => void navigate({ to: "/create", search: { mode: "campaign", idea: c.name, campaign: c.id } })}
              >
                AI 生成完整宣傳
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" data-testid="home-scheduled">
        <SectionHeader
          title="已排程內容"
          action={
            <Link to="/calendar" search={calendarSearch} className="text-sm text-muted" data-testid="home-calendar">
              月曆
            </Link>
          }
        />
        {scheduled.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted">還沒有排程。</p>
        ) : (
          <ul className="space-y-2">
            {scheduled.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <div className="flex min-w-0 items-center gap-3">
                  {item.imageAssetId && urls[item.imageAssetId] ? (
                    <img
                      src={urls[item.imageAssetId]}
                      alt=""
                      data-testid="schedule-thumb"
                      className="size-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                  <p className="truncate text-sm" data-testid="home-scheduled-title">
                    {item.title}
                  </p>
                  {item.caption ? (
                    <p className="truncate text-xs text-muted" data-testid="home-scheduled-hook">
                      {hookLine(item.caption)}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted">
                    {contentKindLabel(item.kind)} · {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })}
                  </p>
                  </div>
                </div>
                {isDue(item) ? (
                  <Link
                    to="/calendar"
                    search={calendarSearchParams({ campaign: item.campaignId ?? upcoming?.id })}
                    data-testid={item.id === scheduled.find((row) => isDue(row))?.id ? "home-due" : undefined}
                    className="shrink-0 rounded-full bg-amber/20 px-2.5 py-1 text-[11px] text-warn"
                  >
                    現在可以發
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingFeel ? (
        <section className="mt-10 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]" data-testid="home-awaiting-feel">
          <SectionHeader title="剛發布" hint="標記學生會不會停，下次生成會學" />
          <p className="text-sm">「{hookLine(pendingFeel.caption)}」</p>
          <p className="mt-1 text-xs text-muted">{pendingFeel.date} · 還沒有效數，先靠你看</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["strong", "ok", "weak"] as PostFeel[]).map((feel) => (
              <Button
                key={feel}
                size="sm"
                className="min-h-11"
                variant="secondary"
                data-testid={feel === "strong" ? "home-rate-strong" : undefined}
                onClick={() => rateIgMemory(pendingFeel.id, feel)}
              >
                {feelLabel(feel)}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionHeader title="最近 AI 生成" />
        {generatedLooks.length ? (
          <ul className="mb-3 grid grid-cols-4 gap-2" data-testid="home-generated">
            {generatedLooks.map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                <Link to="/create" search={{ mode: "from-image", asset: asset.id, idea: `延續「${asset.name}」` }} className="block">
                  <div className="aspect-square bg-bg">
                    {urls[asset.id] ? (
                      <img
                        src={urls[asset.id]}
                        alt={asset.name}
                        data-testid="home-generated-thumb"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted">{asset.name}</div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {generated.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} brand={brand} urls={urls} />
            </li>
          ))}
        </ul>
      </section>

      {strong ? (
        <section className="mt-10 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]" data-testid="home-learned">
          <SectionHeader title="過去表現不錯" hint="用來改善下一次，不是報表牆" />
          <p className="text-sm">「{strongHook}」</p>
          <p className="mt-1 text-xs text-muted">
            {strong.date} · 收藏 {strong.saves ?? 0} · {strong.analysis || "生活問句當 Hook 比較容易停。"}
          </p>
          <Button
            className="mt-3 min-h-11"
            size="sm"
            variant="secondary"
            onClick={() => void navigate({ to: "/create", search: { mode: "from-ig", idea: strongHook } })}
            data-testid="home-extend-hook"
          >
            用這個 Hook 再寫一篇
          </Button>
          <ul className="mt-4 space-y-2">
            {learning.lessons.slice(0, 3).map((lesson) => (
              <li key={lesson.id} className="text-xs text-muted">
                <span className="font-medium text-fg">{lesson.title}</span> {lesson.detail}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionHeader title="最近素材" action={<Link to="/assets" className="text-sm text-muted">素材庫</Link>} />
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {assets.slice(0, 6).map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              <Link to="/assets" className="block">
                <div className="aspect-square bg-bg">
                  {urls[asset.id] ? (
                    <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted">
                      <Images className="size-4" />
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 mb-6">
        <SectionHeader title="淡江禪學社 Creative Brain" hint="生成前先讀自己，不是從零開始" />
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-sm">{dna.palette}</p>
          <p className="mt-2 text-sm text-muted">
            {dna.motifs.join(" · ")} · CTA「{dna.ctas[0]}」
          </p>
          <p className="mt-2 text-xs text-muted">
            喜歡 {dna.likes.join("、")}。不要 {dna.dislikes.join("、")}。
          </p>
          <p className="mt-2 text-xs text-subtle">
            素材 {assets.length} · 過去 IG {igMemory.length} · 活動 {campaigns.length} · Caption 約 {dna.captionLength || "—"} 字
          </p>
        </div>
      </section>

      <section className="mt-10 mb-6">
        <SectionHeader title="快速開始" />
        <div className="flex flex-wrap gap-2">
          {[
            ["生成 IG 貼文", "post"],
            ["生成圖片", "image"],
            ["生成 Story", "story"],
            ["生成 Carousel", "carousel"],
            ["生成 Reels", "reels"],
            ["建立活動", "campaign"],
            ["從一句想法開始", "idea"],
            ["從一張圖片開始", "from-image"],
            ["從 Google Drive", "from-drive"],
            ["從 Canva", "from-canva"],
            ["從以前 IG", "from-ig"],
          ].map(([label, mode]) => (
            <Button
              key={mode}
              variant="secondary"
              onClick={() => {
                if (mode === "image") {
                  void navigate({ to: "/image" });
                  return;
                }
                void navigate({
                  to: "/create",
                  search: mode === "idea" ? { mode, idea: "下週有一場茶會" } : { mode },
                });
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="mt-3">
          <Input readOnly placeholder="或直接搜尋：浮游禪光" onFocus={() => setSearchOpen(true)} />
        </div>
      </section>
    </main>
  );
}
