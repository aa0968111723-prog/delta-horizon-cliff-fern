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
import { applyStudentRevisions, reviseCopiesForStudent, stampEventWhen } from "@/lib/ai/pack-mock";
import { generateCreativePack, type CreativePack } from "@/lib/ai/pack";
import { analyzeImage, type VisionReport } from "@/lib/ai/vision";
import { visionPromptBlock } from "@/lib/ai/vision-notes";
import { clubDnaFromMemory, dnaPromptBlock } from "@/lib/club/dna";
import { clubInsightsFromPosts, insightsPromptBlock, lastLearnPromptBlock } from "@/lib/club/insights";
import { seasonCreateNote } from "@/lib/club/featured";
import { academicMoment } from "@/lib/club/season";
import { createCanvaDesign, pullCanvaExport, startConnection } from "@/lib/connect/oauth";
import { buildCanvaKit, canvaDesignIdFromEditUrl, canvaReturnTitle, memoryFromCanvaKit } from "@/lib/connect/canva-kit";
import { persistableImageSrc } from "@/lib/connect/next";
import { publicImageUrl } from "@/lib/connect/ig-publish";
import { gatherIntoStore } from "@/lib/creative/gather-client";
import { varyImagePrompt, type ImageVaryKind } from "@/lib/creative/image-vary";
import { inferCampaignType, inferEventDate, isoFromMs, scheduledAtFor, displayEventWhen, resolvePromoEvent } from "@/lib/creative/schedule";
import { alignPackToDirection } from "@/lib/creative/pack-align";
import { posterKindFromAspect, posterPackFromDirection } from "@/lib/creative/poster-pack";
import { annotateWavesFromPack, captionForPackKind, coverForKind, PACK_SCHEDULE_KINDS, remainingPackKinds, topicForPackKind, usesStoryCover } from "@/lib/creative/pack-schedule";
import { gatherStatusLine, searchCreative, selectSourcesForPack } from "@/lib/creative/search";
import type { SearchHit } from "@/lib/creative/types";
import type { CanvaLoopStep } from "@/lib/creative/session";
import { readLastSession, writeLastSession, heroAssetIdsFromSession, type LastCreateSession } from "@/lib/creative/session";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { objectUrlForAsset } from "@/lib/studio/assets-idb";
import { createGeneratedAsset, migrateAsset } from "@/lib/studio/assets";
import { brandMemoryBlock } from "@/lib/studio/brand";
import { emptyBrief } from "@/lib/studio/brief";
import { uid } from "@/lib/studio/ids";
import { COPY_TONES, formatForKind, contentKindLabel } from "@/lib/studio/content";
import type { CarouselPagePlan, ContentKind, CreativeDirection, ReelsBeat, SourceRef, StoryFrame } from "@/lib/studio/types";
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
  connected,
  notice,
}: {
  initialQuery?: string;
  autoRun?: boolean;
  mode?: string;
  campaignId?: string;
  initialAssetId?: string;
  connected?: string;
  notice?: string;
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
  const lastLearn = useCreative((s) => s.lastLearn);
  const generateWaves = useCreative((s) => s.generateWaves);
  const addMemory = useCreative((s) => s.addMemory);
  const bindScheduledWave = useCreative((s) => s.bindScheduledWave);
  const setConnection = useCreative((s) => s.setConnection);
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | undefined>();
  const [studioProjectId, setStudioProjectId] = useState<string | undefined>();
  const [canvaStep, setCanvaStep] = useState<CanvaLoopStep | null>(null);
  const [canvaEditUrl, setCanvaEditUrl] = useState<string | null>(null);
  const [canvaDesignId, setCanvaDesignId] = useState<string | null>(null);
  const [canvaReturnAssetId, setCanvaReturnAssetId] = useState<string | null>(null);
  const resolvedCampaignId = campaignId ?? createdCampaignId;
  const campaign = resolvedCampaignId ? campaigns.find((c) => c.id === resolvedCampaignId) : undefined;

  const [query, setQuery] = useState(initialQuery || starterQuery(mode, campaign?.name));
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<CreativePack | null>(null);
  const [posterOnly, setPosterOnly] = useState(false);
  const [dirId, setDirId] = useState<string | null>(null);
  const [copies, setCopies] = useState<CopyBlock[]>([]);
  const [tone, setTone] = useState<CopyBlock["tone"]>("student");
  const [vision, setVision] = useState<VisionReport | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [reelsCoverSrc, setReelsCoverSrc] = useState<string | null>(null);
  const lastAsset = useRef<{ feed?: string; story?: string }>({});
  const imageDirId = useRef<string | null>(null);
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
  const canvaFileRef = useRef<HTMLInputElement>(null);
  const ran = useRef(false);
  const restored = useRef(false);
  const retriedCanva = useRef(false);
  const paintGen = useRef(0);
  const packRef = useRef<CreativePack | null>(null);
  const posterOnlyRef = useRef(false);
  packRef.current = pack;
  posterOnlyRef.current = posterOnly;

  function persistSession(patch: Partial<LastCreateSession> & Pick<LastCreateSession, "pack">) {
    writeLastSession({
      pack: patch.pack,
      posterOnly: patch.posterOnly ?? posterOnly,
      dirId: patch.dirId !== undefined ? patch.dirId : dirId,
      copies: patch.copies ?? copies,
      tone: patch.tone ?? tone,
      imageSrc: persistableImageSrc(patch.imageSrc !== undefined ? patch.imageSrc : imageSrc),
      reelsCoverSrc: persistableImageSrc(
        patch.reelsCoverSrc !== undefined ? patch.reelsCoverSrc : reelsCoverSrc,
      ),
      createdCampaignId: patch.createdCampaignId ?? createdCampaignId,
      projectId: patch.projectId ?? studioProjectId,
      aspect: patch.aspect ?? aspect,
      feedAssetId: lastAsset.current.feed ?? null,
      storyAssetId: lastAsset.current.story ?? null,
      canvaKit: patch.canvaKit,
      canvaStep: patch.canvaStep ?? canvaStep ?? undefined,
      canvaEditUrl: patch.canvaEditUrl !== undefined ? patch.canvaEditUrl : canvaEditUrl,
      canvaDesignId: patch.canvaDesignId !== undefined ? patch.canvaDesignId : canvaDesignId,
      canvaReturnAssetId: patch.canvaReturnAssetId !== undefined ? patch.canvaReturnAssetId : canvaReturnAssetId,
      savedAt: Date.now(),
    });
  }

  function hydrateHeroFromSession(session: LastCreateSession) {
    const heroes = heroAssetIdsFromSession(session);
    if (heroes.feed) lastAsset.current.feed = heroes.feed;
    if (heroes.story) lastAsset.current.story = heroes.story;
    if (session.imageSrc) setImageSrc(session.imageSrc);
    else if (heroes.feed) {
      void objectUrlForAsset(heroes.feed).then((src) => {
        if (src) setImageSrc(src);
      });
    }
    if (session.reelsCoverSrc) setReelsCoverSrc(session.reelsCoverSrc);
    else if (heroes.story) {
      void objectUrlForAsset(heroes.story).then((src) => {
        if (src) setReelsCoverSrc(src);
      });
    }
  }
  const [pickedHits, setPickedHits] = useState<SearchHit[]>([]);
  const [gatherNote, setGatherNote] = useState("");
  const [simApplied, setSimApplied] = useState(false);

  const hits = useMemo(
    () => searchCreative({ query, memory, assets, campaigns, igPosts, projects }),
    [query, memory, assets, campaigns, igPosts, projects],
  );

  async function runPack(opts?: { vision?: VisionReport | null; query?: string; skipHero?: boolean }) {
    const report = opts && "vision" in opts ? opts.vision : vision;
    const q = opts?.query ?? query;
    paintGen.current += 1;
    setBusy(true);
    try {
      const localHits = searchCreative({
        query: q,
        memory,
        assets,
        campaigns,
        igPosts,
        projects,
      });
      setGatherNote(
        localHits.length
          ? `正在找 Drive、Canva、IG 與品牌記憶… 已見 ${localHits.length} 筆`
          : "正在找 Drive、Canva、IG 與品牌記憶…",
      );
      const gathered = await gatherIntoStore(q);
      const liveHits = searchCreative({
        query: q,
        memory: useCreative.getState().memory,
        assets,
        campaigns: useCreative.getState().campaigns,
        igPosts: useCreative.getState().igPosts,
        projects,
      });
      const note = gatherStatusLine(liveHits.length, gathered.sources);
      setGatherNote(note);
      const extra: SourceRef[] = [];
      if (report || imageSrc || initialAssetId) {
        extra.push({
          source: "upload",
          label: assets.find((item) => item.id === initialAssetId)?.name || "你丟進來的圖",
          id: (initialAssetId ?? "upload").slice(0, 160),
        });
      }
      const sources = selectSourcesForPack(pickedHits, liveHits, extra);
      const dna = clubDnaFromMemory({
        igPosts: useCreative.getState().igPosts,
        memory: useCreative.getState().memory,
      });
      const event = resolvePromoEvent({ query: q, campaign });
      const result = await generateCreativePack({
        data: {
          query: q,
          eventName: event.eventName,
          schedule: event.schedule || undefined,
          location: event.location,
          oneLiner: campaign?.oneLiner,
          sources,
          visionNotes: report ? visionPromptBlock(report) : undefined,
          dnaNotes: `${seasonCreateNote(academicMoment(), useCreative.getState().lastLearn?.hook)}\n${brands[0] ? brandMemoryBlock(brands[0]) : ""}\n${dnaPromptBlock(dna)}\n${insightsPromptBlock(clubInsightsFromPosts(useCreative.getState().igPosts))}\n${lastLearnPromptBlock(useCreative.getState().lastLearn)}`.slice(
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
      const aligned = alignPackToDirection(
        { ...result.pack, sourceSummary: note, copyVariants: result.pack.copyVariants },
        dirId,
        directions.length === 3 ? directions : undefined,
      );
      const when = event.schedule || aligned.plan.subhead;
      const where = event.location;
      const revised = reviseCopiesForStudent(aligned.copyVariants, aligned.plan.studentSim, when, where);
      const copies = stampEventWhen(revised.copies, event.schedule, event.location);
      const nextPack = {
        ...aligned,
        sourceSummary: note,
        copyVariants: copies,
      };
      const keptId =
        dirId && nextPack.directions.some((item) => item.id === dirId)
          ? dirId
          : (nextPack.directions[0]?.id ?? null);
      setPack(nextPack);
      setPosterOnly(false);
      posterOnlyRef.current = false;
      packRef.current = nextPack;
      setDirId(keptId);
      setCopies(copies);
      setSimApplied(revised.applied);
      let heroSrc = imageSrc;
      const chosen = nextPack.directions.find((item) => item.id === keptId) ?? nextPack.directions[0];
      const keepHero = Boolean(opts?.skipHero) || (Boolean(imageSrc) && imageDirId.current === keptId);
      if (chosen?.imagePrompt && !keepHero) {
        heroSrc = (await runImage(chosen.imagePrompt, aspect, { silent: true, keepBusy: true, directionId: keptId })) ?? heroSrc;
      }
      persistSession({
        pack: nextPack,
        posterOnly: false,
        dirId: keptId,
        copies,
        tone: "student",
        imageSrc: persistableImageSrc(heroSrc),
        reelsCoverSrc: persistableImageSrc(reelsCoverSrc),
        createdCampaignId,
        projectId: studioProjectId,
        aspect,
      });
      toast.success(chosen?.imagePrompt && !keepHero ? "完整宣傳與主視覺好了" : "完整宣傳好了");
      const campId = resolvedCampaignId;
      if (campId) {
        const live = useCreative.getState();
        const camp = live.campaigns.find((item) => item.id === campId);
        if (camp) {
          if (!camp.waves.length) live.generateWaves(camp.id);
          const fresh = useCreative.getState().campaigns.find((item) => item.id === campId);
          if (fresh) live.updateCampaign(campId, { waves: annotateWavesFromPack(fresh.waves, nextPack) });
        }
      }
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
              if (autoRun) {
                if (mode === "image") await runDirections(result.report, { silent: true });
                else await runPack({ vision: result.report });
              }
            } else if (autoRun) {
              if (mode === "image") await runDirections(undefined, { silent: true });
              else await runPack();
            }
          } else if (autoRun) {
            if (mode === "image") await runDirections(undefined, { silent: true });
            else await runPack();
          }
        } catch {
          toast.error("這張圖讀不到，改丟一張進來也可以。");
          if (autoRun) {
            if (mode === "image") await runDirections(undefined, { silent: true });
            else await runPack();
          }
        } finally {
          setBusy(false);
        }
      })();
      return;
    }
    if (mode === "vision") fileRef.current?.click();
    if (!autoRun) {
      const session = readLastSession();
      const allow = session && (mode !== "image" || session.posterOnly);
      if (allow && session) {
        ran.current = true;
        restored.current = true;
        setPack(session.pack);
        packRef.current = session.pack;
        setPosterOnly(Boolean(session.posterOnly));
        posterOnlyRef.current = Boolean(session.posterOnly);
        if (session.pack.query) setQuery(session.pack.query);
        setDirId(session.dirId);
        setCopies(session.copies);
        setTone(session.tone);
        hydrateHeroFromSession(session);
        if (session.createdCampaignId) setCreatedCampaignId(session.createdCampaignId);
        if (session.projectId) setStudioProjectId(session.projectId);
        if (session.aspect) setAspect(session.aspect);
        if (session.canvaStep) setCanvaStep(session.canvaStep);
        if (session.canvaEditUrl) setCanvaEditUrl(session.canvaEditUrl);
        if (session.canvaDesignId) setCanvaDesignId(session.canvaDesignId);
        if (session.canvaReturnAssetId) setCanvaReturnAssetId(session.canvaReturnAssetId);
        return;
      }
    }
    if (autoRun) {
      ran.current = true;
      if (mode === "image") void runDirections(undefined, { silent: true });
      else void runPack();
      return;
    }
    if (mode === "image") {
      ran.current = true;
      void runDirections(undefined, { silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, initialAssetId, mode]);

  useEffect(() => {
    if (notice === "denied") toast.error("授權沒有完成，這次的文案還在");
    if (notice === "memory") toast.message("官方授權尚未開啟。清單已留在 Creative Memory。");
    if (connected === "canva" || connected === "google-drive" || connected === "instagram") {
      setConnection(connected, { status: "connected", lastSyncAt: Date.now() });
    }
    if (connected === "canva") toast.success("已連接 Canva，接著把這份清單送進去");
  }, [notice, connected, setConnection]);

  async function runCopy() {
    setBusy(true);
    try {
      const event = resolvePromoEvent({ query, campaign });
      const result = await generateCopy({
        data: {
          topic: query,
          kind: mode,
          when: event.schedule || undefined,
          where: event.location,
          insightNotes: `${seasonCreateNote(academicMoment(), useCreative.getState().lastLearn?.hook)}\n${brands[0] ? brandMemoryBlock(brands[0]) : ""}\n${insightsPromptBlock(clubInsightsFromPosts(useCreative.getState().igPosts))}\n${lastLearnPromptBlock(useCreative.getState().lastLearn)}\n${vision ? visionPromptBlock(vision) : ""}\n${dnaPromptBlock(
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

  async function runDirections(report?: VisionReport | null, opts?: { silent?: boolean }) {
    const vis = report !== undefined ? report : vision;
    setBusy(true);
    try {
      const result = await listVisualDirections({
        data: {
          topic: query,
          notes: [
            seasonCreateNote(academicMoment(), useCreative.getState().lastLearn?.hook),
            brands[0] ? brandMemoryBlock(brands[0]) : "",
            vis ? visionPromptBlock(vis) : "",
          ]
            .filter(Boolean)
            .join("\n")
            .slice(0, 1600),
        },
      });
      if (result.ok) {
        setDirections(result.directions);
        setDirId(result.directions[0]?.id ?? null);
        if (pack) setPack({ ...pack, directions: result.directions });
        if (!opts?.silent) toast.success("三個視覺方向好了，先選一個再生成圖");
      }
    } finally {
      setBusy(false);
    }
  }

  function makePosterPack(chosenId?: string | null): CreativePack | null {
    const dirs = directions.length ? directions : packRef.current?.directions ?? [];
    const chosen =
      dirs.find((item) => item.id === chosenId) ??
      dirs.find((item) => item.id === dirId) ??
      dirs[0];
    if (!chosen) return null;
    const sources: SourceRef[] = [];
    if (lastAsset.current.feed) {
      sources.push({ source: "generated", label: "AI 主視覺", id: lastAsset.current.feed });
    } else if (lastAsset.current.story) {
      sources.push({ source: "generated", label: "9:16 封面", id: lastAsset.current.story });
    }
    const event = resolvePromoEvent({ query, campaign });
    return posterPackFromDirection({
      query,
      direction: chosen,
      directions: dirs,
      sources,
      eventName: event.eventName,
      when: event.schedule || undefined,
      where: event.location,
    });
  }

  async function runImage(
    prompt: string,
    ratio: (typeof ASPECTS)[number]["id"] = aspect,
    opts?: { silent?: boolean; keepBusy?: boolean; asCover?: boolean; directionId?: string | null },
  ) {
    const gen = ++paintGen.current;
    const coverOnly = Boolean(opts?.asCover);
    if (!opts?.keepBusy) setBusy(true);
    try {
      if (!coverOnly && ratio !== aspect) setAspect(ratio);
      const result = await generateStudioImage({ data: { prompt, topic: query, aspect: ratio } });
      if (gen !== paintGen.current) return null;
      if (!result.ok) {
        if (!opts?.silent) toast.error(result.error);
        return null;
      }
      const id = uid("asset");
      const blob = await (await fetch(result.src)).blob();
      if (gen !== paintGen.current) return null;
      await getAssetStorage().put(id, blob);
      addAsset(
        createGeneratedAsset({
          id,
          name: coverOnly || ratio === "9:16" ? "Reels／Story 封面" : query.slice(0, 18) || "AI 主視覺",
          mime: blob.type || "image/png",
          width: 1080,
          height: ratio === "9:16" ? 1920 : ratio === "1:1" ? 1080 : 1350,
          category: ratio === "9:16" ? "story" : "poster",
        }),
      );
      if (coverOnly || ratio === "9:16") {
        setReelsCoverSrc(result.src);
        lastAsset.current.story = id;
      }
      if (!coverOnly) {
        setImageSrc(result.src);
        imageDirId.current = opts?.directionId ?? dirId;
        if (ratio !== "9:16") lastAsset.current.feed = id;
        if (!packRef.current || posterOnlyRef.current) {
          const next = makePosterPack(opts?.directionId ?? dirId);
          if (next) {
            setPack(next);
            packRef.current = next;
            setCopies(next.copyVariants);
            setPosterOnly(true);
            posterOnlyRef.current = true;
            persistSession({
              pack: next,
              posterOnly: true,
              dirId: opts?.directionId ?? dirId,
              copies: next.copyVariants,
              tone,
              imageSrc: persistableImageSrc(result.src),
              reelsCoverSrc: persistableImageSrc(ratio === "9:16" ? result.src : reelsCoverSrc),
              createdCampaignId,
              projectId: studioProjectId,
              aspect: ratio,
            });
          }
        }
      }
      if (result.src.startsWith("https:")) {
        addMemory({
          id: `gen_${id}`,
          source: "generated",
          sourceLabel: "AI Generated",
          title: coverOnly || ratio === "9:16" ? "Reels／Story 封面" : query.slice(0, 18) || "AI 主視覺",
          kind: ratio === "9:16" ? "poster" : "poster",
          tags: ["generated", ratio === "9:16" ? "story" : "ig"],
          summary: coverOnly || ratio === "9:16" ? "9:16 封面，可排 Story／Reels。" : "剛才生成的主視覺，可發到 IG。",
          thumbUrl: result.src,
          assetId: id,
          createdAt: Date.now(),
        });
      }
      const session = readLastSession();
      if (session) {
        writeLastSession({
          ...session,
          imageSrc: persistableImageSrc(coverOnly ? session.imageSrc : result.src),
          reelsCoverSrc: persistableImageSrc(coverOnly || ratio === "9:16" ? result.src : session.reelsCoverSrc),
          feedAssetId: lastAsset.current.feed ?? session.feedAssetId,
          storyAssetId: lastAsset.current.story ?? session.storyAssetId,
          savedAt: Date.now(),
        });
      }
      if (!opts?.silent) toast.success(coverOnly || ratio === "9:16" ? "9:16 封面已進素材庫，主視覺還在" : "主視覺已進素材庫");
      return result.src;
    } finally {
      if (!opts?.keepBusy && gen === paintGen.current) setBusy(false);
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
      await runPack({ vision, query: nextQuery, skipHero: true });
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
    if (kind === "story") await runImage(varyImagePrompt(vision.imagePrompt, "story"), "9:16", { asCover: true });
    if (kind === "reels") await runImage(varyImagePrompt(vision.imagePrompt, "reels"), "9:16", { asCover: true });
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

  function applyToStudio(
    andSchedule: boolean,
    opts?: {
      kind?: ContentKind;
      nextPack?: CreativePack;
      stay?: boolean;
      silent?: boolean;
      skipNavigate?: boolean;
      campaignId?: string;
      single?: boolean;
      heroSource?: SourceRef["source"];
      heroSrc?: string | null;
      heroAssetId?: string | null;
    },
  ): { projectId: string; day: string } | undefined {
    const brand = brands[0];
    const active = opts?.nextPack ?? pack;
    const kind = opts?.kind ?? (posterOnly ? posterKindFromAspect(aspect) : "carousel");
    if (!brand || !active) return;
    const live = useCreative.getState();
    const campId = opts?.campaignId ?? resolvedCampaignId;
    let camp = campId ? live.campaigns.find((item) => item.id === campId) : undefined;
    if (!camp && andSchedule) {
      camp = live.addCampaign({
        name: active.plan.campaignName,
        date: inferEventDate(query),
        type: inferCampaignType(`${query} ${active.plan.campaignName}`),
        oneLiner: active.plan.hook,
        fullIntro: active.plan.body,
        studentPain: active.plan.insight,
        cta: active.plan.cta,
        theme: active.plan.visualTheme,
        location: campaign?.location ?? "淡江校園",
        ...(opts?.single ? { waves: [] } : {}),
      });
      setCreatedCampaignId(camp.id);
    }
    const brief = {
      ...emptyBrief(),
      eventName: active.plan.campaignName,
      product: active.plan.campaignName,
      schedule: camp ? displayEventWhen(camp.date, camp.time || "19:30") : resolvePromoEvent({ query }).schedule,
      location: camp?.location ?? "淡江校園",
      audience: active.studentContext,
      features: active.plan.concept,
      style: active.plan.visualTheme,
      deliverables: { post: true, story: true, carousel: true, reels: true },
    };
    const studio = useStudio.getState();
    const existing = studioProjectId ? studio.projects.find((item) => item.id === studioProjectId) : undefined;
    const reuse = Boolean(existing && existing.contentKind === kind);
    const project = reuse
      ? existing!
      : createProject({
          name: `${active.plan.campaignName} · ${kind === "carousel" ? "Carousel" : kind === "story" ? "Story" : kind === "reels" ? "Reels" : kind === "line" ? "LINE" : kind === "threads" ? "Threads" : "IG"}`,
          brandId: brand.id,
          formatId: formatForKind(kind),
          brief,
          templateId: active.plan.templateId,
        });
    applyCampaignPlan(project.id, active.plan, brief);
    const activeCopy = copies.find((c) => c.tone === tone) ?? copies[0];
    const caption = captionForPackKind(active, kind, activeCopy);
    useStudio.getState().setCopy(project.id, {
      headline: kind === "carousel" || kind === "ig-post" ? (activeCopy?.hook ?? active.plan.hook) : topicForPackKind(active, kind),
      body: caption,
      cta: activeCopy?.cta ?? active.plan.cta,
      caption,
      hashtags: activeCopy?.hashtags ?? active.plan.hashtags,
    });
    setStudioProjectId(project.id);
    persistSession({
      pack: active,
      posterOnly,
      createdCampaignId: camp?.id ?? createdCampaignId,
      projectId: project.id,
      reelsCoverSrc: persistableImageSrc(reelsCoverSrc),
    });
    const scheduledAt = scheduledAtFor(kind, camp?.date);
    const status = andSchedule ? "scheduled" : opts?.stay ? "done" : "creating";
    const storyKind = usesStoryCover(kind);
    const fromCanva = !storyKind && (opts?.heroSource === "canva" || (!opts?.heroSource && canvaStep === "returned"));
    const hero =
      opts?.heroSrc ??
      coverForKind(kind, { feed: imageSrc, story: reelsCoverSrc });
    const heroAssetId =
      opts?.heroAssetId ??
      (fromCanva
        ? canvaReturnAssetId
        : coverForKind(kind, { feed: lastAsset.current.feed, story: lastAsset.current.story }));
    const persistable = persistableImageSrc(hero);
    const coverId = heroAssetId || persistable || (!heroAssetId && hero?.startsWith("data:") ? hero : undefined);
    useStudio.getState().updateProject(project.id, {
      contentKind: kind,
      campaignId: camp?.id ?? null,
      sourceRefs: [
        ...active.sources,
        ...(coverId
          ? [{
              source: (fromCanva ? "canva" : "generated") as SourceRef["source"],
              label: fromCanva ? "Canva 微調後" : storyKind ? "9:16 封面" : "AI 主視覺",
              id: coverId,
            }]
          : []),
      ],
      status,
      scheduledAt: andSchedule ? scheduledAt : null,
    });
    if (camp && andSchedule) {
      if (!opts?.single && !useCreative.getState().campaigns.find((item) => item.id === camp.id)?.waves.length) {
        generateWaves(camp.id);
      }
      bindScheduledWave(camp.id, {
        kind,
        projectId: project.id,
        scheduledAt,
        topic: topicForPackKind(active, kind),
        status: "scheduled",
      });
    }
    const day = isoFromMs(scheduledAt);
    if (!opts?.silent) {
      toast.success(andSchedule ? `已排進 ${day.replace(/^\d{4}-/, "").replace("-", "/")} 月曆` : opts?.stay ? "已放到 IG Grid" : "已套進畫布");
    }
    if (opts?.stay) return { projectId: project.id, day };
    if (andSchedule) {
      if (!opts?.skipNavigate) void navigate({ to: "/calendar", search: { day } });
      return { projectId: project.id, day };
    }
    if (!opts?.skipNavigate) void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
    return { projectId: project.id, day };
  }

  async function scheduleWholeCampaign() {
    if (posterOnly) {
      schedulePoster();
      return;
    }
    const active = pack;
    if (!active || !brands[0]) {
      toast.message("先生成一版完整宣傳");
      return;
    }
    const live = useCreative.getState();
    let camp = resolvedCampaignId ? live.campaigns.find((item) => item.id === resolvedCampaignId) : undefined;
    if (!camp) {
      camp = live.addCampaign({
        name: active.plan.campaignName,
        date: inferEventDate(query),
        type: inferCampaignType(`${query} ${active.plan.campaignName}`),
        oneLiner: active.plan.hook,
        fullIntro: active.plan.body,
        studentPain: active.plan.insight,
        cta: active.plan.cta,
        theme: active.plan.visualTheme,
        location: "淡江校園",
      });
      setCreatedCampaignId(camp.id);
    }
    if (!camp.waves.length) live.generateWaves(camp.id);
    const campId = camp.id;
    camp = useCreative.getState().campaigns.find((item) => item.id === campId) ?? camp;
    live.updateCampaign(campId, { waves: annotateWavesFromPack(camp.waves, active) });
    camp = useCreative.getState().campaigns.find((item) => item.id === campId) ?? camp;
    const kinds = remainingPackKinds(camp.waves, PACK_SCHEDULE_KINDS);
    if (!kinds.length) {
      toast.message("這套已經在月曆裡");
      const day = camp.waves[0]?.scheduledAt ? isoFromMs(camp.waves[0].scheduledAt) : camp.date;
      void navigate({ to: "/calendar", search: { day } });
      return;
    }
    setBusy(true);
    let storySrc = reelsCoverSrc;
    try {
      if (kinds.some(usesStoryCover) && !storySrc) {
        const prompt = varyImagePrompt(
          active.directions.find((item) => item.id === dirId)?.imagePrompt || active.plan.visualTheme || query,
          "reels",
        );
        storySrc = (await runImage(prompt, "9:16", { silent: true, keepBusy: true, asCover: true })) ?? storySrc;
      }
      let firstDay = camp.date;
      for (const kind of kinds) {
        const placed = applyToStudio(true, {
          kind,
          nextPack: active,
          silent: true,
          skipNavigate: true,
          campaignId: campId,
          heroSrc: coverForKind(kind, { feed: imageSrc, story: storySrc }),
          heroAssetId: coverForKind(kind, { feed: lastAsset.current.feed, story: lastAsset.current.story }),
        });
        if (placed && kind === kinds[0]) firstDay = placed.day;
      }
      toast.success(
        storySrc
          ? `已把 ${kinds.map((kind) => contentKindLabel(kind)).join("、")} 依節奏排進月曆，限動和 Reels 用 9:16`
          : `已把 ${kinds.map((kind) => contentKindLabel(kind)).join("、")} 依節奏排進月曆`,
      );
      void navigate({ to: "/calendar", search: { day: firstDay } });
    } finally {
      setBusy(false);
    }
  }

  function schedulePoster() {
    const active = pack ?? makePosterPack(dirId);
    if (!active || !brands[0]) {
      toast.message("先生成一張圖");
      return;
    }
    applyToStudio(true, {
      kind: posterKindFromAspect(aspect),
      nextPack: active,
      single: true,
    });
  }

  function goIgPreview() {
    const active = pack ?? makePosterPack(dirId);
    if (!active) {
      toast.message("先生成一張圖，再去 IG 預覽");
      return;
    }
    const placed = applyToStudio(false, {
      stay: true,
      silent: true,
      nextPack: active,
      kind: posterOnly || !pack ? posterKindFromAspect(aspect) : undefined,
      single: true,
      ...(canvaStep === "returned"
        ? { heroSource: "canva" as const, heroSrc: imageSrc, heroAssetId: canvaReturnAssetId }
        : {}),
    });
    const id = placed?.projectId ?? studioProjectId;
    if (!id) {
      toast.message("先生成一張圖，再去 IG 預覽");
      return;
    }
    toast.dismiss();
    void navigate({ to: "/ig", search: { item: id } });
  }

  async function sendCanva(opts?: { afterConnect?: boolean }) {
    const active = pack ?? makePosterPack(dirId);
    if (!active) {
      toast.message("先生成一張圖");
      return;
    }
    const activeCopy = copies.find((c) => c.tone === tone) ?? copies[0] ?? active.copyVariants[0];
    const dir = active.directions.find((d) => d.id === dirId) ?? directions.find((d) => d.id === dirId);
    const caption = activeCopy?.body ?? active.plan.captions[0]?.text ?? active.plan.hook;
    const kit = buildCanvaKit({
      campaignName: active.plan.campaignName,
      hook: active.plan.hook,
      caption,
      cta: activeCopy?.cta ?? active.plan.cta,
      hashtags: activeCopy?.hashtags ?? active.plan.hashtags,
      palette: dir?.palette,
      composition: dir?.composition,
      typeDirection: dir?.typeDirection,
      imagePrompt: dir?.imagePrompt,
      carousel: posterOnly ? undefined : active.conversions.carousel,
    });
    try {
      await navigator.clipboard.writeText(kit);
    } catch {
      /* 沒剪貼簿也繼續開 Canva */
    }
    addMemory(
      memoryFromCanvaKit({
        campaignName: active.plan.campaignName,
        kit,
        thumbUrl: persistableImageSrc(imageSrc),
        id: `canva_kit_${active.plan.campaignName.replace(/\s+/g, "_").slice(0, 40)}`,
      }),
    );
    const kind = posterOnly || aspect === "9:16" ? (aspect === "9:16" ? "story" : "post") : "carousel";
    const placed = applyToStudio(false, {
      stay: true,
      silent: true,
      nextPack: active,
      kind: posterOnly ? posterKindFromAspect(aspect) : undefined,
      single: true,
    });
    const persist = (step: CanvaLoopStep, extra?: { editUrl?: string | null; designId?: string | null }) => {
      setCanvaStep(step);
      if (extra?.editUrl) setCanvaEditUrl(extra.editUrl);
      if (extra?.designId) setCanvaDesignId(extra.designId);
      persistSession({
        pack: active,
        posterOnly,
        projectId: placed?.projectId ?? studioProjectId,
        canvaKit: kit,
        canvaStep: step,
        canvaEditUrl: extra?.editUrl ?? canvaEditUrl,
        canvaDesignId: extra?.designId ?? canvaDesignId,
        canvaReturnAssetId,
      });
    };
    persist("kit");
    const result = await createCanvaDesign({
      data: {
        title: active.plan.campaignName,
        kind,
        imageUrl: publicImageUrl(imageSrc) ?? undefined,
      },
    });
    if (!result.ok) {
      toast.message(result.message);
      persist(result.reason === "connect" ? "need-connect" : "kit");
      return;
    }
    const designId = result.designId ?? canvaDesignIdFromEditUrl(result.url);
    persist("opened", { editUrl: result.url, designId });
    addMemory(
      memoryFromCanvaKit({
        campaignName: active.plan.campaignName,
        kit,
        thumbUrl: persistableImageSrc(imageSrc),
        id: `canva_kit_${active.plan.campaignName.replace(/\s+/g, "_").slice(0, 40)}`,
        openUrl: result.url,
      }),
    );
    if (!opts?.afterConnect) {
      window.open(result.url, "_blank", "noopener");
    }
    toast.success(
      result.withAsset ? "已把主視覺送進 Canva" : opts?.afterConnect ? "Canva 設計已開好，從下面進去改" : "已在 Canva 開對應尺寸，貼上清單繼續改",
    );
  }

  async function acceptCanvaReturn(src: string, blob?: Blob) {
    if (!pack) return;
    setImageSrc(src);
    if (aspect === "9:16") setReelsCoverSrc(src);
    let assetId = canvaReturnAssetId ?? undefined;
    if (blob) {
      assetId = uid("asset");
      await getAssetStorage().put(assetId, blob);
      setCanvaReturnAssetId(assetId);
      if (aspect === "9:16") lastAsset.current.story = assetId;
      else lastAsset.current.feed = assetId;
      addAsset(
        migrateAsset({
          id: assetId,
          name: canvaReturnTitle(pack.plan.campaignName),
          kind: "image",
          category: aspect === "9:16" ? "story" : "poster",
          mime: blob.type || "image/png",
          width: 1080,
          height: aspect === "9:16" ? 1920 : 1350,
          tags: ["canva", "主視覺"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          source: "canva",
          licenseNotes: "從 Canva 接回，可發到 IG。",
          licenseOwner: "Canva 匯出",
          favorite: false,
          lastUsedAt: Date.now(),
          useCount: 1,
        }),
      );
    }
    addMemory({
      id: `canva_return_${assetId ?? pack.plan.campaignName.replace(/\s+/g, "_").slice(0, 40)}`,
      source: "canva",
      sourceLabel: `Canva / ${pack.plan.campaignName}`,
      title: canvaReturnTitle(pack.plan.campaignName),
      kind: "design",
      tags: ["canva", "ig"],
      summary: "Canva 微調後接回的主視覺。",
      thumbUrl: persistableImageSrc(src) ?? undefined,
      assetId,
      openUrl: canvaEditUrl ?? undefined,
      createdAt: Date.now(),
    });
    setCanvaStep("returned");
    persistSession({
      pack,
      posterOnly,
      imageSrc: persistableImageSrc(src),
      canvaStep: "returned",
      canvaReturnAssetId: assetId ?? null,
    });
    applyToStudio(false, { stay: true, silent: true, heroSource: "canva", heroSrc: src, heroAssetId: assetId });
    toast.success("Canva 畫面已回來，可以去 IG 預覽");
  }

  async function takeCanvaBack() {
    const designId = canvaDesignId || canvaDesignIdFromEditUrl(canvaEditUrl);
    if (!designId) {
      canvaFileRef.current?.click();
      return;
    }
    setBusy(true);
    try {
      const result = await pullCanvaExport({ data: { designId } });
      if (!result.ok) {
        toast.message(result.message);
        canvaFileRef.current?.click();
        return;
      }
      let blob: Blob | undefined;
      if (result.src.startsWith("data:")) {
        blob = await (await fetch(result.src)).blob();
      }
      await acceptCanvaReturn(result.src, blob);
    } finally {
      setBusy(false);
    }
  }

  function onCanvaReturnFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      void acceptCanvaReturn(String(reader.result), file);
    };
    reader.readAsDataURL(file);
  }

  async function connectCanvaAndReturn() {
    if (pack) {
      persistSession({
        pack,
        posterOnly,
        canvaStep: canvaStep ?? "need-connect",
      });
    }
    const result = await startConnection({
      data: { provider: "canva", next: posterOnly || mode === "image" ? "/create?mode=image" : "/create" },
    });
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    toast.message(result.message);
  }

  const shownDirections = pack?.directions.length ? pack.directions : directions;
  const activeDir = shownDirections.find((d) => d.id === dirId) ?? shownDirections[0];
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
        carousel: posterOnly ? undefined : pack.conversions.carousel,
      })
    : "";

  useEffect(() => {
    if (retriedCanva.current || connected !== "canva" || !pack) return;
    retriedCanva.current = true;
    void sendCanva({ afterConnect: true });
    void navigate({
      to: "/create",
      search: {
        q: query || undefined,
        mode: mode !== "idea" ? mode : undefined,
        campaign: resolvedCampaignId,
      },
      replace: true,
    });
  }, [connected, pack, query, mode, resolvedCampaignId, navigate]);

  function applySimFixes() {
    if (!copy || !sim) return;
    const event = resolvePromoEvent({ query, campaign });
    const when = event.schedule || pack?.plan.subhead;
    setCopies((prev) => stampEventWhen(
      prev.map((item) => applyStudentRevisions(item, sim, when, event.location)),
      event.schedule,
      event.location,
    ));
    setSimApplied(true);
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
    <main className={cn("mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10", pack && (imageSrc || posterOnly) ? "pb-36 lg:pb-20" : "pb-20")}>
      <p className="text-xs tracking-[0.18em] text-muted uppercase">{mode === "image" ? "AI Image Studio" : "AI 創作台"}</p>
      <h1 className="mt-1 font-display text-3xl md:text-4xl">
        {mode === "image" && (imageSrc || posterOnly) ? "這張可以接著發" : mode === "image" ? "先選一個視覺方向" : "把一句話變成整套網宣"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "image"
          ? imageSrc || posterOnly
            ? "主視覺好了。可以送 Canva、看 IG Preview、排進月曆，或再做成完整宣傳。"
            : "先想活動、淡江學生、淡水、品牌色與龜龜，再給三個方向。不要直接生一張禪風海報。"
          : "文案、方向、Carousel、Story、Threads、Reels 會一起出來。不會出現 Agent 管理。"}
      </p>

      <Textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-6 min-h-28 rounded-2xl"
        placeholder="例如：下週有一場茶會"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void runPack({ skipHero: Boolean(imageSrc) && imageDirId.current === dirId })} disabled={busy} className="min-h-11 rounded-full">
          {busy
            ? "生成中…"
            : dirId && shownDirections.length && (!pack || posterOnly)
              ? `用「${activeDir?.name ?? "這個方向"}」做完整宣傳`
              : "AI 生成完整宣傳"}
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
        <input
          ref={canvaFileRef}
          data-canva-return="1"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCanvaReturnFile(file);
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
      ) : imageSrc && !shownDirections.length ? (
        <img src={imageSrc} alt="生成或上傳的畫面" className="mt-6 w-full rounded-3xl shadow-[var(--shadow-artboard)]" />
      ) : null}

      {busy && !pack && mode !== "image" ? (
        <p className="mt-3 text-sm text-muted" data-gather-status="">
          {gatherNote || "正在找 Drive、Canva、IG 與品牌記憶…"}
        </p>
      ) : null}

      {mode === "image" && busy && !shownDirections.length ? (
        <p className="mt-4 text-sm text-muted">先想三個視覺方向，也同時在找過去的茶會與品牌素材…</p>
      ) : null}

      {shownDirections.length ? (
        <VisualDirectionBoard
          directions={shownDirections}
          dirId={activeDir?.id ?? dirId}
          activeDir={activeDir}
          aspect={aspect}
          busy={busy}
          imageSrc={imageSrc}
          onPick={(dir) => {
            setDirId(dir.id);
            if (pack && dir.id !== dirId && dir.imagePrompt) {
              void runImage(dir.imagePrompt, aspect, { silent: true, directionId: dir.id });
            }
          }}
          onAspect={setAspect}
          onGenerate={() => {
            if (activeDir?.imagePrompt) void runImage(activeDir.imagePrompt, aspect, { directionId: activeDir.id });
          }}
          onVary={(kind) => {
            if (activeDir?.imagePrompt) {
              void runImage(varyImagePrompt(activeDir.imagePrompt, kind), aspect, { directionId: activeDir.id });
            }
          }}
          onRefresh={() => void runDirections()}
          onMakePack={
            pack && !posterOnly
              ? undefined
              : () => void runPack({ skipHero: Boolean(imageSrc) && imageDirId.current === (activeDir?.id ?? dirId) })
          }
        />
      ) : null}

      {pack && posterOnly ? (
        <section className="mt-6 space-y-4" data-poster-loop="">
          <div className="hidden flex-wrap gap-2 lg:flex">
            <Button className="min-h-11 rounded-full" disabled={busy} onClick={schedulePoster}>
              排進月曆
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={goIgPreview}>
              IG Preview
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" disabled={busy} onClick={() => void sendCanva()}>
              送進 Canva 微調
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 rounded-full"
              disabled={busy}
              onClick={() => void runPack({ skipHero: Boolean(imageSrc) && imageDirId.current === (activeDir?.id ?? dirId) })}
            >
              用這個方向做完整宣傳
            </Button>
          </div>
          <div className="pb-2 lg:pb-0" data-poster-convert="">
            <h2 className="text-sm font-medium">這一張再轉一版</h2>
            <p className="mt-1 text-xs text-muted">不用先做完整宣傳。Carousel、Story、Threads、Reels 可以從這張直接拆。</p>
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
                persistSession({ pack: next, posterOnly: true });
                const contentKind = CONVERT_TO_KIND[kind] ?? "carousel";
                applyToStudio(true, {
                  kind: contentKind,
                  nextPack: next,
                  single: true,
                  heroSrc: coverForKind(contentKind, { feed: imageSrc, story: reelsCoverSrc }),
                  heroAssetId: coverForKind(contentKind, {
                    feed: lastAsset.current.feed,
                    story: lastAsset.current.story,
                  }),
                });
              }}
            />
          </div>
          <IgPhonePreview
            hook={pack.plan.hook}
            caption={copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook}
            imageSrc={imageSrc}
            storySrc={aspect === "9:16" ? imageSrc : reelsCoverSrc}
            handle="@tkuzen"
          />
          <p className="text-xs text-muted">來源：{pack.sources[0]?.label ?? "AI Generated"}。先排這一張，完整宣傳再補 Carousel、Story、Reels。</p>
          {canvaStep ? (
            <div className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]" data-canva-loop={canvaStep}>
              <p className="text-xs tracking-[0.18em] text-muted uppercase">下一步</p>
              <p className="mt-1 font-display text-lg">
                {canvaStep === "returned"
                  ? "Canva 畫面已回來"
                  : canvaStep === "opened"
                    ? "Canva 改完，把畫面接回來"
                    : canvaStep === "need-connect"
                      ? "清單已進 Creative Memory"
                      : "清單已複製，可以先改、再排"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {canvaStep === "returned"
                  ? "來源：Canva 微調後。接著 IG Preview 或排進月曆。"
                  : canvaStep === "need-connect"
                    ? "先連官方 Canva。授權後會回到這張主視覺，不用重生成。"
                    : "改完把 PNG 丟回來，或連著 Canva 時按取回。接著 IG Preview。"}
              </p>
              <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
                {canvaStep === "need-connect" ? (
                  <Button className="min-h-11 rounded-full" onClick={() => void connectCanvaAndReturn()}>
                    連接 Canva 後回來繼續
                  </Button>
                ) : null}
                {canvaEditUrl ? (
                  <Button className="min-h-11 rounded-full" variant="secondary" onClick={() => window.open(canvaEditUrl, "_blank", "noopener")}>
                    在 Canva 繼續改
                  </Button>
                ) : null}
                <Button className="min-h-11 rounded-full" variant={canvaStep === "returned" ? "secondary" : "default"} onClick={() => canvaFileRef.current?.click()}>
                  把 Canva 圖丟回來
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {(hits.length || gatherNote || pickedHits.length) && (mode !== "image" || shownDirections.length) ? (
        <div className="mt-4">
          <p className="text-sm text-muted">{gatherNote || (hits.length ? `找到 ${hits.length} 個相關素材 · 根據過去內容準備 3 個方向` : "先用品牌記憶生成 3 個方向")}</p>
          {pickedHits.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {pickedHits.map((hit) => (
                <button
                  key={`${hit.source}-${hit.id}`}
                  type="button"
                  className="rounded-full bg-surface px-3 py-1.5 text-xs shadow-[var(--shadow-border)]"
                  onClick={() => setPickedHits((prev) => prev.filter((item) => item.id !== hit.id))}
                >
                  {hit.sourceLabel} ×
                </button>
              ))}
            </div>
          ) : null}
          <CreativeHits
            hits={hits}
            pickedIds={new Set(pickedHits.map((hit) => hit.id))}
            onPick={(hit) => {
              setPickedHits((prev) =>
                prev.some((item) => item.id === hit.id) ? prev.filter((item) => item.id !== hit.id) : [...prev, hit],
              );
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

      {pack && !posterOnly ? (
        <section className="mt-8 space-y-6" data-full-pack="">
          <div className="rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">{gatherNote || pack.sourceSummary}</p>
            {simApplied ? <p className="mt-1 text-xs text-muted">已依淡江學生視角改過文案</p> : null}
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
            {lastLearn?.hook ? (
              <p className="mt-1 text-xs text-muted">
                下次會避開重複「{lastLearn.hook}」。{lastLearn.hookLesson}
              </p>
            ) : null}
            {inspirations[0] ? (
              <p className="mt-1 text-xs text-muted">靈感抽象：{inspirations[0].pattern} → {inspirations[0].clubTurn}</p>
            ) : null}
            <p className="mt-3 text-xs text-muted">Carousel、Story、Reels、Threads 可以一次排進月曆，節奏會錯開，不會連發招生。</p>
            <Button className="mt-3 hidden min-h-11 rounded-full lg:inline-flex" disabled={busy} onClick={() => void scheduleWholeCampaign()}>
              整套排進月曆
            </Button>
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
              {sim.revisions.length && !simApplied ? (
                <Button className="mt-3" size="sm" variant="secondary" onClick={applySimFixes}>
                  套用學生視角修改
                </Button>
              ) : simApplied ? (
                <p className="mt-3 text-xs text-muted">已自動套用學生視角修改</p>
              ) : null}
            </div>
          ) : null}

          <IgPhonePreview
            hook={pack.plan.hook}
            caption={copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook}
            imageSrc={imageSrc}
            storySrc={reelsCoverSrc}
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
                { asCover: true },
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
                const contentKind = CONVERT_TO_KIND[kind] ?? "carousel";
                applyToStudio(true, {
                  kind: contentKind,
                  nextPack: next,
                  heroSrc: coverForKind(contentKind, { feed: imageSrc, story: reelsCoverSrc }),
                  heroAssetId: coverForKind(contentKind, { feed: lastAsset.current.feed, story: lastAsset.current.story }),
                });
              }}
            />
          </div>

          <div>
            <h2 className="text-sm font-medium">送進 Canva 微調</h2>
            <p className="mt-1 text-xs text-muted">清單會先留下。沒連 Canva 也不會把這次生成弄丟，連完會回到這裡。</p>
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-2xl bg-surface p-4 font-sans text-xs leading-relaxed shadow-[var(--shadow-border)]">
              {canvaKit}
            </pre>
            {canvaStep ? (
              <div className="mt-3 rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]" data-canva-loop={canvaStep}>
                <p className="text-xs tracking-[0.18em] text-muted uppercase">下一步</p>
                <p className="mt-1 font-display text-lg">
                  {canvaStep === "returned"
                    ? "Canva 畫面已回來"
                    : canvaStep === "opened"
                      ? "Canva 改完，把畫面接回來"
                      : canvaStep === "need-connect"
                        ? "清單已進 Creative Memory"
                        : "清單已複製，可以先改、再排"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {canvaStep === "returned"
                    ? "來源：Canva 微調後。接著 IG Preview 或排進月曆。"
                    : canvaStep === "need-connect"
                      ? "先連官方 Canva。授權後會回到這份文案，不用重生成。"
                      : "改完把 PNG 丟回來，或連著 Canva 時按取回。接著 IG Preview。"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canvaStep === "need-connect" ? (
                    <Button className="min-h-11 rounded-full" onClick={() => void connectCanvaAndReturn()}>
                      連接 Canva 後回來繼續
                    </Button>
                  ) : null}
                  {canvaEditUrl ? (
                    <Button
                      className="min-h-11 rounded-full"
                      variant={canvaStep === "opened" ? "secondary" : "secondary"}
                      onClick={() => window.open(canvaEditUrl, "_blank", "noopener")}
                    >
                      在 Canva 繼續改
                    </Button>
                  ) : null}
                  <Button
                    className="min-h-11 rounded-full"
                    variant={canvaStep === "returned" ? "secondary" : "default"}
                    onClick={() => canvaFileRef.current?.click()}
                  >
                    把 Canva 圖丟回來
                  </Button>
                  {canvaDesignId || canvaDesignIdFromEditUrl(canvaEditUrl) ? (
                    <Button
                      className="min-h-11 rounded-full"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void takeCanvaBack()}
                    >
                      從 Canva 取回
                    </Button>
                  ) : null}
                  <Button className="min-h-11 rounded-full" variant={canvaStep === "returned" ? "default" : "secondary"} onClick={goIgPreview}>
                    IG Preview
                  </Button>
                  <Button variant="secondary" className="min-h-11 rounded-full" disabled={busy} onClick={() => void scheduleWholeCampaign()}>
                    整套排進月曆
                  </Button>
                  <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => applyToStudio(true)}>
                    只排這一則
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden flex-wrap gap-2 lg:flex">
            <Button className="min-h-11 rounded-full" disabled={busy} onClick={() => void scheduleWholeCampaign()}>
              整套排進月曆
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => applyToStudio(false)}>
              套進畫布
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => applyToStudio(true)}>
              只排這一則
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 rounded-full"
              onClick={() => void sendCanva()}
            >
              送進 Canva 微調
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 rounded-full"
              onClick={goIgPreview}
            >
              IG Preview
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => void copyCaption()}>
              複製 Caption
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => void navigate({ to: "/inspire" })}>
              靈感研究
            </Button>
            <PublishButton
              projectId={studioProjectId}
              campaignId={campaign?.id}
              title={pack.plan.campaignName}
              caption={copy?.body ?? pack.plan.captions[0]?.text ?? pack.plan.hook}
              imageUrl={imageSrc}
              variant="secondary"
              size="default"
              className="rounded-full"
            />
          </div>
        </section>
      ) : null}

      {pack && (imageSrc || posterOnly) ? (
        <div
          className="fixed inset-x-0 z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-sm lg:hidden"
          style={{ bottom: "var(--spacing-nav-safe)" }}
          data-create-next={posterOnly ? "poster" : "pack"}
        >
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            <Button
              className="min-h-11 rounded-full"
              disabled={busy}
              onClick={() => (posterOnly ? schedulePoster() : void scheduleWholeCampaign())}
            >
              {posterOnly ? "排進月曆" : "整套排進月曆"}
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" onClick={goIgPreview}>
              IG Preview
            </Button>
            <Button variant="secondary" className="min-h-11 rounded-full" disabled={busy} onClick={() => void sendCanva()}>
              送進 Canva
            </Button>
            {posterOnly ? (
              <Button
                variant="secondary"
                className="min-h-11 rounded-full"
                disabled={busy}
                onClick={() => void runPack({ skipHero: Boolean(imageSrc) && imageDirId.current === (activeDir?.id ?? dirId) })}
              >
                完整宣傳
              </Button>
            ) : null}
            {canvaStep === "need-connect" ? (
              <Button className="min-h-11 rounded-full" onClick={() => void connectCanvaAndReturn()}>
                連接 Canva
              </Button>
            ) : null}
            {canvaStep === "opened" || canvaStep === "returned" ? (
              <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => canvaFileRef.current?.click()}>
                接回 Canva
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function VisualDirectionBoard({
  directions,
  dirId,
  activeDir,
  aspect,
  busy,
  imageSrc,
  onPick,
  onAspect,
  onGenerate,
  onVary,
  onRefresh,
  onMakePack,
}: {
  directions: CreativeDirection[];
  dirId: string | null;
  activeDir?: CreativeDirection;
  aspect: (typeof ASPECTS)[number]["id"];
  busy: boolean;
  imageSrc: string | null;
  onPick: (dir: CreativeDirection) => void;
  onAspect: (id: (typeof ASPECTS)[number]["id"]) => void;
  onGenerate: () => void;
  onVary: (kind: ImageVaryKind) => void;
  onRefresh: () => void;
  onMakePack?: () => void;
}) {
  return (
    <section className="mt-6" data-visual-directions="">
      <h2 className="text-sm font-medium">三個視覺方向</h2>
      <p className="mt-1 text-xs text-muted">每個方向有概念、配色、構圖、字、主文案。選一個再生成，不要直接出禪風海報。</p>
      <ul className="mt-3 grid gap-3 md:grid-cols-3">
        {directions.map((dir) => {
          const selected = dir.id === dirId;
          return (
            <li key={dir.id}>
              <button
                type="button"
                onClick={() => onPick(dir)}
                className={cn(
                  "h-full min-h-11 w-full rounded-2xl p-4 text-left shadow-[var(--shadow-border)]",
                  selected ? "bg-accent text-accent-fg" : "bg-surface",
                )}
              >
                <p className="text-sm font-medium">{dir.name}</p>
                <p className="mt-2 font-display text-base leading-snug">「{dir.headline.replace(/\n/g, "")}」</p>
                <p className={cn("mt-2 text-xs", selected ? "text-accent-fg/80" : "text-muted")}>{dir.concept}</p>
              </button>
            </li>
          );
        })}
      </ul>
      {activeDir ? (
        <div className="mt-4 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="這個方向的主視覺"
              className="mb-4 max-h-80 w-full rounded-2xl object-cover shadow-[var(--shadow-artboard)]"
            />
          ) : null}
          <p>主文案：{activeDir.headline.replace(/\n/g, " ")}</p>
          <p className="mt-1">副文案：{activeDir.subhead}</p>
          <p className="mt-1">配色：{activeDir.palette}</p>
          <p className="mt-1">構圖：{activeDir.composition}</p>
          <p className="mt-1">字：{activeDir.typeDirection}</p>
          <p className="mt-3 text-xs text-muted">{activeDir.imagePrompt}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {ASPECTS.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={aspect === item.id ? "default" : "secondary"}
                onClick={() => onAspect(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={onGenerate}>
              生成這個方向的圖
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onVary("compose")}>
              換構圖
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onVary("mood")}>
              換氣氛
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onVary("bg")}>
              換背景
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onVary("style")}>
              換風格
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onVary("type")}>
              換文字
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={onRefresh}>
              重新生成方向
            </Button>
          </div>
          {onMakePack ? (
            <Button className="mt-4 min-h-11 rounded-full" disabled={busy} onClick={onMakePack}>
              用這個方向做完整宣傳
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function IgPhonePreview({
  hook,
  caption,
  imageSrc,
  storySrc,
  handle,
}: {
  hook: string;
  caption: string;
  imageSrc: string | null;
  storySrc?: string | null;
  handle: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-medium">IG Preview</h2>
      <div className="mt-3 flex flex-wrap items-start justify-center gap-4">
        <div className="w-[min(100%,280px)] rounded-[2rem] bg-[#1c1a16] p-3 text-[#f3eee4] shadow-[var(--shadow-artboard)]">
          <p className="px-1 text-xs">{handle} · 貼文</p>
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
        {storySrc ? (
          <div className="w-[min(42%,168px)] rounded-[2rem] bg-[#1c1a16] p-2 text-[#f3eee4] shadow-[var(--shadow-artboard)]" data-ig-story-preview="">
            <p className="px-1 text-[10px]">{handle} · 限動</p>
            <div className="mt-2 aspect-9/16 overflow-hidden rounded-2xl bg-linear-to-b from-[#2a6a64] to-[#161410]">
              <img src={storySrc} alt="" className="size-full object-cover" />
            </div>
          </div>
        ) : null}
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
          <Button key={kind} className="min-h-11 rounded-full" variant={open === kind ? "default" : "secondary"} onClick={() => void run(kind)}>
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
