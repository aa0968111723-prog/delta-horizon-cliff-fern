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
import { compactSeasonSteer } from "@/lib/club/featured";
import { clubInsightsFromPosts, nextCreateFromLearn } from "@/lib/club/insights";
import { academicMoment } from "@/lib/club/season";
import { analyzeIgMemoryPost, applyStudentSimToCopy } from "@/lib/club/ig-analyze";
import { captionFromProject } from "@/lib/creative/publish";
import { coverFromSourceRefs, followPublishedSlot, igGridSlots, upcomingSlotId, upcomingStatusCopy, type IgGridSlot } from "@/lib/creative/ig-feed";
import { contentKindLabel } from "@/lib/studio/content";
import { planPreviewSchedule } from "@/lib/creative/schedule";
import { syncConnectionMemory } from "@/lib/connect/oauth";
import { uid } from "@/lib/studio/ids";
import type { IgMemoryPost } from "@/lib/creative/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { ArtboardView } from "@/components/studio/artboard-view";
import { cn } from "@/lib/utils";
import type { BrandKit, Project } from "@/lib/studio/types";

export function IgCenter({ focusProjectId }: { focusProjectId?: string }) {
  const igPosts = useCreative((s) => s.igPosts);
  const analyzeIg = useCreative((s) => s.analyzeIg);
  const rememberLearn = useCreative((s) => s.rememberLearn);
  const refreshLearnFromIg = useCreative((s) => s.refreshLearnFromIg);
  const lastLearn = useCreative((s) => s.lastLearn);
  const ingestIgPosts = useCreative((s) => s.ingestIgPosts);
  const addMemory = useCreative((s) => s.addMemory);
  const setConnection = useCreative((s) => s.setConnection);
  const campaigns = useCreative((s) => s.campaigns);
  const addCampaign = useCreative((s) => s.addCampaign);
  const generateWaves = useCreative((s) => s.generateWaves);
  const bindScheduledWave = useCreative((s) => s.bindScheduledWave);
  const projects = useStudio((s) => s.projects);
  const updateProject = useStudio((s) => s.updateProject);
  const setCopy = useStudio((s) => s.setCopy);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const brand = brands[0];
  const navigate = useNavigate();
  const slots = useMemo(() => {
    const all = igGridSlots({ projects, posts: igPosts });
    if (!focusProjectId) return all;
    const project = projects.find((item) => item.id === focusProjectId);
    const followed = followPublishedSlot({
      slots: all,
      projectId: focusProjectId,
      caption: project ? captionFromProject(project) : undefined,
      assetIds: coverFromSourceRefs(project?.sourceRefs).assetIds,
    });
    if (!followed) return all;
    return [followed, ...all.filter((slot) => slot.id !== followed.id)];
  }, [projects, igPosts, focusProjectId]);
  const [activeId, setActiveId] = useState<string | null>(
    focusProjectId ? upcomingSlotId(focusProjectId) : slots[0]?.id ?? null,
  );
  const [draftAnalysis, setDraftAnalysis] = useState<Record<string, NonNullable<IgMemoryPost["analysis"]>>>({});
  const [syncingInsights, setSyncingInsights] = useState(false);
  const active = slots.find((slot) => slot.id === activeId) ?? slots[0];
  const activeProject = active?.projectId ? projects.find((item) => item.id === active.projectId) : undefined;
  const memory = useCreative((s) => s.memory);
  const dna = clubDnaFromMemory({ igPosts, memory });
  const insights = clubInsightsFromPosts(igPosts);
  const shownAnalysis = active
    ? (active.origin === "published" ? active.analysis : draftAnalysis[active.id])
    : undefined;

  useEffect(() => {
    if (!focusProjectId) return;
    const project = projects.find((item) => item.id === focusProjectId);
    const followed = followPublishedSlot({
      slots,
      projectId: focusProjectId,
      caption: project ? captionFromProject(project) : undefined,
      assetIds: coverFromSourceRefs(project?.sourceRefs).assetIds,
    });
    if (followed) setActiveId(followed.id);
  }, [focusProjectId, slots, projects]);

  useEffect(() => {
    if (!focusProjectId || !active) return;
    const el = document.querySelector("[data-ig-focus]");
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ block: "start", inline: "nearest" });
  }, [focusProjectId, active?.id]);

  function analyze() {
    if (!active) return;
    if (active.origin === "published" && active.postId) {
      const post = igPosts.find((item) => item.id === active.postId);
      if (!post) return;
      const report = analyzeIgMemoryPost(post);
      analyzeIg(post.id, report);
      rememberLearn(report.hook, post.caption, post.mediaType);
      toast.success("已用淡江學生視角看過這篇");
      return;
    }
    const campaign = activeProject?.campaignId
      ? campaigns.find((item) => item.id === activeProject.campaignId)
      : undefined;
    const report = analyzeIgMemoryPost({
      caption: active.caption,
      mediaType: active.mediaType,
      when: campaign ? `${campaign.date} ${campaign.time}` : undefined,
      where: campaign?.location,
    });
    setDraftAnalysis((prev) => ({
      ...prev,
      [active.id]: report,
    }));
    rememberLearn(report.hook, active.caption, active.mediaType);
    toast.success("已用淡江學生視角看過這篇");
  }

  function applyDraftFixes() {
    if (!active || !activeProject || !shownAnalysis?.studentSim) {
      toast.message("先分析這一則");
      return;
    }
    const campaign = activeProject.campaignId
      ? campaigns.find((item) => item.id === activeProject.campaignId)
      : undefined;
    const nextCopy = applyStudentSimToCopy(
      activeProject.copy,
      shownAnalysis.studentSim,
      campaign ? `${campaign.date} ${campaign.time}` : undefined,
      campaign?.location,
    );
    setCopy(activeProject.id, {
      headline: nextCopy.headline,
      caption: nextCopy.caption,
      body: nextCopy.body,
      cta: nextCopy.cta,
    });
    const caption = captionFromProject({ name: activeProject.name, copy: nextCopy });
    const report = analyzeIgMemoryPost({
      caption,
      mediaType: active.mediaType,
      when: campaign ? `${campaign.date} ${campaign.time}` : undefined,
      where: campaign?.location,
    });
    setDraftAnalysis((prev) => ({ ...prev, [active.id]: report }));
    rememberLearn(report.hook, caption, active.mediaType);
    toast.success("已依淡江學生視角改過 Caption");
  }

  function scheduleActive() {
    if (!active || !activeProject) {
      toast.message("這格還不能排程");
      return;
    }
    const plan = planPreviewSchedule({
      project: {
        id: activeProject.id,
        name: activeProject.name,
        status: activeProject.status,
        scheduledAt: activeProject.scheduledAt,
        campaignId: activeProject.campaignId,
        contentKind: activeProject.contentKind,
        copy: activeProject.copy,
        visualTheme: activeProject.plan?.visualTheme,
        location: activeProject.brief?.location,
      },
      campaigns,
      caption: active.caption,
    });
    if (plan.action === "open") {
      void navigate({ to: "/calendar", search: { day: plan.day } });
      return;
    }
    let campId = plan.campaignId;
    if (!campId && plan.campaignDraft) {
      campId = addCampaign(plan.campaignDraft).id;
    }
    if (!campId) return;
    if (plan.needWaves) generateWaves(campId);
    bindScheduledWave(campId, {
      kind: activeProject.contentKind,
      projectId: activeProject.id,
      scheduledAt: plan.scheduledAt,
      topic: plan.topic,
      status: "scheduled",
    });
    updateProject(activeProject.id, {
      status: "scheduled",
      scheduledAt: plan.scheduledAt,
      campaignId: campId,
    });
    toast.success(`已排進 ${plan.day.slice(5).replace("-", "/")} 月曆`);
    void navigate({ to: "/calendar", search: { day: plan.day } });
  }

  async function pullInsights() {
    setSyncingInsights(true);
    try {
      const result = await syncConnectionMemory({ data: { provider: "instagram" } });
      if (result.ok) {
        for (const item of result.items) addMemory({ ...item, id: item.id || uid("mem") });
        if (result.posts?.length) ingestIgPosts(result.posts);
        else refreshLearnFromIg();
        setConnection("instagram", {
          lastSyncAt: Date.now(),
          status: "connected",
          accountLabel: result.account ?? "Instagram",
        });
        toast.success("已把收藏和停留寫進下次創作");
        return;
      }
      refreshLearnFromIg();
      toast.message(result.message);
    } finally {
      setSyncingInsights(false);
    }
  }

  const focusedCaption = active ? (
    <section
      className={cn("rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]", focusProjectId ? "mt-6" : "mt-8")}
      data-ig-focus={focusProjectId || undefined}
    >
      <p className="text-xs text-muted">
        {active.origin === "upcoming" ? (active.scheduledAt ? "即將 · " : "預覽 · ") : ""}
        {active.origin === "published" || active.scheduledAt
          ? `${format(active.takenAt, "yyyy.MM.dd", { locale: zhTW })} · `
          : ""}
        {activeProject ? contentKindLabel(activeProject.contentKind) : igMediaLabel(active.mediaType)}
      </p>
      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed">{active.caption}</pre>
      {active.origin === "published" ? (
        <p className="mt-2 text-sm" data-published-memory="">
          已進 Content Memory
        </p>
      ) : null}
      {activeProject?.sourceRefs.some((ref) => ref.source === "canva") ||
      assets.find((asset) => asset.id === active.assetIds[0])?.source === "canva" ? (
        <p className="mt-2 text-sm" data-canva-source="returned">
          來源：Canva 微調後
        </p>
      ) : null}
      {active.origin === "published" ? (
        <p className="mt-3 text-xs text-muted">
          收藏 {active.saves ?? "—"} · 留言 {active.comments ?? "—"} · 觸及 {active.reach ?? "—"}
          {active.shares != null ? ` · 分享 ${active.shares}` : ""}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">{upcomingStatusCopy(active)}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {active.origin === "upcoming" && activeProject ? (
          <Button className="min-h-11" onClick={scheduleActive}>
            {activeProject.scheduledAt ? "去月曆" : "排進月曆"}
          </Button>
        ) : null}
        <Button className="min-h-11" variant={active.origin === "published" ? "default" : "secondary"} onClick={analyze}>
          AI 分析
        </Button>
        {active.origin === "upcoming" && shownAnalysis?.studentSim ? (
          <Button className="min-h-11" variant="secondary" onClick={applyDraftFixes}>
            照學生視角改一版
          </Button>
        ) : null}
        {active.origin === "upcoming" ? (
          <PublishButton
            projectId={active.projectId}
            campaignId={activeProject?.campaignId ?? undefined}
            title={active.title}
            caption={active.caption}
            variant="secondary"
            size="default"
            className="rounded-full"
          />
        ) : null}
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
      {shownAnalysis ? (
        <div className="mt-4 space-y-2 text-sm">
          <p>Hook：{shownAnalysis.hook}</p>
          <p>視覺：{shownAnalysis.visual}</p>
          <p>Caption 長度：{shownAnalysis.captionLength} 字</p>
          <p>CTA：{shownAnalysis.cta}</p>
          <p>方向：{shownAnalysis.direction}</p>
          <p>可改善：{shownAnalysis.improve.join(" ")}</p>
          {shownAnalysis.studentSim?.notes.length ? (
            <div className="mt-3 rounded-2xl bg-bg p-3 text-xs text-muted">
              {shownAnalysis.studentSim.notes.map((line) => (
                <p key={line} className="mt-1 first:mt-0">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
          {active.origin === "published" ? (
            <p className="mt-2 text-xs text-subtle">完整帳號節奏在下面「這次 IG 學到」。這裡只看這篇。</p>
          ) : null}
        </div>
      ) : null}
    </section>
  ) : null;

  const feedPreview = (
    <>
      <h2 className={cn("text-sm font-medium", focusProjectId ? "mt-8" : "mt-6")}>Feed Preview</h2>
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
    </>
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">Instagram Center</p>
      <h1 className="mt-1 font-display text-3xl">
        {focusProjectId ? "看這篇會不會停下來" : "貼文長得像自己的帳號"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {focusProjectId
          ? "先看正在預覽的 Caption 和格子。帳號整體學到在下面。"
          : "即將發的排在 Grid 最前面。連接官方 API 後會讀真實貼文；現在先用社團 Content Memory。"}
      </p>

      <DuePublishBar compact />

      {focusProjectId ? (
        <>
          {focusedCaption}
          {feedPreview}
        </>
      ) : (
        <>
          {feedPreview}
          {focusedCaption}
        </>
      )}

      <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]" data-ig-learn="">
        <p className="text-xs tracking-[0.16em] text-muted uppercase">這次 IG 學到</p>
        <p className="mt-2 font-display text-xl leading-snug">
          「{lastLearn?.hook || insights.winningHooks[0] || "問句比社團介紹更容易停"}」
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {insights.answers.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{insights.mixLesson}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="min-h-11 rounded-full" disabled={syncingInsights} onClick={() => void pullInsights()}>
            {syncingInsights ? "正在讀成效…" : "讀取成效"}
          </Button>
          <Button asChild variant="secondary" className="min-h-11 rounded-full">
            <Link
              to="/create"
              search={{
                q: nextCreateFromLearn(
                  lastLearn ?? {
                    hook: insights.winningHooks[0] ?? "最近是不是很久沒坐好？",
                    hookLesson: insights.hookLesson,
                    mixLesson: insights.mixLesson,
                    visualLesson: insights.visualLesson,
                  },
                  { seasonNote: compactSeasonSteer(academicMoment(), lastLearn?.hook ?? insights.winningHooks[0]) },
                ),
                go: "1",
              }}
            >
              用這次學到創作下一篇
            </Link>
          </Button>
        </div>
      </section>

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

function igMediaLabel(mediaType: IgGridSlot["mediaType"]) {
  if (mediaType === "carousel") return "Carousel";
  if (mediaType === "reels") return "Reels";
  return "IG 貼文";
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
  const src = (slot.assetIds[0] && urls[slot.assetIds[0]]) || slot.mediaUrl || "";
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
        <span
          className={cn(
            "absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[10px]",
            slot.status === "scheduled" || slot.scheduledAt ? "bg-accent text-accent-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
          )}
        >
          {slot.status === "scheduled" || slot.scheduledAt ? "即將" : "預覽"}
        </span>
      ) : null}
      {project?.sourceRefs.some((ref) => ref.source === "canva") ? (
        <span className="absolute top-1 left-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] shadow-[var(--shadow-border)]">
          Canva
        </span>
      ) : null}
    </button>
  );
}
