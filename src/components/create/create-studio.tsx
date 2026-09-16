import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CreativeHits } from "@/components/search/creative-hits";
import { ReelsDesk, StoryStrip } from "@/components/create/kit-visuals";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { convertContent, type ConvertResult } from "@/lib/ai/convert";
import { generateCopy, type CopyBlock } from "@/lib/ai/copy";
import { generateStudioImage, listVisualDirections } from "@/lib/ai/image";
import { applyStudentRevisions } from "@/lib/ai/pack-mock";
import { generateCreativePack, type CreativePack } from "@/lib/ai/pack";
import { analyzeImage, type VisionReport } from "@/lib/ai/vision";
import { visionPromptBlock } from "@/lib/ai/vision-notes";
import { clubDnaFromMemory, dnaPromptBlock } from "@/lib/club/dna";
import { clubInsightsFromPosts, insightsPromptBlock, lastLearnPromptBlock } from "@/lib/club/insights";
import { createCanvaDesign } from "@/lib/connect/oauth";
import { buildCanvaKit } from "@/lib/connect/canva-kit";
import { publicImageUrl } from "@/lib/connect/ig-publish";
import { gatherIntoStore } from "@/lib/creative/gather-client";
import { varyImagePrompt } from "@/lib/creative/image-vary";
import { inferCampaignType, inferEventDate, isoFromMs, scheduledAtFor } from "@/lib/creative/schedule";
import { searchCreative } from "@/lib/creative/search";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { brandMemoryBlock } from "@/lib/studio/brand";
import { emptyBrief } from "@/lib/studio/brief";
import { uid } from "@/lib/studio/ids";
import { COPY_TONES, formatForKind } from "@/lib/studio/content";
import type { CarouselPagePlan, ContentKind, CreativeDirection, ReelsBeat, StoryFrame } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

const ASPECTS = [
  { id: "4:5" as const, label: "IG 4:5 / Threads" },
  { id: "1:1" as const, label: "IG 1:1 / LINE" },
  { id: "9:16" as const, label: "Story / Reels Cover" },
];

const CONVERT_TO_KIND: Record<string, ContentKind> = {
  ig: "ig-post",
  carousel: "carousel",
  story: "story",
  threads: "threads",
  line: "line",
  reels: "reels",
};

const CONVERT_ROLES: CarouselPagePlan["role"][] = ["cover", "problem", "detail", "proof", "cta"];

function mergeConvert(pack: CreativePack, kind: string, kit: ConvertResult): CreativePack {
  const pages: CarouselPagePlan[] = kit.carousel.map((page, index) => ({
    role: CONVERT_ROLES[index] ?? "close",
    headline: page.title,
    subhead: "",
    body: page.body,
    cta: pack.plan.cta,
    visualNote: page.role,
    templateId: pack.plan.templateId,
  }));
  return {
    ...pack,
    plan: {
      ...pack.plan,
      carouselPages: kind === "carousel" ? pages : pack.plan.carouselPages,
      threadsPost: kind === "threads" ? kit.threads : pack.plan.threadsPost,
      lineCopy: kind === "line" ? kit.line : pack.plan.lineCopy,
      reelsScript: kind === "reels" ? kit.reels : pack.plan.reelsScript,
    },
    conversions: {
      carousel: kind === "carousel" ? pages : pack.conversions.carousel,
      story: kind === "story" ? kit.story : pack.conversions.story,
      threads: kind === "threads" ? kit.threads : pack.conversions.threads,
      line: kind === "line" ? kit.line : pack.conversions.line,
      reels: kind === "reels" ? kit.reels : pack.conversions.reels,
    },
  };
}

async function readAssetAsDataUrl(asset: { id: string; seedSrc?: string }) {
  const stored = await getAssetStorage().get(asset.id);
  const blob = stored ?? (asset.seedSrc ? await (await fetch(asset.seedSrc)).blob() : undefined);
  if (!blob) return null;
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(blob);
  });
}

function starterQuery(mode: string, campaignName?: string) {
  if (mode === "image") return "我要宣傳茶會";
  if (mode === "story") return "做一組限動，讓淡江學生晚上想過來坐";
  if (mode === "carousel") return "做一篇 IG Carousel：最近是不是很久沒坐好";
  if (mode === "reels") return "做一支 20 秒 Reels，封面少字";
  if (mode === "vision") return "分析這張圖，延續風格做新的網宣";
  if (mode === "drive") return "用以前茶會照片做新的宣傳";
  if (mode === "canva") return "延續以前茶會 Canva 的品牌 DNA，做新活動";
  if (mode === "post") return "寫一篇 IG：課表有了人還在趕路";
  return campaignName ? `幫我做 ${campaignName} 完整宣傳` : "下週有一場茶會";
}

