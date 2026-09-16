import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArtboardView } from "@/components/studio/artboard-view";
import { CreativeHits } from "@/components/search/creative-hits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysUntil, academicMoment } from "@/lib/club/season";
import { DuePublishBar } from "@/components/calendar/due-publish-bar";
import { CalendarThumb } from "@/components/calendar/calendar-thumb";
import { compactSeasonSteer, featuredHookForNow, learnCardForNow, sameLivingHook } from "@/lib/club/featured";
import { clubInsightsFromPosts, nextCreateFromLearn } from "@/lib/club/insights";
import { gatherIntoStore } from "@/lib/creative/gather-client";
import { gatherStatusLine, searchCreative } from "@/lib/creative/search";
import { calendarFrom, useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { contentKindLabel } from "@/lib/studio/content";
import { STATUS_META } from "@/lib/studio/status";

const QUICK = [
  ["生成 IG 貼文", { mode: "post" }],
  ["生成圖片", { mode: "image" }],
  ["生成 Story", { mode: "story" }],
  ["生成 Carousel", { mode: "carousel" }],
  ["生成 Reels", { mode: "reels" }],
  ["從一句想法開始", { mode: "idea" }],
  ["從一張圖片開始", { mode: "vision" }],
  ["從 Drive 素材開始", { mode: "drive" }],
  ["從 Canva 設計開始", { mode: "canva" }],
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const season = academicMoment();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const campaigns = useCreative((s) => s.campaigns);
  const memory = useCreative((s) => s.memory);
  const igPosts = useCreative((s) => s.igPosts);
  const inspirations = useCreative((s) => s.inspirations);
  const lastLearn = useCreative((s) => s.lastLearn);
  const setLastQuery = useCreative((s) => s.setLastQuery);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [liveSources, setLiveSources] = useState<string[]>([]);
  const featured = campaigns[0];
  const remain = featured ? daysUntil(featured.date) : 0;
  const brand = brands[0];
  const urls = useAssetUrls(assets.map((a) => a.id));

  const hits = useMemo(
    () => (q.trim().length < 2 ? [] : searchCreative({ query: q, memory, assets, campaigns, igPosts, projects })),
    [q, memory, assets, campaigns, igPosts, projects],
  );

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setLiveSources([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void gatherIntoStore(term)
        .then((gathered) => setLiveSources(gathered.sources))
        .finally(() => setSearching(false));
    }, 480);
    return () => window.clearTimeout(timer);
  }, [q]);

  const scheduled = calendarFrom(campaigns, projects).filter(
    (item) => item.date >= format(new Date(), "yyyy-MM-dd") && item.status !== "published",
  );
  const recent = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  const strong = [...igPosts].sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0)).slice(0, 3);
  const insights = clubInsightsFromPosts(igPosts);
  const featuredSuggest = featured
    ? featuredHookForNow({
        season,
        campaign: featured,
        posts: igPosts,
        avoidHooks: lastLearn?.hook ? [lastLearn.hook] : [],
      })
    : null;
  const featuredHook = featuredSuggest?.hook || "剛到淡水的時候，好像什麼都還沒開始。";
  const latestPublished = [...igPosts].sort((a, b) => b.takenAt - a.takenAt)[0];
  const learnCard = learnCardForNow({ season, lastLearn });
  const justLearned = Boolean(lastLearn?.hook && Date.now() - lastLearn.at < 15 * 60 * 1000);

  const featuredProject = projects.find((p) => p.id === featured?.projectIds[0]);
  const featuredBoard = featuredProject?.artboards[featuredProject.activeFormatId];

  function runFeatured() {
    if (!featured) return;
    setLastQuery(featured.name);
    void navigate({
      to: "/create",
      search: { q: featuredSuggest?.query ?? `幫我做 ${featured.name} 完整宣傳`, go: "1", campaign: featured.id },
    });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">淡江大學禪學社</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight md:text-5xl">今天可以創作什麼？</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        {season.label} · {season.weather} {season.contentHint}
      </p>

      <form
        data-home-search=""
        className="mt-6 flex flex-col gap-2 min-[420px]:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          setLastQuery(q.trim());
          void navigate({ to: "/create", search: { q: q.trim(), go: "1" } });
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            id="home-search"
            name="creative-search"
            autoComplete="off"
            aria-label="搜尋 Drive、Canva、IG 與素材"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋浮游禪光、茶會、龜龜，或直接說你想做什麼"
            className="h-12 rounded-2xl pl-10"
          />
        </div>
        <Button type="submit" className="h-12 w-full rounded-2xl px-5 min-[420px]:w-auto">
          AI 創作
        </Button>
      </form>
      {searching || hits.length ? (
        <div>
          <p className="mt-3 text-sm text-muted">
            {searching ? "正在找 Drive、Canva、IG…" : gatherStatusLine(hits.length, liveSources)}
          </p>
          <CreativeHits
            hits={hits}
            onPick={(hit) => {
              setLastQuery(q.trim() || hit.title);
              void navigate({
                to: "/create",
                search: {
                  q: `${q.trim() || hit.title}（參考 ${hit.sourceLabel}）`,
                  go: "1",
                  asset: hit.assetId,
                  mode: hit.assetId ? "vision" : undefined,
                },
              });
            }}
          />
        </div>
      ) : null}

      {featured ? (
        <section className="mt-6 overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-artboard)]" data-home-featured="">
          <div className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_0.9fr]">
            <div className="p-5 md:p-7">
              <p className="text-xs tracking-[0.16em] text-muted">今天推薦創作</p>
              <h2 className="mt-2 font-display text-3xl">
                {format(new Date(`${featured.date}T00:00:00`), "MM/dd", { locale: zhTW })} {featured.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{remain > 0 ? `還有 ${remain} 天` : remain === 0 ? "就是今天" : "已過活動日"}</p>
              <p className="mt-5 text-sm text-muted">AI 建議做一篇</p>
              <p className="mt-1 font-display text-xl leading-snug" data-featured-hook="">
                「{featuredHook}」
              </p>
              {featuredSuggest ? <p className="mt-2 text-xs text-muted">{featuredSuggest.why}</p> : null}
              {justLearned && lastLearn && !sameLivingHook(featuredHook, lastLearn.hook) ? (
                <p className="mt-2 text-xs text-muted" data-featured-avoid="">
                  剛才發過「{lastLearn.hook}」，這次換切入。
                </p>
              ) : null}
              <p className="mt-2 text-xs tracking-[0.14em] text-subtle uppercase">IG Carousel</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={runFeatured} className="min-h-11 rounded-full px-5">
                  AI 幫我創作
                </Button>
                <Button asChild variant="secondary" className="min-h-11 rounded-full">
                  <Link to="/campaigns/$campaignId" params={{ campaignId: featured.id }}>
                    看活動
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center bg-bg p-4 md:p-6">
              {featuredBoard && brand ? (
                <ArtboardView artboard={featuredBoard} brand={brand} urls={urls} width={180} />
              ) : (
                <div className="aspect-4/5 w-40 rounded-2xl bg-linear-to-b from-surface-2 to-bg" />
              )}
            </div>
          </div>
        </section>
      ) : null}

      <DuePublishBar />

      <section className="mt-10">
        <h2 className="text-sm font-medium">快速開始</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {QUICK.map(([label, search]) => (
            <Button
              key={label}
              variant="secondary"
              className="h-11 shrink-0 rounded-full"
              onClick={() => void navigate({ to: "/create", search })}
            >
              {label}
            </Button>
          ))}
          <Button variant="secondary" className="h-11 shrink-0 rounded-full" onClick={() => void navigate({ to: "/campaigns" })}>
            建立活動
          </Button>
          <Button variant="secondary" className="h-11 shrink-0 rounded-full" onClick={() => void navigate({ to: "/ig" })}>
            從以前 IG 貼文開始
          </Button>
          <Button variant="secondary" className="h-11 shrink-0 rounded-full" onClick={() => void navigate({ to: "/inspire" })}>
            靈感研究
          </Button>
        </div>
      </section>

      <section className="mt-10 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">今日靈感</h2>
            <Link to="/inspire" className="text-xs text-muted">
              研究
            </Link>
          </div>
          <p className="mt-3 font-display text-lg">{season.studentNow}</p>
          <p className="mt-2 text-sm text-muted">{season.contentHint}</p>
          {inspirations[0] ? (
            <p className="mt-3 text-xs text-muted">
              研究抽象：{inspirations[0].hookShape} → {inspirations[0].clubTurn}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-muted">下次生成會記得：{insights.mixLesson}</p>
          {latestPublished ? (
            <p className="mt-1 text-xs text-subtle">最近一篇：{latestPublished.caption.split("\n")[0]}</p>
          ) : null}
        </div>
        <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">近期活動</h2>
            <Link to="/campaigns" className="text-xs text-muted">
              全部
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {campaigns.slice(0, 3).map((c) => (
              <li key={c.id}>
                <Link to="/campaigns/$campaignId" params={{ campaignId: c.id }} className="block min-h-11">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c.date} {c.time} · {c.location}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">已排程內容</h2>
          <Link to="/calendar" className="text-xs text-muted">
            月曆
          </Link>
        </div>
        <ul className="mt-3 space-y-2">
          {scheduled.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              {item.projectId ? (
                <Link to="/ig" search={{ item: item.projectId }} className="flex items-center gap-3">
                  <CalendarThumb item={item} urls={urls} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.date} · {item.kind === "event" ? "活動" : contentKindLabel(item.kind)}
                    </p>
                  </div>
                  <span className="text-xs text-subtle">{STATUS_META[item.status].label}</span>
                </Link>
              ) : (
                <Link to="/calendar" search={{ day: item.date }} className="flex items-center gap-3">
                  <CalendarThumb item={item} urls={urls} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.date} · {item.kind === "event" ? "活動" : contentKindLabel(item.kind)}
                    </p>
                  </div>
                  <span className="text-xs text-subtle">{STATUS_META[item.status].label}</span>
                </Link>
              )}
            </li>
          ))}
          {scheduled.length === 0 ? <p className="text-sm text-muted">還沒有排程。生成後可以丟進月曆。</p> : null}
        </ul>
      </section>

      {learnCard && lastLearn ? (
        <section className="mt-10 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]" data-home-learn="">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">{learnCard.label}</p>
          <p className="mt-2 font-display text-xl leading-snug">「{learnCard.quote}」</p>
          <p className="mt-2 text-sm text-muted">{learnCard.detail}</p>
          <p className="mt-1 text-xs text-muted">{learnCard.mix}</p>
          {learnCard.visual || insights.visualLesson ? (
            <p className="mt-1 text-xs text-muted">{learnCard.visual || insights.visualLesson}</p>
          ) : null}
          <Button asChild className="mt-4 min-h-11 rounded-full">
            <Link
              to="/create"
              search={{
                q: nextCreateFromLearn(lastLearn, { seasonNote: compactSeasonSteer(season, lastLearn.hook) }),
                go: "1",
              }}
            >
              {learnCard.stale ? "用現在的生活寫下一篇" : "用這次學到的再創作"}
            </Link>
          </Button>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium">最近 AI 生成</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {recent.map((project) => {
            const board = project.artboards[project.activeFormatId];
            return (
              <li key={project.id}>
                <Link
                  to="/studio/$projectId"
                  params={{ projectId: project.id }}
                  className="block rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]"
                >
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-bg">
                    {board && brand ? <ArtboardView artboard={board} brand={brand} urls={urls} width={96} /> : null}
                  </div>
                  <p className="mt-2 truncate text-sm">{project.name}</p>
                  <p className="text-xs text-muted">{STATUS_META[project.status].label}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium">過去表現不錯的內容</h2>
        <ul className="mt-3 space-y-2">
          {strong.map((post) => (
            <li key={post.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="text-sm">{post.caption.split("\n")[0]}</p>
              <p className="mt-1 text-xs text-muted">
                收藏 {post.saves} · 互動 {post.comments} · {post.analysis?.direction}
              </p>
              <p className="mt-1 text-xs text-subtle">{insights.answers[0]}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1"
                onClick={() =>
                  void navigate({
                    to: "/create",
                    search: { q: `延續這篇 IG：${post.caption.split("\n")[0]}`, go: "1", mode: "post" },
                  })
                }
              >
                用這篇再生一篇
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">最近素材</h2>
          <Link to="/assets" className="text-xs text-muted">
            素材庫
          </Link>
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {assets.slice(0, 6).map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
              <Link to="/assets">
                <div className="aspect-square bg-bg">
                  {urls[asset.id] ? <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" /> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
