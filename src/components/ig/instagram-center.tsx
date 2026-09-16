import { InsightLessons } from "@/components/ig/insight-lessons";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArtboardView } from "@/components/studio/artboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { publishInstagramMedia } from "@/lib/connect/instagram-publish";
import { pagesOf } from "@/lib/studio/layers";
import { clubCreativeDna } from "@/lib/zen/dna";
import { canGraphPublish } from "@/lib/zen/memory";
import { igHookAnalysis } from "@/lib/zen/review";
import { useStudio } from "@/stores/studio-store";
import type { ScheduleItem } from "@/lib/studio/types";

export function InstagramCenter() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const igMemory = useStudio((s) => s.igMemory);
  const assets = useStudio((s) => s.assets);
  const campaigns = useStudio((s) => s.campaigns);
  const schedule = useStudio((s) => s.schedule);
  const publishSchedule = useStudio((s) => s.publishSchedule);
  const brand = brands[0];
  const [selected, setSelected] = useState<string | null>(igMemory[0]?.id ?? null);
  const [analysis, setAnalysis] = useState<ReturnType<typeof igHookAnalysis> | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const gridProjects = projects.filter((p) => p.activeFormatId.startsWith("feed") || p.contentKind === "carousel");
  const upcoming = schedule.filter((item) => item.status === "scheduled");
  const post = igMemory.find((p) => p.id === selected);

  const dna = useMemo(
    () => clubCreativeDna({ brand, igMemory, campaigns, assets }),
    [igMemory, brand, assets, campaigns],
  );

  async function publishItem(item: ScheduleItem) {
    const caption = (item.caption || item.title).slice(0, 2200);
    setPublishingId(item.id);
    try {
      await navigator.clipboard.writeText(caption).catch(() => undefined);
      if (canGraphPublish(item.kind)) {
        const result = await publishInstagramMedia({ data: { caption, imageUrl: item.mediaUrl } });
        if (result.ok) {
          publishSchedule(item.id, { mediaUrl: item.mediaUrl });
          toast.success(result.note);
          return;
        }
        toast.message(result.note);
      } else {
        toast.message("限動／Reels／Threads 請在 IG App 發。文案已複製。");
      }
      publishSchedule(item.id);
      toast.success("已標記發布，並寫進過去 IG 記憶");
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram"
        title="IG 是產品出口"
        description="Grid、文案、歷史、DNA。官方連接在「連接」。"
        actions={
          <Button size="sm" variant="secondary" asChild>
            <Link to="/connect">連接 IG</Link>
          </Button>
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

      <section className="mt-8">
        <h2 className="text-sm font-medium">Grid Preview</h2>
        <ul className="mt-3 grid grid-cols-3 gap-1">
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
                    <img src={src} alt={item.title} className="size-full object-cover" />
                  ) : page && brand ? (
                    <ArtboardView artboard={page} brand={brand} urls={urls} width={140} />
                  ) : (
                    <span className="flex size-full items-center p-2 text-left text-xs">{item.title}</span>
                  )}
                  <span className="absolute bottom-1 left-1 rounded-full bg-surface px-2 py-0.5 text-[10px] text-fg">即將</span>
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
                  <img src={urls[postItem.assetId]} alt="" className="size-full object-cover" />
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

      <section className="mt-8">
        <h2 className="text-sm font-medium">即將發布</h2>
        <ul className="mt-3 space-y-2">
          {upcoming.slice(0, 6).map((item) => (
              <li key={item.id} className="flex gap-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
                {item.imageAssetId && urls[item.imageAssetId] ? (
                  <img
                    src={urls[item.imageAssetId]}
                    alt=""
                    data-testid="schedule-thumb"
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                {item.title}
                <span className="mt-1 block text-xs text-muted">{item.kind}</span>
                {item.caption ? <p className="mt-2 line-clamp-3 text-xs text-muted">{item.caption}</p> : null}
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