export function CreateStudio({
  initialQuery = "",
  autoRun = false,
  mode = "idea",
  campaignId,
  initialAssetId,
}: {
  initialQuery?: string;
  autoRun?: boolean;
  mode?: string;
  campaignId?: string;
  initialAssetId?: string;
}) {
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const addAsset = useStudio((s) => s.addAsset);
  const campaigns = useCreative((s) => s.campaigns);
  const memory = useCreative((s) => s.memory);
  const igPosts = useCreative((s) => s.igPosts);
  const inspirations = useCreative((s) => s.inspirations);
  const generateWaves = useCreative((s) => s.generateWaves);
  const addCampaign = useCreative((s) => s.addCampaign);
  const addMemory = useCreative((s) => s.addMemory);
  const bindScheduledWave = useCreative((s) => s.bindScheduledWave);
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | undefined>();
  const resolvedCampaignId = campaignId ?? createdCampaignId;
  const campaign = resolvedCampaignId ? campaigns.find((c) => c.id === resolvedCampaignId) : undefined;

  const [query, setQuery] = useState(initialQuery || starterQuery(mode, campaign?.name));
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<CreativePack | null>(null);
  const [dirId, setDirId] = useState<string | null>(null);
  const [copies, setCopies] = useState<CopyBlock[]>([]);
  const [tone, setTone] = useState<CopyBlock["tone"]>("student");
  const [vision, setVision] = useState<VisionReport | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [reelsCoverSrc, setReelsCoverSrc] = useState<string | null>(null);
  const [visionKit, setVisionKit] = useState<{
    story: StoryFrame[];
    reels: ReelsBeat[];
    carousel: string;
    threads: string;
    line: string;
  } | null>(null);
  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["id"]>("4:5");
  const fileRef = useRef<HTMLInputElement>(null);
  const ran = useRef(false);

  const hits = useMemo(
    () => searchCreative({ query, memory, assets, campaigns, igPosts, projects }),
    [query, memory, assets, campaigns, igPosts, projects],
  );

  async function runPack(opts?: { vision?: VisionReport | null; query?: string }) {
    const report = opts && "vision" in opts ? opts.vision : vision;
    const q = opts?.query ?? query;
    setBusy(true);
    try {
      await gatherIntoStore(q);
      const liveHits = searchCreative({
        query: q,
        memory: useCreative.getState().memory,
        assets,
        campaigns: useCreative.getState().campaigns,
        igPosts: useCreative.getState().igPosts,
        projects,
      });
      const sources = liveHits.slice(0, 12).map((hit) => ({
        source: hit.source,
        label: hit.sourceLabel || hit.title,
        id: hit.id.slice(0, 160),
      }));
      if (report || imageSrc || initialAssetId) {
        const label = assets.find((item) => item.id === initialAssetId)?.name || "你丟進來的圖";
        if (!sources.some((item) => item.id === initialAssetId || item.label === label)) {
          sources.unshift({
            source: "upload",
            label,
            id: (initialAssetId ?? "upload").slice(0, 160),
          });
        }
      }
      const dna = clubDnaFromMemory({
        igPosts: useCreative.getState().igPosts,
        memory: useCreative.getState().memory,
      });
      const result = await generateCreativePack({
        data: {
          query: q,
          eventName: campaign?.name,
          schedule: campaign ? `${campaign.date} ${campaign.time}` : undefined,
          location: campaign?.location,
          oneLiner: campaign?.oneLiner,
          sources,
          visionNotes: report ? visionPromptBlock(report) : undefined,
          dnaNotes: `${brands[0] ? brandMemoryBlock(brands[0]) : ""}\n${dnaPromptBlock(dna)}\n${insightsPromptBlock(clubInsightsFromPosts(useCreative.getState().igPosts))}\n${lastLearnPromptBlock(useCreative.getState().lastLearn)}`.slice(
            0,
            3600,
          ),
          inspirationNotes: useCreative
            .getState()
            .inspirations.slice(0, 4)
            .map((item) => `${item.pattern} → ${item.clubTurn}`)
            .join("\n"),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPack(result.pack);
      setDirId(result.pack.directions[0]?.id ?? null);
      setCopies(result.pack.copyVariants);
    } catch {
      toast.error("生成失敗，再試一次。");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (ran.current) return;
    if (initialAssetId) {
      ran.current = true;
      void (async () => {
        const asset = useStudio.getState().assets.find((item) => item.id === initialAssetId);
        if (!asset) {
          if (autoRun) await runPack();
          return;
        }
        setBusy(true);
        try {
          const dataUrl = await readAssetAsDataUrl(asset);
          if (dataUrl) {
            setImageSrc(dataUrl);
            const result = await analyzeImage({
              data: { imageDataUrl: dataUrl, note: query || asset.name },
            });
            if (result.ok) {
              setVision(result.report);
              toast.success(`已讀「${asset.name}」，可以延續風格或整套生成`);
              if (autoRun) await runPack({ vision: result.report });
            } else if (autoRun) {
              await runPack();
            }
          } else if (autoRun) {
            await runPack();
          }
        } catch {
          toast.error("這張圖讀不到，改丟一張進來也可以。");
          if (autoRun) await runPack();
        } finally {
          setBusy(false);
        }
      })();
      return;
    }
    if (mode === "vision") fileRef.current?.click();
    if (autoRun) {
      ran.current = true;
      void runPack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, initialAssetId, mode]);

  async function runCopy() {
    setBusy(true);
    try {
      const result = await generateCopy({
        data: {
          topic: query,
          kind: mode,
          when: campaign ? `${campaign.date} ${campaign.time}` : undefined,
          where: campaign?.location,
          insightNotes: `${brands[0] ? brandMemoryBlock(brands[0]) : ""}\n${insightsPromptBlock(clubInsightsFromPosts(useCreative.getState().igPosts))}\n${lastLearnPromptBlock(useCreative.getState().lastLearn)}\n${vision ? visionPromptBlock(vision) : ""}\n${dnaPromptBlock(
            clubDnaFromMemory({
              igPosts: useCreative.getState().igPosts,
              memory: useCreative.getState().memory,
            }),
          )}`.slice(0, 1600),
        },
      });
      if (result.ok) setCopies(result.copies);
    } finally {
      setBusy(false);
    }
  }

  async function runDirections() {
    setBusy(true);
    try {
      const result = await listVisualDirections({
        data: {
          topic: query,
          notes: [brands[0] ? brandMemoryBlock(brands[0]) : "", vision ? visionPromptBlock(vision) : ""]
            .filter(Boolean)
            .join("\n")
            .slice(0, 1600),
        },
      });
      if (result.ok) {
        setDirections(result.directions);
        setDirId(result.directions[0]?.id ?? null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function runImage(prompt: string, ratio: (typeof ASPECTS)[number]["id"] = aspect) {
    setBusy(true);
    try {
      if (ratio !== aspect) setAspect(ratio);
      const result = await generateStudioImage({ data: { prompt, topic: query, aspect: ratio } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setImageSrc(result.src);
      if (ratio === "9:16") setReelsCoverSrc(result.src);
      const id = uid("asset");
      const blob = await (await fetch(result.src)).blob();
      await getAssetStorage().put(id, blob);
      addAsset(
        createGeneratedAsset({
          id,
          name: query.slice(0, 18) || "AI 主視覺",
          mime: blob.type || "image/png",
          width: ratio === "9:16" ? 1080 : 1080,
          height: ratio === "9:16" ? 1920 : ratio === "1:1" ? 1080 : 1350,
          category: "poster",
        }),
      );
      if (result.src.startsWith("https:")) {
        addMemory({
          id: `gen_${id}`,
          source: "generated",
          sourceLabel: "AI Generated",
          title: query.slice(0, 18) || "AI 主視覺",
          kind: "poster",
          tags: ["generated", "ig"],
          summary: "剛才生成的主視覺，可發到 IG。",
          thumbUrl: result.src,
          assetId: id,
          createdAt: Date.now(),
        });
      }
      toast.success(ratio === "9:16" ? "Reels 封面已進素材庫" : "主視覺已進素材庫");
    } finally {
      setBusy(false);
    }
  }

  async function onVisionFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result);
      setImageSrc(url);
      setBusy(true);
      try {
        const result = await analyzeImage({ data: { imageDataUrl: url, note: query } });
        if (result.ok) setVision(result.report);
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function fromVision(kind: "style" | "similar" | "restyle" | "story" | "carousel" | "reels") {
    if (!vision) return;
    if (kind === "style") {
      const nextQuery = /延續/.test(query) ? query : `${query}。延續這張圖的風格做新網宣。`;
      setQuery(nextQuery);
      await runImage(vision.imagePrompt);
      await runPack({ vision, query: nextQuery });
      toast.success("已延續風格，文案和方向一起出來了");
      return;
    }
    if (kind === "similar") {
      await runImage(varyImagePrompt(vision.imagePrompt, "similar"));
      return;
    }
    if (kind === "restyle") {
      setQuery((prev) => `${prev}。保留這張的內容，重新設計成淡江學生會停下來的 IG。`);
      await runPack();
      return;
    }
    if (kind === "story") await runImage(varyImagePrompt(vision.imagePrompt, "story"), "9:16");
    if (kind === "reels") await runImage(varyImagePrompt(vision.imagePrompt, "reels"), "9:16");
    const result = await convertContent({
      data: {
        title: query.slice(0, 40) || "淡江禪學社",
        hook: vision.stay || vision.scene,
        body: vision.studentFit,
      },
    });
    if (!result.ok) return;
    setVisionKit({
      story: result.story,
      reels: result.reels,
      carousel: result.carousel.map((page, index) => `${index + 1}. ${page.title}\n${page.body}`).join("\n\n"),
      threads: result.threads,
      line: result.line,
    });
    toast.success(kind === "carousel" ? "已轉成 Carousel" : kind === "story" ? "已轉成限動" : "已轉成 Reels");
  }

  function applyToStudio(andSchedule: boolean, opts?: { kind?: ContentKind; nextPack?: CreativePack }) {
    const brand = brands[0];
    const active = opts?.nextPack ?? pack;
    const kind = opts?.kind ?? "carousel";
    if (!brand || !active) return;
    let camp = resolvedCampaignId ? campaigns.find((c) => c.id === resolvedCampaignId) : undefined;
    if (!camp && andSchedule) {
      camp = addCampaign({
        name: active.plan.campaignName,
        date: inferEventDate(query),
        type: inferCampaignType(`${query} ${active.plan.campaignName}`),
        oneLiner: active.plan.hook,
        fullIntro: active.plan.body,
        studentPain: active.plan.insight,
        cta: active.plan.cta,
        theme: active.plan.visualTheme,
        location: campaign?.location ?? "淡江校園",
      });
      setCreatedCampaignId(camp.id);
    }
    const brief = {
      ...emptyBrief(),
      eventName: active.plan.campaignName,
      product: active.plan.campaignName,
      schedule: camp ? `${camp.date} ${camp.time}` : "",
      location: camp?.location ?? "淡江校園",
      audience: active.studentContext,
      features: active.plan.concept,
      style: active.plan.visualTheme,
      deliverables: { post: true, story: true, carousel: true, reels: true },
    };
    const project = createProject({
      name: `${active.plan.campaignName} · ${kind === "carousel" ? "Carousel" : kind === "story" ? "Story" : kind === "reels" ? "Reels" : kind === "line" ? "LINE" : kind === "threads" ? "Threads" : "IG"}`,
      brandId: brand.id,
      formatId: formatForKind(kind),
      brief,
      templateId: active.plan.templateId,
    });
    applyCampaignPlan(project.id, active.plan, brief);
    const scheduledAt = scheduledAtFor(kind, camp?.date);
    useStudio.getState().updateProject(project.id, {
      contentKind: kind,
      campaignId: camp?.id ?? null,
      sourceRefs: [
        ...active.sources,
        ...(imageSrc?.startsWith("https:") ? [{ source: "generated" as const, label: "AI 主視覺", id: imageSrc }] : []),
      ],
      status: andSchedule ? "scheduled" : "creating",
      scheduledAt: andSchedule ? scheduledAt : null,
    });
    if (camp) {
      if (!camp.waves.length) generateWaves(camp.id);
      bindScheduledWave(camp.id, {
        kind,
        projectId: project.id,
        scheduledAt,
        topic: active.plan.hook,
        status: andSchedule ? "scheduled" : "creating",
      });
    }
    const day = isoFromMs(scheduledAt);
    toast.success(andSchedule ? `已排進 ${day.replace(/^\d{4}-/, "").replace("-", "/")} 月曆` : "已套進畫布");
    if (andSchedule) {
      void navigate({ to: "/calendar", search: { day } });
      return;
    }
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  async function sendCanva() {
    if (!pack) return;
    const activeCopy = copies.find((c) => c.tone === tone) ?? copies[0];
    const dir = pack.directions.find((d) => d.id === dirId) ?? directions.find((d) => d.id === dirId);
    const caption = activeCopy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook;
    const kit = buildCanvaKit({
      campaignName: pack.plan.campaignName,
      hook: pack.plan.hook,
      caption,
      cta: activeCopy?.cta ?? pack.plan.cta,
      hashtags: activeCopy?.hashtags ?? pack.plan.hashtags,
      palette: dir?.palette,
      composition: dir?.composition,
      typeDirection: dir?.typeDirection,
      imagePrompt: dir?.imagePrompt,
      carousel: pack.conversions.carousel,
    });
    try {
      await navigator.clipboard.writeText(kit);
    } catch {
      /* 沒剪貼簿也繼續開 Canva */
    }
    const kind = aspect === "9:16" ? "story" : "carousel";
    const result = await createCanvaDesign({
      data: {
        title: pack.plan.campaignName,
        kind,
        imageUrl: publicImageUrl(imageSrc) ?? undefined,
      },
    });
    if (!result.ok) {
      toast.message(result.message);
      if (result.reason === "connect") void navigate({ to: "/connect" });
      return;
    }
    window.open(result.url, "_blank", "noopener");
    toast.success(result.withAsset ? "已把主視覺送進 Canva" : "已在 Canva 開對應尺寸，貼上清單繼續改");
  }

  const activeDir = pack?.directions.find((d) => d.id === dirId) ?? directions.find((d) => d.id === dirId);
  const copy = copies.find((c) => c.tone === tone) ?? copies[0];
  const sim = pack?.plan.studentSim;
  const insights = clubInsightsFromPosts(igPosts);
  const canvaKit = pack
    ? buildCanvaKit({
        campaignName: pack.plan.campaignName,
        hook: pack.plan.hook,
        caption: copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook,
        cta: copy?.cta ?? pack.plan.cta,
        hashtags: copy?.hashtags ?? pack.plan.hashtags,
        palette: activeDir?.palette,
        composition: activeDir?.composition,
        typeDirection: activeDir?.typeDirection,
        imagePrompt: activeDir?.imagePrompt,
        carousel: pack.conversions.carousel,
      })
    : "";

  function applySimFixes() {
    if (!copy || !sim) return;
    setCopies((prev) =>
      prev.map((item) =>
        item.tone === copy.tone
          ? applyStudentRevisions(item, sim, campaign ? `${campaign.date} ${campaign.time}` : pack?.plan.subhead, campaign?.location)
          : item,
      ),
    );
    toast.success("已依淡江學生視角改過這一版");
  }

  async function copyCaption() {
    if (!copy) return;
    const text = `${copy.body}\n\n${copy.cta}\n${copy.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Caption 已複製。主視覺若還在本機，貼到 IG 再配圖。");
    } catch {
      toast.message("複製失敗，請手動選取文案");
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs tracking-[0.18em] text-muted uppercase">AI 創作台</p>
      <h1 className="mt-1 font-display text-3xl md:text-4xl">把一句話變成整套網宣</h1>
      <p className="mt-2 text-sm text-muted">文案、方向、Carousel、Story、Threads、Reels 會一起出來。不會出現 Agent 管理。</p>

      <Textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-6 min-h-28 rounded-2xl"
        placeholder="例如：下週有一場茶會"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void runPack()} disabled={busy} className="min-h-11 rounded-full">
          {busy ? "生成中…" : "AI 生成完整宣傳"}
        </Button>
        <Button variant="secondary" className="min-h-11 rounded-full" disabled={busy} onClick={() => void runCopy()}>
          只寫文案
        </Button>
        <Button variant="secondary" className="min-h-11 rounded-full" disabled={busy} onClick={() => void runDirections()}>
          三個視覺方向
        </Button>
        <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => fileRef.current?.click()}>
          丟一張圖進來
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onVisionFile(file);
          }}
        />
      </div>

      {vision ? (
        <section className="mt-6 grid items-start gap-4 md:grid-cols-[11rem_minmax(0,1fr)]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="生成或上傳的畫面"
              className="max-h-48 w-full rounded-3xl object-cover shadow-[var(--shadow-artboard)] md:max-h-56"
            />
          ) : null}
          <div className="rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]">
            <h2 className="text-sm font-medium">圖片理解</h2>
            <p className="mt-2">{vision.scene}</p>
            <ul className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
              <li>人物：{vision.people}</li>
              <li>色彩：{vision.color}</li>
              <li>光線：{vision.light}</li>
              <li>構圖：{vision.composition}</li>
              <li>文字比例：{vision.typeShare}</li>
              <li>層級：{vision.hierarchy}</li>
              <li>品牌感：{vision.brandFit}</li>
              <li>停留感：{vision.stay}</li>
            </ul>
            <p className="mt-2 text-muted">{vision.studentFit}</p>
            <p className="mt-2 text-xs">
              太宗教 {vision.tooReligious ? "是" : "沒有"} · 太老氣 {vision.tooOld ? "是" : "沒有"} · 太 AI {vision.tooAi ? "是" : "沒有"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={busy} onClick={() => void fromVision("style")}>
                延續這個風格
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void fromVision("restyle")}>
                保留內容重新設計
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void fromVision("story")}>
                做成限動
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void fromVision("carousel")}>
                做成 Carousel
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void fromVision("reels")}>
                做成 Reels Cover
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void fromVision("similar")}>
                生成相似視覺
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">延續風格會連文案、方向、Carousel 一起出，不是只換一張圖。</p>
            {visionKit ? (
              <div className="mt-4 space-y-3">
                <pre className="whitespace-pre-wrap rounded-2xl bg-bg p-3 font-sans text-xs leading-relaxed">{visionKit.carousel}</pre>
                <StoryStrip frames={visionKit.story} />
                <ReelsDesk beats={visionKit.reels} coverSrc={reelsCoverSrc} />
                <pre className="whitespace-pre-wrap font-sans text-xs text-muted">{visionKit.threads}</pre>
              </div>
            ) : null}
          </div>
        </section>
      ) : imageSrc ? (
        <img src={imageSrc} alt="生成或上傳的畫面" className="mt-6 w-full rounded-3xl shadow-[var(--shadow-artboard)]" />
      ) : null}

      {hits.length ? (
        <div className="mt-4">
          <p className="text-sm text-muted">找到 {hits.length} 個相關素材 · 根據過去內容準備 3 個方向</p>
          <CreativeHits
            hits={hits}
            onPick={(hit) => {
              setQuery((prev) => `${prev}（參考 ${hit.sourceLabel}）`);
            }}
            onAnalyze={(hit) => {
              const thumb = hit.thumbUrl;
              if (!thumb) return;
              void (async () => {
                setBusy(true);
                try {
                  const result = await analyzeImage({
                    data: thumb.startsWith("https:")
                      ? { imageUrl: thumb, note: `延續 ${hit.sourceLabel} 的品牌 DNA，做新活動` }
                      : { imageDataUrl: thumb, note: hit.title },
                  });
                  if (result.ok) {
                    setVision(result.report);
                    toast.success("已分析風格，可延續生成");
                  }
                } finally {
                  setBusy(false);
                }
              })();
            }}
          />
        </div>
      ) : null}

      {pack ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">{pack.sourceSummary}</p>
            <p className="mt-1 text-sm">{pack.studentContext}</p>
            <p className="mt-3 font-display text-2xl">「{pack.plan.hook}」</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {pack.sources.map((s, index) => (
                <span key={`${s.source}-${s.id ?? s.label}-${index}`} className="rounded-full bg-surface-2 px-2 py-1 text-xs text-muted">
                  {s.label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{insights.mixLesson}</p>
            {inspirations[0] ? (
              <p className="mt-1 text-xs text-muted">靈感抽象：{inspirations[0].pattern} → {inspirations[0].clubTurn}</p>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-medium">三個創意方向</h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-3">
              {(pack.directions.length ? pack.directions : directions).map((dir) => (
                <li key={dir.id}>
                  <button
                    type="button"
                    onClick={() => setDirId(dir.id)}
                    className={cn(
                      "h-full min-h-11 w-full rounded-2xl p-4 text-left shadow-[var(--shadow-border)]",
                      dirId === dir.id ? "bg-accent text-accent-fg" : "bg-surface",
                    )}
                  >
                    <p className="text-sm font-medium">{dir.name}</p>
                    <p className={cn("mt-2 text-xs", dirId === dir.id ? "text-accent-fg/80" : "text-muted")}>{dir.concept}</p>
                  </button>
                </li>
              ))}
            </ul>
            {activeDir ? (
              <div className="mt-4 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]">
                <p>配色：{activeDir.palette}</p>
                <p className="mt-1">構圖：{activeDir.composition}</p>
                <p className="mt-1">字：{activeDir.typeDirection}</p>
                <p className="mt-3 text-xs text-muted">{activeDir.imagePrompt}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {ASPECTS.map((item) => (
                    <Button key={item.id} size="sm" variant={aspect === item.id ? "default" : "secondary"} onClick={() => setAspect(item.id)}>
                      {item.label}
                    </Button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void runImage(activeDir.imagePrompt)}>
                    生成這個方向的圖
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(varyImagePrompt(activeDir.imagePrompt, "compose"))}>
                    換構圖
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(varyImagePrompt(activeDir.imagePrompt, "mood"))}>
                    換氣氛
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(varyImagePrompt(activeDir.imagePrompt, "bg"))}>
                    換背景
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(varyImagePrompt(activeDir.imagePrompt, "style"))}>
                    換風格
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(varyImagePrompt(activeDir.imagePrompt, "type"))}>
                    換文字
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runDirections()}>
                    重新生成方向
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <h2 className="text-sm font-medium">文案切換</h2>
            <div className="mt-2 flex flex-wrap gap-1">
              {COPY_TONES.map((t) => (
                <Button key={t.id} size="sm" variant={tone === t.id ? "default" : "secondary"} onClick={() => setTone(t.id)}>
                  {t.label}
                </Button>
              ))}
            </div>
            {copy ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-surface p-4 font-sans text-sm leading-relaxed shadow-[var(--shadow-border)]">
                {copy.body}
                {"\n\n"}
                {copy.cta}
                {"\n"}
                {copy.hashtags.join(" ")}
              </pre>
            ) : null}
            <Button className="mt-2" size="sm" variant="secondary" disabled={busy} onClick={() => void runCopy()}>
              改寫這一版
            </Button>
          </div>

          {sim ? (
            <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <h2 className="text-sm font-medium">淡江學生視角</h2>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted sm:grid-cols-3">
                <li>會停下來 {sim.wouldStop ? "會" : "還不會"}</li>
                <li>太宗教 {sim.tooReligious ? "是" : "沒有"}</li>
                <li>太 AI {sim.tooAi ? "是" : "沒有"}</li>
                <li>太嚴肅 {sim.tooSerious ? "是" : "沒有"}</li>
                <li>太文青 {sim.tooLiterary ? "是" : "沒有"}</li>
                <li>太長 {sim.tooLong ? "是" : "沒有"}</li>
                <li>知道時間地點 {sim.knowsWhenWhere ? "知道" : "不清楚"}</li>
                <li>會找朋友 {sim.wouldBringFriend ? "可能" : "還不會"}</li>
                <li>知道怎麼報名 {sim.knowsHowToJoin ? "知道" : "還不會"}</li>
              </ul>
              <p className="mt-2 text-sm">{sim.notes.join(" ")}</p>
              {sim.revisions.length ? <p className="mt-1 text-xs text-muted">修改：{sim.revisions.join(" ")}</p> : null}
              {sim.revisions.length ? (
                <Button className="mt-3" size="sm" variant="secondary" onClick={applySimFixes}>
                  套用學生視角修改
                </Button>
              ) : null}
            </div>
          ) : null}

          <IgPhonePreview
            hook={pack.plan.hook}
            caption={copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook}
            imageSrc={imageSrc}
            handle="@tkuzen"
          />

          <PackKit
            pack={pack}
            coverSrc={reelsCoverSrc}
            busy={busy}
            onCover={() =>
              void runImage(
                activeDir?.imagePrompt || pack.conversions.reels[0]?.visual || query,
                "9:16",
              )
            }
          />

          <div>
            <h2 className="text-sm font-medium">再轉一版</h2>
            <ConvertPreview
              title={pack.plan.campaignName}
              hook={pack.plan.hook}
              body={pack.plan.body}
              when={campaign ? `${campaign.date} ${campaign.time}` : pack.plan.subhead}
              where={campaign?.location}
              cta={pack.plan.cta}
              onSchedule={(kind, kit) => {
                const next = mergeConvert(pack, kind, kit);
                setPack(next);
                applyToStudio(true, { kind: CONVERT_TO_KIND[kind] ?? "carousel", nextPack: next });
              }}
            />
          </div>

          <div>
            <h2 className="text-sm font-medium">送進 Canva 微調</h2>
            <p className="mt-1 text-xs text-muted">AI 先給清單。連接後開 4:5 或限動尺寸；有公開主視覺會帶進畫布，不是空白檔。</p>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-surface p-4 font-sans text-xs leading-relaxed shadow-[var(--shadow-border)]">
              {canvaKit}
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button className="min-h-11 rounded-full" onClick={() => applyToStudio(false)}>
              套進畫布
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => applyToStudio(true)}>
              排進月曆
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 rounded-full"
              onClick={() => void sendCanva()}
            >
              送進 Canva 微調
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => void navigate({ to: "/ig" })}>
              IG Preview
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => void copyCaption()}>
              複製 Caption
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => void navigate({ to: "/inspire" })}>
              靈感研究
            </Button>
            {campaign ? (
              <PublishButton
                campaignId={campaign.id}
                title={pack.plan.campaignName}
                caption={copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook}
                imageUrl={imageSrc}
                variant="secondary"
                size="default"
                className="rounded-full"
              />
            ) : (
              <PublishButton
                title={pack.plan.campaignName}
                caption={copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook}
                imageUrl={imageSrc}
                variant="secondary"
                size="default"
                className="rounded-full"
              />
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function IgPhonePreview({
  hook,
  caption,
  imageSrc,
  handle,
}: {
  hook: string;
  caption: string;
  imageSrc: string | null;
  handle: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium">IG Preview</h2>
      <div className="mx-auto mt-3 w-[min(100%,280px)] rounded-[2rem] bg-[#1c1a16] p-3 text-[#f3eee4] shadow-[var(--shadow-artboard)]">
        <p className="px-1 text-xs">{handle}</p>
        <div className="mt-2 aspect-4/5 overflow-hidden rounded-2xl bg-linear-to-b from-[#2a6a64] to-[#161410]">
          {imageSrc ? (
            <img src={imageSrc} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full flex-col justify-end p-4">
              <p className="font-display text-xl leading-snug">{hook}</p>
            </div>
          )}
        </div>
        <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap px-1 font-sans text-[11px] leading-relaxed text-[#f3eee4]/90">
          {caption}
        </pre>
      </div>
    </div>
  );
}

function PackKit({
  pack,
  coverSrc,
  busy,
  onCover,
}: {
  pack: CreativePack;
  coverSrc: string | null;
  busy: boolean;
  onCover: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium">整套網宣</h2>
      {pack.plan.scheduleNotes ? <p className="text-xs text-muted">{pack.plan.scheduleNotes}</p> : null}
      <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs tracking-[0.14em] text-muted uppercase">Carousel</p>
        <ol className="mt-2 space-y-2">
          {pack.conversions.carousel.map((page, index) => (
            <li key={`${page.role}-${index}`} className="text-sm">
              <span className="text-xs text-subtle">Page {index + 1}</span>
              <p className="font-medium">{page.headline.replace(/\n/g, " ")}</p>
              <p className="text-xs text-muted">{page.body}</p>
            </li>
          ))}
        </ol>
      </div>
      <StoryStrip frames={pack.conversions.story} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">Threads</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{pack.conversions.threads}</pre>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.14em] text-muted uppercase">LINE</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{pack.conversions.line}</pre>
        </div>
      </div>
      <ReelsDesk beats={pack.conversions.reels} coverSrc={coverSrc} busy={busy} onCover={onCover} />
    </div>
  );
}

function ConvertPreview({
  title,
  hook,
  body,
  when,
  where,
  cta,
  onSchedule,
}: {
  title: string;
  hook: string;
  body?: string;
  when?: string;
  where?: string;
  cta?: string;
  onSchedule: (kind: string, kit: ConvertResult) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [story, setStory] = useState<StoryFrame[] | null>(null);
  const [reels, setReels] = useState<ReelsBeat[] | null>(null);
  const [kit, setKit] = useState<ConvertResult | null>(null);
  const labels: Record<string, string> = {
    ig: "轉 IG 貼文",
    carousel: "轉 Carousel",
    story: "轉 Story",
    threads: "轉 Threads",
    line: "轉 LINE",
    reels: "轉 Reels 腳本",
  };
  async function run(kind: string) {
    const result = await convertContent({ data: { title, hook, body, when, where, cta } });
    if (!result.ok) return;
    setKit(result);
    setOpen(kind);
    setStory(kind === "story" ? result.story : null);
    setReels(kind === "reels" ? result.reels : null);
    if (kind === "carousel") setText(result.carousel.map((p, i) => `${i + 1}. ${p.title}\n${p.body}`).join("\n\n"));
    else if (kind === "threads") setText(result.threads);
    else if (kind === "line") setText(result.line);
    else if (kind === "ig") setText(`${hook}\n${title}\n${[when, where].filter(Boolean).join(" · ")}\n${cta || "晚上來坐一下"}`);
    else setText("");
  }
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {Object.entries(labels).map(([kind, label]) => (
          <Button key={kind} size="sm" variant={open === kind ? "default" : "secondary"} onClick={() => void run(kind)}>
            {label}
          </Button>
        ))}
      </div>
      {story ? <div className="mt-3"><StoryStrip frames={story} /></div> : null}
      {reels ? <div className="mt-3"><ReelsDesk beats={reels} /></div> : null}
      {text ? <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-bg p-3 font-sans text-xs leading-relaxed">{text}</pre> : null}
      {open && kit ? (
        <Button className="mt-3 min-h-11 rounded-full" onClick={() => onSchedule(open, kit)}>
          把這版排進月曆
        </Button>
      ) : null}
    </div>
  );
}
