import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowRight, Images, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CreateLaunchSheet } from "@/components/create/create-sheet";
import { applyPickedDirection } from "@/components/create/apply-picked";
import { createFromHit } from "@/components/create/from-hit";
import { openScheduledPreview } from "@/components/create/open-preview";
import { runIdeaPack } from "@/components/create/run-idea";
import { PackResult } from "@/components/create/pack-result";
import { PublishIgButton } from "@/components/instagram/publish-button";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchHitCard } from "@/components/search/hit-card";
import { ProjectCard } from "@/components/shared/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetUrls, resolveAssetSrc } from "@/hooks/use-asset-urls";
import { searchCreativeWorld } from "@/lib/ai/oauth";
import { APP_NAME, APP_TAGLINE, CLUB_SHORT } from "@/lib/zen/club";
import { hitFromIgPost } from "@/lib/zen/from-hit";
import { isCreateQuery } from "@/lib/zen/from-idea";
import { composeMemoryNotes } from "@/lib/zen/ingest";
import { learnFromPosts, nextCreateHint, whyPostWorked } from "@/lib/zen/insights";
import { inspirationCreateNotes, inspirationFeed, kindFromInspiration } from "@/lib/zen/inspiration";
import { creativeSearch, groupSearchHits, type SearchHit } from "@/lib/zen/search";
import { daysUntil, formatMd, seasonContext } from "@/lib/zen/season";
import { dueScheduleItems, upcomingScheduleItems, schedulePreviewAssetId } from "@/lib/zen/schedule";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function HomePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const campaigns = useCreative((s) => s.campaigns);
  const schedule = useCreative((s) => s.schedule);
  const igPosts = useCreative((s) => s.igPosts);
  const memory = useCreative((s) => s.memory);
  const lastPack = useCreative((s) => s.lastPack);
  const setCreateIntent = useCreative((s) => s.setCreateIntent);
  const markPublished = useCreative((s) => s.markPublished);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [hitBusy, setHitBusy] = useState(false);
  const [winBusy, setWinBusy] = useState<string | null>(null);
  const [remoteHits, setRemoteHits] = useState<SearchHit[]>([]);
  const season = seasonContext();
  const featured = campaigns.find((c) => c.id === "camp_floating_light") ?? campaigns[0];
  const remain = featured ? daysUntil(featured.date) : null;
  const learned = useMemo(() => learnFromPosts(igPosts), [igPosts]);
  const createHint = useMemo(() => nextCreateHint(igPosts), [igPosts]);
  const wantsCreate = isCreateQuery(q);

  const urls = useAssetUrls(useMemo(() => assets.map((a) => a.id), [assets]));
  const localHits = useMemo(
    () => (q.trim() ? creativeSearch(q, { assets, campaigns, igPosts, memory }) : []),
    [q, assets, campaigns, igPosts, memory],
  );
  const hits = useMemo(() => {
    const seen = new Set(localHits.map((h) => `${h.source}:${h.id}`));
    const merged = [...localHits];
    for (const hit of remoteHits) {
      const key = `${hit.source}:${hit.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
    }
    return merged;
  }, [localHits, remoteHits]);
  const grouped = groupSearchHits(hits);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setRemoteHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchCreativeWorld({ data: { query } })
        .then((result) => {
          if (result.ok) setRemoteHits(result.hits);
        })
        .catch(() => setRemoteHits([]));
    }, 320);
    return () => window.clearTimeout(timer);
  }, [q]);
  const upcoming = useMemo(() => upcomingScheduleItems(schedule), [schedule]);
  const due = useMemo(() => dueScheduleItems(schedule), [schedule]);
  const recentGen = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  async function createFromFeatured() {
    if (!featured) return;
    setBusy(true);
    try {
      await runIdeaPack({
        idea: `${featured.name} ${featured.tagline}`,
        notes: composeMemoryNotes([
          featured.studentPain,
          `成效回饋：${createHint.line}`,
          `避開：${createHint.avoid}`,
        ]),
        campaign: featured,
      });
    } finally {
      setBusy(false);
    }
  }

  async function createFromSearch() {
    const idea = q.trim();
    if (!idea) return;
    setBusy(true);
    try {
      await runIdeaPack({ idea });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">{APP_TAGLINE}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">{APP_NAME}</h1>
          <p className="mt-2 max-w-xl text-base text-fg">今天可以創作什麼？</p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {CLUB_SHORT}一人創作台。{season.label} · {season.studentNow}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            快速開始
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            空白畫布
          </Button>
        </div>
      </div>

      {featured ? (
        <section className="mt-8 overflow-hidden rounded-[1.75rem] bg-surface p-5 shadow-[var(--shadow-artboard)] md:p-8">
          <p className="text-xs tracking-[0.16em] text-muted uppercase">今天推薦創作</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-dusk">{formatMd(featured.date)} {featured.name}</p>
              <h2 className="mt-1 font-display text-3xl leading-tight md:text-4xl">{featured.tagline}</h2>
              {remain !== null ? (
                <p className="mt-2 text-sm text-muted">{remain > 0 ? `還有 ${remain} 天` : remain === 0 ? "就是今天" : "已結束，可做回顧"}</p>
              ) : null}
              <p className="mt-3 max-w-md text-sm text-muted" data-testid="next-create-hint">
                AI 建議：{createHint.line}
              </p>
              {due.length ? (
                <p className="mt-2 text-sm text-dusk">有 {due.length} 則到時間了，可以直接發。</p>
              ) : null}
            </div>
            <Button size="lg" disabled={busy} onClick={() => void createFromFeatured()}>
              <Sparkles className="size-4" />
              {busy ? "正在想…" : "AI 幫我創作"}
            </Button>
          </div>
        </section>
      ) : null}

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-subtle" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="找以前晚上的茶會照片、龜龜、浮游禪光…"
          className="h-12 rounded-2xl pl-10"
        />
      </div>
      {q.trim() ? (
        <p className="mt-3 text-sm text-muted">
          {hits.length > 0
            ? `找到 ${hits.length} 個相關素材 · 依 Drive、Canva、IG、AI 生成分類`
            : wantsCreate
              ? "會用品牌記憶、過去內容與淡江學生情境生成。"
              : "本機還沒對上這句。試試「找以前晚上的茶會照片」或「找有龜龜的素材」。"}
        </p>
      ) : null}
      {wantsCreate ? (
        <Button
          className="mt-3 min-h-11 w-full sm:w-auto"
          data-testid="home-idea-pack"
          disabled={busy}
          onClick={() => void createFromSearch()}
        >
          <Sparkles className="size-4" />
          {busy
            ? "正在找素材、想方向…"
            : hits.length > 0
              ? `根據 ${hits.length} 個相關素材生成 3 個方向`
              : "AI 生成完整宣傳"}
        </Button>
      ) : null}
      {hits.length > 0 ? (
        <div className="mt-3 space-y-4">
          {grouped.map((group) => (
            <div key={group.source}>
              <p className="text-[11px] tracking-wide text-muted uppercase">{sourceLabel(group.source)}</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {group.items.slice(0, 4).map((hit) => (
                  <SearchHitCard
                    key={`${hit.source}-${hit.id}`}
                    hit={hit}
                    busy={hitBusy}
                    onCreate={(item) => {
                      setHitBusy(true);
                      void createFromHit(item)
                        .then((ok) => {
                          if (ok) void navigate({ to: "/create" });
                        })
                        .finally(() => setHitBusy(false));
                    }}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {lastPack ? (
        <section className="mt-8" data-testid="home-last-pack">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-medium">剛才 AI 生成</h2>
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link to="/calendar">看日曆節奏</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/create">繼續修</Link>
              </Button>
            </div>
          </div>
          <PackResult
            compact
            pack={lastPack}
            campaignId={
              campaigns.find(
                (campaign) =>
                  campaign.name === lastPack.campaignName || lastPack.campaignName.includes(campaign.name),
              )?.id ?? featured?.id
            }
            onApply={async (directionId) => {
              const campaignId =
                campaigns.find(
                  (campaign) =>
                    campaign.name === lastPack.campaignName || lastPack.campaignName.includes(campaign.name),
                )?.id ?? featured?.id;
              const result = await applyPickedDirection({
                pack: lastPack,
                directionId,
                campaignId,
              });
              if (!result.ok) return;
              void navigate({ to: "/instagram" });
            }}
            onSuiteDone={() => navigate({ to: "/instagram" })}
          />
        </section>
      ) : null}

      {due.length ? (
        <section className="mt-8" data-testid="home-due">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-sm font-medium">現在可以發</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/calendar">打開排程</Link>
            </Button>
          </div>
          <ul className="space-y-3">
            {due.map((item) => {
              const assetId = schedulePreviewAssetId(item, campaigns);
              const imageSrc = resolveAssetSrc(
                assetId,
                urls,
                assets.find((asset) => asset.id === assetId)?.seedSrc,
              );
              return (
                <li key={item.id} className="rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]">
                  <p className="text-xs text-muted">
                    {formatDate(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                  </p>
                  <p className="mt-1 text-sm font-medium">{item.title}</p>
                  {item.captionPreview ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{item.captionPreview}</p>
                  ) : null}
                  <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <PublishIgButton
                      caption={item.captionPreview || item.title}
                      imageSrc={imageSrc}
                      onPublished={() => {
                        markPublished(item.id);
                        toast.success("已寫進過去 IG，下次生成會參考這則");
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        openScheduledPreview(item);
                        void navigate({ to: "/instagram" });
                      }}
                    >
                      看畫面
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        markPublished(item.id);
                        toast.success("已寫進過去 IG，下次生成會參考這則");
                      }}
                    >
                      寫進過去 IG
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">今日靈感</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/inspire">全部</Link>
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {inspirationFeed().slice(0, 2).map((seed) => (
            <li key={seed.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">{seed.watch}</p>
              <p className="mt-2 text-sm font-medium">{seed.zenClub.hook}</p>
              <p className="mt-1 text-xs text-muted">{seed.zenClub.why}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setCreateIntent({
                    idea: seed.zenClub.hook,
                    kind: kindFromInspiration(seed),
                    autoGenerate: true,
                    pack: true,
                    notes: inspirationCreateNotes(seed),
                  });
                  void navigate({ to: "/create" });
                }}
              >
                用這個 Hook 創作
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium">快速開始</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          {(
            [
              { label: "從一句想法開始", to: "/create", intent: { idea: "最近是不是連休息都覺得有罪惡感？", kind: "emotion", autoGenerate: true, pack: true } },
              { label: "生成 IG 貼文", to: "/create", intent: { idea: "下週有一場茶會", kind: "event", autoGenerate: true, pack: true } },
              { label: "生成圖片", to: "/create/image" },
              { label: "從一張圖片開始", to: "/create/image" },
              { label: "生成 Story", to: "/create", intent: { idea: "把活動做成 3 到 5 張限動", kind: "story", autoGenerate: true } },
              { label: "生成 Carousel", to: "/create", intent: { idea: "茶會 Carousel，第一頁先講生活", kind: "carousel", autoGenerate: true } },
              { label: "生成 Reels", to: "/create", intent: { idea: "茶會 Reels，前三秒先讓學生停下來", kind: "reels", autoGenerate: true } },
              { label: "建立活動", to: "/campaigns" },
              { label: "從 Drive 素材", to: "/connect" },
              { label: "從 Canva 設計", to: "/connect" },
              { label: "從以前 IG", to: "/instagram" },
              { label: "靈感研究", to: "/inspire" },
            ] as const
          ).map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => {
                if ("intent" in item && item.intent) setCreateIntent(item.intent);
                else setCreateIntent(null);
              }}
              className="rounded-2xl bg-surface px-4 py-4 text-sm shadow-[var(--shadow-border)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium">近期活動</h2>
          <ul className="mt-3 space-y-2">
            {campaigns.map((camp) => (
              <li key={camp.id}>
                <Link
                  to="/campaigns/$campaignId"
                  params={{ campaignId: camp.id }}
                  className="flex min-h-16 items-center justify-between rounded-2xl bg-surface px-4 shadow-[var(--shadow-border)]"
                >
                  <span>
                    <span className="block text-sm font-medium">{camp.name}</span>
                    <span className="text-xs text-muted">
                      {formatMd(camp.date)} · {camp.location}
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-medium">已排程</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((item) => (
              <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {formatDate(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                </p>
                <p className="text-sm font-medium">{item.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">最近創作</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/create">全部</Link>
          </Button>
        </div>
        {recentGen.length === 0 ? (
          <EmptyState icon={Images} title="還沒有作品" description="從推薦創作或快速開始。" />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recentGen.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} brand={brands.find((b) => b.id === project.brandId)} urls={urls} compact />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium">過去表現不錯</h2>
        <p className="mt-2 text-xs text-muted">{createHint.rates}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {learned.winning.slice(0, 3).map((post) => (
            <li key={post.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">{post.hook}</p>
              <p className="mt-2 text-xs text-muted">
                收藏 {post.saves} · 觸及 {post.reach} · {whyPostWorked(post)}
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                data-testid={post.id === learned.winning[0]?.id ? "winning-create" : undefined}
                disabled={Boolean(winBusy)}
                onClick={() => {
                  setWinBusy(post.id);
                  void createFromHit(hitFromIgPost(post))
                    .then((ok) => {
                      if (ok) void navigate({ to: "/create" });
                    })
                    .finally(() => setWinBusy(null));
                }}
              >
                {winBusy === post.id ? "正在延續…" : "延續這篇再做"}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">最近素材</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/assets">素材庫</Link>
          </Button>
        </div>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {assets.slice(0, 6).map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              <Link to="/assets">
                <div className="aspect-square bg-bg">
                  {resolveAssetSrc(asset.id, urls, asset.seedSrc) ? (
                    <img src={resolveAssetSrc(asset.id, urls, asset.seedSrc)} alt={asset.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-muted">載入中</div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <NewProjectDialog open={open} onOpenChange={setOpen} />
      <CreateLaunchSheet open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}

function sourceLabel(source: string) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  if (source === "campaign") return "活動";
  if (source === "brand") return "Brand";
  return "素材";
}
