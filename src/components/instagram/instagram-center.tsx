import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls, resolveAssetSrc } from "@/hooks/use-asset-urls";
import { generateCopyPack } from "@/lib/ai/copy";
import { IG_DNA } from "@/lib/zen/memory";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { ArtboardView } from "@/components/studio/artboard-view";
import { pagesOf } from "@/lib/studio/layers";

export function InstagramCenter() {
  const igPosts = useCreative((s) => s.igPosts);
  const schedule = useCreative((s) => s.schedule);
  const addIgPost = useCreative((s) => s.addIgPost);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(useMemo(() => [...assets.map((a) => a.id), ...igPosts.map((p) => p.assetId)], [assets, igPosts]));
  const [active, setActive] = useState(igPosts[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const post = igPosts.find((p) => p.id === active);
  const brand = brands[0];
  const previewProject = projects.find((p) => p.contentKind === "carousel") ?? projects[0];
  const previewPages = previewProject ? pagesOf(previewProject) : [];
  const upcoming = [...schedule]
    .filter((item) => ["ig-post", "carousel", "story", "reels"].includes(item.contentKind))
    .sort((a, b) => a.scheduledAt - b.scheduledAt)
    .slice(0, 5);

  async function analyze() {
    if (!post) return;
    setBusy(true);
    try {
      const result = await generateCopyPack({
        data: {
          idea: post.caption,
          kind: post.mediaType === "reels" ? "reels" : post.mediaType === "carousel" ? "carousel" : "emotion",
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const review = result.pack.studentReview;
      addIgPost({
        ...post,
        hook: result.pack.hook,
        analysis: `Hook：${result.pack.hook}\n視覺／主題：看學生會不會停。${review.wouldStop}\n太宗教？${review.tooReligious} 太 AI？${review.tooAi} 太長？${review.tooLong}\n時間地點：${review.knowsWhenWhere}`,
      });
      toast.success("已寫入 IG 記憶");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="過去 IG"
        description={`DNA：${IG_DNA.voice} Caption ${IG_DNA.captionLength}`}
      />
      <section className="mt-6 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs text-muted">Zen Club IG DNA</p>
        <p className="mt-2 text-sm">{IG_DNA.visual}</p>
        <p className="mt-1 text-xs text-muted">
          CTA {IG_DNA.cta.join("／")} · {IG_DNA.hashtags.join(" ")}
        </p>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <div className="grid grid-cols-3 gap-1">
            {igPosts.map((item) => {
              const src = resolveAssetSrc(item.assetId, urls, assets.find((a) => a.id === item.assetId)?.seedSrc);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className="aspect-square overflow-hidden bg-surface"
                >
                  {src ? (
                    <img src={src} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs text-muted">{item.mediaType}</span>
                  )}
                </button>
              );
            })}
          </div>
          {post ? (
            <article className="mt-6 rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-xs text-muted">
                {new Date(post.postedAt).toISOString().slice(0, 10)} · {post.mediaType}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.caption}</p>
              <p className="mt-3 text-xs text-muted">
                收藏 {post.saves} · 留言 {post.comments} · 觸及 {post.reach}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{post.analysis}</p>
              <Button className="mt-4" variant="secondary" size="sm" disabled={busy} onClick={() => void analyze()}>
                {busy ? "分析中…" : "AI 分析"}
              </Button>
            </article>
          ) : null}
        </div>
        <aside className="space-y-6">
          <div>
            <p className="text-sm font-medium">Feed Preview</p>
            <div className="mt-3 rounded-[1.5rem] bg-surface p-3 shadow-[var(--shadow-artboard)]">
              {previewPages[0] && brand ? (
                <ArtboardView artboard={previewPages[0]} brand={brand} urls={urls} width={220} />
              ) : (
                <p className="py-16 text-center text-xs text-muted">還沒有預覽</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">即將發布</p>
            <ul className="mt-3 space-y-2">
              {upcoming.map((item) => (
                <li key={item.id} className="rounded-2xl bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
                  <p className="text-xs text-muted">
                    {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                  </p>
                  <p className="text-sm">{item.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
