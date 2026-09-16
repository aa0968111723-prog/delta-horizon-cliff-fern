import { IgFeedPreview } from "@/components/ig/ig-feed-preview";
import { InsightLessons } from "@/components/ig/insight-lessons";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArtboardView } from "@/components/studio/artboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { runPublishItem } from "@/lib/connect/publish-item";
import { syncConnection } from "@/lib/connect/sync";
import { pagesOf } from "@/lib/studio/layers";
import { clubCreativeDna } from "@/lib/zen/dna";
import { feelLabel, type PostFeel } from "@/lib/zen/feel";
import { igMemoryFromSchedule } from "@/lib/zen/memory";
import { soonestScheduled } from "@/lib/zen/schedule";
import { igHookAnalysis } from "@/lib/zen/review";
import { useStudio } from "@/stores/studio-store";
import type { ScheduleItem } from "@/lib/studio/types";
import { previewMediaId } from "@/lib/ai/reels-asset";
import { AssetMedia } from "@/components/shared/asset-media";

export function InstagramCenter() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { posted?: string };
  const hydrated = useStudio((s) => s.hydrated);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const igMemory = useStudio((s) => s.igMemory);
  const assets = useStudio((s) => s.assets);
  const campaigns = useStudio((s) => s.campaigns);
  const schedule = useStudio((s) => s.schedule);
  const publishSchedule = useStudio((s) => s.publishSchedule);
  const rateIgMemory = useStudio((s) => s.rateIgMemory);
  const upsertIgMemory = useStudio((s) => s.upsertIgMemory);
  const setConnection = useStudio((s) => s.setConnection);
  const brand = brands[0];
  const postedId = search.posted;
  const [selected, setSelected] = useState<string | null>(postedId ?? igMemory[0]?.id ?? null);
  const [analysis, setAnalysis] = useState<ReturnType<typeof igHookAnalysis> | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const gridProjects = projects.filter((p) => p.activeFormatId.startsWith("feed") || p.contentKind === "carousel");
  const upcoming = soonestScheduled(schedule, 12);
  const stories = upcoming.filter((item) => item.kind === "story" || item.kind === "countdown");
  const reels = upcoming.filter((item) => item.kind === "reels");
  const videoIds = assets.filter((asset) => asset.kind === "video" || asset.mime.startsWith("video/")).map((asset) => asset.id);
  const post = igMemory.find((p) => p.id === selected);

  const dna = useMemo(
    () => clubCreativeDna({ brand, igMemory, campaigns, assets }),
    [igMemory, brand, assets, campaigns],
  );

  useEffect(() => {
    if (postedId) setSelected(postedId);
  }, [postedId]);

  async function publishItem(item: ScheduleItem) {
    setPublishingId(item.id);
    try {
      const result = await runPublishItem(item);
      toast.message(result.note);
      if (result.marked) {
        publishSchedule(item.id, result.extra);
        const memory = igMemoryFromSchedule({
          ...item,
          status: "published",
          publishedAt: Date.now(),
          permalink: result.extra?.permalink ?? item.permalink,
          mediaUrl: result.extra?.mediaUrl ?? item.mediaUrl,
          igMediaId: result.extra?.igMediaId ?? item.igMediaId,
        });
        toast.success("已寫進過去 IG。可標記學生會不會停，下次生成會學。");
        void navigate({ to: "/ig", search: { posted: memory.id } });
      }
    } finally {
      setPublishingId(null);
    }
  }

  function rate(id: string, feel: PostFeel) {
    rateIgMemory(id, feel);
    toast.success(`已記成「${feelLabel(feel)}」，下次生成會參考`);
  }

  async function pullInsights() {
    setSyncing(true);
    try {
      const result = await syncConnection({ data: { provider: "instagram" } });
      if (result.igPosts.length) upsertIgMemory(result.igPosts);
      setConnection("instagram", {
        lastSyncAt: Date.now(),
        status: result.connected ? "connected" : "disconnected",
        ...(result.accountLabel ? { accountLabel: result.accountLabel } : {}),
      });
      toast.message(result.note);
    } finally {
      setSyncing(false);
    }
  }

  if (!hydrated) {
    return <LoadingState label="讀取 IG…" />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 pb-nav md:px-8 md:py-10" data-testid="ig-ready">
      <PageHeader
        kicker="Instagram"
        title="IG 是產品出口"
        description="Feed、Grid、文案、歷史、DNA。官方連接在「連接」。"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={syncing} data-testid="ig-pull-insights" onClick={() => void pullInsights()}>
              {syncing ? "讀取中" : "讀取成效"}
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link to="/connect">連接 IG</Link>
            </Button>
          </div>
        }
      />

      <section className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-sm font-medium">{brand?.handle ?? "@tamkang.zen"}</p>
        <p className="mt-1 text-sm text-muted">{brand?.name} · 一人創作中控台</p>
        <p className="mt-2 text-xs text-muted">
          DNA：{dna.palette} · 常用 CTA「{dna.ctas[0]}」· Caption 約 {dna.captionLength} 字
        </p>
        <p className="mt-2 text-xs text-subtle">{dna.voice}</p>
        <p className="mt-2 text-xs text-muted">喜歡 {dna.likes.join("、")} · 視覺 {dna.visual}</p>
      </section>

      <IgFeedPreview
        handle={brand?.handle ?? "@tamkang.zen"}
        upcoming={upcoming}
        stories={stories}
        reels={reels}
        memory={igMemory}
        urls={urls}
        videoIds={videoIds}
        publishingId={publishingId}
        postedId={postedId}
        onPublish={(item) => void publishItem(item)}
        onRate={rate}
        onSelect={(id) => {
          setSelected(id);
          setAnalysis(null);
        }}
      />

      <section className="mt-8">
        <h2 className="text-sm font-medium">Grid Preview</h2>
        <ul className="mt-3 grid grid-cols-3 gap-1" data-testid="ig-upcoming-grid">
          {upcoming
            .filter((item) => item.kind === "ig-post" || item.kind === "carousel")
            .slice(0, 6)
            .map((item) => {
              const project = item.projectId ? projects.find((p) => p.id === item.projectId) : null;
              const page = project ? pagesOf(project)[0] : null;
              const src = item.imageAssetId ? urls[item.imageAssetId] : null;
              return (
                <li key={`up-${item.id}`} className="relative aspect-square overflow-hidden bg-surface-2">
                  {src ? (
                    <img src={src} alt={item.title} data-testid="ig-upcoming-thumb" className="size-full object-cover" />
                  ) : page && brand ? (
                    <ArtboardView artboard={page} brand={brand} urls={urls} width={140} />
                  ) : (
                    <span className="flex size-full items-center p-2 text-left text-xs">{item.title}</span>
                  )}
                  <span className="absolute bottom-1 left-1 rounded-full bg-surface px-2 py-0.5 text-xs text-fg">即將</span>
                </li>
              );
            })}
          {gridProjects
            .filter((project) => !upcoming.some((item) => item.projectId === project.id))
            .map((project) => {
            const page = pagesOf(project)[0];
            return (
              <li key={project.id} className="aspect-square overflow-hidden bg-surface-2">
                <Link to="/studio/$projectId" params={{ projectId: project.id }} className="flex size-full items-center justify-center">
                  {page && brand ? <ArtboardView artboard={page} brand={brand} urls={urls} width={140} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium">過去 IG</h2>
        <ul className="mt-3 grid grid-cols-3 gap-1">
          {igMemory.map((postItem) => (
            <li key={postItem.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(postItem.id);
                  setAnalysis(null);
                }}
                className="aspect-square w-full overflow-hidden bg-surface-2"
              >
                {postItem.assetId && urls[postItem.assetId] ? (
                  <AssetMedia
                    src={urls[postItem.assetId]}
                    video={videoIds.includes(postItem.assetId)}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : postItem.mediaUrl ? (
                  <img src={postItem.mediaUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center p-2 text-left text-xs">{postItem.caption}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {post ? (
          <article className="mt-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">
              Instagram / {post.date} · {post.kind}
              {post.feel ? ` · ${feelLabel(post.feel)}` : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{post.caption}</p>
            <p className="mt-2 text-xs text-muted">
              收藏 {post.saves ?? "—"} · 留言 {post.comments ?? 0} · 按讚 {post.likes ?? "—"}
              {post.reach != null ? ` · 觸及 ${post.reach}` : ""}
            </p>
            <p className="mt-3 text-sm">{post.analysis || "問句 Hook、生活語氣，時間地點要更靠近第一屏。"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAnalysis(igHookAnalysis(post.caption))}>
                AI 分析
              </Button>
              <Button size="sm" onClick={() => void navigate({ to: "/create", search: { mode: "from-ig", idea: post.caption } })}>
                從這篇延伸
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["strong", "ok", "weak"] as PostFeel[]).map((feel) => (
                <Button
                  key={feel}
                  size="sm"
                  variant={post.feel === feel ? "default" : "secondary"}
                  onClick={() => rate(post.id, feel)}
                >
                  {feelLabel(feel)}
                </Button>
              ))}
            </div>
            {analysis ? (
              <ul className="mt-3 space-y-1 text-sm text-muted">
                <li>Hook：{analysis.hook}</li>
                <li>視覺：{analysis.visual}</li>
                <li>主題：{analysis.theme}</li>
                <li>Caption 長度：{analysis.length}</li>
                <li>CTA：{analysis.cta}</li>
                <li>內容方向：{analysis.direction}</li>
                {analysis.improve.map((note) => (
                  <li key={note}>可改善：{note}</li>
                ))}
                <li>太宗教？{analysis.review.tooReligious}</li>
                <li>太 AI？{analysis.review.tooAi}</li>
              </ul>
            ) : null}
          </article>
        ) : null}
      </section>

      <section className="mt-8" data-testid="ig-upcoming-list">
        <h2 className="text-sm font-medium">即將發布</h2>
        <ul className="mt-3 space-y-2">
          {upcoming.slice(0, 6).map((item) => (
              <li
                key={item.id}
                data-testid="ig-upcoming-row"
                className="flex gap-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]"
              >
                {previewMediaId(item) && urls[previewMediaId(item)!] ? (
                  <AssetMedia
                    src={urls[previewMediaId(item)!]}
                    video={Boolean(item.videoAssetId && videoIds.includes(item.videoAssetId))}
                    alt=""
                    testId="schedule-thumb"
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                {item.title}
                <span className="mt-1 block text-xs text-muted">{item.kind}</span>
                {item.caption ? (
                  <p className="mt-2 line-clamp-3 text-xs text-muted" data-testid="ig-caption">
                    {item.caption}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={publishingId === item.id}
                    onClick={() => void publishItem(item)}
                  >
                    發布到 IG
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      publishSchedule(item.id);
                      toast.success("已寫進過去 IG");
                    }}
                  >
                    標記已發布
                  </Button>
                </div>
                </div>
              </li>
            ))}
        </ul>
      </section>

      <InsightLessons posts={igMemory} />
    </main>
  );
}
