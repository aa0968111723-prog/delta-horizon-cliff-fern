import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AssistantForm } from "@/components/assistant/assistant-form";
import { IdeaFlow } from "@/components/create/idea-flow";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FormatPreview } from "@/components/create/format-preview";
import { CONVERT_TARGETS, convertPlan } from "@/lib/convert/pack";
import { COPY_INTENTS, COPY_TONES, generateCopyPack, type CopyPack } from "@/lib/copy/generate";
import { applyStudentReviewToPack } from "@/lib/copy/review";
import { consumeHandoff, takeAutoRun, type CreateHandoff, type CreateTab } from "@/lib/create/handoff";
import { generateImageDirections, generateStudioImage, IMAGE_ASPECTS } from "@/lib/image/studio";
import { analyzeImage, type VisionReport } from "@/lib/vision/analyze";
import { compactDataUrl, loadAssetDataUrl } from "@/lib/vision/media";
import { convertKindFromAction, formatFromVisionAction, ideaFromVision, isImageVisionAction } from "@/lib/vision/tags";
import { styleBriefFromReport } from "@/lib/vision/from-hit";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { useStudio } from "@/stores/studio-store";
import { useCreative } from "@/stores/creative-store";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { lessonPrompt } from "@/lib/club/insights";
import { applyCanvaPush, canvaPushMessage, pushHeroToCanva } from "@/lib/club/canva-push";
import { kindFromFormat, lastPackFromPlan, lastPackPreviewSrc, packAssetIds, withPackKind, httpsRasterUrl } from "@/lib/club/last-pack";
import { convertedScheduleInput, matchingScheduleRow } from "@/lib/club/schedule";
import type { ContentKind, CreativeDirection, FormatId } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { beginOAuth } from "@/lib/connections/begin";

export type { CreateTab };

export function CreateHub({ initialTab = "campaign" }: { initialTab?: CreateTab }) {
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const projects = useStudio((s) => s.projects);
  const [tab, setTab] = useState<CreateTab>(initialTab);
  const [bridge, setBridge] = useState<CreateHandoff>(() => consumeHandoff() ?? {});

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const next = consumeHandoff();
    if (next) {
      setBridge(next);
      if (next.tab) setTab(next.tab);
    }
  }, [initialTab]);

  const lastPlan = projects.find((item) => item.id === lastProjectId)?.plan;

  function applyVisionAction(action: { id: string; report: VisionReport; preview: string | null; note: string }) {
    const idea = ideaFromVision(action.id, action.report, action.note);
    useCreative.getState().rememberStyle(styleBriefFromReport(action.report, action.note || "圖片理解"));
    const convertKind = convertKindFromAction(action.id);
    const next: CreateHandoff = {
      idea,
      imageDataUrl: action.preview ?? undefined,
      visionNote: action.note,
      visionAction: action.id,
      convertKind,
      formatId: formatFromVisionAction(action.id),
      sourceLabel: "圖片理解",
    };
    setBridge(next);
    if (isImageVisionAction(action.id)) {
      setTab("image");
      return;
    }
    if (convertKind && lastPlan) {
      setTab("convert");
      return;
    }
    setTab("campaign");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI 創作"
        title="多模態工作台"
        description="從一句話開始：找素材、給三個方向、再產出 IG 文案與多模態內容。前台不顯示 Agent。"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["campaign", "活動宣傳"],
            ["copy", "IG 文案"],
            ["image", "圖片 Studio"],
            ["vision", "圖片理解"],
            ["convert", "一鍵轉換"],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "secondary"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        {tab === "campaign" ? (
          <div className="space-y-8">
            <IdeaFlow seedIdea={bridge.idea} seedConvertKind={bridge.convertKind} seedAutoRun={bridge.autoRun} />
            <details className="rounded-2xl bg-bg px-4 py-3">
              <summary className="cursor-pointer text-sm text-muted">需要填完整活動欄位再生成</summary>
              <div className="mt-4">
                <AssistantForm variant="page" projectId={lastProjectId} />
              </div>
            </details>
          </div>
        ) : null}
        {tab === "copy" ? <CopyStudio seedIdea={bridge.idea} /> : null}
        {tab === "image" ? (
          <ImageStudio
            seedIdea={bridge.idea}
            referenceImage={bridge.imageDataUrl}
            sourceLabel={bridge.sourceLabel}
            seedFormat={bridge.formatId}
            seedAction={bridge.visionAction}
            seedAutoRun={bridge.autoRun}
          />
        ) : null}
        {tab === "vision" ? (
          <VisionStudio
            seedImage={bridge.imageDataUrl || bridge.imageSrc}
            seedNote={bridge.visionNote}
            seedAssetId={bridge.assetId}
            onAction={applyVisionAction}
          />
        ) : null}
        {tab === "convert" ? (
          <ConvertStudio
            seedKind={bridge.convertKind}
            seedIdea={bridge.idea}
            onMakeCampaign={() => setTab("campaign")}
          />
        ) : null}
      </div>
    </main>
  );
}

