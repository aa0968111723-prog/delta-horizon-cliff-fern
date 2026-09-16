import { Link, useNavigate } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { CalendarPlus, Check, Copy, LayoutTemplate, Sparkles, Tent, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CopyPanel } from "@/components/create/copy-panel";
import { FormatsPanel } from "@/components/create/formats-panel";
import { ReelsPanel } from "@/components/create/reels-panel";
import { type AspectId, VisualPanel } from "@/components/create/visual-panel";
import { ContentStatusBadge } from "@/components/content/content-card";
import { igCaption, IgPostPreview } from "@/components/content/ig-preview";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import {
  analyzeZenImage,
  convertZenContent,
  generateVisualDirections,
  generateZenCopy,
  generateZenImage,
  generateZenReels,
  getZenAiStatus,
  reviewAsStudent,
} from "@/lib/ai/zen";
import type { CampaignContextInput } from "@/lib/ai/zen-schema";
import { brandMemoryContext } from "@/lib/studio/brand";
import { campaignToContext, ideaToContext, waveDateIso } from "@/lib/studio/campaigns";
import { importUserImage, saveGeneratedImage } from "@/lib/studio/generated-assets";
import type { AssetInsight, ContentItem, ContentStatus, ContentType, CopyDraft, CreativeDirection, ToneId } from "@/lib/studio/types";
import { studentContext } from "@/lib/zen/context";
import { type CreateMode, MODE_LABEL, modeToContentType } from "@/lib/zen/create-modes";
import { CONTENT_STATUS, CONTENT_STATUS_ORDER, CONTENT_TYPES, contentTypeLabel, WAVE_ROLES } from "@/lib/zen/labels";
import { reelsCoverPrompt } from "@/lib/zen/reels";
import { pickHooks } from "@/lib/zen/voice";
import { cn } from "@/lib/utils";
import type { CreateSearch } from "@/routes/create";
import { useStudio } from "@/stores/studio-store";

