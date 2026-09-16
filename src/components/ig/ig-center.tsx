import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { mockStudentSim } from "@/lib/ai/pack-mock";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { ArtboardView } from "@/components/studio/artboard-view";
import { cn } from "@/lib/utils";

export function IgCenter() {
  const igPosts = useCreative((s) => s.igPosts);
  const analyzeIg = useCreative((s) => s.analyzeIg);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const brand = brands[0];
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(igPosts[0]?.id ?? null);
  const active = igPosts.find((p) => p.id === activeId);
  const gridProjects = useMemo(() => projects.filter((p) => p.status !== "idea").slice(0, 5), [projects]);

  function analyze() {
    if (!active) return;
    const sim = mockStudentSim({
      hook: active.caption.split("\n")[0] ?? "",
      caption: active.caption,
      when: format(active.takenAt, "yyyy-MM-dd"),
      where: "淡江",
      cta: "",
    });
    analyzeIg(active.id, {
      hook: active.caption.split("\n")[0] ?? "",
      visual: "生活感畫面",
      theme: active.analysis?.theme ?? "日常",
      captionLength: active.caption.length,
      cta: active.analysis?.cta ?? "弱",
      direction: "延續自己的 IG DNA，不要套模板。",
      improve: sim.revisions.length ? sim.revisions : ["Hook 可以更生活"],
      studentSim: sim,
    });
    toast.success("已用淡江學生視角看過這篇");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">Instagram Center</p>
      <h1 className="mt-1 font-display text-3xl">貼文長得像自己的帳號</h1>
      <p className="mt-2 text-sm text-muted">Grid、Caption、歷史、DNA。連接官方 API 後會讀真實貼文；現在先用社團 Content Memory。</p>

      <h2 className="mt-8 text-sm font-medium">Feed Preview</h2>
      <div className="mt-3 grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
        {igPosts.map((post) => {
          const src = post.assetIds[0] ? urls[post.assetIds[0]] : "";
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => setActiveId(post.id)}
              className={cn("aspect-square bg-surface-2", activeId === post.id && "ring-2 ring-accent")}
            >
              {src ? <img src={src} alt="" className="size-full object-cover" /> : null}
            </button>
          );
        })}
        {gridProjects.map((project) => {
          const board = project.artboards[project.activeFormatId];
          if (!board || !brand) return null;
          return (
            <div key={project.id} className="flex aspect-square items-center justify-center bg-bg">
              <ArtboardView artboard={board} brand={brand} urls={urls} width={120} />
            </div>
          );
        })}
      </div>

      {active ? (
        <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">
            {format(active.takenAt, "yyyy.MM.dd", { locale: zhTW })} · {active.mediaType}
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">{active.caption}</pre>
          <p className="mt-3 text-xs text-muted">
            收藏 {active.saves ?? "—"} · 留言 {active.comments ?? "—"} · 觸及 {active.reach ?? "—"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="min-h-11" onClick={analyze}>
              AI 分析
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() =>
                void navigate({
                  to: "/create",
                  search: { q: `延續這篇 IG：${active.caption.split("\n")[0]}`, auto: "1", mode: "post" },
                })
              }
            >
              從這篇再生一篇
            </Button>
          </div>
          {active.analysis ? (
            <div className="mt-4 space-y-2 text-sm">
              <p>Hook：{active.analysis.hook}</p>
              <p>視覺：{active.analysis.visual}</p>
              <p>Caption 長度：{active.analysis.captionLength} 字</p>
              <p>CTA：{active.analysis.cta}</p>
              <p>方向：{active.analysis.direction}</p>
              <p>可改善：{active.analysis.improve.join("、")}</p>
              <div className="mt-3 rounded-2xl bg-bg p-3 text-xs text-muted">
                <p>哪種 Hook 比較有效？問句比社團介紹更容易停。</p>
                <p className="mt-1">哪種圖片學生比較停留？茶會圍坐、龜龜、河岸光，比寺廟海報高。</p>
                <p className="mt-1">Carousel 哪種結構比較好？第一頁生活，第三頁才出現活動。</p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">Zen Club IG DNA</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          <li>配色：霧亞麻、淡水綠、夜間三色光</li>
          <li>語氣：口語、短、先生活再活動</li>
          <li>常見 CTA：晚上來坐一下、帶一個朋友</li>
          <li>圖片：茶會圍坐、龜龜、河岸、光，不是寺廟</li>
          <li>學生比較會停的是問句 Hook，不是社團介紹</li>
        </ul>
      </section>
    </main>
  );
}
