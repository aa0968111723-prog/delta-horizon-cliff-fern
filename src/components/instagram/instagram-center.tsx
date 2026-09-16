import { Link } from "@tanstack/react-router";
import { Grid3x3, Instagram, Link2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BringRemoteButton } from "@/components/search/bring-remote-button";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { getConnections } from "@/lib/connections/status";
import type { ConnectionStatus } from "@/lib/connections/providers";
import { analyzeIgHistory } from "@/lib/ai/ig-ai";
import { formatBrandMemory } from "@/lib/studio/brand";
import { buildIgDna, buildIgInsights, formatIgInsights, formatIgReading, igHistoryCaptions } from "@/lib/studio/ig-dna";
import { clipSeed } from "@/lib/studio/sources";
import { contentKindLabel } from "@/lib/studio/status";
import {
  igFeedPostCount,
  igGridProjects,
  igHighlights,
  isHighlightKind,
  isIgFeedKind,
  storyPreviewProjects,
} from "@/lib/studio/ig-profile";
import type { BrandKit, Project } from "@/lib/studio/types";
import { IgFeedPreview } from "@/components/instagram/ig-feed-preview";
import { IgStoryPreview } from "@/components/instagram/ig-story-preview";
import { cn } from "@/lib/utils";
import { CLUB_HANDLE, CLUB_INTRO_SHORT, CLUB_NAME } from "@/lib/zen/club";
import { useStudio } from "@/stores/studio-store";
import { useRemote } from "@/stores/remote-store";

type Tab = "grid" | "history" | "dna" | "insights";

/**
 * Instagram Center。IG 是這個產品的主要輸出平台，不是外掛功能。
 *
 * 現在可以做的：把自己做好的內容用 IG Grid 的方式預覽、從內容抽出 IG DNA。
 * 需要連接才有的：過去貼文、真實成效。那些區塊會誠實說還沒連。
 */