function CopyStudio({ seedIdea }: { seedIdea?: string }) {
  const projects = useStudio((s) => s.projects);
  const setCopy = useStudio((s) => s.setCopy);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const igPosts = useCreative((s) => s.igPosts);
  const setLastPack = useCreative((s) => s.setLastPack);
  const campaigns = useCreative((s) => s.campaigns);
  const [idea, setIdea] = useState(seedIdea || "最近是不是很久沒有好好坐下來？");
  const [intent, setIntent] = useState("情緒共鳴");
  const [tone, setTone] = useState("學生版");
  const [pack, setPack] = useState<CopyPack | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (seedIdea) setIdea(seedIdea);
  }, [seedIdea]);

  async function run() {
    setBusy(true);
    try {
      const result = await generateCopyPack({ data: { idea, intent, tone, igLessons: lessonPrompt(igPosts) } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPack(result.pack);
      const current = useCreative.getState().lastPack;
      const nextCaption = `${result.pack.hook}\n\n${result.pack.body}`;
      if (current) {
        setLastPack({ ...current, hook: result.pack.hook, caption: nextCaption, hashtags: result.pack.hashtags, updatedAt: Date.now() });
      } else {
        setLastPack(
          lastPackFromPlan({
            projectId: lastProjectId || "proj_copy",
            campaignId: campaigns[0]?.id || "",
            eventName: idea.slice(0, 16) || "文案",
            plan: { hook: result.pack.hook, captions: [{ style: tone, text: nextCaption }], hashtags: result.pack.hashtags },
          }),
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const project = projects.find((p) => p.id === lastProjectId);

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        意圖
        <select className="mt-1 h-11 w-full rounded-md border border-border bg-surface px-3" value={intent} onChange={(e) => setIntent(e.target.value)}>
          {COPY_INTENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        想法
        <Textarea value={idea} onChange={(e) => setIdea(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {COPY_TONES.map((item) => (
          <Button key={item} size="sm" variant={tone === item ? "default" : "secondary"} onClick={() => setTone(item)}>
            {item}
          </Button>
        ))}
      </div>
      <Button disabled={busy} onClick={() => void run()}>
        {busy ? "寫作中…" : "生成文案"}
      </Button>
      {pack ? (
        <div className="space-y-3 rounded-2xl bg-bg p-4">
          <p className="font-display text-xl">{pack.hook}</p>
          <p className="whitespace-pre-wrap text-sm">{pack.body}</p>
          <p className="text-sm">{pack.cta}</p>
          <p className="text-xs text-muted">{pack.hashtags.join(" ")}</p>
          <p className="text-xs text-muted">學生視角：{pack.studentReview.wouldStop} {pack.studentReview.revisions.join("、")}</p>
          <Button
            size="sm"
            variant="secondary"
            data-testid="copy-apply-review"
            onClick={() => setPack(applyStudentReviewToPack(pack).pack)}
          >
            套用淡江學生視角
          </Button>
          {project ? (
            <Button
              variant="secondary"
              onClick={() =>
                setCopy(project.id, {
                  headline: pack.hook,
                  body: pack.body,
                  cta: pack.cta,
                  caption: `${pack.hook}\n\n${pack.body}`,
                  hashtags: pack.hashtags,
                })
              }
            >
              套進目前作品
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ImageStudio({
  seedIdea,
  referenceImage,
  sourceLabel,
  seedFormat,
  seedAction,
  seedAutoRun,
}: {
  seedIdea?: string;
  referenceImage?: string;
  sourceLabel?: string;
  seedFormat?: FormatId;
  seedAction?: string;
  seedAutoRun?: boolean;
}) {
  const addAsset = useStudio((s) => s.addAsset);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const setLastPack = useCreative((s) => s.setLastPack);
  const campaigns = useCreative((s) => s.campaigns);
  const igPosts = useCreative((s) => s.igPosts);
  const [idea, setIdea] = useState(seedIdea || "我要宣傳茶會");
  const [formatId, setFormatId] = useState<(typeof IMAGE_ASPECTS)[number]["id"]>(
    seedFormat && IMAGE_ASPECTS.some((item) => item.id === seedFormat) ? seedFormat : "feed-portrait",
  );
  const [dirs, setDirs] = useState<CreativeDirection[]>([]);
  const [picked, setPicked] = useState<CreativeDirection | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (seedIdea) setIdea(seedIdea);
    if (seedFormat && IMAGE_ASPECTS.some((item) => item.id === seedFormat)) setFormatId(seedFormat);
  }, [seedIdea, seedFormat]);

  useEffect(() => {
    if (!takeAutoRun(seedAutoRun)) return;
    void directions();
    // Intentionally once per consumed handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedAutoRun, seedIdea]);

  async function directions() {
    setBusy(true);
    try {
      const result = await generateImageDirections({
        data: { idea, formatId, igLessons: lessonPrompt(igPosts) },
      });
      setDirs(result.directions);
    } finally {
      setBusy(false);
    }
  }

  async function render(direction: CreativeDirection, variation?: "regen" | "compose" | "mood" | "background" | "style" | "text") {
    setBusy(true);
    setPicked(direction);
    try {
      const editUrl = referenceImage ? compactDataUrl(referenceImage) : null;
      const result = await generateStudioImage({
        data: {
          prompt: `${direction.imagePrompt}. ${idea}`.slice(0, 1200),
          variation,
          headline: direction.headline,
          eventName: idea.slice(0, 40),
          formatId,
          editUrls: editUrl ? [editUrl] : undefined,
        },
      });
      setUrls(result.urls);
      const url = result.urls[0];
      if (!url) {
        toast.error("圖片暫時無法生成");
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const id = uid("asset");
      await getAssetStorage().put(id, blob);
      const format = formatById(formatId);
      addAsset(
        createGeneratedAsset({
          id,
          name: `${direction.name} · ${idea.slice(0, 18)}`,
          mime: blob.type || "image/png",
          width: format.width,
          height: format.height,
          category: "poster",
          tags: ["AI生成", direction.name, seedAction || "圖片Studio"].filter(Boolean),
        }),
      );
      toast.success(sourceLabel ? `已存進素材庫 · 來源：AI Generated（參考 ${sourceLabel}）` : "已存進素材庫 · 來源：AI Generated");
      const current = useCreative.getState().lastPack;
      const kind = kindFromFormat(formatId);
      setLastPack(
        lastPackFromPlan({
          projectId: lastProjectId || current?.projectId || "proj_image",
          campaignId: current?.campaignId || campaigns[0]?.id || "",
          eventName: idea.slice(0, 16) || current?.eventName || "主視覺",
          plan: {
            hook: direction.headline || current?.hook || idea,
            captions: [{ style: "視覺", text: current?.caption || direction.subhead || idea }],
            hashtags: current?.hashtags ?? [],
          },
          kind,
          converted: current?.converted,
          packs: current?.packs,
          formatAssetIds: { ...current?.formatAssetIds, [kind]: id },
          formatPublicUrls: {
            ...current?.formatPublicUrls,
            ...(httpsRasterUrl(url) ? { [kind]: httpsRasterUrl(url) } : {}),
          },
          canvaDesignId: current?.canvaDesignId,
          canvaEditUrl: current?.canvaEditUrl,
          canvaExportUrl: current?.canvaExportUrl,
          reelsVideoUrl: current?.reelsVideoUrl,
          reelsJobId: current?.reelsJobId,
          directionName: direction.name,
          heroAssetId: id,
          heroThumb: current?.heroThumb,
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {referenceImage ? (
        <div className="rounded-2xl bg-bg p-3">
          <p className="text-xs text-muted">參考畫面{sourceLabel ? ` · ${sourceLabel}` : ""}</p>
          <img src={referenceImage} alt="風格參考" className="mt-2 max-h-40 rounded-xl object-contain" />
        </div>
      ) : null}
      <label className="block text-sm">
        我想做
        <Input data-testid="image-studio-input" value={idea} onChange={(e) => setIdea(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        {IMAGE_ASPECTS.map((item) => (
          <Button key={item.id} size="sm" variant={formatId === item.id ? "default" : "secondary"} onClick={() => setFormatId(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <Button data-testid="image-studio-run" disabled={busy} onClick={() => void directions()}>
        {busy ? "思考中…" : "提出三個視覺方向"}
      </Button>
      <ul className="space-y-3">
        {dirs.map((dir) => (
          <li key={dir.id} data-testid="image-direction" className={cn("rounded-2xl bg-bg p-4", picked?.id === dir.id && "ring-2 ring-ring/30")}>
            <p className="font-display text-lg">{dir.name}</p>
            <p className="mt-1 text-sm">{dir.concept}</p>
            <p className="mt-1 text-xs text-muted">{dir.palette} · {dir.composition} · {dir.typeDirection}</p>
            <p className="mt-2 text-sm">{dir.headline}</p>
            <p className="mt-1 text-xs text-muted">{dir.subhead}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => void render(dir)}>生成圖片</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "compose")}>換構圖</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "mood")}>換氣氛</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "background")}>換背景</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "style")}>換風格</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "text")}>換文字</Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void render(dir, "regen")}>重新生成</Button>
            </div>
          </li>
        ))}
      </ul>
      {urls[0] ? (
        <FormatPreview
          kind={kindFromFormat(formatId)}
          src={urls[0]}
          hook={picked?.headline || idea}
          items={[{ heading: picked?.name || "主視覺", body: picked?.headline || idea, visual: picked?.composition || "主畫面" }]}
        />
      ) : null}
    </div>
  );
}

function VisionStudio({
  onAction,
  seedImage,
  seedNote,
  seedAssetId,
}: {
  onAction: (action: { id: string; report: VisionReport; preview: string | null; note: string }) => void;
  seedImage?: string;
  seedNote?: string;
  seedAssetId?: string;
}) {
  const assets = useStudio((s) => s.assets);
  const [note, setNote] = useState(seedNote || "");
  const [report, setReport] = useState<VisionReport | null>(null);
  const [preview, setPreview] = useState<string | null>(seedImage || null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  async function runAnalyze(dataUrl: string, extraNote: string) {
    setBusy(true);
    try {
      const packed = compactDataUrl(dataUrl, 5_500_000);
      const result = await analyzeImage({
        data: {
          imageDataUrl:
            packed && packed.startsWith("data:") && packed.length >= 20
              ? packed
              : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          note: extraNote || "原圖較大，以檔名與畫面描述分析",
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReport(result.report);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (seedImage) {
      setPreview(seedImage);
      void loadAssetDataUrl({ id: "vision-seed", previewUrl: seedImage, seedSrc: seedImage }).then((dataUrl) => {
        void runAnalyze(dataUrl || seedImage, seedNote || "");
      });
      return;
    }
    if (!seedAssetId) return;
    const asset = assets.find((item) => item.id === seedAssetId);
    void loadAssetDataUrl({ id: seedAssetId, seedSrc: asset?.seedSrc }).then((dataUrl) => {
      if (!dataUrl) return;
      setPreview(dataUrl);
      void runAnalyze(dataUrl, seedNote || asset?.name || "");
    });
  }, [seedImage, seedAssetId, seedNote, assets]);

  async function onFile(file: File) {
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    await runAnalyze(dataUrl, note);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">可丟入照片、歷屆海報、IG 截圖、Canva、活動照或淡水校園照。</p>
      <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="這是去年茶會海報…" />
      {preview ? <img src={preview} alt="上傳預覽" className="max-h-64 rounded-2xl object-contain" /> : null}
      {busy ? <p className="text-sm">分析中…</p> : null}
      {report ? (
        <div className="space-y-2 text-sm">
          <p>{report.content}</p>
          <p>人物：{report.people}</p>
          <p>品牌感：{report.brandFeel}</p>
          <p>學生感：{report.studentFeel}</p>
          <p>停留感：{report.stayFeel}</p>
          <p>是否太宗教：{report.tooReligious}</p>
          <p>是否太老氣：{report.tooOld}</p>
          <p>是否太像 AI：{report.tooAi}</p>
          <p>是否符合淡江學生：{report.fitsTamkang}</p>
          <ul className="flex flex-wrap gap-2 pt-2">
            {report.actions.map((action) => (
              <li key={action.id}>
                <Button
                  size="sm"
                  variant="secondary"
                  data-testid={`vision-action-${action.id}`}
                  onClick={() => onAction({ id: action.id, report, preview, note })}
                >
                  {action.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ConvertStudio({
  seedKind,
  seedIdea,
  onMakeCampaign,
}: {
  seedKind?: ContentKind;
  seedIdea?: string;
  onMakeCampaign: () => void;
}) {
  const projects = useStudio((s) => s.projects);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const updateProject = useStudio((s) => s.updateProject);
  const lastPack = useCreative((s) => s.lastPack);
  const setLastPack = useCreative((s) => s.setLastPack);
  const campaigns = useCreative((s) => s.campaigns);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === lastProjectId);
  const [kind, setKind] = useState<ContentKind>(seedKind || "carousel");
  const [sending, setSending] = useState(false);
  const urls = useAssetUrls(packAssetIds(lastPack));

  useEffect(() => {
    if (seedKind) setKind(seedKind);
  }, [seedKind]);

  if (!project?.plan) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">先在「活動宣傳」生成一篇，就可以一鍵轉成 Carousel、Story、Threads、LINE、Reels。</p>
        {seedIdea ? (
          <Button data-testid="convert-to-campaign" onClick={onMakeCampaign}>
            用剛才的圖去做完整宣傳
          </Button>
        ) : null}
      </div>
    );
  }

  const plan = project.plan;
  const converted = convertPlan(plan, kind);
  const previewSrc = lastPack ? lastPackPreviewSrc(lastPack, urls, kind) : "/seed/tea.svg";

  function pickKind(next: ContentKind) {
    setKind(next);
    const pack = convertPlan(plan, next);
    const current = useCreative.getState().lastPack;
    if (current) setLastPack(withPackKind(current, next, pack.items));
  }

  function putKindOnCalendar(nextKind = kind) {
    const pack = lastPack;
    const campaign = campaigns.find((item) => item.id === pack?.campaignId);
    if (!pack || !campaign?.date) {
      toast.message("先在活動宣傳生成一篇，就能排進 Calendar。");
      return;
    }
    const draft = convertedScheduleInput({
      eventDate: campaign.date,
      eventName: pack.eventName,
      kind: nextKind,
      hook: pack.hook,
      campaignId: pack.campaignId,
      projectId: pack.projectId,
    });
    const existing = matchingScheduleRow(useCreative.getState().schedule, {
      campaignId: pack.campaignId,
      kind: nextKind,
      plannedAt: draft.plannedAt,
    });
    upsertSchedule({ ...draft, id: existing?.id });
    updateProject(pack.projectId, {
      campaignId: pack.campaignId,
      contentKind: nextKind,
      contentStatus: "scheduled",
      scheduledAt: draft.plannedAt,
    });
    toast.success(`已排入 Calendar · ${draft.title}`);
    void navigate({ to: "/calendar" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CONVERT_TARGETS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={kind === item.id ? "default" : "secondary"}
            data-testid={`convert-kind-${item.id}`}
            onClick={() => pickKind(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <FormatPreview kind={kind} src={previewSrc} hook={project.plan.hook} items={converted.items} handle={project.copy.handle} />
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
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="secondary"
          data-testid="convert-calendar"
          onClick={() => putKindOnCalendar()}
        >
          排入這個格式
        </Button>
        <Button
          variant="secondary"
          data-testid="convert-canva"
          disabled={sending}
          onClick={async () => {
            setSending(true);
            try {
              const caption = converted.items.map((item) => `${item.heading}\n${item.body}`).join("\n\n");
              const result = await pushHeroToCanva({
                title: lastPack ? `${lastPack.eventName} · ${converted.title}` : converted.title,
                kind,
                previewSrc,
                caption,
              });
              const current = useCreative.getState().lastPack;
              if (current && result.ok) setLastPack(applyCanvaPush(withPackKind(current, kind, converted.items), result));
              if (result.ok) {
                window.open(result.editUrl, "_blank", "noopener,noreferrer");
                toast.success(canvaPushMessage(result));
                return;
              }
              if (result.needsConnect) {
                toast.message("正在連接 Canva，回來後會自動把主視覺送進去。");
                const started = await beginOAuth({ provider: "canva", next: "create", resume: "canva-push" });
                if (!started.ok) {
                  toast.message(started.error);
                  void navigate({ to: "/connections" });
                }
                return;
              }
              toast.message(canvaPushMessage(result));
            } finally {
              setSending(false);
            }
          }}
        >
          {sending ? "送進 Canva…" : "送進 Canva 微調"}
        </Button>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
