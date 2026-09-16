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
import { formatIdFromKind, lastPackFromPlan, withPackKind } from "@/lib/club/last-pack";
import { parseIdea } from "@/lib/club/idea";
import { lessonPrompt } from "@/lib/club/insights";
import { CONVERT_TARGETS, convertPlan } from "@/lib/convert/pack";
import { createCanvaFromPlan } from "@/lib/connections/oauth";
import { folderSearchInput } from "@/lib/connections/presets";
import { generateStudioImage } from "@/lib/image/studio";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { pagesOf } from "@/lib/studio/layers";
import { searchCreative, type SearchHit } from "@/lib/search/creative";
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
  const updateProject = useStudio((s) => s.updateProject);
  const folder = useCreative((s) => s.folder);
  const igPosts = useCreative((s) => s.igPosts);

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
  const urls = useAssetUrls(assetIds);

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
    setPhase("pack");
    const heroAssetId = await paintHero(direction, nextPlan, raw);
    const scheduled = Boolean(nextPlan.waves?.length);
    updateProject(projectNext.id, {
      campaignId: campaign.id,
      contentStatus: scheduled ? "scheduled" : "done",
      scheduledAt: scheduled ? Date.now() : null,
    });
    setLastPack(
      lastPackFromPlan({
        projectId: projectNext.id,
        campaignId: campaign.id,
        eventName: parsed.eventName,
        plan: nextPlan,
        kind: packKind,
        converted: convertPlan(nextPlan, packKind).items,
        directionName: direction.name,
        heroAssetId,
        heroThumb: currentHits[0]?.thumb,
      }),
    );
    toast.success("已生成主視覺、文案與多模態內容，並依淡江學生視角改過一輪");
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

  async function paintHero(direction: CreativeDirection, currentPlan = plan, raw = idea) {
    const format = formatById(formatIdFromKind(packKind));
    const result = await generateStudioImage({
      data: {
        prompt: direction.imagePrompt,
        headline: direction.headline || currentPlan?.hook,
        eventName: parseIdea(raw).eventName,
        formatId: format.id,
      },
    });
    const url = result.urls[0];
    if (!url) return null;
    setHeroUrl(url);
    const res = await fetch(url);
    const blob = await res.blob();
    const id = uid("asset");
    await getAssetStorage().put(id, blob);
    addAsset(
      createGeneratedAsset({
        id,
        name: `${direction.name} · ${parseIdea(raw).eventName}`,
        mime: blob.type || "image/png",
        width: format.width,
        height: format.height,
        category: "poster",
        tags: ["AI生成", direction.name, parseIdea(raw).eventName],
      }),
    );
    return id;
  }

  async function renderHero() {
    if (!picked) return;
    setBusy(true);
    try {
      const heroAssetId = await paintHero(picked);
      const current = useCreative.getState().lastPack;
      if (current && heroAssetId) {
        setLastPack({ ...current, heroAssetId, updatedAt: Date.now() });
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
      await navigator.clipboard.writeText(caption).catch(() => undefined);
      const result = await createCanvaFromPlan({
        data: { title: `${plan.campaignName} · ${parseIdea(idea).eventName}`.slice(0, 80), kind: packKind },
      });
      if (result.ok) {
        window.open(result.editUrl, "_blank", "noopener,noreferrer");
        toast.success("已在 Canva 開新設計，文案已複製");
        return;
      }
      window.open("https://www.canva.com", "_blank", "noopener,noreferrer");
      toast.message(result.needsConnect ? "還沒連接 Canva。文案已複製，可先貼上再連接。" : `${result.error} 文案已複製。`);
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
              src={heroUrl || thumb}
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

          <div className="grid gap-2 sm:grid-cols-2">
            <Button disabled={busy} onClick={() => void renderHero()}>
              {busy ? "生成中…" : "生成主視覺"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void navigate({ to: "/calendar" })}
              data-testid="idea-calendar"
            >
              排入 Calendar
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
