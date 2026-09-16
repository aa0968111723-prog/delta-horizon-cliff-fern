import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DuePublishBar } from "@/components/calendar/due-publish-bar";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { clubDnaFromMemory } from "@/lib/club/dna";
import { clubInsightsFromPosts } from "@/lib/club/insights";
import { analyzeIgMemoryPost } from "@/lib/club/ig-analyze";
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
  const queue = useMemo(
    () => projects.filter((p) => p.status === "scheduled" || p.status === "done"),
    [projects],
  );
  const memory = useCreative((s) => s.memory);
  const dna = clubDnaFromMemory({ igPosts, memory });
  const insights = clubInsightsFromPosts(igPosts);

  function analyze() {
    if (!active) return;
    analyzeIg(active.id, analyzeIgMemoryPost(active));
    toast.success("已用淡江學生視角看過這篇");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">Instagram Center</p>
      <h1 className="mt-1 font-display text-3xl">貼文長得像自己的帳號</h1>
      <p className="mt-2 text-sm text-muted">Grid、Caption、歷史、DNA。連接官方 API 後會讀真實貼文；現在先用社團 Content Memory。</p>

      <DuePublishBar compact />

      {queue.length ? (
        <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-medium">準備發布</h2>
          <p className="mt-1 text-xs text-muted">下載檔案不算發布。標記後會進 Content Memory，下次生成會參考。</p>
          <ul className="mt-3 space-y-3">
            {queue.map((project) => (
              <li key={project.id} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm">{project.name}</p>
                  <p className="text-xs text-muted">{project.contentKind}</p>
                </div>
                <PublishButton
                  projectId={project.id}
                  campaignId={project.campaignId ?? undefined}
                  title={project.name}
                  variant="secondary"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mt-8 text-sm font-medium">Feed Preview</h2>
      <div className="mt-3 grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
        {igPosts.map((post) => {
          const src = post.assetIds[0] ? urls[post.assetIds[0]] : post.mediaUrl ?? "";
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => setActiveId(post.id)}
              className={cn("aspect-square bg-surface-2", activeId === post.id && "ring-2 ring-accent")}
            >
              {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="block size-full bg-linear-to-br from-surface-2 to-bg" />}
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
            {active.shares != null ? ` · 分享 ${active.shares}` : ""}
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
                  search: {
                    q: `延續這篇 IG：${active.caption.split("\n")[0]}`,
                    go: "1",
                    mode: "post",
                    asset: active.assetIds[0],
                  },
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
              <p>可改善：{active.analysis.improve.join(" ")}</p>
              <div className="mt-3 rounded-2xl bg-bg p-3 text-xs text-muted">
                {insights.answers.map((line) => (
                  <p key={line} className="mt-1 first:mt-0">
                    {line}
                  </p>
                ))}
                <p className="mt-2">{insights.mixLesson}</p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">Zen Club IG DNA</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          <li>配色：{dna.palette}</li>
          <li>語氣：{dna.voice}</li>
          <li>常見 CTA：{dna.ctas.slice(0, 2).join("、")}</li>
          <li>有效 Hook：{dna.winningHooks.slice(0, 2).join(" ／ ") || "生活問句"}</li>
          <li>{dna.captionHint}</li>
          <li>{insights.mixLesson}</li>
        </ul>
      </section>
    </main>
  );
}
