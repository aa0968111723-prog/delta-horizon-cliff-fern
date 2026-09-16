import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  PenLine,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CopyDraftCard, copyDraftText } from "@/components/create/copy-results";
import { ConvertBar } from "@/components/create/convert-bar";
import { PostPackBar } from "@/components/create/post-pack";
import { ImageUnderstanding, type ImageMakePayload } from "@/components/create/image-understanding";
import { ReelsTimeline } from "@/components/create/reels-timeline";
import { SourceList } from "@/components/shared/source-list";
import { ContentFlowBar } from "@/components/shared/content-flow";
import { StudentReviewPanel } from "@/components/create/student-review-panel";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DirectionSourceNote,
  RegenerateButton,
  VisualDirectionCard,
} from "@/components/create/visual-directions";
import { COPY_TONES, COPY_TOPICS, type CopyTopic } from "@/lib/ai/copy-local";
import { generateIgCopy, getZenAiStatus, reviewAsStudent, generateReelsScript } from "@/lib/ai/copy-ai";
import { generateVisualDirections, type VisualDirection } from "@/lib/ai/image-ai";
import { formatBrandMemory } from "@/lib/studio/brand";
import { saveDataUrlAsAsset } from "@/lib/studio/generated-image";
import { sourceFromAsset, sourceFromExtend } from "@/lib/studio/sources";
import { CONTENT_KIND_META, CONTENT_KIND_ORDER, contentKindLabel, deliverablesForKind, kindUsesPagedLayout } from "@/lib/studio/status";
import {
  defaultImageRatio,
  pickArrivalWave,
  claimArrivalAutofill,
  shouldAutofillCopy,
  shouldAutofillReels,
  shouldAutofillVisuals,
  shouldAutoApplyArrivalDraft,
  topicForKind,
  visualIntent,
  wantsArrivalAutofill,
} from "@/lib/studio/wave-draft";
import { uniqueById } from "@/lib/studio/ids";
import type { ContentKind, CopyDraft, CopyTone, StudentReview } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { AUDIENCE_SEGMENTS, DEFAULT_AUDIENCE_IDS } from "@/lib/zen/audience";
import { semesterPhaseAt } from "@/lib/zen/semester";
import { useIgDnaText, useIgInsightsText } from "@/hooks/use-ig-dna";
import { useStudio } from "@/stores/studio-store";

type StartFrom = "idea" | "image";

export type CreateSearch = {
  kind?: string;
  from?: string;
  seed?: string;
  contentId?: string;
  campaignId?: string;
  step?: string;
  asset?: string;
};

const TEXTAREA =
  "w-full min-h-24 rounded-xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring";

