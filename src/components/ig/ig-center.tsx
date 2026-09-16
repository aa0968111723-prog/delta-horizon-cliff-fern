import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DuePublishBar } from "@/components/calendar/due-publish-bar";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { clubDnaFromMemory } from "@/lib/club/dna";
import { clubInsightsFromPosts } from "@/lib/club/insights";
import { analyzeIgMemoryPost } from "@/lib/club/ig-analyze";
import { igGridSlots, upcomingSlotId, type IgGridSlot } from "@/lib/creative/ig-feed";
import { isoFromMs } from "@/lib/creative/schedule";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { ArtboardView } from "@/components/studio/artboard-view";
import { cn } from "@/lib/utils";
import type { BrandKit, Project } from "@/lib/studio/types";

export function IgCenter({ focusProjectId }: { focusProjectId?: string }) {
  const igPosts = useCreative((s) => s.igPosts);
  const analyzeIg = useCreative((s) => s.analyzeIg);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const brand = brands[0];
  const navigate = useNavigate();
  const slots = useMemo(() => igGridSlots({ projects, posts: igPosts }), [projects, igPosts]);
  const [activeId, setActiveId] = useState<string | null>(
    focusProjectId ? upcomingSlotId(focusProjectId) : slots[0]?.id ?? null,
  );
  const active = slots.find((slot) => slot.id === activeId) ?? slots[0];
  const activeProject = active?.projectId ? projects.find((item) => item.id === active.projectId) : undefined;
  const memory = useCreative((s) => s.memory);
  const dna = clubDnaFromMemory({ igPosts, memory });
  const insights = clubInsightsFromPosts(igPosts);

  useEffect(() => {
    if (focusProjectId) setActiveId(upcomingSlotId(focusProjectId));
  }, [focusProjectId]);

  function analyze() {
    if (!active?.postId) return;
    const post = igPosts.find((item) => item.id === active.postId);
    if (!post) return;
    analyzeIg(post.id, analyzeIgMemoryPost(post));
    toast.success("已用淡江學生視角看過這篇");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">Instagram Center</p>
      <h1 className="mt-1 font-display text-3xl">貼文長得像自己的帳號</h1>
      <p className="mt-2 text-sm text-muted">
        即將發的排在 Grid 最前面。連接官方 API 後會讀真實貼文；現在先用社團 Content Memory。
      </p>

      <DuePublishBar compact />

      <h2 className="mt-8 text-sm font-medium">Feed Preview</h2>
      <p className="mt-1 text-xs text-muted">點即將發的格子可以發到 IG，或先標記進記憶。下載檔案不算發布。</p>
      <div className="mt-3 grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
        {slots.slice(0, 18).map((slot) => (
          <GridCell
            key={slot.id}
            slot={slot}
            active={active?.id === slot.id}
            brand={brand}
            project={slot.projectId ? projects.find((item) => item.id === slot.projectId) : undefined}
            urls={urls}
            onSelect={() => setActiveId(slot.id)}
          />
        ))}
      </div>

      {active ? (
        <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted">
            {active.origin === "upcoming" ? "即將 · " : ""}
            {format(active.takenAt, "yyyy.MM.dd", { locale: zhTW })} · {active.mediaType}
          </p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">{active.caption}</pre>
          {active.origin === "published" ? (
            <p className="mt-3 text-xs text-muted">
              收藏 {active.saves ?? "—"} · 留言 {active.comments ?? "—"} · 觸及 {active.reach ?? "—"}
              {active.shares != null ? ` · 分享 ${active.shares}` : ""}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted">排在 {isoFromMs(active.takenAt).slice(5).replace("-", "/")} · 還沒進帳號</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {active.origin === "published" ? (
              <Button className="min-h-11" onClick={analyze}>
                AI 分析
              </Button>
            ) : (
              <PublishButton
                projectId={active.projectId}
                campaignId={activeProject?.campaignId ?? undefined}
                title={active.title}
                caption={active.caption}
                variant="secondary"
                size="default"
                className="rounded-full"
              />
            )}
            {active.projectId ? (
              <Button asChild variant="secondary" className="min-h-11">
                <Link to="/studio/$projectId" params={{ projectId: active.projectId }}>
                  編輯
                </Link>
              </Button>
            ) : null}
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

function GridCell({
  slot,
  active,
  brand,
  project,
  urls,
  onSelect,
}: {
  slot: IgGridSlot;
  active: boolean;
  brand: BrandKit | undefined;
  project: Project | undefined;
  urls: Record<string, string>;
  onSelect: () => void;
}) {
  const src = slot.assetIds[0] ? urls[slot.assetIds[0]] : slot.mediaUrl ?? "";
  const board = project?.artboards[project.activeFormatId];
  const generated = project?.sourceRefs.find((ref) => ref.id?.startsWith("https:") || ref.id?.startsWith("data:"))?.id;
  const cover = src || generated;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn("relative aspect-square overflow-hidden bg-surface-2", active && "ring-2 ring-accent")}
    >
      {cover ? (
        <img src={cover} alt="" className="size-full object-cover" />
      ) : board && brand ? (
        <span className="absolute inset-0 overflow-hidden bg-bg">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <ArtboardView artboard={board} brand={brand} urls={urls} width={360} />
          </span>
        </span>
      ) : (
        <span className="flex size-full items-end bg-linear-to-br from-surface-2 to-bg p-2 text-left">
          <span className="line-clamp-3 text-[11px] leading-snug">{slot.title}</span>
        </span>
      )}
      {slot.origin === "upcoming" ? (
        <span className="absolute bottom-1 left-1 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-fg">即將</span>
      ) : null}
    </button>
  );
}
