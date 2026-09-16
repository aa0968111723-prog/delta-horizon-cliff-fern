import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { convertPlan, packCaption, type ConvertedPack } from "@/lib/ai/convert";
import { generateCampaignPlan, getCampaignAiStatus, describeAdapter, type AiStatus } from "@/lib/ai/campaign";
import { generateCopyPacks } from "@/lib/ai/copy-studio";
import {
  analyzeStudioImage,
  generateStudioImage,
  generateVisualDirections,
  toImageFormat,
  varyImagePrompt,
  type VisionAnalysis,
} from "@/lib/ai/image-studio";
import { directionPosterSvg, encodeUtf8Base64 } from "@/lib/ai/poster";
import { toBriefInput } from "@/lib/ai/payload";
import { createCanvaDesign, pullCanvaDesign } from "@/lib/connect/canva";
import { canvaRemoteFromDesign } from "@/lib/connect/canva-format";
import { runPublishItem } from "@/lib/connect/publish-item";
import { searchDriveLive } from "@/lib/connect/sync";
import { emptyBrief, migrateBrief } from "@/lib/studio/brief";
import { getAssetBlob, hydrateSeedAsset, putAssetBlob } from "@/lib/studio/assets-idb";
import { persistGeneratedImage } from "@/lib/studio/raster";
import { blobFromBase64, bytesToBase64 } from "@/lib/studio/bytes";
import { formatById, FORMATS } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { parseEventDate, parseEventTime, guessEventName, defaultScheduleText } from "@/lib/zen/dates";
import { DEFAULT_AUDIENCE, academicBeat } from "@/lib/zen/context";
import { clubCreativeDna } from "@/lib/zen/dna";
import { learnFromIg } from "@/lib/zen/insights";
import { composeMemoryHint } from "@/lib/zen/memory-hook";
import { igMemoryFromSchedule } from "@/lib/zen/memory";
import { applyDirectionToPlan, ensureRewriteDiffers } from "@/lib/zen/direction";
import { researchInspiration } from "@/lib/zen/inspiration";
import { offsetDaysForConvertedKind, rhythmHint } from "@/lib/zen/rhythm";
import { searchCreative, groupCreativeHits, type CreativeHit } from "@/lib/zen/search";
import { pickSourceRefs, styleFromHits, visionFromHits } from "@/lib/zen/source-style";
import { ideaFromVision, tagsFromVision } from "@/lib/zen/vision-tags";
import {
  suggestWaves,
  eventKindFromText,
  waveLabel,
  contentKindForWave,
  waveVisualVariation,
  mergeCampaignWaves,
  scheduleItemsForWave,
  heroScheduleItem,
} from "@/lib/zen/schedule";
import type { WaveDraft } from "@/lib/ai/wave";
import type { CampaignPlan, CampaignWaveKind, ClubCampaign, ContentKind, CopyPack, StudentReview, VisualDirection } from "@/lib/studio/types";
import { HeroVisual } from "@/components/create/hero-visual";
import { ReelsBoard } from "@/components/create/reels-board";
import { WaveList } from "@/components/create/wave-list";
import { StudentReviewCard } from "@/components/create/student-review-card";
import { VisionCard } from "@/components/create/vision-card";
import { PhotoDrop } from "@/components/shared/photo-drop";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useStudio } from "@/stores/studio-store";

const KINDS: ContentKind[] = ["ig-post", "carousel", "story", "reels", "threads", "line"];

const VARIATIONS: { id: "composition" | "mood" | "background" | "style" | "text"; label: string }[] = [
  { id: "composition", label: "換構圖" },
  { id: "mood", label: "換氣氛" },
  { id: "background", label: "換背景" },
  { id: "style", label: "換風格" },
  { id: "text", label: "換文字空間" },
];

const MODE_HINT: Record<string, string> = {
  post: "會先寫 Hook、正文、CTA。",
  image: "會先給三個視覺方向，再生成圖。",
  story: "會產出 3–5 則限動。",
  carousel: "會走五到六頁輪播骨架。",
  reels: "會寫 0–20 秒腳本。",
  campaign: "會建立活動，再生成完整宣傳節奏。",
  idea: "從一句話長出整套網宣。",
  "from-image": "丟圖後會理解畫面，再生成文案與三個方向。",
  "from-drive": "會先搜歷屆 Drive，再生成完整宣傳。",
  "from-canva": "會先找歷屆 Canva 當風格，不要複製舊作品。",
  "from-ig": "會先讀自己的 IG 語氣，再寫下一篇。",
};

