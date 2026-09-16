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
import { ImageUnderstanding, type ImageMakePayload } from "@/components/create/image-understanding";
import { ReelsTimeline } from "@/components/create/reels-timeline";
import { SourceList } from "@/components/shared/source-list";
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
import { CONTENT_KIND_META, CONTENT_KIND_ORDER, contentKindLabel, kindUsesPagedLayout } from "@/lib/studio/status";
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
  const igDnaText = useIgDnaText();
  const insightsText = useIgInsightsText();

  const brand = brands[0];
  const phase = semesterPhaseAt();

  const linkedProject = useMemo(
    () => projects.find((p) => p.id === search.contentId) ?? null,
    [projects, search.contentId],
  );
  const campaign = useMemo(() => {
    const id = search.campaignId ?? linkedProject?.campaignId;
    return campaigns.find((c) => c.id === id) ?? null;
  }, [campaigns, search.campaignId, linkedProject]);

  const [from, setFrom] = useState<StartFrom>(
    search.from === "image" || Boolean(search.asset) ? "image" : "idea",
  );
  const [kind, setKind] = useState<ContentKind>(
    (search.kind && search.kind in CONTENT_KIND_META ? (search.kind as ContentKind) : null) ??
      linkedProject?.contentKind ??
      "ig-post",
  );
  const [topic, setTopic] = useState<CopyTopic>(campaign ? "event" : "emotion");
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
  const [drafts, setDrafts] = useState<CopyDraft[]>(linkedProject?.copyDrafts ?? []);
  const [usedDraftId, setUsedDraftId] = useState<string | null>(null);
  const [review, setReview] = useState<StudentReview | null>(linkedProject?.studentReview ?? null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [visualBusy, setVisualBusy] = useState(false);
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [directionAdapter, setDirectionAdapter] = useState<"live" | "local">("local");
  const [reelsBusy, setReelsBusy] = useState(false);
  const [imageSourceAssetId, setImageSourceAssetId] = useState<string | null>(search.asset ?? null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
      brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
      igDnaText: igDnaText || undefined,
      insightsText: insightsText || undefined,
    }),
    [topic, eventName, schedule, location, idea, painPoint, signupUrl, audienceIds, brand, campaign, igDnaText, insightsText],
  );

  async function runCopy() {
    if (!idea.trim() && !eventName.trim() && !painPoint.trim()) {
      toast.error("先寫一句想法，或填活動名稱。");
      return;
    }
    setCopyBusy(true);
    try {
      const res = await generateIgCopy({ data: { ...briefPayload, tones } });
      setDrafts(res.drafts);
      if (!res.ok) toast.warning(res.error);
      else if (res.adapter === "local") toast.info("目前是本機草稿，可以直接編輯。");
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      toast.error("生成文案時出錯了，再試一次。");
    } finally {
      setCopyBusy(false);
    }
  }

  async function runVisuals() {
    const intent = [idea.trim(), eventName.trim() ? `活動：${eventName.trim()}` : ""].filter(Boolean).join("／");
    if (!intent) {
      toast.error("先寫一句你想宣傳什麼。");
      return;
    }
    setVisualBusy(true);
    try {
      const res = await generateVisualDirections({
        data: {
          intent,
          eventName: eventName.trim(),
          schedule: schedule.trim(),
          location: location.trim(),
          painPoint: painPoint.trim(),
          audienceIds,
          imageStyle: brand
            ? `${brand.imageStyle.mood}｜${brand.imageStyle.lighting}｜${brand.imageStyle.composition}`
            : undefined,
          brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      setDirections(res.directions);
      setDirectionAdapter(res.ok ? "live" : "local");
      if (!res.ok) toast.warning(res.error);
    } catch {
      toast.error("想視覺方向時出錯了，再試一次。");
    } finally {
      setVisualBusy(false);
    }
  }

  async function runReview(draft: CopyDraft) {
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
          brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
          igDnaText: igDnaText || undefined,
          insightsText: insightsText || undefined,
        },
      });
      setReview(res.review);
      if (!res.ok) toast.warning(res.error);
    } catch {
      toast.error("檢查時出錯了，再試一次。");
    } finally {
      setReviewBusy(false);
    }
  }

  /** 把選中的版本變成一個可以編輯、可以排程的內容。 */
  function commitDraft(draft: CopyDraft) {
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
          deliverables: {
            post: kind === "ig-post",
            story: kind === "story" || kind === "countdown",
            carousel: kind === "carousel" || kind === "knowledge" || kind === "qa",
            reels: kind === "reels",
          },
        },
        sources: [
          ...(campaign ? [{ kind: "local" as const, label: `活動 / ${campaign.name}`, detail: "活動資訊" }] : []),
          ...(search.seed ? [sourceFromExtend({ title: search.seed })] : []),
        ],
      });

    addCopyDraft(target.id, draft);
    useCopyDraft(target.id, draft.id);
    if (review) setStudentReview(target.id, review);
    setUsedDraftId(draft.id);
    if (imageSourceAssetId) {
      const asset = useStudio.getState().assets.find((item) => item.id === imageSourceAssetId);
      if (asset) addSources(target.id, [sourceFromAsset(asset, "圖片寫文案")]);
    }
    if (created && kindUsesPagedLayout(kind)) {
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

    toast.success("已建立內容，可以進畫面編輯了");
    return target.id;
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
      setDrafts(res.drafts);
      if (!res.ok) toast.warning(res.error);
      else if (res.adapter === "local") toast.info("目前是本機草稿，可以直接編輯。");
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      toast.error("從圖片寫文案時出錯了，再試一次。");
    } finally {
      setCopyBusy(false);
    }
  }

  async function runReels(draft?: CopyDraft) {
    setReelsBusy(true);
    try {
      const res = await generateReelsScript({
        data: {
          eventName: eventName.trim(),
          schedule: schedule.trim(),
          location: location.trim(),
          detail: [idea.trim(), draft?.body ?? ""].filter(Boolean).join("\n"),
          painPoint: painPoint.trim(),
          cta: draft?.cta ?? "",
          audienceIds,
          brandMemoryText: brand ? formatBrandMemory(brand.memory) : undefined,
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
        toast.success("Reels 腳本已存到這則內容");
      } else {
        toast.info("先選一個文案版本建立內容，腳本就會存進去。");
      }
      return res.reels;
    } finally {
      setReelsBusy(false);
    }
  }

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
            <Button
              variant="secondary"
              onClick={() =>
                void navigate({ to: "/studio/$projectId", params: { projectId: linkedProject.id } })
              }
            >
              進畫面編輯
              <ArrowRight className="size-4" />
            </Button>
          ) : null
        }
      />

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
          <Button onClick={runCopy} disabled={copyBusy}>
            {copyBusy ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
            生成文案
          </Button>
          <Button variant="secondary" onClick={runVisuals} disabled={visualBusy}>
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
              <Button variant="ghost" size="sm" onClick={runCopy} disabled={copyBusy}>
                重新生成
              </Button>
            }
          />
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {drafts.map((draft) => (
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
              正在用淡江學生的視角重看一次…
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
                <RegenerateButton onClick={runVisuals} busy={visualBusy} />
              </div>
            }
          />
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {directions.map((direction) => (
              <li key={direction.id}>
                <VisualDirectionCard
                  direction={direction}
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
                  onImageSaved={(assetId) => {
                    if (!linkedProject) return;
                    addSources(linkedProject.id, [
                      { kind: "generated", label: "AI 生成圖片", detail: direction.title, assetId },
                    ]);
                  }}
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
        <section className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <ConvertBar project={linkedProject} />
        </section>
      ) : null}
    </main>
  );
}
