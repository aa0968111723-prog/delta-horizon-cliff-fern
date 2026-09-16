import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { IG_DNA } from "@/lib/club/memory";
import { lessonsFromIg } from "@/lib/club/insights";
import { listConnectedMedia } from "@/lib/connections/oauth";
import { useCreative, type IgMemoryPost } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { ArtboardView } from "@/components/studio/artboard-view";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { pagesOf } from "@/lib/studio/layers";

export function InstagramCenter() {
  const posts = useCreative((s) => s.igPosts);
  const ingestIg = useCreative((s) => s.ingestIg);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const [active, setActive] = useState<IgMemoryPost | null>(null);
  const [live, setLive] = useState<IgMemoryPost[]>([]);
  const brand = brands[0];
  const preview = projects.find((p) => p.contentKind === "carousel") ?? projects[0];
  const artboard = preview ? pagesOf(preview)[preview.slideIndex ?? 0] : undefined;
  const urls = useAssetUrls(
    preview
      ? pagesOf(preview).flatMap((page) =>
          page.layers.flatMap((l) => (l.type === "image" || l.type === "logo" ? [l.assetId ?? ""] : [])),
        )
      : [],
  );

  useEffect(() => {
    void listConnectedMedia().then((result) => {
      const mapped: IgMemoryPost[] = result.instagram.map((item) => ({
        id: item.id,
        mediaType: item.kind === "carousel" ? "carousel" : item.kind === "reels" ? "reels" : "image",
        caption: item.caption || item.title,
        takenAt: item.date ? Date.parse(item.date) : Date.now(),
        thumb: item.thumb,
        permalink: item.notes.startsWith("http") ? item.notes : undefined,
        metrics: item.metrics,
        metricsSource: "live" as const,
        analysis: item.notes,
      }));
      setLive(mapped);
      if (mapped.length) ingestIg(mapped);
    });
  }, [ingestIg]);

  const grid = live.length ? live : posts;
  const lessons = lessonsFromIg(posts);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="IG 是主要輸出"
        description="Feed、Grid、Story、Reels、Caption、排程與歷史記憶都在這裡。連接後會讀官方 API，不會爬蟲。"
        actions={
          <Button asChild variant="secondary">
            <Link to="/connections">連接帳號</Link>
          </Button>
        }
      />

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <h2 className="text-sm font-medium">過去 IG</h2>
          <p className="mt-1 text-xs text-muted">
            {live.length ? "官方 Instagram 內容。" : "本機 Creative Memory。官方授權後會換成真實貼文。"}
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-1">
            {grid.map((post) => (
              <li key={post.id}>
                <button type="button" className="block w-full" onClick={() => setActive(post)}>
                  <img src={post.thumb} alt="" className="aspect-square w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-medium">IG Preview</h2>
          {preview && brand && artboard ? (
            <div className="mt-4 flex justify-center rounded-2xl bg-bg p-3">
              <ArtboardView artboard={artboard} brand={brand} urls={urls} width={160} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">先做一篇內容，這裡會出現 Feed 預覽。</p>
          )}
          <p className="mt-3 text-xs text-muted">{preview?.copy.caption.slice(0, 80)}</p>
        </aside>
      </section>

      {active ? (
        <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex flex-col gap-4 md:flex-row">
            <img src={active.thumb} alt="" className="w-full max-w-xs rounded-2xl object-cover" />
            <div>
              <p className="text-xs text-muted">
                {format(active.takenAt, "yyyy/MM/dd", { locale: zhTW })} · {active.mediaType} · {active.metricsSource === "memory" ? "本機記憶" : "官方 Insights"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{active.caption}</p>
              {active.metrics ? (
                <p className="mt-3 text-xs text-muted">
                  觸及 {active.metrics.reach} · 收藏 {active.metrics.saves} · 留言 {active.metrics.comments}
                </p>
              ) : null}
              <p className="mt-3 text-sm">{active.analysis}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild>
                  <Link
                    to="/create"
                    search={{ tab: "campaign" }}
                    onClick={() => window.sessionStorage.setItem("zen-idea", active.caption)}
                  >
                    AI 分析並做新的
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-10 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">下一次可以怎麼寫</h2>
        <p className="mt-1 text-xs text-muted">用過去表現改善生成，不是報表牆。</p>
        <ul className="mt-4 space-y-3 text-sm">
          <li>Hook：{lessons.hook}</li>
          <li>圖片：{lessons.visual}</li>
          <li>活動文案：{lessons.activity}</li>
          <li>Carousel：{lessons.carousel}</li>
          <li>Story：{lessons.story}</li>
        </ul>
      </section>

      <section className="mt-10 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Zen Club IG DNA</h2>
        <p className="mt-2 text-sm text-muted">{IG_DNA.voice}</p>
        <p className="mt-2 text-sm">配色 {IG_DNA.palette.join("、")}</p>
        <p className="mt-1 text-sm">常用 CTA {IG_DNA.ctas.join("／")}</p>
        <p className="mt-1 text-sm">Caption {IG_DNA.captionLength}</p>
      </section>
    </main>
  );
}
