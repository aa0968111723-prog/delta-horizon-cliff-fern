import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ArtboardView } from "@/components/studio/artboard-view";
import { FormatPreview } from "@/components/create/format-preview";
import { generateCampaignPlan } from "@/lib/ai/campaign";
import { takeAutoRun } from "@/lib/create/handoff";
import { applyStudentReviewToPlan } from "@/lib/copy/review";
import { toBriefInput } from "@/lib/ai/payload";
import { applyPickedDirection, briefFromIdea, flattenHits, mergePlanSources, notesFromHits, summarizeFound } from "@/lib/club/compose";
import { applyCanvaPush, canvaPushMessage, ensurePublicRaster, pushHeroToCanva } from "@/lib/club/canva-push";
import { formatIdFromKind, httpsRasterUrl, lastPackFromPlan, lastPackPreviewSrc, packAssetIds, publicReelsCoverUrl, withPackKind, withReelsVideo } from "@/lib/club/last-pack";
import { parseIdea } from "@/lib/club/idea";
import { lessonPrompt } from "@/lib/club/insights";
import { convertedScheduleInput, matchingScheduleRow } from "@/lib/club/schedule";
import { generateReelsClip } from "@/lib/club/reels-video";
import { runPackPublish } from "@/lib/club/run-publish";
import { CONVERT_TARGETS, allConvertedPacks, convertPlan, reelsVideoPrompt } from "@/lib/convert/pack";
import { folderSearchInput } from "@/lib/connections/presets";
import { generateStudioImage } from "@/lib/image/studio";
import { moodFromVariation, posterDataUrl } from "@/lib/image/poster";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { pagesOf } from "@/lib/studio/layers";
import { searchCreative, type SearchHit } from "@/lib/search/creative";
import { adoptIdeaFromHit } from "@/lib/search/hits";
import type { CampaignPlan, ContentKind, CreativeDirection } from "@/lib/studio/types";
import { sourceLabel, useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { cn } from "@/lib/utils";

type Phase = "idea" | "research" | "directions" | "pack";

export function IdeaFlow({
  seedIdea,
  seedConvertKind,
  seedAutoRun,
}: {
  seedIdea?: string;
  seedConvertKind?: ContentKind;
  seedAutoRun?: boolean;
} = {}) {
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const addAsset = useStudio((s) => s.addAsset);
  const setLastProjectId = useStudio((s) => s.setLastProjectId);
  const campaigns = useCreative((s) => s.campaigns);
  const upsertCampaign = useCreative((s) => s.upsertCampaign);
  const setWaves = useCreative((s) => s.setWaves);
  const setDirections = useCreative((s) => s.setDirections);
  const attachProject = useCreative((s) => s.attachProject);
  const setLastSearch = useCreative((s) => s.setLastSearch);
  const setLastPack = useCreative((s) => s.setLastPack);
  const ingestIg = useCreative((s) => s.ingestIg);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const updateProject = useStudio((s) => s.updateProject);
  const folder = useCreative((s) => s.folder);
  const igPosts = useCreative((s) => s.igPosts);
  const lastPackState = useCreative((s) => s.lastPack);

  const [idea, setIdea] = useState(seedIdea || "下週有一場茶會");
  const [phase, setPhase] = useState<Phase>("idea");
  const [status, setStatus] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [picked, setPicked] = useState<CreativeDirection | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [packKind, setPackKind] = useState<ContentKind>(seedConvertKind || "ig-post");
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [kindUrls, setKindUrls] = useState<Partial<Record<ContentKind, string>>>({});
  const [busy, setBusy] = useState(false);

  const brand = brands[0];
  const projects = useStudio((s) => s.projects);
  const previewProject = projects.find((item) => item.id === projectId);
  const artboard = previewProject ? pagesOf(previewProject)[previewProject.slideIndex ?? 0] : undefined;
  const assetIds = previewProject
    ? pagesOf(previewProject).flatMap((page) =>
        page.layers.flatMap((layer) => (layer.type === "image" || layer.type === "logo" ? [layer.assetId ?? ""] : [])),
      )
    : [];
  const urls = useAssetUrls([...assetIds, ...packAssetIds(lastPackState)]);

  useEffect(() => {
    if (seedIdea) setIdea(seedIdea);
    if (seedConvertKind) setPackKind(seedConvertKind);
  }, [seedIdea, seedConvertKind]);

  useEffect(() => {
    if (!takeAutoRun(seedAutoRun)) return;
    void research(seedIdea || idea);
    // Intentionally once per consumed handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedAutoRun, seedIdea]);

  const converted = plan ? convertPlan(plan, packKind) : null;
  const thumb = heroUrl || hits[0]?.thumb || "/seed/tea.svg";
  const previewSrc =
    kindUrls[packKind] || (lastPackState ? lastPackPreviewSrc(lastPackState, urls, packKind) : thumb);

  async function research(raw = idea, autoPack = Boolean(seedAutoRun)) {
    if (!brand) {
      toast.error("請先在品牌中心確認淡江禪學社品牌。");
      return;
    }
    const parsed = parseIdea(raw);
    setBusy(true);
    setPhase("research");
    setPicked(null);
    setHeroUrl(null);
    setKindUrls({});
    setProjectId(null);
    setStatus("正在找歷屆素材與品牌記憶…");
    try {
      setLastSearch(parsed.searchQuery);
      const search = await searchCreative({ data: folderSearchInput(parsed.searchQuery, folder) });
      const foundHits = flattenHits(search.groups);
      setHits(foundHits);
      setStatus(`找到 ${search.found} 個相關素材。根據過去內容生成 3 個方向…`);
      const brief = briefFromIdea(parsed, notesFromHits(parsed, foundHits));
      const result = await generateCampaignPlan({
        data: toBriefInput(brief, brand, { igLessons: lessonPrompt(igPosts) }),
      });
      if (!result.ok) {
        toast.error(result.error);
        setPhase("idea");
        return;
      }
      const nextPlan = mergePlanSources(result.plan, foundHits);
      setPlan(nextPlan);
      setPhase("directions");
      setStatus(summarizeFound(search.groups).line + "。根據過去內容生成 3 個方向。");
      if (autoPack && nextPlan.directions?.[0]) {
        setStatus(summarizeFound(search.groups).line + "。已依第一個方向做成完整宣傳，可再換方向。");
        await packDirection(nextPlan, nextPlan.directions[0], foundHits, raw);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "創作失敗");
      setPhase("idea");
    } finally {
      setBusy(false);
    }
  }

  async function packDirection(
    currentPlan: CampaignPlan,
    direction: CreativeDirection,
    currentHits = hits,
    raw = idea,
  ) {
    if (!brand) return;
    const parsed = parseIdea(raw);
    const reviewed = applyStudentReviewToPlan(applyPickedDirection(currentPlan, direction));
    const nextPlan = reviewed.plan;
    const brief = briefFromIdea(parsed, notesFromHits(parsed, currentHits));
    const existing = campaigns.find((item) => item.name === parsed.eventName);
    const campaign = upsertCampaign({
      id: existing?.id,
      name: parsed.eventName,
      type: parsed.eventType,
      date: parsed.date,
      time: parsed.time,
      location: parsed.location,
      oneLiner: nextPlan.hook,
      description: nextPlan.concept,
      theme: nextPlan.visualTheme,
      studentPain: nextPlan.insight,
      cta: nextPlan.cta,
    });
    const projectNext = createProject({
      name: nextPlan.campaignName,
      brandId: brand.id,
      formatId: "feed-portrait",
      brief,
      templateId: nextPlan.templateId,
    });
    applyCampaignPlan(projectNext.id, nextPlan, brief);
    setLastProjectId(projectNext.id);
    attachProject(campaign.id, projectNext.id);
    if (nextPlan.waves?.length) setWaves(campaign.id, nextPlan.waves, { syncCalendar: true });
    if (nextPlan.directions?.length) setDirections(campaign.id, nextPlan.directions);
    setPlan(nextPlan);
    setPicked(direction);
    setProjectId(projectNext.id);
    setCampaignId(campaign.id);
    setStatus("正在生成各尺寸主視覺…");
    const packs = allConvertedPacks(nextPlan);
    const formatAssetIds: Partial<Record<ContentKind, string>> = {};
    const nextKindUrls: Partial<Record<ContentKind, string>> = {};
    const painted = await paintHero(direction, nextPlan, raw, packKind);
    const heroAssetId = painted?.id ?? null;
    if (painted) {
      formatAssetIds[packKind] = painted.id;
      nextKindUrls[packKind] = painted.url;
    }
    for (const target of CONVERT_TARGETS) {
      if (target.id === packKind) continue;
      if (painted && formatIdFromKind(target.id) === formatIdFromKind(packKind)) {
        formatAssetIds[target.id] = painted.id;
        nextKindUrls[target.id] = painted.url;
        continue;
      }
      const composed = await composeKindHero(direction, nextPlan, raw, target.id);
      if (composed) {
        formatAssetIds[target.id] = composed.id;
        nextKindUrls[target.id] = composed.url;
      }
    }
    setKindUrls(nextKindUrls);
    const formatPublicUrls = Object.fromEntries(
      Object.entries(nextKindUrls)
        .map(([kind, url]) => [kind, httpsRasterUrl(url)] as const)
        .filter(([, url]) => url),
    ) as Partial<Record<ContentKind, string>>;
    const scheduled = Boolean(nextPlan.waves?.length);
    updateProject(projectNext.id, {
      campaignId: campaign.id,
      contentStatus: scheduled ? "scheduled" : "done",
      scheduledAt: scheduled ? Date.now() : null,
    });
    const packed = lastPackFromPlan({
      projectId: projectNext.id,
      campaignId: campaign.id,
      eventName: parsed.eventName,
      plan: nextPlan,
      kind: packKind,
      converted: packs[packKind],
      packs,
      formatAssetIds,
      formatPublicUrls,
      directionName: direction.name,
      heroAssetId,
      heroThumb: currentHits[0]?.thumb,
    });
    setLastPack(packed);
    setPhase("pack");
    toast.success("已生成主視覺、文案與多模態內容，並依淡江學生視角改過一輪");
    void ensurePublicRaster({
      pack: packed,
      previewSrc: nextKindUrls[packKind] || currentHits[0]?.thumb || "/seed/tea.svg",
      title: parsed.eventName,
    })
      .then((result) => {
        if (!result.changed) return;
        setLastPack(result.pack);
        toast.success(result.message);
      })
      .catch(() => undefined);
  }

  function adoptHit(item: SearchHit) {
    setHeroUrl(item.thumb);
    setIdea(adoptIdeaFromHit(item));
    const current = useCreative.getState().lastPack;
    if (current) {
      setLastPack({ ...current, heroThumb: item.thumb, updatedAt: Date.now() });
    }
    toast.success(`已加入創作 · 來源：${sourceLabel(item.source)} / ${item.title}`);
  }

  function upsertConverted(kind: ContentKind) {
    if (!plan) return null;
    const parsed = parseIdea(idea);
    const draft = convertedScheduleInput({
      eventDate: parsed.date,
      eventName: parsed.eventName,
      kind,
      hook: plan.hook,
      campaignId,
      projectId,
    });
    const existing = matchingScheduleRow(useCreative.getState().schedule, {
      campaignId,
      kind,
      plannedAt: draft.plannedAt,
    });
    return upsertSchedule({ ...draft, id: existing?.id });
  }

  function putOnCalendar() {
    if (!plan) return;
    const row = upsertConverted(packKind);
    if (!row) return;
    if (projectId) {
      updateProject(projectId, {
        campaignId: campaignId,
        contentKind: packKind,
        contentStatus: "scheduled",
        scheduledAt: row.plannedAt,
      });
    }
    const current = useCreative.getState().lastPack;
    if (current) setLastPack(withPackKind(current, packKind, convertPlan(plan, packKind).items));
    toast.success(`已排入 Calendar · ${row.title}`);
    void navigate({ to: "/calendar" });
  }

  function putAllOnCalendar() {
    if (!plan) return;
    const rows = CONVERT_TARGETS.map((item) => upsertConverted(item.id)).filter(Boolean);
    const currentRow = rows.find((row) => row && row.contentKind === packKind);
    if (projectId) {
      updateProject(projectId, {
        campaignId: campaignId,
        contentKind: packKind,
        contentStatus: "scheduled",
        scheduledAt: currentRow?.plannedAt ?? Date.now(),
      });
    }
    const current = useCreative.getState().lastPack;
    if (current) setLastPack(withPackKind(current, packKind, convertPlan(plan, packKind).items));
    toast.success("已排入 IG Post、Carousel、Story、Threads、LINE、Reels");
    void navigate({ to: "/calendar" });
  }

  async function publishNow() {
    const current = useCreative.getState().lastPack;
    if (!current) {
      toast.message("先做成一篇，才能發布。");
      return;
    }
    setBusy(true);
    try {
      const result = await runPackPublish(current, previewSrc);
      ingestIg([result.post]);
      const existing = useCreative.getState().schedule.find(
        (row) => row.campaignId === campaignId && row.contentKind === packKind && row.status !== "published",
      );
      if (existing) {
        upsertSchedule({ ...existing, status: "published", publishedAt: Date.now() });
      }
      if (projectId) {
        updateProject(projectId, { campaignId, contentKind: packKind, contentStatus: "published", publishedAt: Date.now() });
      }
      toast.success(result.message);
      void navigate({ to: "/instagram" });
    } finally {
      setBusy(false);
    }
  }

  async function pickDirection(direction: CreativeDirection) {
    if (!plan || !brand) return;
    setBusy(true);
    try {
      await packDirection(plan, direction);
    } finally {
      setBusy(false);
    }
  }

  async function composeKindHero(direction: CreativeDirection, currentPlan = plan, raw = idea, kind = packKind) {
    if (!currentPlan) return null;
    const format = formatById(formatIdFromKind(kind));
    const variation = kind === "story" ? "mood" : kind === "reels" ? "style" : kind === "threads" || kind === "line" ? "text" : "regen";
    const url = posterDataUrl({
      hook: direction.headline || currentPlan.hook,
      eventName: parseIdea(raw).eventName,
      mood: moodFromVariation(variation),
      width: format.width,
      height: format.height,
    });
    const res = await fetch(url);
    const blob = await res.blob();
    const id = uid("asset");
    await getAssetStorage().put(id, blob);
    addAsset(
      createGeneratedAsset({
        id,
        name: `${direction.name} · ${parseIdea(raw).eventName} · ${format.short}`,
        mime: blob.type || "image/svg+xml",
        width: format.width,
        height: format.height,
        category: kind === "reels" ? "reels-asset" : kind === "story" ? "story-asset" : "poster",
        tags: ["AI生成", direction.name, parseIdea(raw).eventName, kind],
      }),
    );
    return { id, url };
  }

  async function paintHero(direction: CreativeDirection, currentPlan = plan, raw = idea, kind = packKind) {
    const format = formatById(formatIdFromKind(kind));
    const result = await generateStudioImage({
      data: {
        prompt: direction.imagePrompt,
        headline: direction.headline || currentPlan?.hook,
        eventName: parseIdea(raw).eventName,
        formatId: format.id,
        variation: kind === "story" ? "mood" : kind === "reels" ? "style" : kind === "threads" || kind === "line" ? "text" : "regen",
      },
    });
    const url = result.urls[0];
    if (!url) return null;
    if (kind === packKind) setHeroUrl(url);
    const res = await fetch(url);
    const blob = await res.blob();
    const id = uid("asset");
    await getAssetStorage().put(id, blob);
    addAsset(
      createGeneratedAsset({
        id,
        name: `${direction.name} · ${parseIdea(raw).eventName} · ${format.short}`,
        mime: blob.type || "image/png",
        width: format.width,
        height: format.height,
        category: "poster",
        tags: ["AI生成", direction.name, parseIdea(raw).eventName, kind],
      }),
    );
    return { id, url };
  }

  async function renderHero() {
    if (!picked) return;
    setBusy(true);
    try {
      const painted = await paintHero(picked);
      const current = useCreative.getState().lastPack;
      if (current && painted) {
        setKindUrls((prev) => ({ ...prev, [packKind]: painted.url }));
        setLastPack({
          ...current,
          heroAssetId: painted.id,
          formatAssetIds: { ...current.formatAssetIds, [packKind]: painted.id },
          formatPublicUrls: {
            ...current.formatPublicUrls,
            ...(httpsRasterUrl(painted.url) ? { [packKind]: httpsRasterUrl(painted.url) } : {}),
          },
          updatedAt: Date.now(),
        });
      }
      toast.success("主視覺已存進素材庫 · 來源：AI Generated");
    } finally {
      setBusy(false);
    }
  }

  async function sendToCanva() {
    if (!plan) return;
    setBusy(true);
    try {
      const caption = plan.captions[0]?.text ?? plan.hook;
      const result = await pushHeroToCanva({
        title: `${plan.campaignName} · ${parseIdea(idea).eventName}`,
        kind: packKind,
        previewSrc,
        caption,
      });
      const current = useCreative.getState().lastPack;
      if (current && result.ok) setLastPack(applyCanvaPush(current, result));
      if (result.ok) {
        window.open(result.editUrl, "_blank", "noopener,noreferrer");
        toast.success(canvaPushMessage(result));
        return;
      }
      window.open("https://www.canva.com", "_blank", "noopener,noreferrer");
      toast.message(canvaPushMessage(result));
    } finally {
      setBusy(false);
    }
  }

  async function makeReelsVideo() {
    const current = useCreative.getState().lastPack;
    if (!current || !plan) {
      toast.message("先做成一篇，才能生成 Reels 影片。");
      return;
    }
    const cover = publicReelsCoverUrl(current);
    const items = convertPlan(plan, "reels").items;
    setBusy(true);
    setPackKind("reels");
    try {
      const result = await generateReelsClip({
        data: {
          prompt: reelsVideoPrompt(plan.hook, items),
          imageUrl: cover || undefined,
          requestId: current.reelsJobId,
        },
      });
      if (!result.ok) {
        toast.message(result.error);
        return;
      }
      if ("pending" in result && result.pending) {
        setLastPack(withReelsVideo(current, { requestId: result.requestId }));
        toast.message("影片還在生成，再按一次可以接續。");
        return;
      }
      if ("url" in result && result.url) {
        setLastPack(withReelsVideo(current, { url: result.url, requestId: result.requestId }));
        toast.success("Reels 影片已就緒，可以用官方 API 發布。");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <label className="block text-sm">
        我想做
        <Textarea
          data-testid="idea-flow-input"
          className="mt-1 min-h-24"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="下週有一場茶會"
        />
      </label>
      <Button className="w-full" data-testid="idea-flow-submit" disabled={busy} onClick={() => void research()}>
        {busy && phase !== "pack" ? status || "正在創作…" : "AI 幫我創作"}
      </Button>
      {status ? (
        <p className="text-sm text-muted" data-testid="idea-flow-found">
          {status}
        </p>
      ) : (
        <p className="text-sm text-muted">輸入一句話即可。會先找素材，再給三個方向，不會顯示 Agent 流程。</p>
      )}

      {phase !== "idea" || hits.length ? (
        <ul className="flex flex-wrap gap-2" data-testid="idea-flow-sources">
          <li className="rounded-full bg-bg px-3 py-1 text-xs text-muted">Brand Memory / 龜龜與三色光</li>
          {folder.driveFolder ? (
            <li className="rounded-full bg-bg px-3 py-1 text-xs text-muted">Google Drive / {folder.driveFolder}</li>
          ) : null}
          <li className="rounded-full bg-bg px-3 py-1 text-xs text-muted">Instagram / 過去表現</li>
          {hits.slice(0, 8).map((item) => (
            <li key={item.id} className="rounded-full bg-bg px-3 py-1 text-xs text-muted">
              {sourceLabel(item.source)} / {item.title}
            </li>
          ))}
        </ul>
      ) : null}
      {hits.length ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" data-testid="idea-hit-thumbs">
          {hits.slice(0, 8).map((item) => (
            <li key={`thumb-${item.id}`}>
              <button
                type="button"
                data-testid="idea-adopt-hit"
                className="overflow-hidden rounded-xl bg-bg"
                onClick={() => adoptHit(item)}
              >
                <img src={item.thumb} alt="" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {plan?.directions?.length && phase !== "idea" ? (
        <section className="space-y-3">
          <h3 className="font-medium">三個創意方向</h3>
          <ul className="space-y-3">
            {plan.directions.map((direction) => (
              <li
                key={direction.id || direction.name}
                className={cn(
                  "rounded-2xl bg-bg p-4",
                  picked?.name === direction.name && "ring-2 ring-ring/30",
                )}
              >
                <p className="font-display text-lg">{direction.name}</p>
                <p className="mt-1 text-sm">{direction.concept}</p>
                <p className="mt-1 text-xs text-muted">
                  {direction.palette} · {direction.composition} · {direction.typeDirection}
                </p>
                <p className="mt-2 text-sm">{direction.headline}</p>
                <Button
                  className="mt-3"
                  size="sm"
                  data-testid="idea-direction"
                  disabled={busy}
                  onClick={() => void pickDirection(direction)}
                >
                  {picked?.name === direction.name ? "已用這個方向" : "用這個方向"}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {phase === "pack" && plan && picked ? (
        <section className="space-y-4" data-testid="idea-pack">
          <div className="rounded-3xl bg-bg p-4" data-testid="idea-preview">
            <FormatPreview
              kind={packKind}
              src={previewSrc}
              hook={plan.hook}
              handle={brand?.handle ?? "@tku.zen"}
              items={converted?.items ?? []}
            />
            {artboard && brand ? (
                <div className="mt-3 border-t border-border bg-[#1c2422]/[0.04] p-3" data-testid="idea-artboard">
                  <p className="mb-2 text-[10px] tracking-[0.16em] text-muted">畫布主視覺</p>
                  <div className="flex justify-center">
                    <ArtboardView artboard={artboard} brand={brand} urls={urls} width={220} />
                  </div>
                </div>
              ) : null}
              <div className="mt-3 space-y-2 px-1">
                <p className="text-sm font-medium">{plan.hook}</p>
                <p className="whitespace-pre-wrap text-sm text-muted">{plan.captions[0]?.text}</p>
                <p className="text-xs text-subtle">{plan.hashtags.join(" ")}</p>
              </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CONVERT_TARGETS.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={packKind === item.id ? "default" : "secondary"}
                data-testid={`convert-kind-${item.id}`}
                onClick={() => {
                  setPackKind(item.id);
                  const current = useCreative.getState().lastPack;
                  if (current) setLastPack(withPackKind(current, item.id, convertPlan(plan, item.id).items));
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {plan.studentReview ? (
            <div className="rounded-2xl bg-bg p-4 text-sm">
              <p className="font-medium">淡江學生視角</p>
              <p className="mt-2 text-muted">{plan.studentReview.wouldStop}</p>
              <p className="mt-1 text-muted">太宗教？{plan.studentReview.tooReligious}</p>
              <p className="mt-1 text-muted">太像 AI？{plan.studentReview.tooAi}</p>
              <p className="mt-1">建議改：{plan.studentReview.revisions.join("、")}</p>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                data-testid="idea-apply-review"
                disabled={busy}
                onClick={() => {
                  const reviewed = applyStudentReviewToPlan(plan);
                  setPlan(reviewed.plan);
                  const parsed = parseIdea(idea);
                  if (projectId) {
                    applyCampaignPlan(projectId, reviewed.plan, briefFromIdea(parsed, notesFromHits(parsed, hits)));
                  }
                  if (campaignId) {
                    upsertCampaign({
                      id: campaignId,
                      name: parsed.eventName,
                      oneLiner: reviewed.plan.hook,
                      cta: reviewed.plan.cta,
                    });
                    const current = useCreative.getState().lastPack;
                    setLastPack(
                      lastPackFromPlan({
                        projectId: projectId ?? current?.projectId ?? "",
                        campaignId,
                        eventName: parsed.eventName,
                        plan: reviewed.plan,
                        kind: packKind,
                        converted: convertPlan(reviewed.plan, packKind).items,
                        packs: allConvertedPacks(reviewed.plan),
                        formatAssetIds: current?.formatAssetIds,
                        formatPublicUrls: current?.formatPublicUrls,
                        canvaDesignId: current?.canvaDesignId,
                        canvaEditUrl: current?.canvaEditUrl,
                        canvaExportUrl: current?.canvaExportUrl,
                        reelsVideoUrl: current?.reelsVideoUrl,
                        reelsJobId: current?.reelsJobId,
                        directionName: picked?.name ?? current?.directionName,
                        heroAssetId: current?.heroAssetId,
                        heroThumb: current?.heroThumb,
                      }),
                    );
                  }
                  toast.success(reviewed.applied.join("、"));
                }}
              >
                套用淡江學生視角
              </Button>
            </div>
          ) : null}

          {converted && packKind !== "ig-post" ? (
            <div className="rounded-2xl bg-bg p-4">
              <p className="font-display text-xl">{converted.title}</p>
              <ul className="mt-3 space-y-3">
                {converted.items.map((item, index) => (
                  <li key={`${item.heading}-${index}`} className="rounded-xl bg-surface px-3 py-2">
                    <p className="text-xs text-muted">{item.heading}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p>
                    <p className="mt-1 text-xs text-muted">畫面：{item.visual}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {lastPackState?.reelsVideoUrl ? (
            <p className="text-xs text-muted" data-testid="idea-reels-ready">
              來源：AI Generated · Reels 影片已可官方發布
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={busy} onClick={() => void renderHero()}>
              {busy ? "生成中…" : "生成主視覺"}
            </Button>
            <Button
              variant="secondary"
              data-testid="idea-calendar"
              onClick={() => putOnCalendar()}
            >
              排入這個格式
            </Button>
            <Button
              variant="secondary"
              data-testid="idea-calendar-all"
              onClick={() => putAllOnCalendar()}
            >
              排入全部格式
            </Button>
            <Button data-testid="idea-publish" disabled={busy} onClick={() => void publishNow()}>
              發布到 IG
            </Button>
            <Button variant="secondary" onClick={() => void navigate({ to: "/instagram" })}>
              看 IG Preview
            </Button>
            {projectId ? (
              <Button variant="secondary" onClick={() => void navigate({ to: "/studio/$projectId", params: { projectId } })}>
                進畫布微調
              </Button>
            ) : null}
            <Button
              variant="secondary"
              data-testid="idea-reels-video"
              disabled={busy}
              onClick={() => void makeReelsVideo()}
            >
              {lastPackState?.reelsVideoUrl ? "Reels 影片已就緒" : lastPackState?.reelsJobId ? "接續 Reels 影片" : "生成 Reels 影片"}
            </Button>
            <Button
              variant="secondary"
              data-testid="idea-canva"
              disabled={busy}
              onClick={() => void sendToCanva()}
            >
              送進 Canva 微調
            </Button>
            {campaignId ? (
              <Button
                variant="secondary"
                onClick={() => void navigate({ to: "/campaigns/$campaignId", params: { campaignId } })}
              >
                看活動節奏
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
