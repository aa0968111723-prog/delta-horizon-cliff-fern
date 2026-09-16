import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Clapperboard, Images } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { applyVisualDirection } from "@/components/create/apply-visual";
import { applyFormatSequence } from "@/components/create/apply-sequence";
import { createFromHit } from "@/components/create/from-hit";
import { openCanvaDraft } from "@/components/create/open-canva";
import { openScheduledPreview } from "@/components/create/open-preview";
import { DueSlotActions, DueSlotCard } from "@/components/instagram/due-slot";
import { FormatScriptPanel } from "@/components/instagram/format-script";
import { IgPostSheet } from "@/components/instagram/post-sheet";
import { PublishIgButton } from "@/components/instagram/publish-button";
import { PageHeader } from "@/components/shared/page-header";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAssetUrls, resolveAssetSrc } from "@/hooks/use-asset-urls";
import { generateCopyPack } from "@/lib/ai/copy";
import { syncInstagramMemory } from "@/lib/ai/oauth";
import { ingestUrlToLibrary } from "@/lib/zen/ingest-client";
import { FORMATS } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import { SEED_ASSETS } from "@/lib/studio/seed";
import { canvaDraftNotes, canvaPresetForFormat } from "@/lib/zen/canva-draft";
import type { FormatId } from "@/lib/studio/types";
import { uid } from "@/lib/studio/ids";
import { hitFromIgPost } from "@/lib/zen/from-hit";
import { dnaPromptIdea, igDnaBlock, learnFromPosts, recentPostedNotes } from "@/lib/zen/insights";
import { IG_DNA } from "@/lib/zen/memory";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import { tonightAt, contentKindForFormat, convertFromPlan, convertTargetForPreview, formatIdForContentKind, formatScript } from "@/lib/zen/convert";
import { isWaveScheduleItem, schedulePreviewAssetId, placeScheduleItems, dueScheduleItems } from "@/lib/zen/schedule";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

type Tab = "grid" | "preview" | "calendar";

const PREVIEW_FORMATS: FormatId[] = ["feed-portrait", "feed-square", "story", "reels-cover", "threads", "line"];