export function CreateStudio() {
  const search = useSearch({ strict: false }) as { mode?: string; idea?: string; asset?: string; campaign?: string };
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const hydrated = useStudio((s) => s.hydrated);
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const igMemory = useStudio((s) => s.igMemory);
  const remoteFiles = useStudio((s) => s.remoteFiles);
  const calendar = useStudio((s) => s.schedule);
  const createProject = useStudio((s) => s.createProject);
  const updateProject = useStudio((s) => s.updateProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const createCampaign = useStudio((s) => s.createCampaign);
  const updateCampaign = useStudio((s) => s.updateCampaign);
  const upsertSchedule = useStudio((s) => s.upsertSchedule);
  const publishSchedule = useStudio((s) => s.publishSchedule);
  const addAsset = useStudio((s) => s.addAsset);
  const upsertRemoteFiles = useStudio((s) => s.upsertRemoteFiles);
  const updateAsset = useStudio((s) => s.updateAsset);
  const brand = brands[0];
  const memoryHint = clubCreativeDna({ brand, igMemory, campaigns, assets }).promptBlock;
  const learning = useMemo(() => learnFromIg(igMemory), [igMemory]);
  const recentKinds = calendar.slice(-4).map((item) => item.kind);
  const urls = useAssetUrls(assets.map((a) => a.id));

  const [idea, setIdea] = useState(search.idea || "下週有一場茶會");
  const [eventName, setEventName] = useState(guessEventName(search.idea || "下週有一場茶會"));
  const [schedule, setSchedule] = useState(() => defaultScheduleText(search.idea || "下週有一場茶會"));
  const [location, setLocation] = useState("淡江大學淡水校園 · 禪學社");
  const [signupUrl, setSignupUrl] = useState("");
  const [studentPain, setStudentPain] = useState("開學後行程變滿，休息會心虛。");
  const [oneLiner, setOneLiner] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [packs, setPacks] = useState<CopyPack[]>([]);
  const [tone, setTone] = useState<CopyPack["tone"]>("student");
  const [directions, setDirections] = useState<VisualDirection[]>([]);
  const [review, setReview] = useState<StudentReview | null>(null);
  const [found, setFound] = useState<CreativeHit[]>([]);
  const [pinned, setPinned] = useState<CreativeHit[]>([]);
  const [pickedDirection, setPickedDirection] = useState<VisualDirection | null>(null);
  const [campaign, setCampaign] = useState<ClubCampaign | null>(null);
  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [waveLookIds, setWaveLookIds] = useState<Partial<Record<CampaignWaveKind, string>>>({});
  const research = useMemo(
    () =>
      researchInspiration({
        idea: `${idea} ${eventName}`,
        eventName,
        beat: academicBeat(),
        learning,
        sources: (pinned.length ? pinned : found).map((hit) => ({ source: hit.source, title: hit.title })),
      }),
    [idea, eventName, learning, found, pinned],
  );
  const [lastImage, setLastImage] = useState<{
    base64: string;
    mime: string;
    assetId?: string;
    headline?: string;
    directionName?: string;
  } | null>(null);
  const [lastCanva, setLastCanva] = useState<{ designId: string; editUrl: string; title: string } | null>(null);
  const [sourcePreview, setSourcePreview] = useState<{
    id: string;
    name: string;
    mime: string;
    base64: string;
  } | null>(null);
  const autoRan = useRef(false);
  const foundGroups = useMemo(() => groupCreativeHits(found), [found]);

  useEffect(() => {
    getCampaignAiStatus()
      .then(setStatus)
      .catch(() => setStatus(describeAdapter(false)));
  }, []);

  useEffect(() => {
    if (search.idea) setIdea(search.idea);
    const guessed = guessEventName(search.idea || "");
    if (guessed) setEventName(guessed);
    const existing =
      campaigns.find((c) => search.campaign && c.id === search.campaign) ??
      campaigns.find((c) => search.idea && (c.name === search.idea || c.oneLiner === search.idea));
    if (existing) {
      setCampaign(existing);
      setEventName(existing.name);
      setLocation(existing.location);
      setStudentPain(existing.studentPain || "開學後行程變滿，休息會心虛。");
      setSignupUrl(existing.signupUrl);
      setOneLiner(existing.oneLiner);
      setDescription(existing.description);
      setTheme(existing.theme);
      if (existing.date) setSchedule(`${existing.date.replaceAll("-", "/")} ${existing.time}`.trim());
      const looks = looksFromCampaign(existing);
      if (Object.keys(looks).length) setWaveLookIds((current) => ({ ...looks, ...current }));
    } else if (search.idea) {
      setSchedule(defaultScheduleText(search.idea));
    }
  }, [search.idea, search.campaign]);

  const activePack = packs.find((p) => p.tone === tone) ?? packs[0];
  const mode = search.mode || "idea";

  useEffect(() => {
    if (mode === "from-drive" || mode === "from-canva" || mode === "from-ig") {
      void gatherHits(idea || "茶會");
    }
  }, [mode]);

  useEffect(() => {
    if (!status || !brand || !hydrated || autoRan.current) return;
    if (mode === "from-image" && search.asset) {
      autoRan.current = true;
      void analyzeSourceAsset(search.asset);
      return;
    }
    if (mode === "from-image" && !search.idea) return;
    autoRan.current = true;
    void runKit(undefined, true);
  }, [status, brand, hydrated, mode, search.asset]);

  useEffect(() => {
    if (!lastImage) return;
    document.querySelector('[data-testid="hero-visual"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [lastImage]);

  async function gatherHits(query: string) {
    let remotes = remoteFiles;
    try {
      const live = await searchDriveLive({ data: { query: query.slice(0, 80) || "茶會" } });
      if (live.files.length) {
        upsertRemoteFiles(live.files);
        const map = new Map(remotes.map((row) => [row.id, row]));
        for (const file of live.files) map.set(file.id, file);
        remotes = [...map.values()];
      }
    } catch {
      /* keep local index */
    }
    const hits = searchCreative({ query, assets, projects, campaigns, igMemory, remoteFiles: remotes });
    setFound(hits.slice(0, 12));
    return hits;
  }

  function sourceNotes(hits: CreativeHit[]) {
    const refs = pinned.length ? pinned : pickSourceRefs(mode, hits);
    const picked = refs.length ? refs : hits.slice(0, 6);
    const sources = picked.map((h) => `${sourceLine(h)}/${h.title}`).join("、") || "品牌記憶";
    return `${sources}。${styleFromHits(picked)}`.slice(0, 400);
  }

  function togglePin(hit: CreativeHit) {
    const next = pinned.some((row) => row.id === hit.id) ? pinned.filter((row) => row.id !== hit.id) : [...pinned, hit];
    setPinned(next);
    void refreshDirections(next);
  }

  async function refreshDirections(refs: CreativeHit[]) {
    if (!idea.trim()) return;
    setBusy(true);
    try {
      const notes = (refs.length ? refs : found).map((hit) => `${sourceLine(hit)}/${hit.title}`).join("、");
      const result = await generateVisualDirections({
        data: {
          idea: `${idea}。參考：${notes || "品牌記憶"}`.slice(0, 400),
          eventName,
          memoryHint: composeMemoryHint([learning.promptBlock, memoryHint, research.promptBlock]),
          forceMock: !status?.available,
        },
      });
      if (!result.ok) return;
      setDirections(result.directions);
      toast.success("已依參考素材換三個方向");
    } finally {
      setBusy(false);
    }
  }

  async function swapWaveVisual(kind: CampaignWaveKind) {
    const dir = pickedDirection || directions[0];
    if (!dir) return;
    const asHero = kind === "hero";
    const assetId = await saveGeneratedImage(dir, { kind: waveVisualVariation(kind), silent: true, asHero });
    if (!assetId) return;
    setWaveLookIds((current) => ({ ...current, [kind]: assetId }));
    const currentCampaign = campaign;
    if (currentCampaign) {
      const waves = currentCampaign.waves.map((wave) =>
        wave.kind === kind ? { ...wave, imageAssetId: assetId } : wave,
      );
      updateCampaign(currentCampaign.id, {
        waves,
        imageAssetId: asHero ? assetId : currentCampaign.imageAssetId,
      });
      setCampaign({ ...currentCampaign, waves, imageAssetId: asHero ? assetId : currentCampaign.imageAssetId });
      for (const item of scheduleItemsForWave(useStudio.getState().schedule, currentCampaign.id, kind)) {
        upsertSchedule({ ...item, imageAssetId: assetId });
      }
    }
  }

  async function saveLocalWavePoster(dir: VisualDirection, kind: CampaignWaveKind) {
    const variation = waveVisualVariation(kind);
    const spec = formatById(toImageFormat(toCreateImageFormat(mode)));
    const payload = posterPayloadFromDirection(
      { ...dir, name: `${waveLabel(kind)} · ${dir.name}` },
      spec,
      variation,
    );
    const id = uid("asset");
    await putAssetBlob(id, blobFromBase64(payload.imageBase64, payload.mime));
    addAsset({
      id,
      name: `${waveLabel(kind)} · ${dir.name}`,
      kind: "image",
      category: "ai",
      mime: payload.mime,
      width: spec.width,
      height: spec.height,
      tags: ["AI 生成", waveLabel(kind), eventName || idea],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: "generated",
      licenseNotes: "來源：AI Generated",
      licenseOwner: "禪光",
      favorite: false,
      lastUsedAt: Date.now(),
      useCount: 0,
    });
    return id;
  }

  async function attachWaveLooks(created: ClubCampaign, dir: VisualDirection, heroId: string) {
    const pairs = await Promise.all(
      created.waves
        .filter((wave) => wave.kind !== "hero")
        .map(async (wave) => [wave.kind, await saveLocalWavePoster(dir, wave.kind)] as const),
    );
    const looks: Partial<Record<CampaignWaveKind, string>> = { hero: heroId };
    for (const [kind, assetId] of pairs) looks[kind] = assetId;
    const waves = created.waves.map((wave) => ({ ...wave, imageAssetId: looks[wave.kind] ?? heroId }));
    const assetIds = [...new Set(waves.map((wave) => wave.imageAssetId).filter((id): id is string => Boolean(id)))];
    updateCampaign(created.id, { waves, imageAssetId: heroId, assetIds });
    setCampaign({ ...created, waves, imageAssetId: heroId, assetIds });
    setWaveLookIds(looks);
    const rows = useStudio.getState().schedule;
    for (const wave of waves) {
      const assetId = looks[wave.kind];
      if (!assetId) continue;
      for (const item of scheduleItemsForWave(rows, created.id, wave.kind)) {
        upsertSchedule({ ...item, imageAssetId: assetId });
      }
    }
  }

  function applyWaveCopy(draft: WaveDraft) {
    setPacks((rows) =>
      rows.map((pack) => ({
        ...pack,
        hook: draft.hook,
        body: draft.body,
        cta: draft.cta,
      })),
    );
    setPlan((current) => (current ? { ...current, hook: draft.hook, body: draft.body, cta: draft.cta } : current));
    const currentCampaign = campaign;
    if (currentCampaign) {
      const caption = `${draft.hook}\n${draft.body}`.trim();
      const waves = currentCampaign.waves.map((wave) =>
        wave.kind === draft.kind ? { ...wave, caption, notes: draft.visualNote || wave.notes } : wave,
      );
      updateCampaign(currentCampaign.id, { waves, oneLiner: draft.kind === "hero" ? draft.hook : currentCampaign.oneLiner });
      setCampaign({
        ...currentCampaign,
        waves,
        oneLiner: draft.kind === "hero" ? draft.hook : currentCampaign.oneLiner,
      });
      for (const item of scheduleItemsForWave(useStudio.getState().schedule, currentCampaign.id, draft.kind)) {
        upsertSchedule({ ...item, caption, body: draft.body });
      }
    }
    toast.success(`已套用「${draft.title}」文案`);
  }

  async function runCopy() {
    setBusy(true);
    const hits = await gatherHits(idea);
    try {
      const result = await generateCopyPacks({
        data: {
          idea,
          eventName,
          schedule,
          location,
          memoryHint: composeMemoryHint([learning.promptBlock, memoryHint, research.promptBlock, `參考來源：${sourceNotes(hits)}`]),
          forceMock: !status?.available,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPacks(result.packs);
      setReview(ensureRewriteDiffers(result.review, result.packs[0]?.hook ?? ""));
      toast.success(result.adapter === "mock" ? "本機文案草案" : "文案已生成");
    } finally {
      setBusy(false);
    }
  }

  async function runKit(ideaOverride?: string, silent = false) {
    if (!brand) return;
    const workingIdea = ideaOverride ?? idea;
    const hits = await gatherHits(`${workingIdea} ${eventName}`);
    const refs = pinned.length ? pinned : pickSourceRefs(mode, hits);
    if (!pinned.length && refs.length) setPinned(refs);
    setBusy(true);
    try {
      const brief = migrateBrief({
        ...emptyBrief(),
        eventName: eventName || guessEventName(workingIdea) || workingIdea.slice(0, 20),
        product: eventName || guessEventName(workingIdea) || workingIdea.slice(0, 20),
        schedule,
        location,
        audience: DEFAULT_AUDIENCE,
        goal: "traffic",
        features: `${workingIdea}\n一句介紹：${oneLiner}\n學生痛點：${studentPain}\n主題：${theme}`.slice(0, 400),
        style: "生活感、夜晚、年輕",
        notes: `一人網宣。不要宗教語氣。${description ? `介紹：${description}。` : ""}參考來源：${sourceNotes(hits)}`.slice(0, 400),
        deliverables: { post: true, story: true, carousel: true, reels: true },
      });
      const result = await generateCampaignPlan({
        data: toBriefInput(brief, brand, {
          forceMock: !status?.available,
          memoryHint: composeMemoryHint([
            learning.promptBlock,
            memoryHint,
            research.promptBlock,
            `參考來源：${sourceNotes(hits)}`,
          ]),
        }),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPlan(result.plan);
      setPacks(result.plan.copyPacks ?? []);
      const dirs = result.plan.directions ?? [];
      setDirections(dirs);
      setReview(result.plan.studentReview ? ensureRewriteDiffers(result.plan.studentReview, result.plan.hook) : null);
      setPickedDirection(null);
      if (!silent) toast.success(result.adapter === "mock" ? "本機宣傳草案" : "已生成完整宣傳");
      if (dirs[0]) await saveGeneratedImage(dirs[0], { silent: true });
      setVision((current) => current ?? visionFromHits(refs.length ? refs : hits));
    } finally {
      setBusy(false);
    }
  }

  async function analyzeSourceAsset(assetId: string) {
    const meta = assets.find((item) => item.id === assetId);
    if (!meta) {
      toast.error("找不到這張素材。");
      await runKit(undefined, true);
      return;
    }
    setBusy(true);
    try {
      let blob = await getAssetBlob(assetId);
      if (!blob && meta.seedSrc) {
        try {
          await hydrateSeedAsset(assetId, meta.seedSrc);
          blob = await getAssetBlob(assetId);
        } catch {
          /* fetch below */
        }
      }
      if (!blob && meta.seedSrc) {
        const res = await fetch(meta.seedSrc);
        if (res.ok) blob = await res.blob();
      }
      if (!blob) {
        toast.error("這張圖還沒有檔案可分析。");
        await runKit(undefined, true);
        return;
      }
      const mime = blob.type || meta.mime || "image/jpeg";
      const buf = await blob.arrayBuffer();
      const b64 = bytesToBase64(new Uint8Array(buf));
      if (b64.length > 1_800_000) {
        toast.error("圖檔太大，請用較小的照片。");
        return;
      }
      setSourcePreview({ id: assetId, name: meta.name, mime, base64: b64 });
      const hit: CreativeHit = {
        id: `asset:${meta.id}`,
        source: meta.source === "generated" ? "generated" : "local",
        title: meta.name,
        subtitle: "來源素材",
        kind: "素材",
        score: 99,
        assetId: meta.id,
        thumbnail: meta.seedSrc,
      };
      setFound((rows) => (rows.some((row) => row.id === hit.id) ? rows : [hit, ...rows]));
      setPinned((rows) => (rows.some((row) => row.id === hit.id) ? rows : [hit, ...rows]));
      const result = await analyzeStudioImage({ data: { imageBase64: b64, mime } });
      if (!result.ok) {
        toast.error(result.error);
        await runKit(search.idea || idea, true);
        return;
      }
      setVision(result.analysis);
      updateAsset(assetId, { tags: tagsFromVision(result.analysis, meta.tags) });
      const nextIdea = ideaFromVision(result.analysis, search.idea || `延續「${meta.name}」的風格，做新的活動，不要複製舊作品。`);
      setIdea(nextIdea);
      toast.success("已理解這張圖，接著生成文案與方向");
      await runKit(nextIdea, true);
    } finally {
      setBusy(false);
    }
  }

  async function onImage(file: File) {
    setBusy(true);
    try {
      const id = uid("asset");
      await putAssetBlob(id, file);
      addAsset({
        id,
        name: file.name.replace(/\.[^.]+$/, "") || "上傳圖片",
        kind: "image",
        category: "photo",
        mime: file.type || "image/jpeg",
        width: 0,
        height: 0,
        tags: ["上傳"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: "upload",
        licenseNotes: "來源：本機上傳",
        licenseOwner: "禪光",
        favorite: false,
        lastUsedAt: Date.now(),
        useCount: 0,
      });
      const buf = await file.arrayBuffer();
      const b64 = bytesToBase64(new Uint8Array(buf));
      if (b64.length > 1_800_000) {
        toast.error("圖檔太大，請用較小的照片。");
        return;
      }
      setSourcePreview({ id, name: file.name.replace(/\.[^.]+$/, "") || "上傳圖片", mime: file.type || "image/jpeg", base64: b64 });
      const result = await analyzeStudioImage({ data: { imageBase64: b64, mime: file.type } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setVision(result.analysis);
      updateAsset(id, { tags: tagsFromVision(result.analysis, ["上傳"]) });
      const nextIdea = ideaFromVision(result.analysis, idea);
      setIdea(nextIdea);
      toast.success("已理解這張圖，接著生成文案與方向");
      await runKit(nextIdea, true);
    } finally {
      setBusy(false);
    }
  }

  async function runDirections() {
    setBusy(true);
    const hits = await gatherHits(idea);
    try {
      const result = await generateVisualDirections({
        data: {
          idea: `${idea}。參考：${sourceNotes(hits)}`.slice(0, 400),
          eventName,
          memoryHint: composeMemoryHint([learning.promptBlock, memoryHint, research.promptBlock]),
          forceMock: !status?.available,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDirections(result.directions);
    } finally {
      setBusy(false);
    }
  }

  async function saveGeneratedImage(
    dir: VisualDirection,
    opts?: { kind?: (typeof VARIATIONS)[number]["id"]; format?: string; silent?: boolean; asHero?: boolean },
  ) {
    const format = toImageFormat(opts?.format ?? toCreateImageFormat(mode));
    const spec = formatById(format);
    const prompt = opts?.kind ? varyImagePrompt(dir.prompt, opts.kind) : dir.prompt;
    let payload: { imageBase64: string; mime: string } = posterPayloadFromDirection(
      dir,
      spec,
      opts?.kind,
      prompt,
    );
    try {
      const result = await generateStudioImage({
        data: {
          prompt,
          format,
          headline: dir.headline,
          subhead: dir.subhead,
          palette: dir.palette,
          name: dir.name,
          variation: opts?.kind,
          memoryHint: composeMemoryHint([learning.promptBlock, memoryHint, research.promptBlock]),
        },
      });
      if (result.ok) payload = { imageBase64: result.imageBase64, mime: result.mime };
    } catch {
      /* keep the student-hook poster so 主視覺 still appears */
    }
    let png: { blob: Blob; mime: string; base64: string };
    try {
      png = await persistGeneratedImage({
        base64: payload.imageBase64,
        mime: payload.mime,
        width: spec.width,
        height: spec.height,
      });
    } catch {
      png = {
        blob: blobFromBase64(payload.imageBase64, payload.mime),
        mime: payload.mime,
        base64: payload.imageBase64,
      };
    }
    const id = uid("asset");
    await putAssetBlob(id, png.blob);
    addAsset({
      id,
      name: [dir.name, opts?.kind ? VARIATIONS.find((item) => item.id === opts.kind)?.label : null, spec.short]
        .filter(Boolean)
        .join(" · "),
      kind: "image",
      category: "ai",
      mime: png.mime,
      width: spec.width,
      height: spec.height,
      tags: ["AI 生成", eventName || idea],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: "generated",
      licenseNotes: "來源：AI Generated",
      licenseOwner: "禪光",
      favorite: false,
      lastUsedAt: Date.now(),
      useCount: 0,
    });
    if (opts?.asHero !== false) {
      setLastImage({ base64: png.base64, mime: png.mime, assetId: id, headline: dir.headline, directionName: dir.name });
    }
    if (!opts?.silent) toast.success("圖片已進素材庫（AI Generated）");
    return id;
  }

  async function generateFromDirection(
    dir: VisualDirection,
    kind?: (typeof VARIATIONS)[number]["id"],
    format?: string,
  ) {
    setBusy(true);
    try {
      await saveGeneratedImage(dir, { kind, format });
    } finally {
      setBusy(false);
    }
  }

  function applyToCanvas(nextPlan = plan, navigateAfter = true, imageAssetId = lastImage?.assetId) {
    if (!brand || !nextPlan) return null;
    const brief = migrateBrief({
      ...emptyBrief(),
      eventName: nextPlan.campaignName,
      product: nextPlan.campaignName,
      schedule,
      location,
      audience: DEFAULT_AUDIENCE,
      goal: "traffic",
      features: idea,
      deliverables: { post: true, story: true, carousel: true, reels: true },
    });
    const project = createProject({
      name: nextPlan.campaignName,
      brandId: brand.id,
      formatId: mode === "story" ? "story" : mode === "reels" ? "reels-cover" : "feed-portrait",
      brief,
      templateId: nextPlan.templateId,
      campaignId: campaign?.id,
      contentKind: mode === "story" ? "story" : mode === "reels" ? "reels" : "carousel",
      imageAssetId,
    });
    applyCampaignPlan(project.id, nextPlan, brief);
    if (navigateAfter) void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
    return project;
  }

  function saveCampaignAndWaves(
    nextPlan = plan,
    assetId = lastImage?.assetId,
    projectId: string | null = null,
    opts?: { silent?: boolean },
  ) {
    const name = eventName.trim() || guessEventName(`${idea} ${nextPlan?.campaignName ?? ""}`) || nextPlan?.campaignName || "未命名活動";
    const date = parseEventDate(`${schedule} ${idea}`);
    const type = eventKindFromText(`${name} ${idea}`);
    const existing =
      (search.campaign ? campaigns.find((row) => row.id === search.campaign) : undefined) ??
      campaigns.find((row) => row.name === name && row.date === date) ??
      (campaign && campaign.name === name ? campaign : undefined);
    const fresh = suggestWaves({ date, type, name }, new Date(), { recentKinds });
    const waves = mergeCampaignWaves(existing?.waves, fresh).map((wave) => ({
      ...wave,
      imageAssetId: wave.imageAssetId ?? assetId,
      projectId: projectId ?? wave.projectId,
    }));
    const patch = {
      name,
      type,
      date,
      time: parseEventTime(schedule),
      location,
      oneLiner: oneLiner || nextPlan?.hook || idea,
      description: description || nextPlan?.concept || "",
      theme: theme || nextPlan?.visualTheme || "",
      studentPain,
      cta: nextPlan?.cta || "來坐一下",
      signupUrl,
      waves,
      imageAssetId: assetId ?? existing?.imageAssetId ?? null,
      canvaDesignId: lastCanva?.designId ?? existing?.canvaDesignId,
      canvaEditUrl: lastCanva?.editUrl ?? existing?.canvaEditUrl,
    };
    let created: ClubCampaign;
    if (existing) {
      updateCampaign(existing.id, patch);
      created = { ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: Date.now() };
    } else {
      created = createCampaign(patch);
    }
    for (const wave of waves) {
      if (!wave.scheduledAt) continue;
      upsertSchedule({
        id: wave.id,
        projectId,
        campaignId: created.id,
        kind: contentKindForWave(wave.kind),
        title: wave.title,
        scheduledAt: wave.scheduledAt,
        publishedAt: null,
        status: "scheduled",
        caption: wave.caption || oneLiner || nextPlan?.hook || idea,
        body: description || nextPlan?.body,
        hashtags: nextPlan?.hashtags,
        imageAssetId: wave.imageAssetId ?? assetId,
        ...(wave.kind === "hero" && lastCanva
          ? { canvaDesignId: lastCanva.designId, canvaEditUrl: lastCanva.editUrl }
          : {}),
      });
    }
    setCampaign(created);
    if (!opts?.silent) {
      toast.success("活動與節奏已進月曆");
      toast.message(rhythmHint(recentKinds));
    }
    return created;
  }

  function scheduleConverted(nextPlan: CampaignPlan, created: ClubCampaign, projectId: string | null = null, assetId = lastImage?.assetId) {
    const date = parseEventDate(`${schedule} ${idea}`);
    const when = Date.parse(`${date}T19:00:00+08:00`);
    for (const pack of KINDS.map((kind) => convertPlan(nextPlan, kind))) {
      const scheduledAt = Number.isNaN(when) ? Date.now() : when + offsetDaysForConvertedKind(pack.kind) * 86_400_000;
      upsertSchedule({
        id: uid("sch"),
        projectId,
        campaignId: created.id,
        kind: pack.kind,
        title: `${pack.title} · ${eventName || nextPlan.campaignName || idea.slice(0, 12)}`,
        scheduledAt,
        publishedAt: null,
        status: "scheduled",
        caption: packCaption(nextPlan, pack),
        body: pack.items.join("\n"),
        hashtags: nextPlan.hashtags,
        imageAssetId: assetId,
        mediaUrl: undefined,
      });
    }
  }

  function scheduleAllFormats() {
    if (!plan) return;
    const created = saveCampaignAndWaves(plan);
    scheduleConverted(plan, created);
    toast.success("IG／Story／Reels／Threads 已依節奏排進月曆");
  }

  async function publishHero() {
    if (!campaign) return;
    const item = heroScheduleItem(useStudio.getState().schedule, campaign.id);
    if (!item) {
      toast.error("還沒有主視覺排程，可先選一個方向。");
      return;
    }
    setBusy(true);
    try {
      const result = await runPublishItem(item);
      toast.message(result.note);
      if (result.marked) {
        publishSchedule(item.id, result.extra);
        const memory = igMemoryFromSchedule({
          ...item,
          status: "published",
          publishedAt: Date.now(),
          permalink: result.extra?.permalink ?? item.permalink,
          mediaUrl: result.extra?.mediaUrl ?? item.mediaUrl,
          igMediaId: result.extra?.igMediaId ?? item.igMediaId,
        });
        toast.success("已寫進過去 IG。可在 Feed 標記學生會不會停。");
        void navigate({ to: "/ig", search: { posted: memory.id } });
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendToCanva() {
    if (!plan) return;
    setBusy(true);
    try {
      const result = await createCanvaDesign({
        data: {
          title: plan.campaignName,
          hook: plan.hook,
          body: activePack?.body || plan.body,
          cta: plan.cta,
          format: mode === "story" ? "story" : mode === "reels" ? "reels-cover" : "feed-portrait",
          palette: plan.colorMood,
          composition: pickedDirection?.composition,
          headline: pickedDirection?.headline || plan.headline,
          imageBase64: lastImage?.base64,
          mime: lastImage?.mime,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await navigator.clipboard.writeText(result.brief).catch(() => undefined);
      window.open(result.editUrl, "_blank", "noopener,noreferrer");
      if (result.connected && result.designId) {
        rememberCanva({ designId: result.designId, editUrl: result.editUrl, title: result.title });
      }
      toast.success(result.note);
    } finally {
      setBusy(false);
    }
  }

  function rememberCanva(next: { designId: string; editUrl: string; title: string }) {
    setLastCanva(next);
    upsertRemoteFiles([canvaRemoteFromDesign(next)]);
    if (campaign) {
      updateCampaign(campaign.id, { canvaDesignId: next.designId, canvaEditUrl: next.editUrl });
      setCampaign({ ...campaign, canvaDesignId: next.designId, canvaEditUrl: next.editUrl });
      for (const item of scheduleItemsForWave(useStudio.getState().schedule, campaign.id, "hero")) {
        upsertSchedule({ ...item, canvaDesignId: next.designId, canvaEditUrl: next.editUrl });
      }
    }
  }

  async function pullFromCanva() {
    const designId = lastCanva?.designId || campaign?.canvaDesignId;
    if (!designId) {
      toast.error("先送進 Canva 微調，再拉回主視覺。");
      return;
    }
    setBusy(true);
    try {
      const result = await pullCanvaDesign({
        data: {
          designId,
          format: mode === "story" ? "story" : mode === "reels" ? "reels-cover" : "feed-portrait",
          title: plan?.campaignName || eventName || "茶會",
        },
      });
      if (!result.ok) {
        toast.error(result.note);
        return;
      }
      if (result.imageBase64) {
        const png = await persistGeneratedImage({
          base64: result.imageBase64,
          mime: result.mime,
          width: 1080,
          height: 1350,
        });
        const id = uid("asset");
        await putAssetBlob(id, png.blob);
        addAsset({
          id,
          name: `Canva · ${plan?.campaignName || eventName || "茶會"}`,
          kind: "image",
          category: "poster",
          mime: png.mime,
          width: 1080,
          height: 1350,
          tags: ["Canva", eventName || "茶會"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          source: "canva",
          licenseNotes: `來源：Canva / ${plan?.campaignName || eventName || "茶會"}`,
          licenseOwner: "禪光",
          favorite: false,
          lastUsedAt: Date.now(),
          useCount: 0,
        });
        setLastImage({
          base64: png.base64,
          mime: png.mime,
          assetId: id,
          headline: pickedDirection?.headline || plan?.hook,
          directionName: pickedDirection?.name,
        });
        if (campaign) {
          updateCampaign(campaign.id, { imageAssetId: id });
          setCampaign({ ...campaign, imageAssetId: id });
          for (const item of scheduleItemsForWave(useStudio.getState().schedule, campaign.id, "hero")) {
            upsertSchedule({
              ...item,
              imageAssetId: id,
              mediaUrl: result.imageUrl,
              canvaDesignId: designId,
              canvaEditUrl: lastCanva?.editUrl || campaign.canvaEditUrl,
            });
          }
        }
      }
      toast.success(result.note);
    } finally {
      setBusy(false);
    }
  }

  function adoptDirection(dir: VisualDirection, silent = false) {
    setPickedDirection(dir);
    setPlan((current) => (current ? applyDirectionToPlan(current, dir) : current));
    setPacks((rows) =>
      rows.map((pack) => ({
        ...pack,
        hook: /[？?]/.test(dir.headline) ? dir.headline : pack.hook,
      })),
    );
    if (!silent) toast.success(`已選「${dir.name}」，文案與視覺會跟著走`);
  }

  async function realizeDirection(dir: VisualDirection) {
    if (!plan) return;
    const next = applyDirectionToPlan(plan, dir);
    adoptDirection(dir, true);
    setPlan(next);
    setBusy(true);
    try {
      const imageId =
        lastImage?.assetId && lastImage.directionName === dir.name
          ? lastImage.assetId
          : ((await saveGeneratedImage(dir, { silent: true })) ?? lastImage?.assetId);
      const project = applyToCanvas(next, false, imageId);
      const created = saveCampaignAndWaves(next, imageId, project?.id ?? null, { silent: true });
      if (project) updateProject(project.id, { campaignId: created.id });
      scheduleConverted(next, created, project?.id ?? null, imageId);
      if (imageId) {
        await attachWaveLooks(created, dir, imageId);
      }
      toast.success("已用這個方向做出整套：主視覺、文案、各平台、月曆");
      requestAnimationFrame(() => {
        document.querySelector('[data-testid="kit-ready"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } finally {
      setBusy(false);
    }
  }

  function schedulePack(pack: ConvertedPack) {
    const date = parseEventDate(`${schedule} ${idea}`);
    const when = Date.parse(`${date}T19:00:00+08:00`);
    const scheduledAt = Number.isNaN(when)
      ? Date.now()
      : when + offsetDaysForConvertedKind(pack.kind) * 86_400_000;
    upsertSchedule({
      id: uid("sch"),
      projectId: null,
      campaignId: campaign?.id ?? null,
      kind: pack.kind,
      title: `${pack.title} · ${eventName || plan?.campaignName || idea.slice(0, 12)}`,
      scheduledAt,
      publishedAt: null,
      status: "scheduled",
      caption: plan ? packCaption(plan, pack) : pack.items.join("\n"),
      body: pack.items.join("\n"),
      hashtags: plan?.hashtags,
      imageAssetId: lastImage?.assetId,
    });
    toast.success(`${pack.title}已進月曆`);
    toast.message(rhythmHint([...recentKinds, pack.kind]));
  }

  const converted = useMemo(() => {
    if (!plan) return [];
    return KINDS.map((kind) => convertPlan(plan, kind));
  }, [plan]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-36 md:px-8 md:py-10 lg:pb-10">
      <PageHeader
        kicker="AI 創作"
        title="從一句話開始"
        description="前台只顯示找到什麼、生成什麼、下一步。沒有 Agent 管理器。"
      />

      <div className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <p className="text-xs text-muted">
          {status?.label ?? "確認創作服務中"} · {MODE_HINT[mode] ?? MODE_HINT.idea}
        </p>
        <p className="mt-2 text-xs text-muted">
          這次會參考過去 IG：「{learning.bestHookShape}」。{learning.avoid}
        </p>
        <Label className="mt-4">你想做什麼</Label>
        <Textarea className="mt-2" value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} />
        <div className="mt-3">
          <p className="text-sm font-medium">或從一張圖開始</p>
          <PhotoDrop disabled={busy} onFile={(file) => void onImage(file)} />
          {sourcePreview ? (
            <figure
              className="mt-3 flex items-center gap-3 rounded-2xl bg-bg p-3"
              data-testid="source-visual"
            >
              <img
                src={`data:${sourcePreview.mime};base64,${sourcePreview.base64}`}
                alt={sourcePreview.name}
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <figcaption className="min-w-0 text-xs text-muted">
                來源素材 · {sourcePreview.name}。會理解畫面再延續，不複製舊作品。
              </figcaption>
            </figure>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="活動名">
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="浮游禪光、茶會…" />
          </Field>
          <Field label="時間">
            <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} />
          </Field>
          <Field label="地點">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="一句活動介紹">
            <Input value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} placeholder="最近是不是很久沒有好好坐下來？" />
          </Field>
          <Field label="活動主題">
            <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="光、坐下來、朋友…" />
          </Field>
          <Field label="學生痛點">
            <Input value={studentPain} onChange={(e) => setStudentPain(e.target.value)} />
          </Field>
          <Field label="報名連結（可空）">
            <Input value={signupUrl} onChange={(e) => setSignupUrl(e.target.value)} placeholder="https://" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="完整介紹">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button disabled={busy} onClick={() => void runKit()}>
            AI 生成完整宣傳
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void runCopy()}>
            只生文案
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void runDirections()}>
            三個視覺方向
          </Button>
          {mode === "image" ? (
            <Button variant="secondary" onClick={() => void navigate({ to: "/image" })}>
              打開 Image Studio
            </Button>
          ) : null}
        </div>
      </div>

      <section className="mt-8" data-testid="inspiration-research">
        <h2 className="text-sm font-medium">這次抽象自：{research.cards[0]?.title}</h2>
        <p className="mt-1 text-xs text-muted">
          研究構圖、配色、排版、Hook、形式，再轉成淡江禪學社。不是抄別人。{research.fromOwnIg}
          {research.foundSources.length
            ? ` 已參考 ${research.foundSources.map((row) => row.title).slice(0, 3).join("、")}。`
            : ""}
        </p>
        <ul className="mt-3 grid gap-2">
          {research.cards.slice(0, 3).map((card) => (
            <li key={card.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">{card.title}</p>
              <p className="mt-1 text-xs text-muted">
                {card.composition} · {card.palette} · Hook {card.hookShape}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {vision ? (
        <VisionCard vision={vision}>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => void runKit()}>
              延續這個風格
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !plan}
              onClick={() => plan && schedulePack(convertPlan(plan, "story"))}
            >
              做成限動
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !plan}
              onClick={() => plan && schedulePack(convertPlan(plan, "carousel"))}
            >
              做成 Carousel
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !plan}
              onClick={() => plan && schedulePack(convertPlan(plan, "reels"))}
            >
              做成 Reels Cover
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void runDirections()}>
              生成相似視覺
            </Button>
          </div>
        </VisionCard>
      ) : null}

      {lastImage ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">主視覺</h2>
          <p className="mt-1 text-xs text-muted">
            {pickedDirection?.name || lastImage.directionName || "這次方向"} · 來源：AI Generated
          </p>
          <div className="mt-3">
            <HeroVisual
              base64={lastImage.base64}
              mime={lastImage.mime}
              headline={lastImage.headline || pickedDirection?.headline}
            />
          </div>
        </section>
      ) : null}

      {directions.length ? (
        <section className="mt-8" data-testid="direction-list">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">根據過去內容生成 {directions.length} 個方向</h2>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void runDirections()}>
              換三個方向
            </Button>
          </div>
          {found.length ? (
            <p className="mt-2 text-xs text-muted">
              找到 {found.length} 個相關素材
              {Object.entries(foundGroups)
                .map(([source, list]) => ` · ${sourceLabelOf(source)} ${list.length}`)
                .join("")}
            </p>
          ) : null}
          <ul className="mt-3 grid gap-3">
            {directions.map((dir, index) => (
              <li key={dir.id || dir.name} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="font-medium">{dir.name}</p>
                <p className="mt-1 text-sm text-muted">{dir.concept}</p>
                <p className="mt-2 text-xs text-muted">{dir.palette} · {dir.composition}</p>
                <p className="mt-1 text-sm">{dir.headline} · {dir.subhead}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={pickedDirection?.name === dir.name ? "default" : "secondary"}
                    data-testid={index === 0 ? "realize-direction" : undefined}
                    onClick={() => void realizeDirection(dir)}
                  >
                    {pickedDirection?.name === dir.name ? "已做出這套" : "用這個方向做出整套"}
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => void generateFromDirection(dir)}>
                    生成圖片
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => void generateFromDirection(dir)}>
                    重新生成
                  </Button>
                  {VARIATIONS.map((item) => (
                    <Button
                      key={item.id}
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void generateFromDirection(dir, item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
                  {FORMATS.filter((item) => item.id !== "feed-landscape").map((item) => (
                    <Button
                      key={`ext-${item.id}`}
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void generateFromDirection(dir, undefined, item.id)}
                    >
                      延伸 {item.short}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {packs.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">IG Copy</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {packs.map((pack) => (
              <Button key={pack.tone} size="sm" variant={tone === pack.tone ? "default" : "secondary"} onClick={() => setTone(pack.tone)}>
                {toneLabel(pack.tone)}
              </Button>
            ))}
          </div>
          {activePack ? (
            <article className="mt-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="font-display text-xl">{activePack.hook}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{activePack.body}</p>
              <p className="mt-3 text-sm">{activePack.cta}</p>
              <p className="mt-2 text-xs text-muted">{activePack.hashtags.join(" ")}</p>
            </article>
          ) : null}
        </section>
      ) : null}

      {review ? (
        <StudentReviewCard
          review={review}
          onApplyHook={(hook) => {
            setPacks((rows) =>
              rows.map((pack) => ({
                ...pack,
                hook,
                body: pack.body.replace(pack.hook, hook),
              })),
            );
            setPlan((current) => (current ? { ...current, hook } : current));
            if (campaign) {
              updateCampaign(campaign.id, { oneLiner: hook });
              setCampaign({ ...campaign, oneLiner: hook });
              for (const item of scheduleItemsForWave(useStudio.getState().schedule, campaign.id, "hero")) {
                upsertSchedule({ ...item, caption: hook });
              }
            }
            toast.success("已套用學生視角 Hook");
          }}
        />
      ) : null}

      {plan ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">一鍵轉換</h2>
          <div className="mt-3 space-y-3">
            {converted.map((pack) => (
              <article key={pack.kind} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-sm font-medium">{pack.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {pack.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Button className="mt-3" size="sm" variant="secondary" onClick={() => schedulePack(pack)}>
                  排入這則
                </Button>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => applyToCanvas(plan, true)}>套用到畫布</Button>
            <Button variant="secondary" onClick={() => saveCampaignAndWaves()}>
              排入 Calendar
            </Button>
            <Button variant="secondary" onClick={scheduleAllFormats}>
              各平台都排進月曆
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void sendToCanva()}>
              送進 Canva
            </Button>
            <Button variant="secondary" onClick={() => void navigate({ to: "/ig" })}>
              IG Preview
            </Button>
          </div>
          {campaign ? (
            <div className="mt-4 rounded-2xl bg-accent/15 p-4" data-testid="kit-ready">
              <p className="text-sm font-medium">下一步</p>
              <p className="mt-1 text-xs text-muted">
                一人走完：Canva 微調 → 拉回主視覺 → IG Preview → 月曆 → 發布。
              </p>
              <p className="mt-3 font-display text-lg leading-snug" data-testid="kit-hook">
                {plan.hook}
              </p>
              <p className="mt-3 text-xs text-muted">
                已建立 {campaign.name}，節奏含 {campaign.waves.map((w) => waveLabel(w.kind)).join("、") || "預熱到回顧"}。
              </p>
              {lastCanva || campaign.canvaEditUrl ? (
                <p className="mt-2 text-xs text-muted" data-testid="canva-source">
                  來源：Canva / {lastCanva?.title || campaign.name}
                  {lastCanva?.editUrl || campaign.canvaEditUrl ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={lastCanva?.editUrl || campaign.canvaEditUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        開 Canva
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} data-testid="send-to-canva" onClick={() => void sendToCanva()}>
                  送進 Canva
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} data-testid="pull-from-canva" onClick={() => void pullFromCanva()}>
                  拉回主視覺
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/ig" })}>
                  IG Preview
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void navigate({ to: "/calendar" })}>
                  看月曆
                </Button>
                <Button size="sm" disabled={busy} data-testid="publish-hero" onClick={() => void publishHero()}>
                  發布主視覺
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {plan?.reelsScript ? (
        <ReelsBoard script={plan.reelsScript} eventName={eventName || plan.campaignName} onSchedule={() => saveCampaignAndWaves()} />
      ) : null}

      {campaign?.waves.length ? (
        <WaveList
          waves={campaign.waves}
          name={campaign.name}
          schedule={schedule}
          location={location}
          idea={idea}
          memoryHint={composeMemoryHint([learning.promptBlock, memoryHint])}
          looks={Object.fromEntries(
            (Object.entries(waveLookIds) as Array<[CampaignWaveKind, string]>).flatMap(([kind, assetId]) => {
              const src = urls[assetId];
              return src ? [[kind, src]] : [];
            }),
          )}
          onSwapVisual={(kind) => swapWaveVisual(kind)}
          onApplyDraft={applyWaveCopy}
        />
      ) : null}

      {found.length ? (
        <section className="mt-8" data-testid="found-sources">
          <h2 className="text-sm font-medium">找到 {found.length} 個相關素材</h2>
          <p className="mt-1 text-xs text-muted">
            可釘選給 AI 當風格參考。來源會標出來。
            {Object.entries(foundGroups)
              .map(([source, list]) => `${sourceLabelOf(source)} ${list.length}`)
              .join(" · ")}
          </p>
          {Object.entries(foundGroups).map(([source, list]) => (
            <div key={source} className="mt-3">
              <h3 className="text-xs tracking-[0.14em] text-muted uppercase">{sourceLabelOf(source)}</h3>
              <ul className="mt-2 space-y-2">
                {list.map((hit) => {
                  const pinnedHit = pinned.some((row) => row.id === hit.id);
                  const thumb = hit.thumbnail || (hit.assetId ? urls[hit.assetId] : undefined);
                  return (
                    <li key={hit.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface px-3 py-2 text-sm shadow-[var(--shadow-border)]">
                      {thumb ? (
                        <img src={thumb} alt="" data-testid="found-thumb" className="size-12 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="size-12 shrink-0 rounded-xl bg-surface-2" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{hit.title}</p>
                        <p className="mt-1 truncate text-xs text-muted">
                          {sourceLine(hit)} · {hit.subtitle}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={pinnedHit ? "default" : "secondary"}
                        data-testid={hit.source === "canva" ? "pin-canva" : undefined}
                        onClick={() => togglePin(hit)}
                      >
                        {pinnedHit ? "已參考" : "加入參考"}
                      </Button>
                      {hit.url ? (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={hit.url} target="_blank" rel="noreferrer">
                            開啟
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={hit.source === "canva" ? "extend-canva" : undefined}
                        onClick={() => {
                          if (!pinnedHit) togglePin(hit);
                          const nextIdea = `${idea}。延續「${hit.title}」的品牌 DNA，做新的活動，不要複製舊作品。`;
                          setIdea(nextIdea);
                          void runKit(nextIdea);
                        }}
                      >
                        延伸新設計
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <p className="mt-8 text-xs text-subtle">來源會標成 Google Drive / Canva / Instagram / AI Generated。沒連接時先用品牌記憶與本機素材。</p>
    </main>
  );
}

function toCreateImageFormat(mode: string) {
  if (mode === "story") return "story" as const;
  if (mode === "reels") return "reels-cover" as const;
  return "feed-portrait" as const;
}

function posterPayloadFromDirection(
  dir: VisualDirection,
  spec: { width: number; height: number },
  variation?: "composition" | "mood" | "background" | "style" | "text",
  prompt = dir.prompt,
) {
  const svg = directionPosterSvg({
    headline: dir.headline,
    subhead: dir.subhead,
    concept: dir.concept,
    palette: dir.palette,
    name: dir.name,
    width: spec.width,
    height: spec.height,
    variation,
  });
  return {
    imageBase64: encodeUtf8Base64(svg),
    mime: "image/svg+xml" as const,
    prompt,
  };
}

function sourceLine(hit: CreativeHit) {
  return sourceLabelOf(hit.source);
}

function sourceLabelOf(source: string) {
  if (source === "drive") return "Google Drive";
  if (source === "canva") return "Canva";
  if (source === "instagram") return "Instagram";
  if (source === "generated") return "AI Generated";
  return "本機／品牌記憶";
}

function looksFromCampaign(created: ClubCampaign): Partial<Record<CampaignWaveKind, string>> {
  const looks: Partial<Record<CampaignWaveKind, string>> = {};
  for (const wave of created.waves) {
    if (wave.imageAssetId) looks[wave.kind] = wave.imageAssetId;
  }
  return looks;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function toneLabel(tone: CopyPack["tone"]) {
  return {
    short: "短版",
    normal: "一般版",
    emotional: "感性版",
    student: "學生版",
    life: "生活版",
    humor: "幽默版",
  }[tone];
}