export function CreateStudio({ search }: { search: CreateSearch }) {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const brand = useStudio((s) => s.brands[0]);
  const campaigns = useStudio((s) => s.campaigns);
  const contents = useStudio((s) => s.contents);
  const assets = useStudio((s) => s.assets);
  const createContent = useStudio((s) => s.createContent);
  const updateContent = useStudio((s) => s.updateContent);
  const setContentStatus = useStudio((s) => s.setContentStatus);
  const scheduleContent = useStudio((s) => s.scheduleContent);
  const deleteContent = useStudio((s) => s.deleteContent);
  const duplicateContent = useStudio((s) => s.duplicateContent);
  const updateCampaign = useStudio((s) => s.updateCampaign);
  const addAsset = useStudio((s) => s.addAsset);
  const updateAsset = useStudio((s) => s.updateAsset);
  const markAssetUsed = useStudio((s) => s.markAssetUsed);
  const createProject = useStudio((s) => s.createProject);
  const setCopy = useStudio((s) => s.setCopy);

  const mode: CreateMode = search.mode ?? "post";
  const [contentId, setContentId] = useState<string | null>(search.contentId ?? null);
  const content = contents.find((c) => c.id === contentId) ?? null;
  const [campaignId, setCampaignId] = useState<string | null>(search.campaignId ?? null);
  const campaign = campaigns.find((c) => c.id === (content?.campaignId ?? campaignId)) ?? null;
  const wave = campaign?.strategy?.waves.find((w) => w.id === search.waveId) ?? null;
  const [idea, setIdea] = useState(search.idea ?? "");
  const [type, setType] = useState<ContentType>(wave?.contentType ?? modeToContentType(mode));
  const [directions, setDirections] = useState<CreativeDirection[]>(campaign?.strategy?.directions ?? []);
  const [chosenId, setChosenId] = useState<string | null>(campaign?.strategy?.chosenDirectionId ?? null);
  const [insight, setInsight] = useState<AssetInsight | null>(null);
  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [busy, setBusy] = useState<{ copy?: boolean; review?: boolean; dir?: boolean; img?: boolean; conv?: boolean; ana?: boolean }>({});
  const autoRan = useRef(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getZenAiStatus().then((s) => setAiLive(s.available)).catch(() => setAiLive(false));
  }, []);

  useEffect(() => {
    if (search.contentId && search.contentId !== contentId) setContentId(search.contentId);
  }, [search.contentId, contentId]);

  useEffect(() => {
    if (content) setType(content.type);
  }, [content?.id, content?.type]);

  const urls = useAssetUrls(
    useMemo(() => {
      const ids = [content?.coverAssetId ?? "", campaign?.coverAssetId ?? ""];
      for (const b of content?.reels ?? []) if (b.assetId) ids.push(b.assetId);
      return ids;
    }, [content?.coverAssetId, campaign?.coverAssetId, content?.reels]),
  );
  const cover = content?.coverAssetId ? urls[content.coverAssetId] : undefined;

  const ctx = useMemo<CampaignContextInput | null>(() => {
    if (!brand) return null;
    if (campaign) return campaignToContext(campaign, brand, { sourceNotes: insight ? `參考圖片：${insight.summary}` : undefined });
    const seed = idea || content?.title || "";
    if (!seed.trim()) return null;
    return ideaToContext(seed, brand);
  }, [brand, campaign, idea, content?.title, insight]);

  const sc = studentContext();

  /* ---------------------------------------------------------------- */

  function ensureContent(seedCopy?: Partial<CopyDraft>): ContentItem | null {
    if (content) return content;
    if (!brand) return null;
    const title = campaign ? `${campaign.name}${wave ? ` · ${wave.title}` : ""}` : idea.trim().slice(0, 40) || MODE_LABEL[mode];
    const created = createContent({
      campaignId: campaign?.id ?? null,
      type,
      status: "drafting",
      title,
      copy: { hook: wave?.hook ?? "", body: "", cta: campaign?.cta ?? "", hashtags: [], tone: "normal", ...seedCopy },
      visualDirection: wave?.angle ?? "",
      scheduledAt: campaign && wave ? new Date(`${waveDateIso(campaign, wave)}T20:00:00`).getTime() : null,
      sources: [
        { kind: "brand", label: "Brand Memory / 淡江禪學社" },
        ...(wave ? [{ kind: "ai" as const, label: `AI 宣傳策略 / ${WAVE_ROLES[wave.role].label}` }] : []),
      ],
    });
    if (campaign && wave) {
      updateCampaign(campaign.id, (c) =>
        c.strategy
          ? { ...c, strategy: { ...c.strategy, waves: c.strategy.waves.map((w) => (w.id === wave.id ? { ...w, contentId: created.id } : w)) } }
          : c,
      );
    }
    setContentId(created.id);
    void navigate({ to: "/create", search: { ...search, contentId: created.id }, replace: true });
    return created;
  }

  async function runCopy(tone: ToneId = content?.copy.tone ?? "normal") {
    if (!ctx) {
      toast.message("先選一個活動，或寫一句你想講的。");
      return;
    }
    const target = ensureContent();
    if (!target) return;
    setBusy((b) => ({ ...b, copy: true }));
    try {
      const res = await generateZenCopy({
        data: {
          campaign: ctx,
          contentType: target.type,
          tone,
          angle: wave?.angle || target.visualDirection || undefined,
          waveRole: wave?.role,
          idea: idea || undefined,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const primary = res.variants[0];
      updateContent(target.id, (c) => ({
        ...c,
        copy: primary,
        variants: res.variants,
        imagePrompt: c.imagePrompt || res.imagePrompt,
        visualDirection: c.visualDirection || res.visualDirection,
        generatedBy: res.source,
        status: c.status === "idea" ? "drafting" : c.status,
        sources: c.sources.some((s) => s.kind === "ai" && s.label.startsWith("AI 文案")) ? c.sources : [...c.sources, { kind: "ai", label: `AI 文案 / ${res.source === "live" ? "Grok" : "本機規則"}` }],
      }));
      toast.success(res.source === "live" ? "AI 寫好了 6 個語氣版本" : "已用本機規則寫出草案（AI 連線後品質更好）");
      void runReview(primary, target.id);
    } finally {
      setBusy((b) => ({ ...b, copy: false }));
    }
  }

  function switchTone(tone: ToneId) {
    if (!content) {
      void runCopy(tone);
      return;
    }
    const v = content.variants.find((x) => x.tone === tone);
    if (v) updateContent(content.id, { copy: v });
    else void runCopy(tone);
  }

  async function runReview(copy?: CopyDraft, id?: string) {
    const target = id ? contents.find((c) => c.id === id) ?? content : content;
    const c = copy ?? target?.copy;
    if (!ctx || !c || !(id ?? target?.id)) return;
    setBusy((b) => ({ ...b, review: true }));
    try {
      const res = await reviewAsStudent({ data: { campaign: ctx, hook: c.hook, body: c.body, cta: c.cta } });
      if (res.ok) updateContent(id ?? target!.id, { review: res.review });
    } finally {
      setBusy((b) => ({ ...b, review: false }));
    }
  }

  function patchCopy(patch: Partial<CopyDraft>) {
    const target = ensureContent(patch);
    if (!target) return;
    updateContent(target.id, (c) => ({
      ...c,
      copy: { ...c.copy, ...patch },
      variants: c.variants.map((v) => (v.tone === c.copy.tone ? { ...v, ...patch } : v)),
    }));
  }

  async function runDirections() {
    if (!ctx) {
      toast.message("先選一個活動，或寫一句你想講的。");
      return;
    }
    setBusy((b) => ({ ...b, dir: true }));
    try {
      const res = await generateVisualDirections({ data: { campaign: ctx, idea: idea || undefined, referenceNotes: insight?.summary } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setDirections(res.directions);
      setChosenId(null);
      if (campaign?.strategy) updateCampaign(campaign.id, { strategy: { ...campaign.strategy, directions: res.directions, chosenDirectionId: null } });
    } finally {
      setBusy((b) => ({ ...b, dir: false }));
    }
  }

  function chooseDirection(d: CreativeDirection) {
    setChosenId(d.id);
    const target = ensureContent();
    if (target) updateContent(target.id, { imagePrompt: d.imagePrompt, visualDirection: `${d.title}：${d.concept}` });
    if (campaign?.strategy) updateCampaign(campaign.id, { strategy: { ...campaign.strategy, chosenDirectionId: d.id } });
  }

  async function runImage(aspect: AspectId, promptOverride?: string) {
    const target = ensureContent();
    if (!target || !brand) return;
    const prompt = (promptOverride ?? target.imagePrompt).trim();
    if (!prompt) return;
    setBusy((b) => ({ ...b, img: true }));
    try {
      const res = await generateZenImage({ data: { prompt, brandContext: brandMemoryContext(brand).slice(0, 2000), aspect, quality: "fast" } });
      if (!res.ok) {
        if (res.unavailable) setImageUnavailable(true);
        toast.message(res.error);
        return;
      }
      const meta = await saveGeneratedImage({
        src: res.url,
        name: `${target.title} · ${aspect === "9:16" ? "封面" : "主視覺"} ${aspect}`,
        prompt,
        tags: [campaign?.name ?? "日常", contentTypeLabel(target.type), aspect],
      });
      addAsset(meta);
      updateContent(target.id, (c) => ({
        ...c,
        coverAssetId: meta.id,
        imagePrompt: prompt,
        sources: [...c.sources.filter((s) => s.kind !== "library" || !s.label.startsWith("AI Generated")), { kind: "library", label: "AI Generated / 主視覺", refId: meta.id }],
      }));
      toast.success("主視覺生成完成，已存進素材庫（AI 生成）");
    } finally {
      setBusy((b) => ({ ...b, img: false }));
    }
  }

  async function onPhoto(file: File) {
    if (!brand) return;
    setBusy((b) => ({ ...b, ana: true }));
    try {
      const { meta, dataUrl } = await importUserImage(file, { category: "photo", tags: campaign ? [campaign.name] : [] });
      addAsset(meta);
      const target = ensureContent();
      if (target) {
        updateContent(target.id, (c) => ({
          ...c,
          coverAssetId: meta.id,
          sources: [...c.sources, { kind: "library", label: `素材庫 / ${meta.name}`, refId: meta.id }],
        }));
      }
      const res = await analyzeZenImage({ data: { brandContext: brandMemoryContext(brand).slice(0, 3000), imageDataUrl: dataUrl, fileName: file.name, hints: campaign?.name } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const next: AssetInsight = {
        summary: res.insight.summary,
        subjects: res.insight.subjects,
        palette: res.insight.palette,
        mood: res.insight.mood,
        studentFit: res.insight.studentFit,
        brandFit: res.insight.brandFit,
        stopPower: res.insight.stopPower,
        warnings: res.insight.warnings,
        suggestions: res.insight.suggestions,
        analyzedAt: Date.now(),
        source: res.source,
      };
      setInsight(next);
      updateAsset(meta.id, { insight: next, tags: [...new Set([...meta.tags, ...res.insight.tags])] });
      if (target && res.insight.extendPrompt) updateContent(target.id, (c) => ({ ...c, imagePrompt: c.imagePrompt || res.insight.extendPrompt }));
      toast.success(res.source === "live" ? "AI 看完了這張圖" : "已存進素材庫；AI 視覺連線後可實際看圖");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "無法讀取這張圖");
    } finally {
      setBusy((b) => ({ ...b, ana: false }));
    }
  }

  async function runConvert() {
    if (!ctx || !content) return;
    setBusy((b) => ({ ...b, conv: true }));
    try {
      const res = await convertZenContent({ data: { campaign: ctx, from: content.copy, to: content.type } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      updateContent(content.id, {
        carousel: res.carousel,
        storyFrames: res.storyFrames,
        reels: res.reels,
        threads: res.threads,
        line: res.line,
        generatedBy: content.generatedBy ?? res.source,
      });
      toast.success("已轉成 Carousel、Story、Reels、Threads、LINE");
    } finally {
      setBusy((b) => ({ ...b, conv: false }));
    }
  }

  async function runReels() {
    if (!ctx) {
      toast.message("先選一個活動，或寫一句你想講的。");
      return;
    }
    const target = ensureContent();
    if (!target) return;
    setBusy((b) => ({ ...b, conv: true }));
    try {
      const res = await generateZenReels({
        data: {
          campaign: ctx,
          from: target.copy.hook ? target.copy : undefined,
          idea: idea || undefined,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setType("reels");
      updateContent(target.id, (c) => ({
        ...c,
        type: "reels",
        reels: res.reels,
        imagePrompt: c.imagePrompt || res.coverPrompt,
        copy: {
          ...c.copy,
          hook: c.copy.hook || res.hook,
          body: c.copy.body || res.body,
          cta: c.copy.cta || res.cta,
        },
        generatedBy: c.generatedBy ?? res.source,
        sources: c.sources.some((s) => s.label.startsWith("AI Reels"))
          ? c.sources
          : [...c.sources, { kind: "ai", label: `AI Reels / ${res.source === "live" ? "Grok" : "本機規則"}` }],
      }));
      toast.success(res.source === "live" ? "20 秒腳本寫好了，可以預覽、改字幕、出封面" : "已用本機規則寫出 20 秒腳本（AI 連線後更貼校園）");
      if (!target.copy.hook) void runReview({ hook: res.hook, body: res.body, cta: res.cta, hashtags: target.copy.hashtags, tone: "normal" }, target.id);
    } finally {
      setBusy((b) => ({ ...b, conv: false }));
    }
  }

  function patchBeat(index: number, patch: Partial<ContentItem["reels"][number]>) {
    if (!content) return;
    if (patch.assetId) markAssetUsed(patch.assetId);
    updateContent(content.id, (c) => ({
      ...c,
      reels: c.reels.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));
  }

  function openCanvas() {
    if (!content || !brand) return;
    let projectId = content.projectId;
    if (!projectId) {
      const formatId = content.type === "story" || content.type === "reels" ? "story" : "feed-portrait";
      const project = createProject({
        name: content.title,
        brandId: brand.id,
        formatId,
        brief: {
          product: campaign?.name ?? content.title,
          eventName: campaign?.name ?? "",
          schedule: campaign ? `${campaign.date} ${campaign.time}` : "",
          location: campaign?.location ?? "",
          offer: campaign?.oneLiner ?? "",
          audience: "淡江大學學生",
          goal: "awareness",
          features: content.copy.body.slice(0, 200),
          style: content.visualDirection,
          notes: content.imagePrompt,
          deliverables: { post: true, story: content.type === "story", carousel: content.type === "carousel", reels: content.type === "reels" },
        },
      });
      setCopy(project.id, {
        headline: content.copy.hook || content.title,
        subhead: campaign?.oneLiner ?? "",
        body: content.copy.body.split("\n")[0] ?? "",
        cta: content.copy.cta,
        caption: igCaption(content),
        hashtags: content.copy.hashtags,
      });
      projectId = project.id;
      updateContent(content.id, { projectId });
    }
    void navigate({ to: "/studio/$projectId", params: { projectId } });
  }

  async function copyCaption() {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(igCaption(content));
      toast.success("Caption 已複製，可以直接貼到 IG");
    } catch {
      toast.error("無法複製");
    }
  }

  // 首頁「AI 幫我創作」：帶 campaignId + waveId 進來但還沒有內容時，自動跑第一輪。
  useEffect(() => {
    if (!hydrated || autoRan.current || content || !campaign || !wave || !ctx) return;
    autoRan.current = true;
    if (mode === "reels" || type === "reels") void runReels();
    else void runCopy("normal");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, campaign?.id, wave?.id, ctx]);

  useEffect(() => {
    if (mode === "photo" && !content && hydrated) photoRef.current?.click();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hydrated]);

  if (!hydrated || !brand) return null;

  const scheduledLabel = content?.scheduledAt ? formatDate(content.scheduledAt, "M/d HH:mm") : null;
  const isReels = type === "reels" || mode === "reels";
  const visualAspect: AspectId = isReels || type === "story" ? "9:16" : "4:5";

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-[0.18em] text-muted uppercase">AI 創作</p>
          <h1 className="mt-1 truncate font-display text-3xl tracking-tight">{content?.title ?? MODE_LABEL[mode]}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            {content ? <ContentStatusBadge status={content.status} /> : null}
            <span className="rounded-full bg-surface-2 px-2 py-0.5">{aiLive === null ? "確認 AI 連線…" : aiLive ? "AI 已連線" : "本機規則模式"}</span>
            <span>
              {sc.monthDay} · {sc.phaseLabel}
            </span>
          </div>
        </div>
        {content ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => void copyCaption()}>
              複製 Caption
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const dup = duplicateContent(content.id);
                if (dup) void navigate({ to: "/create", search: { contentId: dup.id } });
              }}
            >
              <Copy className="size-4" /> 複製一份
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="刪除"
              onClick={() => {
                deleteContent(content.id);
                if (campaign) {
                  void navigate({ to: "/campaigns/$campaignId", params: { campaignId: campaign.id } });
                } else {
                  void navigate({ to: "/" });
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </header>

      {(mode === "drive" || mode === "canva" || mode === "ig") && !content ? (
        <section className="mt-5 rounded-[24px] bg-glow-card p-4">
          <p className="text-sm font-medium">
            {mode === "ig" ? "從以前的 IG 貼文開始" : mode === "drive" ? "從 Google Drive 素材開始" : "從 Canva 設計開始"}
          </p>
          <p className="mt-1 text-xs text-muted">
            AI 會先搜過去的東西，標示來源，再提出新方向。沒連接時，先用本機已發布內容或去搜尋。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mode === "ig" ? (
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/instagram">打開 IG Grid</Link>
              </Button>
            ) : (
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/search" search={{ q: idea || "茶會" }}>
                  跨來源搜尋
                </Link>
              </Button>
            )}
            <Button size="sm" variant="secondary" className="rounded-full" asChild>
              <Link to="/connections">{mode === "drive" ? "連接 Drive" : mode === "canva" ? "連接 Canva" : "連接 IG"}</Link>
            </Button>
          </div>
          {mode === "ig" ? (
            <ul className="mt-3 space-y-1.5">
              {contents
                .filter((c) => c.status === "published")
                .slice(0, 4)
                .map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-surface px-3 py-2 text-left text-sm shadow-[var(--shadow-border)]"
                      onClick={() => setIdea(`延伸這篇舊貼文：${c.copy.hook}`)}
                    >
                      <span className="block font-medium">{c.copy.hook}</span>
                      <span className="block text-xs text-muted">{c.sources[0]?.label ?? c.title}</span>
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {/* 情境 */}
          <section className={cn("rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5", isReels && "order-2 lg:order-1")}>
            <h2 className="text-sm font-medium">這篇在講什麼</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted">活動</label>
                <Select
                  value={campaign?.id ?? "none"}
                  onValueChange={(v) => {
                    const next = v === "none" ? null : v;
                    setCampaignId(next);
                    if (content) updateContent(content.id, { campaignId: next });
                    const c = campaigns.find((x) => x.id === next);
                    setDirections(c?.strategy?.directions ?? []);
                    setChosenId(c?.strategy?.chosenDirectionId ?? null);
                  }}
                >
                  <SelectTrigger className="mt-1 rounded-2xl">
                    <SelectValue placeholder="不綁活動（日常內容）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不綁活動（日常內容）</SelectItem>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.date ? `${c.date.slice(5).replace("-", "/")} ` : ""}
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">內容類型</label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as ContentType);
                    if (content) updateContent(content.id, { type: v as ContentType });
                  }}
                >
                  <SelectTrigger className="mt-1 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label} · {t.hint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {campaign ? (
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-2xl bg-glow-card px-3 py-2 text-xs">
                <Tent className="size-3.5 shrink-0 text-accent" />
                <span className="font-medium">{campaign.name}</span>
                <span className="min-w-0 text-muted">
                  {campaign.date} {campaign.time} · {campaign.location}
                </span>
                {wave ? <span className="rounded-full bg-surface px-2 py-0.5">{WAVE_ROLES[wave.role].label}</span> : null}
                <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }} className="ml-auto text-accent">
                  看活動
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <label className="text-xs font-medium text-muted" htmlFor="idea">
                  一句你想講的（沒有活動也可以）
                </label>
                <Textarea
                  id="idea"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={2}
                  placeholder={`例如：期中前想提醒大家，讀不下去的時候可以先來坐十分鐘。（現在是${sc.phaseLabel}）`}
                  className="mt-1 rounded-2xl text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pickHooks({ painPoints: ["stress", "belonging", "lonely"], type: "other", seed: new Date().getDate() }).slice(0, 3).map((h) => (
                    <button key={h} type="button" className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted hover:text-fg" onClick={() => setIdea(h)}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!content ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="rounded-full" onClick={() => void (isReels ? runReels() : runCopy("normal"))} disabled={busy.copy || busy.conv || !ctx}>
                  <Sparkles className="size-4" />
                  {busy.copy || (isReels && busy.conv) ? (isReels ? "AI 正在寫腳本…" : "AI 正在寫…") : isReels ? "AI 生成 20 秒腳本" : "AI 幫我創作"}
                </Button>
                <Button variant="secondary" className="rounded-full" onClick={() => photoRef.current?.click()} disabled={busy.ana}>
                  從一張圖片開始
                </Button>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPhoto(f);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            ) : null}
          </section>

          {isReels ? (
            <div className="order-1 lg:order-2">
              <ReelsPanel
                beats={content?.reels ?? []}
                cover={cover}
                handle={brand.handle}
                assets={assets}
                assetUrls={urls}
                busy={Boolean(busy.conv)}
                onGenerate={() => void runReels()}
                onPatchBeat={patchBeat}
                onGenerateCover={() => {
                  const t = ensureContent();
                  if (!t) return;
                  const prompt = t.imagePrompt.trim() || reelsCoverPrompt(t.visualDirection, t.copy.hook);
                  if (!t.imagePrompt.trim()) updateContent(t.id, { imagePrompt: prompt });
                  void runImage("9:16", prompt);
                }}
              />
            </div>
          ) : null}

          <div className="order-3">
          <CopyPanel
            copy={content?.copy ?? { hook: wave?.hook ?? "", body: "", cta: campaign?.cta ?? "", hashtags: [], tone: "normal" }}
            variants={content?.variants ?? []}
            busy={Boolean(busy.copy)}
            reviewBusy={Boolean(busy.review)}
            review={content?.review ?? null}
            onTone={switchTone}
            onRegenerate={() => void runCopy(content?.copy.tone ?? "normal")}
            onChange={patchCopy}
            onReview={() => void runReview()}
            onApplyRewrite={() => content?.review?.rewriteHook && patchCopy({ hook: content.review.rewriteHook })}
          />

          <VisualPanel
            directions={directions}
            chosenId={chosenId}
            imagePrompt={content?.imagePrompt ?? ""}
            cover={cover}
            insight={insight}
            busyDirections={Boolean(busy.dir)}
            busyImage={Boolean(busy.img)}
            busyAnalyze={Boolean(busy.ana)}
            imageUnavailable={imageUnavailable}
            defaultAspect={visualAspect}
            onDirections={() => void runDirections()}
            onChoose={chooseDirection}
            onPrompt={(v) => {
              const t = ensureContent();
              if (t) updateContent(t.id, { imagePrompt: v });
            }}
            onGenerate={(aspect) => void runImage(aspect)}
            onPhoto={(f) => void onPhoto(f)}
            onExtend={() => {
              const t = ensureContent();
              if (t && insight) void runImage(visualAspect, t.imagePrompt || `same visual style: ${insight.summary}`);
            }}
            onUseInsightForCopy={() => {
              if (insight) setIdea(`依這張圖寫：${insight.summary}`);
              void runCopy("life");
            }}
          />

          {content ? (
            <FormatsPanel
              content={content}
              busy={Boolean(busy.conv)}
              hideReels={isReels}
              onConvert={() => void runConvert()}
              onOpenReels={() => {
                setType("reels");
                updateContent(content.id, { type: "reels" });
              }}
            />
          ) : null}
          </div>
        </div>

        {/* Right rail */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
          {content ? (
            <>
              {isReels ? (
                <section className="hidden rounded-[24px] bg-night p-5 text-night-fg lg:block">
                  <p className="text-xs tracking-[0.16em] text-night-fg/60 uppercase">拍攝順序</p>
                  <p className="mt-2 font-display text-xl leading-snug">左邊時間軸就是 20 秒。</p>
                  <p className="mt-2 text-sm text-night-fg/75">改字幕、選素材、出封面，然後排進 Calendar。一個人拿手機就能拍。</p>
                </section>
              ) : (
                <IgPostPreview content={content} cover={cover} handle={brand.handle} />
              )}
              <section className="rounded-[24px] bg-surface p-4 shadow-[var(--shadow-border)]">
                <h2 className="text-sm font-medium">狀態與排程</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {CONTENT_STATUS_ORDER.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setContentStatus(content.id, s as ContentStatus)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${content.status === s ? "bg-fg text-bg" : "bg-surface-2 text-muted"}`}
                    >
                      {content.status === s ? <Check className="size-3" /> : null}
                      {CONTENT_STATUS[s as ContentStatus].label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="datetime-local"
                    className="min-w-0 rounded-2xl"
                    value={content.scheduledAt ? formatDate(content.scheduledAt, "yyyy-MM-dd'T'HH:mm") : ""}
                    onChange={(e) => scheduleContent(content.id, e.target.value ? new Date(e.target.value).getTime() : null)}
                  />
                  <Button variant="secondary" size="sm" className="shrink-0 rounded-full" asChild>
                    <Link to="/calendar">
                      <CalendarPlus className="size-4" />
                      {scheduledLabel ?? "Calendar"}
                    </Link>
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={openCanvas}>
                    <LayoutTemplate className="size-3.5" />
                    {content.projectId ? "打開畫布" : "在畫布編排"}
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full" asChild>
                    <Link to="/instagram">IG 預覽</Link>
                  </Button>
                </div>
                {content.sources.length ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted">AI 參考了</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {content.sources.map((s, i) => (
                        <li key={`${s.label}-${i}`} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <section className="rounded-[24px] bg-glow-card p-5">
              <p className="font-display text-xl">AI 會一次幫你做到哪裡</p>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                <li>· 6 個語氣的 IG 文案（Hook / 正文 / CTA / Hashtags）</li>
                <li>· 淡江學生視角的檢查與重寫建議</li>
                <li>· 3 個視覺方向 + 圖片 Prompt，一鍵出圖</li>
                <li>· 20 秒 Reels：時間軸、字幕、旁白、封面</li>
                <li>· 轉成 Carousel、Story、Threads、LINE</li>
                <li>· IG 預覽 → 排進 Calendar</li>
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