export function CreatePage({ search }: { search: CreateSearch }) {
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const campaigns = useStudio((s) => s.campaigns);
  const projects = useStudio((s) => s.projects);
  const createProject = useStudio((s) => s.createProject);
  const addCopyDraft = useStudio((s) => s.addCopyDraft);
  const useCopyDraft = useStudio((s) => s.useCopyDraft);
  const setStudentReview = useStudio((s) => s.setStudentReview);
  const setReels = useStudio((s) => s.setReels);
  const setCopy = useStudio((s) => s.setCopy);
  const updateCampaign = useStudio((s) => s.updateCampaign);
  const addAsset = useStudio((s) => s.addAsset);
  const addSources = useStudio((s) => s.addSources);
  const applyCoverAsset = useStudio((s) => s.applyCoverAsset);
  const applyVisualAsset = useStudio((s) => s.applyVisualAsset);
  const layoutFromKind = useStudio((s) => s.layoutFromKind);
  const hydrated = useStudio((s) => s.hydrated);
  const igDnaText = useIgDnaText();
  const insightsText = useIgInsightsText();

  const brand = brands[0];
  const memoryText = useMemo(
    () => (brand ? formatBrandMemory(brand.memory, assets) : undefined),
    [brand, assets],
  );
  const phase = semesterPhaseAt();

  const linkedProject = useMemo(
    () => projects.find((p) => p.id === search.contentId) ?? null,
    [projects, search.contentId],
  );
  const arrivalKind: ContentKind =
    (search.kind && search.kind in CONTENT_KIND_META ? (search.kind as ContentKind) : null) ??
    linkedProject?.contentKind ??
    "ig-post";
  const arrival = useMemo(() => {
    if (!wantsArrivalAutofill(search)) return null;
    return pickArrivalWave(campaigns, arrivalKind, search.campaignId ?? linkedProject?.campaignId ?? undefined);
  }, [campaigns, arrivalKind, search, linkedProject?.campaignId]);
  const campaign = useMemo(() => {
    const id = search.campaignId ?? linkedProject?.campaignId ?? arrival?.campaign.id;
    return campaigns.find((c) => c.id === id) ?? arrival?.campaign ?? null;
  }, [campaigns, search.campaignId, linkedProject, arrival]);

  const [from, setFrom] = useState<StartFrom>(
    search.from === "image" || Boolean(search.asset) ? "image" : "idea",
  );
  const [kind, setKind] = useState<ContentKind>(arrivalKind);
  const [topic, setTopic] = useState<CopyTopic>(
    topicForKind(
      (search.kind && search.kind in CONTENT_KIND_META ? (search.kind as ContentKind) : "ig-post"),
      Boolean(search.campaignId),
    ),
  );
  const [tones, setTones] = useState<CopyTone[]>(["student", "short", "emotional"]);
  const [idea, setIdea] = useState(search.seed ?? "");
  const [eventName, setEventName] = useState(campaign?.name ?? linkedProject?.brief.eventName ?? "");
  const [schedule, setSchedule] = useState(
    campaign ? `${campaign.date} ${campaign.time}`.trim() : (linkedProject?.brief.schedule ?? ""),
  );
  const [location, setLocation] = useState(campaign?.location ?? linkedProject?.brief.location ?? "");
  const [painPoint, setPainPoint] = useState(campaign?.painPoint ?? "");
  const [signupUrl, setSignupUrl] = useState(campaign?.signupUrl ?? "");
  const [audienceIds, setAudienceIds] = useState<string[]>(
    campaign?.audienceIds.length ? campaign.audienceIds : DEFAULT_AUDIENCE_IDS,
  );

  const [aiStatus, setAiStatus] = useState<{ available: boolean; label: string; detail: string } | null>(null);
  const [reels, setReelsLocal] = useState(linkedProject?.reels ?? null);
  const [reelsAdapter, setReelsAdapter] = useState<"live" | "local" | "mock" | undefined>(linkedProject?.reels?.source);
  const [copyBusy, setCopyBusy] = useState(false);
  const [drafts, setDrafts] = useState<CopyDraft[]>(() => uniqueById(linkedProject?.copyDrafts ?? []));
  const [usedDraftId, setUsedDraftId] = useState<string | null>(null);
  const [review, setReview] = useState<StudentReview | null>(linkedProject?.studentReview ?? null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [visualBusy, setVisualBusy] = useState(false);
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [directionAdapter, setDirectionAdapter] = useState<"live" | "local">("local");
  const [reelsBusy, setReelsBusy] = useState(false);
  const [imageSourceAssetId, setImageSourceAssetId] = useState<string | null>(search.asset ?? null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const reviewSeq = useRef(0);
  const autofillRan = useRef(false);
  const visualsRan = useRef(false);
  const reelsRan = useRef(false);

  useEffect(() => {
    let alive = true;
    void getZenAiStatus().then((status) => {
      if (alive) setAiStatus(status);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (search.step === "visual" && !directions.length && !visualBusy) {
      // 從「生成圖片」入口進來時，直接停在視覺方向這一段。
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [search.step, directions.length, visualBusy]);

  useEffect(() => {
    if (!campaign) return;
    setTopic(topicForKind(kind, true));
    setEventName((value) => value || campaign.name);
    setSchedule((value) => value || `${campaign.date} ${campaign.time}`.trim());
    setLocation((value) => value || campaign.location);
    setPainPoint((value) => value || campaign.painPoint);
    setSignupUrl((value) => value || campaign.signupUrl);
    if (campaign.audienceIds.length) {
      setAudienceIds((ids) => (ids.length ? ids : campaign.audienceIds));
    }
    const hook = search.seed || arrival?.wave.hook;
    if (hook) setIdea((value) => value || hook);
    // 只在這場活動第一次進來時帶入欄位，之後讓人自己改。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id, arrival?.wave.id]);

  const briefPayload = useMemo(
    () => ({
      topic,
      eventName: eventName.trim(),
      schedule: schedule.trim(),
      location: location.trim(),
      detail: [idea.trim(), campaign?.intro ?? ""].filter(Boolean).join("\n"),
      painPoint: painPoint.trim(),
      cta: campaign?.cta ?? brand?.boilerplate.cta ?? "來坐一下",
      audienceIds,
      signupUrl: signupUrl.trim(),
      brandVoice: brand?.voice,
      brandDontSay: brand?.dontSay,
      forbiddenWords: brand?.forbiddenWords ?? [],
      brandMemoryText: memoryText,
      igDnaText: igDnaText || undefined,
      insightsText: insightsText || undefined,
    }),
    [topic, eventName, schedule, location, idea, painPoint, signupUrl, audienceIds, brand, campaign, igDnaText, insightsText, memoryText],
  );

  async function runCopy(overrides?: { topic?: CopyTopic }) {
    const event = eventName.trim() || campaign?.name || "";
    const sched = schedule.trim() || (campaign ? `${campaign.date} ${campaign.time}`.trim() : "");
    const loc = location.trim() || campaign?.location || "";
    const pain = painPoint.trim() || campaign?.painPoint || "";
    const ideaText = idea.trim() || search.seed?.trim() || arrival?.wave.hook || "";
    if (!ideaText && !event && !pain) {
      toast.error("先寫一句想法，或填活動名稱。");
      return;
    }
    setCopyBusy(true);
    try {
      const res = await generateIgCopy({
        data: {
          ...briefPayload,
          topic: overrides?.topic ?? topic,
          eventName: event,
          schedule: sched,
          location: loc,
          painPoint: pain,
          detail: [ideaText, campaign?.intro ?? ""].filter(Boolean).join("\n"),
          cta: campaign?.cta ?? briefPayload.cta,
          tones,
        },
      });
      setDrafts(uniqueById(res.drafts));
      if (!res.ok) toast.warning(res.error);
      else if (res.adapter === "local") toast.info("目前是本機草稿，可以直接編輯。");
      const first = res.drafts[0];
      let appliedId: string | undefined;
      if (
        first &&
        shouldAutoApplyArrivalDraft(search, {
          hasLinkedProject: Boolean(linkedProject),
          hasUsedDraft: Boolean(usedDraftId),
          hasCaption: Boolean(linkedProject?.copy.caption?.trim()),
        })
      ) {
        appliedId = commitDraft(first, { quiet: true, extras: res.drafts.filter((item) => item.id !== first.id) }) ?? undefined;
        toast.success("已套用第一版到畫面，可改選其他語氣。");
      }
      if (first) {
        void runReview(first, { projectId: appliedId ?? linkedProject?.id });
      }
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      toast.error("生成文案時出錯了，再試一次。");
    } finally {
      setCopyBusy(false);
    }
  }

  useEffect(() => {
    if (autofillRan.current) return;
    const hasPrompt = Boolean(
      idea.trim() || search.seed?.trim() || arrival?.wave.hook || eventName.trim() || campaign?.name || painPoint.trim() || campaign?.painPoint,
    );
    if (
      !shouldAutofillCopy(search, {
        hydrated,
        hasDrafts: drafts.length > 0 || Boolean(linkedProject?.copyDrafts.length),
        hasPrompt,
      })
    ) {
      return;
    }
    if ((search.campaignId || linkedProject?.campaignId) && !campaign) return;
    if (search.kind && campaigns.length > 0 && !campaign) return;
    if (!claimArrivalAutofill("copy", search)) return;
    autofillRan.current = true;
    void runCopy({ topic: topicForKind(kind, Boolean(campaign)) });
    // 進頁一次：從首頁／活動節奏／延續這則進來就先寫一版。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, campaign, drafts.length, idea, eventName, painPoint, search.seed, search.campaignId, search.contentId, search.from, search.asset, search.kind, search.step]);

  async function runVisuals(opts?: { allowFallback?: boolean }) {
    const intent = visualIntent({
      idea: idea.trim() || search.seed?.trim() || arrival?.wave.hook,
      eventName: eventName.trim() || campaign?.name,
      oneLiner: campaign?.oneLiner,
    });
    if (!idea.trim() && !eventName.trim() && !campaign?.name && !opts?.allowFallback) {
      toast.error("先寫一句你想宣傳什麼。");
      return;
    }
    setVisualBusy(true);
    try {
      const res = await generateVisualDirections({
        data: {
          intent,
          eventName: eventName.trim() || campaign?.name || "",
          schedule: schedule.trim() || (campaign ? `${campaign.date} ${campaign.time}`.trim() : ""),
          location: location.trim() || campaign?.location || "",
          painPoint: painPoint.trim() || campaign?.painPoint || "",
          audienceIds,
          imageStyle: brand
            ? `${brand.imageStyle.mood}｜${brand.imageStyle.lighting}｜${brand.imageStyle.composition}`
            : undefined,
          brandMemoryText: memoryText,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      setDirections(res.directions);
      setDirectionAdapter(res.ok ? "live" : "local");
      if (!res.ok) toast.warning(res.error);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      toast.error("想視覺方向時出錯了，再試一次。");
    } finally {
      setVisualBusy(false);
    }
  }

  useEffect(() => {
    if (visualsRan.current) return;
    const hasIntent = Boolean(
      idea.trim() || search.seed?.trim() || eventName.trim() || campaign?.name || search.step === "visual",
    );
    if (
      !shouldAutofillVisuals(search, {
        hydrated,
        hasDirections: directions.length > 0,
        hasIntent,
      })
    ) {
      return;
    }
    visualsRan.current = true;
    if (!claimArrivalAutofill("visuals", search)) return;
    void runVisuals({ allowFallback: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, campaign, directions.length, idea, eventName, search.seed, search.campaignId, search.contentId, search.from, search.asset, search.kind, search.step]);

  async function runReview(draft: CopyDraft, opts?: { projectId?: string }) {
    const seq = ++reviewSeq.current;
    setReviewBusy(true);
    try {
      const res = await reviewAsStudent({
        data: {
          text: copyDraftText(draft),
          eventName: eventName.trim(),
          schedule: schedule.trim(),
          location: location.trim(),
          signupUrl: signupUrl.trim(),
          painPoint: painPoint.trim(),
          audienceIds,
          brandMemoryText: memoryText,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      if (seq !== reviewSeq.current) return;
      setReview(res.review);
      const pid = opts?.projectId ?? linkedProject?.id;
      if (pid) setStudentReview(pid, res.review);
      if (!res.ok) toast.warning(res.error);
    } catch {
      if (seq !== reviewSeq.current) return;
      toast.error("檢查時出錯了，再試一次。");
    } finally {
      if (seq === reviewSeq.current) setReviewBusy(false);
    }
  }

  /** 把選中的版本變成一個可以編輯、可以排程的內容。 */
  function commitDraft(draft: CopyDraft, opts?: { quiet?: boolean; extras?: CopyDraft[] }) {
    if (!brand) return;
    const meta = CONTENT_KIND_META[kind];
    const name = draft.hook.slice(0, 18) || eventName || "未命名內容";
    const created = !linkedProject;
    const target =
      linkedProject ??
      createProject({
        name,
        brandId: brand.id,
        formatId: meta.formatId,
        contentKind: kind,
        campaignId: campaign?.id ?? null,
        status: "making",
        brief: {
          product: eventName || name,
          eventName: eventName || name,
          schedule: schedule.trim(),
          location: location.trim(),
          offer: campaign?.oneLiner ?? "",
          audience: audienceIds.join("、"),
          goal: "awareness",
          features: idea.trim(),
          style: "安靜、具體、不說教",
          notes: painPoint.trim(),
          deliverables: deliverablesForKind(kind),
        },
        sources: [
          ...(campaign ? [{ kind: "local" as const, label: `活動 / ${campaign.name}`, detail: "活動資訊" }] : []),
          ...(search.seed ? [sourceFromExtend({ title: search.seed })] : []),
        ],
      });

    addCopyDraft(target.id, draft);
    for (const extra of opts?.extras ?? []) addCopyDraft(target.id, extra);
    useCopyDraft(target.id, draft.id);
    if (review) setStudentReview(target.id, review);
    setUsedDraftId(draft.id);
    if (imageSourceAssetId) {
      const asset = useStudio.getState().assets.find((item) => item.id === imageSourceAssetId);
      if (asset) addSources(target.id, [sourceFromAsset(asset, "圖片寫文案")]);
    }
    if (kindUsesPagedLayout(kind) && (created || !linkedProject?.copy.caption?.trim())) {
      layoutFromKind(target.id, kind);
    }

    if (campaign) {
      const wave = campaign.waves.find((w) => !w.contentId && w.kind === kind);
      if (wave) {
        updateCampaign(campaign.id, {
          waves: campaign.waves.map((w) => (w.id === wave.id ? { ...w, contentId: target.id } : w)),
        });
      }
    }

    if (!opts?.quiet) {
      toast.success(created ? "已建立內容，可以進畫面編輯了" : "已套用到這則內容");
    }
    return target.id;
  }

  function attachGeneratedImage(assetId: string, direction: VisualDirection) {
    if (!brand) {
      toast.error("找不到品牌設定。");
      return;
    }
    let projectId = linkedProject?.id ?? null;
    if (!projectId) {
      const draft = (usedDraftId ? drafts.find((item) => item.id === usedDraftId) : null) ?? drafts[0];
      projectId = draft ? commitDraft(draft, { quiet: true }) ?? null : null;
    }
    if (!projectId) {
      const meta = CONTENT_KIND_META[kind];
      const created = createProject({
        name: (direction.headline.split("\n")[0] || direction.title).slice(0, 18) || "視覺草稿",
        brandId: brand.id,
        formatId: meta.formatId,
        contentKind: kind,
        campaignId: campaign?.id ?? null,
        status: "making",
        brief: {
          product: eventName || direction.title,
          eventName: eventName || direction.title,
          schedule: schedule.trim(),
          location: location.trim(),
          offer: campaign?.oneLiner ?? "",
          audience: audienceIds.join("、"),
          goal: "awareness",
          features: idea.trim() || direction.concept,
          style: direction.imagePrompt,
          notes: painPoint.trim(),
          deliverables: deliverablesForKind(kind),
        },
        sources: [{ kind: "generated", label: "AI 生成圖片", detail: direction.title, assetId }],
      });
      projectId = created.id;
      if (direction.headline) {
        setCopy(projectId, { headline: direction.headline, subhead: direction.subhead });
      }
    }
    const applied =
      kind === "reels" ? applyCoverAsset(projectId, assetId) : applyVisualAsset(projectId, assetId);
    if (!applied) {
      toast.error("套不到畫面，再試一次。");
      return;
    }
    if (!linkedProject) {
      void navigate({
        to: "/create",
        search: {
          contentId: projectId,
          kind,
          campaignId: campaign?.id,
          seed: search.seed,
        },
      });
    }
    toast.success("已套成這則的主視覺，可以下載圖或進畫面編輯。");
  }

  async function makeFromImage(payload: ImageMakePayload) {
    if (!brand) return;
    try {
      const summary = payload.summary || payload.caption || "從一張圖片開始";
      let assetId = payload.assetId;
      if (!assetId) {
        const meta = await saveDataUrlAsAsset({
          dataUrl: payload.preview,
          name: (payload.caption || summary).slice(0, 18) || "圖片理解",
          tags: ["圖片理解"],
          source: "upload",
          notes: summary,
        });
        addAsset(meta);
        assetId = meta.id;
      }
      const asset = useStudio.getState().assets.find((item) => item.id === assetId);
      const meta = CONTENT_KIND_META[payload.kind];
      const name = (payload.caption || summary).slice(0, 18) || "從圖片開始";
      const project = createProject({
        name,
        brandId: brand.id,
        formatId: meta.formatId,
        contentKind: payload.kind,
        campaignId: campaign?.id ?? null,
        status: "making",
        brief: {
          product: eventName || name,
          eventName: eventName || name,
          schedule: schedule.trim(),
          location: location.trim(),
          offer: campaign?.oneLiner ?? "",
          audience: audienceIds.join("、"),
          goal: "awareness",
          features: summary,
          style: payload.stylePrompt,
          notes: summary,
          deliverables: {
            post: false,
            story: payload.kind === "story",
            carousel: payload.kind === "carousel",
            reels: payload.kind === "reels",
          },
        },
        sources: [
          ...(campaign ? [{ kind: "local" as const, label: `活動 / ${campaign.name}`, detail: "活動資訊" }] : []),
          asset
            ? sourceFromAsset(asset, "圖片理解")
            : { kind: "local" as const, label: "圖片理解", detail: summary },
        ],
      });
      if (payload.kind === "reels") applyCoverAsset(project.id, assetId);
      else applyVisualAsset(project.id, assetId);
      if (payload.caption) {
        setCopy(project.id, { headline: payload.caption.slice(0, 24), caption: payload.caption });
      }
      if (kindUsesPagedLayout(payload.kind)) {
        layoutFromKind(project.id, payload.kind);
      }
      toast.success(`已做成${contentKindLabel(payload.kind)}`);
      void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
    } catch {
      toast.error("做成內容時出錯了，再試一次。");
    }
  }

  async function copyFromImage(payload: {
    preview: string;
    summary: string;
    caption: string;
    assetId: string | null;
  }) {
    if (payload.caption) setIdea(payload.caption);
    else if (payload.summary) setIdea(payload.summary);
    else setIdea("從這張圖開始");
    setFrom("idea");
    setCopyBusy(true);
    try {
      let assetId = payload.assetId;
      if (!assetId) {
        try {
          const meta = await saveDataUrlAsAsset({
            dataUrl: payload.preview,
            name: (payload.caption || payload.summary).slice(0, 18) || "圖片寫文案",
            tags: ["圖片理解"],
            source: "upload",
            notes: payload.summary || "從圖片寫文案",
          });
          addAsset(meta);
          assetId = meta.id;
        } catch {
          // 圖存不進素材庫時，文案還是可以寫
        }
      }
      if (assetId) setImageSourceAssetId(assetId);
      const imageUrl = payload.preview.length <= 3_000_000 ? payload.preview : undefined;
      const res = await generateIgCopy({
        data: {
          ...briefPayload,
          detail: [payload.summary, payload.caption, briefPayload.detail].filter(Boolean).join("\n"),
          imageUrl,
          tones,
        },
      });
      setDrafts(uniqueById(res.drafts));
      if (!res.ok) toast.warning(res.error);
      else if (res.adapter === "local") toast.info("目前是本機草稿，可以直接編輯。");
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      toast.error("從圖片寫文案時出錯了，再試一次。");
    } finally {
      setCopyBusy(false);
    }
  }

  async function runReels(draft?: CopyDraft, opts?: { quiet?: boolean }) {
    setReelsBusy(true);
    try {
      const res = await generateReelsScript({
        data: {
          eventName: eventName.trim() || campaign?.name || "",
          schedule: schedule.trim() || (campaign ? `${campaign.date} ${campaign.time}`.trim() : ""),
          location: location.trim() || campaign?.location || "",
          detail: [idea.trim() || search.seed?.trim() || "", draft?.body ?? ""].filter(Boolean).join("\n"),
          painPoint: painPoint.trim() || campaign?.painPoint || "",
          cta: draft?.cta ?? campaign?.cta ?? "",
          audienceIds,
          brandMemoryText: memoryText,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      if (!res.ok) toast.warning(res.error);
      setReelsLocal(res.reels);
      setReelsAdapter(res.adapter);
      const id = linkedProject?.id;
      if (id) {
        setReels(id, res.reels);
        if (!opts?.quiet) toast.success("Reels 腳本已存到這則內容");
      } else if (!opts?.quiet) {
        toast.info("先選一個文案版本建立內容，腳本就會存進去。");
      }
      return res.reels;
    } finally {
      setReelsBusy(false);
    }
  }

  useEffect(() => {
    if (reelsRan.current) return;
    const hasPrompt = Boolean(
      idea.trim() || search.seed?.trim() || eventName.trim() || campaign?.name || painPoint.trim(),
    );
    if (
      !shouldAutofillReels(search, kind, {
        hydrated,
        hasReels: Boolean(reels || linkedProject?.reels),
        hasPrompt,
      })
    ) {
      return;
    }
    reelsRan.current = true;
    if (!claimArrivalAutofill("reels", search)) return;
    void runReels(undefined, { quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, campaign, kind, reels, linkedProject?.reels, idea, eventName, painPoint, search.seed, search.campaignId, search.contentId, search.from, search.asset, search.kind]);

  function toggleTone(tone: CopyTone) {
    setTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : prev.length >= 4 ? prev : [...prev, tone],
    );
  }

  function toggleAudience(id: string) {
    setAudienceIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI 創作"
        title={linkedProject ? linkedProject.name : "從一句想法開始"}
        description={
          aiStatus
            ? aiStatus.detail
            : `現在是${phase.label}。${phase.angle}`
        }
        actions={
          linkedProject ? (
            <div className="flex flex-wrap items-center gap-2">
              <ContentFlowBar project={linkedProject} variant="compact" />
              <Button
                variant="secondary"
                onClick={() =>
                  void navigate({ to: "/studio/$projectId", params: { projectId: linkedProject.id } })
                }
              >
                進畫面編輯
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null
        }
      />

      {copyBusy && !drafts.length ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          正在依這場活動寫文案…
        </p>
      ) : visualBusy && !directions.length ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          正在想三個視覺方向…
        </p>
      ) : reelsBusy && !reels ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" />
          正在寫 Reels 腳本…
        </p>
      ) : null}

      {linkedProject?.sources.length ? (
        <div className="mt-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <SourceList sources={linkedProject.sources} />
        </div>
      ) : null}

      {aiStatus && !aiStatus.available ? (
        <p className="mt-4 rounded-xl bg-[color-mix(in_oklab,var(--color-warn)_12%,transparent)] px-3 py-2 text-xs text-muted">
          {aiStatus.label}：{aiStatus.detail}
        </p>
      ) : null}

      {/* 從哪裡開始 */}
      <div className="mt-6 flex gap-2">
        {(
          [
            { id: "idea" as const, label: "從一句想法", icon: Lightbulb },
            { id: "image" as const, label: "從一張圖片", icon: ImageIcon },
          ]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFrom(tab.id)}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition-colors",
              from === tab.id ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {from === "image" ? (
        <div className="mt-4">
          <ImageUnderstanding
            audienceIds={audienceIds}
            initialAssetId={search.asset}
            onUseCaption={(caption) => {
              setIdea(caption);
              setFrom("idea");
            }}
            onGenerateCopy={(payload) => void copyFromImage(payload)}
            onUseStylePrompt={(prompt) =>
              setDirections([
                {
                  id: `vis_from_image_${Date.now()}`,
                  title: "延續這張圖的風格",
                  concept: "從既有素材抽出風格，再做新的內容。",
                  palette: "沿用原圖配色",
                  composition: "沿用原圖構圖，留白給標題",
                  typography: "跟現有版面一致",
                  imagePrompt: prompt,
                  headline: "",
                  subhead: "",
                },
              ])
            }
            onMakeKind={makeFromImage}
          />
        </div>
      ) : null}

      {/* 想法與活動資訊 */}
      <section className="mt-6 space-y-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
        <div>
          <Label htmlFor="idea">一句想法</Label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="例：下週有一場茶會／期中考大家都很累／想讓新生知道第一次來不用準備什麼"
            className={cn(TEXTAREA, "mt-1.5")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="eventName">活動名稱（可留空）</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="浮游禪光"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="schedule">時間</Label>
            <Input
              id="schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="9/24（三）19:00"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="location">地點</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="商管大樓 B302"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="signup">報名連結（可留空）</Label>
            <Input
              id="signup"
              value={signupUrl}
              onChange={(e) => setSignupUrl(e.target.value)}
              placeholder="直接來就好"
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="pain">想打到的狀態</Label>
          <Input
            id="pain"
            value={painPoint}
            onChange={(e) => setPainPoint(e.target.value)}
            placeholder="最近連休息都覺得有罪惡感"
            className="mt-1.5"
          />
        </div>

        {/* 內容型態 */}
        <div>
          <p className="text-sm font-medium">要做成什麼</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CONTENT_KIND_ORDER.slice(0, 8).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs transition-colors",
                  kind === item ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {contentKindLabel(item)}
              </button>
            ))}
          </div>
        </div>

        {/* 內容類型 */}
        <div>
          <p className="text-sm font-medium">內容角度</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COPY_TOPICS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTopic(item.id)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs transition-colors",
                  topic === item.id ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 語氣版本 */}
        <div>
          <p className="text-sm font-medium">要幾種語氣（最多 4）</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COPY_TONES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleTone(item.id)}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs transition-colors",
                  tones.includes(item.id)
                    ? "bg-[color-mix(in_oklab,var(--color-night)_18%,transparent)] text-fg"
                    : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 給誰看 */}
        <div>
          <p className="text-sm font-medium">給誰看</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AUDIENCE_SEGMENTS.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => toggleAudience(seg.id)}
                title={seg.pain}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs transition-colors",
                  audienceIds.includes(seg.id)
                    ? "bg-[color-mix(in_oklab,var(--color-warm)_24%,transparent)] text-fg"
                    : "bg-surface-2 text-muted hover:text-fg",
                )}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={() => void runCopy()} disabled={copyBusy}>
            {copyBusy ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
            生成文案
          </Button>
          <Button variant="secondary" onClick={() => void runVisuals()} disabled={visualBusy}>
            {visualBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            想 3 個視覺方向
          </Button>
          <Button variant="ghost" onClick={() => void runReels(drafts[0])} disabled={reelsBusy}>
            {reelsBusy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            寫 Reels 腳本
          </Button>
        </div>
      </section>

      <div ref={resultsRef} />

      {/* 文案結果 */}
      {drafts.length ? (
        <section className="mt-8">
          <SectionHeader
            title="文案版本"
            hint="每一版都是 Hook / 正文 / CTA / Hashtags"
            action={
              <Button variant="ghost" size="sm" onClick={() => void runCopy()} disabled={copyBusy}>
                重新生成
              </Button>
            }
          />
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {uniqueById(drafts).map((draft) => (
              <li key={draft.id}>
                <CopyDraftCard
                  draft={draft}
                  used={usedDraftId === draft.id}
                  onUse={() => {
                    const id = commitDraft(draft);
                    if (id && !linkedProject) {
                      void navigate({ to: "/create", search: { contentId: id, kind } });
                    }
                  }}
                  onReview={() => void runReview(draft)}
                />
              </li>
            ))}
          </ul>
          {reviewBusy ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              文案好了，正在用淡江學生的視角重看一次…
            </p>
          ) : null}
        </section>
      ) : null}

      {/* 學生視角 */}
      {review ? (
        <section className="mt-6">
          <StudentReviewPanel
            review={review}
            onApplyHook={(hook) => {
              if (linkedProject) {
                setCopy(linkedProject.id, { headline: hook.slice(0, 24) });
                toast.success("已換成這句");
              } else {
                setIdea(hook);
                toast.info("已放到想法欄，重新生成就會用這個角度。");
              }
            }}
            onClose={() => setReview(null)}
          />
        </section>
      ) : null}

      {/* 視覺方向 */}
      {directions.length ? (
        <section className="mt-8">
          <SectionHeader
            title="視覺方向"
            hint="先想方向，再生圖"
            action={
              <div className="flex items-center gap-2">
                <DirectionSourceNote adapter={directionAdapter} />
                <RegenerateButton onClick={() => void runVisuals()} busy={visualBusy} />
              </div>
            }
          />
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {directions.map((direction) => (
              <li key={direction.id}>
                <VisualDirectionCard
                  direction={direction}
                  preferredRatio={defaultImageRatio(kind)}
                  styleHint={
                    brand
                      ? `${brand.imageStyle.mood}｜${brand.imageStyle.lighting}｜${brand.imageStyle.composition}`
                      : undefined
                  }
                  onUseCopy={(headline, subhead) => {
                    if (linkedProject) {
                      setCopy(linkedProject.id, { headline, subhead });
                      toast.success("已套用到畫面");
                    } else {
                      toast.info("先選一個文案版本建立內容，才有畫面可以套用。");
                    }
                  }}
                  onImageSaved={(assetId) => attachGeneratedImage(assetId, direction)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Reels 腳本 */}
      {reels || linkedProject?.reels ? (
        <section className="mt-8">
          <SectionHeader title="Reels 腳本" hint="20 秒、一個人、一支手機就能拍" />
          <ReelsTimeline
            reels={reels ?? linkedProject!.reels!}
            adapter={reelsAdapter ?? linkedProject?.reels?.source}
            projectId={linkedProject?.id}
          />
        </section>
      ) : null}

      {linkedProject ? (
        <section className="mt-8 space-y-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <PostPackBar copy={linkedProject.copy} kind={linkedProject.contentKind} projectId={linkedProject.id} />
          <ContentFlowBar project={linkedProject} />
          <ConvertBar project={linkedProject} />
        </section>
      ) : null}
    </main>
  );
}