export function InstagramCenter() {
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const updateBrand = useStudio((s) => s.updateBrand);
  const remoteItems = useRemote((s) => s.items);
  const igPosts = useMemo(() => remoteItems.filter((item) => item.provider === "instagram"), [remoteItems]);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const [tab, setTab] = useState<Tab>("grid");
  const [gridView, setGridView] = useState<"grid" | "feed" | "story">("grid");
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [readingBusy, setReadingBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void getConnections()
      .then((list) => {
        if (!alive) return;
        setConnection(list.find((item) => item.id === "instagram") ?? null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const brand = brands[0];
  const feed = useMemo(
    () =>
      [...projects]
        .filter((p) => p.status !== "idea")
        .sort((a, b) => (b.publishedAt ?? b.scheduledAt ?? b.updatedAt) - (a.publishedAt ?? a.scheduledAt ?? a.updatedAt)),
    [projects],
  );
  const dna = useMemo(() => buildIgDna(projects, brand, igPosts), [projects, brand, igPosts]);
  const insights = useMemo(() => buildIgInsights(igPosts), [igPosts]);
  const highlights = useMemo(() => igHighlights(feed), [feed]);
  const postCount = igFeedPostCount(projects);
  const gridPosts = useMemo(() => igGridProjects(feed), [feed]);
  const igHistory = useMemo(
    () => feed.filter((project) => isIgFeedKind(project.contentKind) || isHighlightKind(project.contentKind)),
    [feed],
  );
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects],
  );
  const phoneStories = useMemo(() => storyPreviewProjects(feed), [feed]);
  const connected = connection?.state === "connected";
  const reading = brand?.memory.igReading;
  const readingText = formatIgReading(reading);

  async function runHistoryReading() {
    if (!brand) return;
    setReadingBusy(true);
    try {
      const res = await analyzeIgHistory({
        data: {
          captions: igHistoryCaptions(projects, igPosts),
          hooks: dna.hookStarts,
          hashtags: dna.topHashtags.map((row) => row.tag),
          ctas: dna.topCtas.map((row) => row.cta),
          kinds: dna.kinds.map((row) => row.kind),
          captionAvg: dna.captionLength.avg,
          sampleCount: dna.sampleCount,
          insightsText: formatIgInsights(insights) || undefined,
          brandMemoryText: formatBrandMemory(brand.memory, assets),
        },
      });
      updateBrand(brand.id, { memory: { ...brand.memory, igReading: res.reading } });
      if (!res.ok) toast.warning(`${res.error}已放上本機整理。`);
      else if (res.adapter === "local") toast.info("目前是本機整理，不是線上模型的回覆。");
      else toast.success("已讀完過去內容，之後生成會先看這段。");
    } catch {
      toast.error("讀過去內容時出錯了。");
    } finally {
      setReadingBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram"
        title="IG 中心"
        description={`${CLUB_NAME} ${CLUB_HANDLE}。這裡看版面長相、過去內容與帳號自己的語氣習慣。`}
        actions={
          connected ? (
            <Badge variant="success">已連接</Badge>
          ) : (
            <Button asChild variant="secondary">
              <Link to="/connections" search={{ focus: "instagram" }}>
                <Link2 className="size-4" />
                連接 Instagram
              </Link>
            </Button>
          )
        }
      />

      {/* 帳號卡：像 IG 個人頁，追蹤數字沒連上就不編造 */}
      <section className="mt-6 rounded-2xl surface-card p-4">
        <div className="flex items-center gap-4">
          <span className="three-lights flex size-16 shrink-0 items-center justify-center rounded-full">
            <Instagram className="size-6 text-accent-fg" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{CLUB_HANDLE}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-medium tabular-nums">{postCount}</p>
                <p className="text-xs text-subtle">貼文</p>
              </div>
              <div>
                <p className="text-sm font-medium tabular-nums">—</p>
                <p className="text-xs text-subtle">追蹤者</p>
              </div>
              <div>
                <p className="text-sm font-medium tabular-nums">—</p>
                <p className="text-xs text-subtle">追蹤中</p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium">{CLUB_NAME}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{CLUB_INTRO_SHORT}</p>
        <p className="mt-2 text-xs text-subtle">
          {connected ? "已連接。追蹤人數要等同步回來才會顯示真實數字。" : "還沒連接 Instagram，追蹤人數不會用假數字填。"}
        </p>
        {highlights.length ? (
          <ul className="mt-4 flex gap-3 overflow-x-auto pb-1" data-testid="ig-highlights">
            {highlights.map((item) => (
              <li key={item.id} className="w-14 shrink-0 text-center">
                <Link
                  to="/studio/$projectId"
                  params={{ projectId: item.projectId }}
                  className="flex flex-col items-center gap-1"
                >
                  <HighlightCover
                    project={projectById[item.projectId]}
                    brand={brand}
                    urls={urls}
                    fallback={contentKindLabel(item.kind).slice(0, 2)}
                  />
                  <span className="w-full truncate text-xs text-muted">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-subtle">做成限動或 Reels 之後，這裡會出現精選圓圈。</p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(
          [
            { id: "grid" as const, label: "版面預覽" },
            { id: "history" as const, label: "過去 IG" },
            { id: "dna" as const, label: "IG DNA" },
            { id: "insights" as const, label: "成效" },
          ]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-9 rounded-full px-3 text-xs transition-colors",
              tab === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "grid" ? (
        <section className="mt-6">
          <SectionHeader
            title="版面預覽"
            hint="九宮格只放貼文與輪播。限動與 Reels 在上面的精選圓圈。"
            action={
              <div className="flex gap-1 rounded-full bg-surface-2 p-0.5">
                <button
                  type="button"
                  onClick={() => setGridView("grid")}
                  className={cn(
                    "min-h-9 rounded-full px-3 text-xs",
                    gridView === "grid" ? "bg-accent text-accent-fg" : "text-muted",
                  )}
                >
                  網格
                </button>
                <button
                  type="button"
                  onClick={() => setGridView("feed")}
                  className={cn(
                    "min-h-9 rounded-full px-3 text-xs",
                    gridView === "feed" ? "bg-accent text-accent-fg" : "text-muted",
                  )}
                >
                  貼文
                </button>
                <button
                  type="button"
                  onClick={() => setGridView("story")}
                  className={cn(
                    "min-h-9 rounded-full px-3 text-xs",
                    gridView === "story" ? "bg-accent text-accent-fg" : "text-muted",
                  )}
                >
                  限動
                </button>
              </div>
            }
          />
          {feed.length === 0 ? (
            <EmptyBlock
              text="還沒有可以放上版面的內容。做完一篇之後就會出現在這裡。"
              action={
                <Button asChild size="sm">
                  <Link to="/create" search={{ from: "idea" }}>
                    <Sparkles className="size-4" />
                    寫一篇
                  </Link>
                </Button>
              }
            />
          ) : gridView === "story" ? (
            <IgStoryPreview projects={phoneStories} brand={brand} urls={urls} />
          ) : gridPosts.length === 0 ? (
            <EmptyBlock
              text="還沒有貼文可以排進九宮格。限動與 Reels 會出現在上面的精選圓圈。"
              action={
                <Button asChild size="sm">
                  <Link to="/create" search={{ from: "idea" }}>
                    <Sparkles className="size-4" />
                    寫一篇貼文
                  </Link>
                </Button>
              }
            />
          ) : gridView === "grid" ? (
            <ul className="grid grid-cols-3 gap-1" data-testid="ig-grid">
              {gridPosts.map((project) => {
                const board = project.artboards[project.activeFormatId];
                return (
                  <li
                    key={project.id}
                    className="relative aspect-square overflow-hidden bg-surface-2"
                    data-testid="ig-grid-cell"
                    data-kind={project.contentKind}
                  >
                    <Link
                      to="/studio/$projectId"
                      params={{ projectId: project.id }}
                      className="flex size-full items-center justify-center"
                    >
                      {board && brand ? (
                        <ArtboardView artboard={board} brand={brand} urls={urls} width={140} />
                      ) : (
                        <span className="text-xs text-muted">{project.name}</span>
                      )}
                    </Link>
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-fg/55 px-1.5 py-1 text-xs text-accent-fg">
                      {contentKindLabel(project.contentKind)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <IgFeedPreview projects={gridPosts} brand={brand} urls={urls} />
          )}
        </section>
      ) : null}

      {tab === "history" ? (
        <section className="mt-6">
          <SectionHeader title="過去 IG" hint="連接後會帶進真實貼文。沒連上時也可以延續這個工作室裡做過的內容。" />
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" />
              正在確認連接狀態…
            </p>
          ) : null}
          {!loading && igPosts.length ? (
            <ul className="space-y-2">
              {igPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-2xl surface-card p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{post.detail}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {post.metrics?.likes != null ? `${post.metrics.likes} 個讚` : ""}
                      {post.metrics?.comments != null ? ` · ${post.metrics.comments} 則留言` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ExtendLink
                      seed={`${post.title}\n${post.detail}`}
                      kind={post.kind === "video" ? "reels" : "ig-post"}
                    />
                    <BringRemoteButton item={post} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {!loading && connected && !igPosts.length ? (
            <EmptyBlock
              text="已連接，但還沒同步過。到連接頁按一次「同步」就會把過去貼文帶進來。"
              action={
                <Button asChild size="sm">
                  <Link to="/connections" search={{ focus: "instagram" }}>
                    去同步
                  </Link>
                </Button>
              }
            />
          ) : null}
          {!loading && !connected && !igPosts.length ? (
            igHistory.length ? (
              <p className="text-xs text-subtle">
                還沒連接 Instagram。連接之後才有真實貼文；下面是這個工作室裡做過的 IG 內容，可以延續語氣再寫一篇。
              </p>
            ) : (
              <EmptyBlock
                text={`還沒連接 Instagram，所以這裡沒有真實貼文。連接之後 AI 才能讀 ${CLUB_NAME} 過去的 Caption、輪播、Reels 與互動，並用它調整下一篇。`}
                action={
                  <Button asChild size="sm">
                    <Link to="/connections" search={{ focus: "instagram" }}>
                      <Link2 className="size-4" />
                      連接 Instagram
                    </Link>
                  </Button>
                }
              />
            )
          ) : null}
          {igHistory.length ? (
            <ul className={igPosts.length || !connected ? "mt-3 space-y-2" : "space-y-2"}>
              {igHistory.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-2xl surface-card p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {project.copy.caption || project.copy.headline}
                    </p>
                    <p className="mt-1 text-xs text-subtle">{contentKindLabel(project.contentKind)}</p>
                  </div>
                  <ExtendLink
                    seed={project.copy.caption || project.copy.headline || project.name}
                    kind={project.contentKind}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {tab === "dna" ? (
        <section className="mt-6 space-y-4">
          <SectionHeader
            title="IG DNA"
            hint={`從 ${dna.sampleCount} 則自己的內容抽出來的習慣。生成新內容時會優先參考這些。`}
            action={
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="secondary" disabled={readingBusy} onClick={() => void runHistoryReading()}>
                  {readingBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  用 AI 讀這些過去內容
                </Button>
                <Button asChild size="sm">
                  <Link
                    to="/create"
                    search={
                      dna.hookStarts[0]
                        ? { from: "idea", seed: dna.hookStarts[0] }
                        : { from: "idea" }
                    }
                    aria-label="用這個習慣寫新的一篇"
                  >
                    <Sparkles className="size-4" />
                    用這個習慣寫新的一篇
                  </Link>
                </Button>
              </div>
            }
          />
          {readingText ? (
            <div className="rounded-2xl surface-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">帳號自己的語氣</p>
                <Badge variant={reading?.adapter === "live" ? "accent" : "default"}>
                  {reading?.adapter === "live" ? "AI 讀過" : "本機整理"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted">{reading?.voice}</p>
              {reading?.continueWith.length ? (
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {reading.continueWith.map((item) => (
                    <li key={item}>值得延續：{item}</li>
                  ))}
                </ul>
              ) : null}
              {reading?.avoid.length ? (
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {reading.avoid.map((item) => (
                    <li key={item}>不要再做：{item}</li>
                  ))}
                </ul>
              ) : null}
              {reading?.nextPost ? <p className="mt-2 text-xs text-subtle">下一篇可以：{reading.nextPost}</p> : null}
            </div>
          ) : (
            <p className="text-xs text-subtle">
              按「用 AI 讀這些過去內容」之後，生成文案與視覺會先看這段整理。沒連上 AI 時會用本機統計整理，不會編造成效。
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card title="Caption 長度">
              <p className="text-sm text-muted">
                平均 {dna.captionLength.avg} 字（{dna.captionLength.min}–{dna.captionLength.max}）
              </p>
            </Card>
            <Card title="常用配色">
              <ul className="flex flex-wrap gap-1.5">
                {dna.colors.map((hex) => (
                  <li key={hex} className="flex items-center gap-1.5 text-xs text-muted">
                    <span
                      className="size-4 rounded-full shadow-[var(--shadow-border)]"
                      style={{ backgroundColor: hex }}
                    />
                    {hex}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="常用 Hashtag">
              {dna.topHashtags.length ? (
                <ul className="flex flex-wrap gap-1.5 text-xs">
                  {dna.topHashtags.map((row) => (
                    <li key={row.tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
                      {row.tag} · {row.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-subtle">還沒有資料。</p>
              )}
            </Card>
            <Card title="常用 CTA">
              {dna.topCtas.length ? (
                <ul className="space-y-1 text-xs text-muted">
                  {dna.topCtas.map((row) => (
                    <li key={row.cta}>
                      {row.cta} · {row.count} 次
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-subtle">還沒有資料。</p>
              )}
            </Card>
            <Card title="內容型態分布">
              <ul className="space-y-1 text-xs text-muted">
                {dna.kinds.map((row) => (
                  <li key={row.kind}>
                    {contentKindLabel(row.kind as never)} · {row.count}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="開場習慣">
              {dna.hookStarts.length ? (
                <ul className="space-y-1 text-xs text-muted">
                  {dna.hookStarts.map((hook) => (
                    <li key={hook} className="line-clamp-1">
                      「{hook}」
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-subtle">還沒有資料。</p>
              )}
            </Card>
          </div>
          {!connected ? (
            <p className="text-xs text-subtle">
              連接 Instagram 後，這裡會再加上真實貼文的視覺風格、圖片類型與學生互動偏好。
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "insights" ? (
        <section className="mt-6">
          <SectionHeader title="成效" hint="不只看數字，是回答「哪一種 Hook 有效」" />
          {insights.sampleCount && (insights.totalLikes || insights.totalComments || insights.totalReach) ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Card title="按讚">
                  <p className="text-sm text-muted">同步貼文合計 {insights.totalLikes}</p>
                </Card>
                <Card title="留言">
                  <p className="text-sm text-muted">同步貼文合計 {insights.totalComments}</p>
                </Card>
                {insights.totalReach ? (
                  <Card title="觸及／曝光">
                    <p className="text-sm text-muted">同步貼文合計 {insights.totalReach}</p>
                  </Card>
                ) : null}
                {insights.totalSaved ? (
                  <Card title="收藏">
                    <p className="text-sm text-muted">同步貼文合計 {insights.totalSaved}</p>
                  </Card>
                ) : null}
              </div>
              {insights.hookWins.length ? (
                <Card title="哪種開頭比較有效">
                  <ul className="space-y-1 text-xs text-muted">
                    {insights.hookWins.map((row) => (
                      <li key={row.kind}>
                        {row.kind} · 「{row.sample}」
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
              <Card title="互動較高的開頭">
                <ul className="space-y-2 text-xs text-muted">
                  {insights.topPosts.map((post) => (
                    <li key={post.title} className="flex flex-wrap items-start justify-between gap-2">
                      <span>
                        {post.title} · {post.likes} 讚 / {post.comments} 留言
                        {post.saved ? ` / ${post.saved} 收藏` : ""}
                      </span>
                      <ExtendLink seed={post.title} />
                    </li>
                  ))}
                </ul>
              </Card>
              <p className="text-xs text-subtle">這些數字來自 Instagram 同步回來的貼文，不是假資料。</p>
            </div>
          ) : connected ? (
            <EmptyBlock text="已連接，同步之後這裡會分析觸及、互動、收藏與分享，並整理成下一次生成的依據。" />
          ) : (
            <EmptyBlock
              text="還沒連接 Instagram，所以沒有真實成效可以分析。這裡不會放假數據。"
              action={
                <Button asChild size="sm">
                  <Link to="/connections" search={{ focus: "instagram" }}>
                    <Link2 className="size-4" />
                    連接 Instagram
                  </Link>
                </Button>
              }
            />
          )}
          <ul className="mt-4 space-y-1 text-xs text-muted">
            <li>· 哪種 Hook 讓學生停下來？</li>
            <li>· 哪種圖片停留比較久？</li>
            <li>· 輪播哪種結構看到最後一頁？</li>
            <li>· 限動哪種互動比較多？</li>
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function HighlightCover({
  project,
  brand,
  urls,
  fallback,
}: {
  project?: Project;
  brand?: BrandKit;
  urls: Record<string, string>;
  fallback: string;
}) {
  const board = project?.artboards[project.activeFormatId];
  return (
    <span
      data-testid="ig-highlight"
      className="three-lights flex size-14 items-center justify-center rounded-full p-1 shadow-[var(--shadow-border)]"
    >
      <span className="relative size-full overflow-hidden rounded-full bg-surface-2">
        {board && brand ? (
          <span
            data-testid="ig-highlight-cover"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <ArtboardView artboard={board} brand={brand} urls={urls} width={56} />
          </span>
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-accent-fg">{fallback}</span>
        )}
      </span>
    </span>
  );
}

function ExtendLink({ seed, kind }: { seed: string; kind?: string }) {
  return (
    <Button asChild size="sm">
      <Link
        to="/create"
        search={{ from: "idea", seed: clipSeed(seed), ...(kind ? { kind } : {}) }}
        aria-label="延續這則"
      >
        延續這則
      </Link>
    </Button>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl surface-card p-4">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function EmptyBlock({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl surface-card p-6 text-center">
      <Grid3x3 className="mx-auto size-5 text-subtle" />
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