export function InstagramCenter() {
  const navigate = useNavigate();
  const igPosts = useCreative((s) => s.igPosts);
  const schedule = useCreative((s) => s.schedule);
  const campaigns = useCreative((s) => s.campaigns);
  const igView = useCreative((s) => s.igView);
  const igFormat = useCreative((s) => s.igFormat);
  const setIgView = useCreative((s) => s.setIgView);
  const lastVisualAssetId = useCreative((s) => s.lastVisualAssetId);
  const lastSequence = useCreative((s) => s.lastSequence);
  const sequences = useCreative((s) => s.sequences);
  const lastPack = useCreative((s) => s.lastPack);
  const previewScheduleId = useCreative((s) => s.previewScheduleId);
  const setIgFormat = useCreative((s) => s.setIgFormat);
  const setIgPreview = useCreative((s) => s.setIgPreview);
  const patchCampaign = useCreative((s) => s.patchCampaign);
  const addIgPost = useCreative((s) => s.addIgPost);
  const setConnection = useCreative((s) => s.setConnection);
  const igStatus = useCreative((s) => s.connections.find((c) => c.id === "instagram")?.status);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const markPublished = useCreative((s) => s.markPublished);
  const projects = useStudio((s) => s.projects);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setLastProjectId = useStudio((s) => s.setLastProjectId);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const addAsset = useStudio((s) => s.addAsset);
  const setCopy = useStudio((s) => s.setCopy);
  const ensureArtboard = useStudio((s) => s.ensureArtboard);
  const setActiveFormat = useStudio((s) => s.setActiveFormat);
  const setSlide = useStudio((s) => s.setSlide);
  const due = useMemo(() => dueScheduleItems(schedule, Date.now(), 6), [schedule]);
  const dueIds = useMemo(() => new Set(due.map((item) => item.id)), [due]);
  const upcoming = useMemo(
    () =>
      [...schedule]
        .filter((item) => item.status !== "published")
        .filter((item) => !dueIds.has(item.id))
        .filter((item) => ["ig-post", "carousel", "story", "reels", "threads"].includes(item.contentKind))
        .filter((item) => !isWaveScheduleItem(item))
        .sort((a, b) => a.scheduledAt - b.scheduledAt),
    [schedule, dueIds],
  );
  const previewIds = useMemo(() => {
    const ids = [
      ...assets.map((a) => a.id),
      ...igPosts.map((p) => p.assetId),
      ...due.map((item) => schedulePreviewAssetId(item, campaigns)).filter((id): id is string => Boolean(id)),
      ...upcoming.map((item) => schedulePreviewAssetId(item, campaigns)).filter((id): id is string => Boolean(id)),
      ...(lastVisualAssetId ? [lastVisualAssetId] : []),
      ...(lastSequence?.assetIds ?? []),
      ...sequences.flatMap((row) => row.assetIds),
    ];
    return [...new Set(ids)];
  }, [assets, igPosts, due, upcoming, campaigns, lastVisualAssetId, lastSequence, sequences]);
  const urls = useAssetUrls(previewIds);
  const [tab, setTab] = useState<Tab>(igView);
  const [active, setActive] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [dnaBusy, setDnaBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [beatBusy, setBeatBusy] = useState<string | null>(null);
  const [canvaBusy, setCanvaBusy] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<FormatId>(igFormat);
  const [caption, setCaption] = useState("");
  const post = igPosts.find((p) => p.id === active);
  const brand = brands[0];
  const learned = useMemo(() => learnFromPosts(igPosts), [igPosts]);
  const filmstrip = useMemo(() => {
    if (previewFormat === "story") {
      return sequences.find((row) => row.kind === "story") ?? (lastSequence?.kind === "story" ? lastSequence : null);
    }
    if (previewFormat === "reels-cover") {
      return sequences.find((row) => row.kind === "reels") ?? (lastSequence?.kind === "reels" ? lastSequence : null);
    }
    if (previewFormat === "threads") {
      return sequences.find((row) => row.kind === "threads") ?? (lastSequence?.kind === "threads" ? lastSequence : null);
    }
    if (previewFormat === "line") {
      return sequences.find((row) => row.kind === "line") ?? (lastSequence?.kind === "line" ? lastSequence : null);
    }
    return (
      sequences.find((row) => row.kind === "carousel") ??
      sequences.find((row) => row.kind === "post") ??
      lastSequence
    );
  }, [previewFormat, sequences, lastSequence]);
  const previewProject =
    (filmstrip ? projects.find((p) => p.id === filmstrip.projectId) : undefined) ??
    projects.find((p) => p.id === lastProjectId) ??
    projects.find((p) => p.activeFormatId === previewFormat) ??
    projects.find((p) => pagesOf(p, previewFormat).length) ??
    projects[0];
  const previewPages = previewProject ? pagesOf(previewProject, previewFormat) : [];
  const previewScript = useMemo(() => {
    if (!lastPack) return null;
    return formatScript(convertFromPlan(lastPack.plan), previewFormat, previewProject?.contentKind);
  }, [lastPack, previewFormat, previewProject?.contentKind]);
  const previewAssetId =
    lastVisualAssetId ??
    filmstrip?.assetIds[previewProject?.slideIndex ?? 0] ??
    filmstrip?.assetIds[0] ??
    previewPages[0]?.layers.find((layer) => layer.type === "image")?.assetId ??
    previewPages[0]?.background.assetId ??
    assets[0]?.id ??
    null;
  const previewImageSrc = resolveAssetSrc(
    previewAssetId,
    urls,
    assets.find((asset) => asset.id === previewAssetId)?.seedSrc ??
      SEED_ASSETS.find((asset) => asset.id === previewAssetId)?.seedSrc,
  );

  useEffect(() => {
    setTab(igView);
  }, [igView]);

  useEffect(() => {
    setPreviewFormat(igFormat);
    if (igView !== "preview" || !lastProjectId) return;
    ensureArtboard(lastProjectId, igFormat);
    setActiveFormat(lastProjectId, igFormat);
  }, [igFormat, lastProjectId, igView]);

  useEffect(() => {
    const opened = schedule.find((item) => item.id === previewScheduleId);
    if (opened?.captionPreview) {
      setCaption(opened.captionPreview);
      return;
    }
    if (previewProject) setCaption(previewProject.copy.caption || previewProject.copy.headline);
  }, [previewScheduleId, schedule, previewProject?.id, previewProject?.copy.caption, previewProject?.copy.headline]);

  async function analyze() {
    if (!post) return;
    setBusy(true);
    try {
      const result = await generateCopyPack({
        data: {
          idea: post.caption,
          kind: post.mediaType === "reels" ? "reels" : post.mediaType === "carousel" ? "carousel" : "emotion",
          dnaNotes: igDnaBlock(igPosts),
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

  async function createFromActive() {
    if (!post) return;
    setCreateBusy(true);
    try {
      const ok = await createFromHit(hitFromIgPost(post));
      if (ok) {
        setSheetOpen(false);
        await navigate({ to: "/create" });
      }
    } finally {
      setCreateBusy(false);
    }
  }

  async function syncOfficial() {
    setSyncBusy(true);
    try {
      const result = await syncInstagramMemory();
      if (!result.ok) {
        toast.message(result.error);
        setConnection("instagram", {
          status: result.connected ? "connected" : "disconnected",
          detail: result.error,
        });
        return;
      }
      for (const live of result.posts) {
        const pixelId = `asset_${live.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 60);
        const ingested = live.mediaUrl
          ? await ingestUrlToLibrary({
              id: pixelId,
              name: live.hook || live.caption.slice(0, 24),
              source: "instagram",
              url: live.mediaUrl,
              tags: [live.mediaType],
              addAsset,
            })
          : false;
        addIgPost({
          ...live,
          assetId: ingested ? pixelId : "asset_tamsui",
        });
      }
      if (result.posts[0]) setActive(result.posts[0].id);
      setConnection("instagram", {
        status: "connected",
        lastSyncAt: Date.now(),
        detail: `已讀取 ${result.posts.length} 則官方貼文`,
      });
      toast.success(`已同步 ${result.posts.length} 則 IG 進記憶`);
    } finally {
      setSyncBusy(false);
    }
  }

  async function writeFromDna() {
    setDnaBusy(true);
    try {
      const result = await generateCopyPack({
        data: {
          idea: dnaPromptIdea(igPosts),
          kind: "emotion",
          dnaNotes: igDnaBlock(igPosts),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
    upsertSchedule({
        id: uid("sch"),
        title: result.pack.hook,
        contentKind: "ig-post",
        status: "idea",
        scheduledAt: tonightAt(2),
        publishedAt: null,
        projectId: null,
        campaignId: null,
        captionPreview: result.pack.body,
      });
      toast.success("已用 IG DNA 寫出新文案，並放進日曆草稿");
      await navigate({ to: "/create" });
    } finally {
      setDnaBusy(false);
    }
  }

  function saveCaption() {
    if (!previewProject) return;
    ensureArtboard(previewProject.id, previewFormat);
    setActiveFormat(previewProject.id, previewFormat);
    setCopy(previewProject.id, { caption });
    toast.success("已更新 Caption");
  }

  async function sendPreviewToCanva() {
    const slide = previewProject?.slideIndex ?? 0;
    const assetId =
      lastVisualAssetId ??
      filmstrip?.assetIds[slide] ??
      filmstrip?.assetIds[0] ??
      null;
    const seedSrc = assets.find((a) => a.id === assetId)?.seedSrc;
    const imageSrc = resolveAssetSrc(assetId, urls, seedSrc);
    setCanvaBusy(true);
    try {
      await openCanvaDraft({
        title: lastPack?.campaignName || previewProject?.name || "禪光",
        hook: lastPack?.copy.hook || caption.split("\n")[0],
        notes:
          canvaDraftNotes({
            hook: lastPack?.copy.hook,
            body: caption,
            cta: lastPack?.copy.cta,
            hashtags: lastPack?.copy.hashtags,
          }) || caption,
        preset: canvaPresetForFormat(previewFormat),
        imageSrc,
      });
    } finally {
      setCanvaBusy(false);
    }
  }

  function scheduleCurrent() {
    if (!caption.trim()) {
      toast.message("還沒有文案可以排。");
      return;
    }
    const campaignId =
      lastPack?.campaignName
        ? campaigns.find((row) => row.name === lastPack.campaignName || lastPack.campaignName.includes(row.name))?.id ??
          null
        : null;
    const [placed] = placeScheduleItems(schedule, [
      {
        id: uid("sch"),
        title: (lastPack?.copy.hook || previewProject?.name || "今晚").slice(0, 48),
        contentKind: previewProject?.contentKind ?? contentKindForFormat(previewFormat),
        status: "scheduled",
        scheduledAt: tonightAt(0),
        publishedAt: null,
        projectId: previewProject?.id ?? lastSequence?.projectId ?? null,
        campaignId,
        captionPreview: previewScript && previewScript.kind !== "post" ? previewScript.rows.map((row) => `${row.kicker} ${row.title}`).join("\n") : caption,
        sequence: lastSequence && lastSequence.kind === (previewScript?.kind ?? "") ? lastSequence : undefined,
      },
    ]);
    if (placed) upsertSchedule(placed);
    if (campaignId && lastVisualAssetId) {
      const campaign = campaigns.find((row) => row.id === campaignId);
      if (campaign) {
        patchCampaign(campaignId, {
          relatedAssetIds: [lastVisualAssetId, ...campaign.relatedAssetIds.filter((id) => id !== lastVisualAssetId)].slice(0, 8),
        });
      }
    }
    toast.success("已排進日曆（避開已有的活動廣告夜）");
    void navigate({ to: "/calendar" });
  }

  function rememberPreviewPublished() {
    const campaignId =
      lastPack?.campaignName
        ? campaigns.find((row) => row.name === lastPack.campaignName || lastPack.campaignName.includes(row.name))?.id ??
          null
        : null;
    const existing = schedule.find(
      (item) =>
        item.status !== "published" &&
        (item.projectId === previewProject?.id || item.sequence?.projectId === lastSequence?.projectId),
    );
    if (existing) {
      markPublished(existing.id);
      toast.success("已寫進過去 IG，下次生成會參考這則");
      setTab("grid");
      setIgView("grid");
      return;
    }
    const id = uid("sch");
    upsertSchedule({
      id,
      title: (lastPack?.copy.hook || previewProject?.name || "IG").slice(0, 48),
      contentKind: previewProject?.contentKind ?? contentKindForFormat(previewFormat),
      status: "scheduled",
      scheduledAt: Date.now(),
      publishedAt: null,
      projectId: previewProject?.id ?? lastSequence?.projectId ?? null,
      campaignId,
      captionPreview: caption,
      sequence: lastSequence,
    });
    markPublished(id);
    toast.success("已寫進過去 IG");
    setTab("grid");
    setIgView("grid");
  }

  async function makeAllVisuals() {
    if (!lastPack || !previewScript) return;
    const kind = previewScript.kind;
    if (kind !== "carousel" && kind !== "story" && kind !== "reels") return;
    setBeatBusy("all");
    try {
      const result = await applyFormatSequence({
        pack: lastPack,
        kind,
        campaignId:
          campaigns.find(
            (campaign) => campaign.name === lastPack.campaignName || lastPack.campaignName.includes(campaign.name),
          )?.id ?? null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`已做成 ${result.labels.length} 張畫面`);
    } finally {
      setBeatBusy(null);
    }
  }

  async function makeBeatVisual(beat: { id: string; title: string; kicker: string }) {
    if (!lastPack) return;
    setBeatBusy(beat.id);
    try {
      const pack = {
        ...lastPack,
        directions: lastPack.directions?.map((dir, i) =>
          i === 0 ? { ...dir, headline: beat.title, subhead: beat.kicker } : dir,
        ),
      };
      const result = await applyVisualDirection({
        pack,
        formatId: previewFormat,
        convertTarget: convertTargetForPreview(previewFormat, previewProject?.contentKind),
        contentKind: previewProject?.contentKind,
        caption: beat.title,
        campaignId:
          campaigns.find((campaign) => campaign.name === lastPack.campaignName || lastPack.campaignName.includes(campaign.name))
            ?.id ?? null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("已做成這一拍畫面");
    } finally {
      setBeatBusy(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="過去 IG"
        description={`DNA：${IG_DNA.voice} Caption ${IG_DNA.captionLength}`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {([
          ["grid", "Grid"],
          ["preview", "Preview"],
          ["calendar", "Calendar"],
        ] as const).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "secondary"}
            data-testid={`ig-tab-${id}`}
            onClick={() => {
              setTab(id);
              setIgView(id);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === "grid" ? (
      <section className="mt-6 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs text-muted">Zen Club IG DNA</p>
        <p className="mt-2 text-sm">{IG_DNA.visual}</p>
        <p className="mt-1 text-xs text-muted">
          CTA {IG_DNA.cta.join("／")} · {IG_DNA.hashtags.join(" ")}
        </p>
        <p className="mt-3 text-xs text-muted">有效 Hook：{learned.winningHooks.join("／")}</p>
        <p className="mt-1 text-xs text-muted">
          問句收藏率 {(learned.questionSaveRate * 100).toFixed(1)}% · 公告 {(learned.announceSaveRate * 100).toFixed(1)}%
          {learned.reelsSaveRate ? ` · Reels ${(learned.reelsSaveRate * 100).toFixed(1)}%` : ""}
          {learned.carouselSaveRate ? ` · Carousel ${(learned.carouselSaveRate * 100).toFixed(1)}%` : ""}
        </p>
        <p className="mt-2 text-sm">{learned.whatWorks}</p>
        <p className="mt-1 text-xs text-muted">{learned.whatFails}</p>
        <p className="mt-2 text-sm">{recentPostedNotes(igPosts)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={dnaBusy} onClick={() => void writeFromDna()}>
            {dnaBusy ? "寫作中…" : "用這個 DNA 寫新文案"}
          </Button>
          <Button size="sm" variant="secondary" disabled={syncBusy} onClick={() => void syncOfficial()}>
            {syncBusy ? "同步中…" : "同步官方內容"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          {igStatus === "connected" ? "只讀 Meta 官方授權範圍內的貼文。" : "還沒連接時會提示，不會爬蟲或存帳密。"}
        </p>
      </section>
      ) : null}

      {tab === "grid" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="grid grid-cols-3 gap-1">
              {igPosts.map((item) => {
                const seedSrc =
                  assets.find((a) => a.id === item.assetId)?.seedSrc ??
                  SEED_ASSETS.find((a) => a.id === item.assetId)?.seedSrc;
                const src = item.mediaUrl || resolveAssetSrc(item.assetId, urls, seedSrc);
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid="ig-grid-post"
                    data-media-type={item.mediaType}
                    onClick={() => {
                      setActive(item.id);
                      setSheetOpen(true);
                    }}
                    className={cn(
                      "relative aspect-square min-h-11 overflow-hidden bg-surface",
                      active === item.id && "ring-2 ring-accent",
                    )}
                  >
                    {src ? (
                      <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs text-muted">{item.mediaType}</span>
                    )}
                    {item.mediaType === "carousel" ? (
                      <Images className="absolute top-1.5 right-1.5 size-4 text-bg drop-shadow" aria-hidden />
                    ) : item.mediaType === "reels" ? (
                      <Clapperboard className="absolute top-1.5 right-1.5 size-4 text-bg drop-shadow" aria-hidden />
                    ) : null}
                  </button>
                );
              })}
            </div>
            {due.length > 0 ? (
              <section className="mt-6" data-testid="ig-due">
                <p className="text-sm font-medium">現在可以發</p>
                <ul className="mt-2 space-y-3">
                  {due.map((item) => {
                    const assetId = schedulePreviewAssetId(item, campaigns);
                    return (
                      <DueSlotCard
                        key={item.id}
                        item={item}
                        imageSrc={resolveAssetSrc(
                          assetId,
                          urls,
                          assets.find((asset) => asset.id === assetId)?.seedSrc ??
                            SEED_ASSETS.find((asset) => asset.id === assetId)?.seedSrc,
                        )}
                      />
                    );
                  })}
                </ul>
              </section>
            ) : null}
            {upcoming.length > 0 ? (
              <div className="mt-6">
                <p className="text-sm font-medium">即將發布</p>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {upcoming.slice(0, 6).map((item) => {
                    const assetId = schedulePreviewAssetId(item, campaigns);
                    const seedSrc =
                      assets.find((a) => a.id === assetId)?.seedSrc ??
                      SEED_ASSETS.find((a) => a.id === assetId)?.seedSrc;
                    const src = resolveAssetSrc(assetId, urls, seedSrc);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          openScheduledPreview(item);
                          setTab("preview");
                          setPreviewFormat(formatIdForContentKind(item.contentKind));
                        }}
                        className="relative aspect-square overflow-hidden bg-surface"
                      >
                        {src ? (
                          <img src={src} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center bg-surface text-xs text-muted">
                            {CONTENT_KIND_LABEL[item.contentKind]}
                          </span>
                        )}
                        <span className="absolute inset-x-0 bottom-0 bg-fg/55 px-2 py-1 text-left text-xs text-bg">
                          {format(item.scheduledAt, "M/d", { locale: zhTW })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <IgPostSheet
              post={post ?? null}
              src={
                post
                  ? post.mediaUrl ||
                    resolveAssetSrc(
                      post.assetId,
                      urls,
                      assets.find((a) => a.id === post.assetId)?.seedSrc ??
                        SEED_ASSETS.find((a) => a.id === post.assetId)?.seedSrc,
                    )
                  : undefined
              }
              open={sheetOpen && Boolean(post)}
              onOpenChange={setSheetOpen}
              analyzeBusy={busy}
              createBusy={createBusy}
              onAnalyze={() => void analyze()}
              onCreate={() => void createFromActive()}
            />
          </div>
          <aside className="space-y-4">
            <p className="text-sm font-medium">哪種 Hook 比較有效</p>
            <ul className="space-y-2">
              {learned.ranked.slice(0, 4).map((item) => (
                <li key={item.id} className="rounded-2xl bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
                  <p className="text-xs text-muted">收藏 {item.saves} · 觸及 {item.reach}</p>
                  <p className="text-sm">{item.hook}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}

      {tab === "preview" ? (
        <section className="mt-6">
          <div className="flex flex-wrap gap-2">
            {PREVIEW_FORMATS.map((id) => {
              const meta = FORMATS.find((f) => f.id === id);
              return (
                <Button
                  key={id}
                  size="sm"
                  variant={previewFormat === id ? "default" : "secondary"}
                  onClick={() => {
                    setPreviewFormat(id);
                    setIgFormat(id);
                    const match =
                      id === "story"
                        ? sequences.find((row) => row.kind === "story")
                        : id === "reels-cover"
                          ? sequences.find((row) => row.kind === "reels")
                          : id === "feed-portrait" || id === "feed-square"
                            ? sequences.find((row) => row.kind === "carousel")
                            : undefined;
                    const projectId = match?.projectId ?? previewProject?.id;
                    if (match) {
                      useCreative.getState().setLastSequence(match);
                      setIgPreview(match.assetIds[0] ?? null, id);
                      setLastProjectId(match.projectId);
                      setSlide(match.projectId, 0);
                    }
                    if (projectId) {
                      ensureArtboard(projectId, id);
                      setActiveFormat(projectId, id);
                    }
                  }}
                >
                  {meta?.name ?? id}
                </Button>
              );
            })}
          </div>
          <div className="mt-4 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-artboard)]">
              {previewPages[previewProject?.slideIndex ?? 0] && brand ? (
                <ArtboardView
                  artboard={previewPages[previewProject?.slideIndex ?? 0]!}
                  brand={brand}
                  urls={urls}
                  width={280}
                />
              ) : previewPages[0] && brand ? (
                <ArtboardView artboard={previewPages[0]} brand={brand} urls={urls} width={280} />
              ) : (
                <p className="py-16 text-center text-xs text-muted">還沒有這個尺寸的預覽，先去創作一則。</p>
              )}
              {filmstrip && filmstrip.assetIds.length > 1 ? (
                <div className="mt-3 max-w-full overflow-x-auto overscroll-x-contain">
                  <div className="flex w-max gap-2 pb-1">
                    {filmstrip.assetIds.map((id, index) => {
                      const seedSrc = assets.find((a) => a.id === id)?.seedSrc;
                      const src = resolveAssetSrc(id, urls, seedSrc);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setIgPreview(id, previewFormat);
                            if (filmstrip.projectId) setSlide(filmstrip.projectId, index);
                          }}
                          className={cn(
                            "h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-bg",
                            lastVisualAssetId === id && "ring-2 ring-accent",
                          )}
                        >
                          {src ? (
                            <img src={src} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="flex size-full items-center justify-center px-1 text-xs text-muted">
                              {filmstrip.labels[index] ?? index + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Caption</p>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} />
              <p className="text-xs text-muted">{IG_DNA.hashtags.join(" ")}</p>
              <p className="text-xs text-muted">下一步：Canva 微調 → 排進日曆 → 發布</p>
              <Button size="sm" onClick={saveCaption} disabled={!previewProject}>
                更新文案
              </Button>
              <Button
                size="sm"
                variant="secondary"
                data-testid="preview-canva"
                disabled={canvaBusy}
                onClick={() => void sendPreviewToCanva()}
              >
                {canvaBusy ? "送出中…" : "送到 Canva 微調"}
              </Button>
              <Button size="sm" variant="secondary" onClick={scheduleCurrent} disabled={!caption.trim()}>
                排進日曆
              </Button>
              <PublishIgButton
                caption={caption}
                imageSrc={previewImageSrc}
                onPublished={() => rememberPreviewPublished()}
              />
              <Button size="sm" variant="ghost" onClick={rememberPreviewPublished} disabled={!caption.trim()}>
                寫進過去 IG
              </Button>
              {previewScript ? (
                <FormatScriptPanel
                  script={previewScript}
                  busyId={beatBusy}
                  onMakeVisual={(beat) => makeBeatVisual(beat)}
                  onMakeAll={() => void makeAllVisuals()}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">IG 排程</p>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/calendar">打開完整日曆</Link>
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {due.map((item) => {
              const assetId = schedulePreviewAssetId(item, campaigns);
              return (
                <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                  <p className="text-xs text-muted">
                    {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]} ·
                    現在可以發
                  </p>
                  <p className="text-sm">{item.title}</p>
                  <DueSlotActions
                    item={item}
                    imageSrc={resolveAssetSrc(
                      assetId,
                      urls,
                      assets.find((asset) => asset.id === assetId)?.seedSrc,
                    )}
                  />
                </li>
              );
            })}
            {upcoming.map((item) => (
              <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                </p>
                <p className="text-sm">{item.title}</p>
                <div className="mt-2">
                  <PublishIgButton
                    caption={item.captionPreview}
                    imageSrc={resolveAssetSrc(
                      schedulePreviewAssetId(item, campaigns),
                      urls,
                      assets.find((asset) => asset.id === schedulePreviewAssetId(item, campaigns))?.seedSrc,
                    )}
                    onPublished={() => {
                      markPublished(item.id);
                      toast.success("已寫進過去 IG，下次生成會參考這則");
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
