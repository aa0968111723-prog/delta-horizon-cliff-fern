import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArtboardView } from "@/components/studio/artboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { pagesOf } from "@/lib/studio/layers";
import { igHookAnalysis } from "@/lib/zen/review";
import { useStudio } from "@/stores/studio-store";

export function InstagramCenter() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const igMemory = useStudio((s) => s.igMemory);
  const assets = useStudio((s) => s.assets);
  const brand = brands[0];
  const [selected, setSelected] = useState<string | null>(igMemory[0]?.id ?? null);
  const [analysis, setAnalysis] = useState<ReturnType<typeof igHookAnalysis> | null>(null);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const gridProjects = projects.filter((p) => p.activeFormatId.startsWith("feed") || p.contentKind === "carousel");
  const post = igMemory.find((p) => p.id === selected);

  const dna = useMemo(() => {
    const captions = igMemory.map((p) => p.caption);
    const avg = captions.length ? Math.round(captions.reduce((n, c) => n + c.length, 0) / captions.length) : 0;
    return {
      palette: brand?.colors.map((c) => c.label).join(" / ") ?? "",
      voice: brand?.voice ?? "",
      length: avg,
      cta: brand?.ctas[0] ?? "來坐一下",
    };
  }, [igMemory, brand]);

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
          DNA：{dna.palette} · 常用 CTA「{dna.cta}」· Caption 約 {dna.length} 字
        </p>
        <p className="mt-2 text-xs text-subtle">{dna.voice}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium">Grid Preview</h2>
        <ul className="mt-3 grid grid-cols-3 gap-1">
          {gridProjects.map((project) => {
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
                <li>Caption 長度：{analysis.length}</li>
                {analysis.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
                <li>太宗教？{analysis.review.tooReligious}</li>
                <li>太 AI？{analysis.review.tooAi}</li>
              </ul>
            ) : null}
          </article>
        ) : null}
      </section>
    </main>
  );
}
