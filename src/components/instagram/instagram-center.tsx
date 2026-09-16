import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls, resolveAssetSrc } from "@/hooks/use-asset-urls";
import { IG_DNA } from "@/lib/zen/memory";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { ArtboardView } from "@/components/studio/artboard-view";
import { pagesOf } from "@/lib/studio/layers";

export function InstagramCenter() {
  const igPosts = useCreative((s) => s.igPosts);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(useMemo(() => [...assets.map((a) => a.id), ...igPosts.map((p) => p.assetId)], [assets, igPosts]));
  const [active, setActive] = useState(igPosts[0]?.id ?? null);
  const post = igPosts.find((p) => p.id === active);
  const brand = brands[0];
  const previewProject = projects.find((p) => p.contentKind === "carousel") ?? projects[0];
  const previewPages = previewProject ? pagesOf(previewProject) : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="過去 IG"
        description={`DNA：${IG_DNA.voice} Caption ${IG_DNA.captionLength}`}
      />
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
              <p className="mt-3 text-sm">{post.analysis}</p>
              <Button className="mt-4" variant="secondary" size="sm">
                AI 分析（已寫入記憶）
              </Button>
            </article>
          ) : null}
        </div>
        <aside>
          <p className="text-sm font-medium">Feed Preview</p>
          <div className="mt-3 rounded-[1.5rem] bg-surface p-3 shadow-[var(--shadow-artboard)]">
            {previewPages[0] && brand ? (
              <ArtboardView artboard={previewPages[0]} brand={brand} urls={urls} width={220} />
            ) : (
              <p className="py-16 text-center text-xs text-muted">還沒有預覽</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
