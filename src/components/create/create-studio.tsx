import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { convertPlan, type ConvertedPack } from "@/lib/ai/convert";
import { generateCampaignPlan, getCampaignAiStatus, describeAdapter, type AiStatus } from "@/lib/ai/campaign";
import { generateCopyPacks } from "@/lib/ai/copy-studio";
import { analyzeStudioImage, generateStudioImage, generateVisualDirections, type VisionAnalysis } from "@/lib/ai/image-studio";
import { toBriefInput } from "@/lib/ai/payload";
import { createCanvaDesign } from "@/lib/connect/canva";
import { searchDriveLive } from "@/lib/connect/sync";
import { emptyBrief, migrateBrief } from "@/lib/studio/brief";
import { putAssetBlob } from "@/lib/studio/assets-idb";
import { blobFromBase64, bytesToBase64 } from "@/lib/studio/bytes";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { parseEventDate, parseEventTime, guessEventName } from "@/lib/zen/dates";
import { DEFAULT_AUDIENCE } from "@/lib/zen/context";
import { clubCreativeDna } from "@/lib/zen/dna";
import { applyDirectionToPlan, ensureRewriteDiffers } from "@/lib/zen/direction";
import { offsetDaysForConvertedKind, rhythmHint } from "@/lib/zen/rhythm";
import { searchCreative, type CreativeHit } from "@/lib/zen/search";
import { pickSourceRefs, styleFromHits } from "@/lib/zen/source-style";
import { ideaFromVision, tagsFromVision } from "@/lib/zen/vision-tags";
import { suggestWaves, eventKindFromText, waveLabel, contentKindForWave } from "@/lib/zen/schedule";
import type { CampaignPlan, ClubCampaign, ContentKind, CopyPack, StudentReview, VisualDirection } from "@/lib/studio/types";
import { ReelsBoard } from "@/components/create/reels-board";
import { WaveList } from "@/components/create/wave-list";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { useStudio } from "@/stores/studio-store";

const KINDS: ContentKind[] = ["ig-post", "carousel", "story", "reels", "threads", "line"];

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
  const search = useSearch({ strict: false }) as { mode?: string; idea?: string };
  const navigate = useNavigate();
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const igMemory = useStudio((s) => s.igMemory);
  const remoteFiles = useStudio((s) => s.remoteFiles);
  const calendar = useStudio((s) => s.schedule);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const createCampaign = useStudio((s) => s.createCampaign);
  const upsertSchedule = useStudio((s) => s.upsertSchedule);
  const addAsset = useStudio((s) => s.addAsset);
  const upsertRemoteFiles = useStudio((s) => s.upsertRemoteFiles);
  const updateAsset = useStudio((s) => s.updateAsset);
  const brand = brands[0];
  const memoryHint = clubCreativeDna({ brand, igMemory, campaigns, assets }).promptBlock;
  const recentKinds = calendar.slice(-4).map((item) => item.kind);

  const [idea, setIdea] = useState(search.idea || "下週有一場茶會");
  const [eventName, setEventName] = useState(guessEventName(search.idea || ""));
  const [schedule, setSchedule] = useState("2026/09/24 19:00");
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
  const autoRan = useRef(false);

  useEffect(() => {
    getCampaignAiStatus()
      .then(setStatus)
      .catch(() => setStatus(describeAdapter(false)));
  }, []);

  useEffect(() => {
    if (search.idea) setIdea(search.idea);
    const guessed = guessEventName(search.idea || "");
    if (guessed) setEventName(guessed);
    const existing = campaigns.find((c) => search.idea && (c.name === search.idea || c.oneLiner === search.idea));
    if (existing) {
      setEventName(existing.name);
      setLocation(existing.location);
      setStudentPain(existing.studentPain || "開學後行程變滿，休息會心虛。");
      setSignupUrl(existing.signupUrl);
      setOneLiner(existing.oneLiner);
      setDescription(existing.description);
      setTheme(existing.theme);
      if (existing.date) setSchedule(`${existing.date.replaceAll("-", "/")} ${existing.time}`.trim());
    }
  }, [search.idea]);

  const activePack = packs.find((p) => p.tone === tone) ?? packs[0];
  const mode = search.mode || "idea";

  useEffect(() => {
    if (mode === "from-drive" || mode === "from-canva" || mode === "from-ig") {
      void gatherHits(idea || "茶會");
    }
  }, [mode]);

  useEffect(() => {
    if (!status || !brand || autoRan.current) return;
    const should =
      mode === "from-drive" ||
      mode === "from-canva" ||
      mode === "from-ig" ||
      (Boolean(search.idea) &&
        (mode === "carousel" || mode === "campaign" || mode === "idea" || mode === "from-image"));
    if (!should) return;
    autoRan.current = true;
    void runKit();
  }, [status, brand]);

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
    setPinned((rows) => (rows.some((row) => row.id === hit.id) ? rows.filter((row) => row.id !== hit.id) : [...rows, hit]));
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
          memoryHint: `${memoryHint}\n參考來源：${sourceNotes(hits)}`.slice(0, 800),
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

  async function runKit(ideaOverride?: string) {
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
        data: toBriefInput(brief, brand, { forceMock: !status?.available, memoryHint }),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setPlan(result.plan);
      setPacks(result.plan.copyPacks ?? []);
      setDirections(result.plan.directions ?? []);
      setReview(result.plan.studentReview ? ensureRewriteDiffers(result.plan.studentReview, result.plan.hook) : null);
      setPickedDirection(null);
      toast.success(result.adapter === "mock" ? "本機宣傳草案" : "已生成完整宣傳");
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
      await runKit(nextIdea);
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

  async function generateFromDirection(dir: VisualDirection) {
    setBusy(true);
    try {
      const format = toCreateImageFormat(mode);
      const result = await generateStudioImage({ data: { prompt: dir.prompt, format } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const spec = formatById(format);
      const blob = blobFromBase64(result.imageBase64, result.mime);
      const id = uid("asset");
      await putAssetBlob(id, blob);
      addAsset({
        id,
        name: dir.name,
        kind: "image",
        category: "ai",
        mime: result.mime,
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
      toast.success("圖片已進素材庫（AI Generated）");
    } finally {
      setBusy(false);
    }
  }

  function applyToCanvas() {
    if (!brand || !plan) return;
    const brief = migrateBrief({
      ...emptyBrief(),
      eventName: plan.campaignName,
      product: plan.campaignName,
      schedule,
      location,
      audience: DEFAULT_AUDIENCE,
      goal: "traffic",
      features: idea,
      deliverables: { post: true, story: true, carousel: true, reels: true },
    });
    const project = createProject({
      name: plan.campaignName,
      brandId: brand.id,
      formatId: mode === "story" ? "story" : mode === "reels" ? "reels-cover" : "feed-portrait",
      brief,
      templateId: plan.templateId,
      campaignId: campaign?.id,
      contentKind: mode === "story" ? "story" : mode === "reels" ? "reels" : "carousel",
    });
    applyCampaignPlan(project.id, plan, brief);
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  function saveCampaignAndWaves() {
    const name = eventName.trim() || guessEventName(`${idea} ${plan?.campaignName ?? ""}`) || plan?.campaignName || "未命名活動";
    const date = parseEventDate(schedule);
    const type = eventKindFromText(`${name} ${idea}`);
    const waves = suggestWaves({ date, type, name });
    const created = createCampaign({
      name,
      type,
      date,
      time: parseEventTime(schedule),
      location,
      oneLiner: oneLiner || plan?.hook || idea,
      description: description || plan?.concept || "",
      theme: theme || plan?.visualTheme || "",
      studentPain,
      cta: plan?.cta || "來坐一下",
      signupUrl,
      waves,
    });
    for (const wave of waves) {
      if (!wave.scheduledAt) continue;
      upsertSchedule({
        id: wave.id,
        projectId: null,
        campaignId: created.id,
        kind: contentKindForWave(wave.kind),
        title: wave.title,
        scheduledAt: wave.scheduledAt,
        publishedAt: null,
        status: "idea",
      });
    }
    setCampaign(created);
    toast.success("活動與節奏已進月曆");
    toast.message(rhythmHint(recentKinds));
    return created;
  }

  function scheduleAllFormats() {
    const created = saveCampaignAndWaves();
    const date = parseEventDate(schedule);
    const when = Date.parse(`${date}T19:00:00+08:00`);
    for (const pack of converted) {
      const scheduledAt = Number.isNaN(when) ? Date.now() : when + offsetDaysForConvertedKind(pack.kind) * 86_400_000;
      upsertSchedule({
        id: uid("sch"),
        projectId: null,
        campaignId: created.id,
        kind: pack.kind,
        title: `${pack.title} · ${eventName || plan?.campaignName || idea.slice(0, 12)}`,
        scheduledAt,
        publishedAt: null,
        status: "idea",
      });
    }
    toast.success("IG／Story／Reels／Threads 已依節奏排進月曆");
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
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.connected) {
        window.open(result.editUrl, "_blank", "noopener,noreferrer");
        toast.success("已在 Canva 建立設計，可繼續微調");
        return;
      }
      await navigator.clipboard.writeText(result.brief).catch(() => undefined);
      window.open(result.editUrl, "_blank", "noopener,noreferrer");
      toast.message(result.note);
    } finally {
      setBusy(false);
    }
  }

  function adoptDirection(dir: VisualDirection) {
    setPickedDirection(dir);
    setPlan((current) => (current ? applyDirectionToPlan(current, dir) : current));
    setPacks((rows) =>
      rows.map((pack) => ({
        ...pack,
        hook: /[？?]/.test(dir.headline) ? dir.headline : pack.hook,
      })),
    );
    toast.success(`已選「${dir.name}」，文案與視覺會跟著走`);
  }

  function schedulePack(pack: ConvertedPack) {
    const date = parseEventDate(schedule);
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
      status: "idea",
    });
    toast.success(`${pack.title}已進月曆`);
    toast.message(rhythmHint([...recentKinds, pack.kind]));
  }

  const converted = useMemo(() => {
    if (!plan) return [];
    return KINDS.map((kind) => convertPlan(plan, kind));
  }, [plan]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 pb-28 md:px-8 md:py-10 lg:pb-10">
      <PageHeader
        kicker="AI 創作"
        title="從一句話開始"
        description="前台只顯示找到什麼、生成什麼、下一步。沒有 Agent 管理器。"
      />

      <div className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <p className="text-xs text-muted">
          {status?.label ?? "確認創作服務中"} · {MODE_HINT[mode] ?? MODE_HINT.idea}
        </p>
        <Label className="mt-4">你想做什麼</Label>
        <Textarea className="mt-2" value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} />
        <div className="mt-3">
          <p className="text-sm font-medium">或從一張圖開始</p>
          <label className="mt-1.5 flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-surface-2 px-3 text-sm">
            選擇照片／舊海報／截圖
            <input
              type="file"
              accept="image/*"
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImage(file);
                e.target.value = "";
              }}
            />
          </label>
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
        {mode === "campaign" ? (
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
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
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

      {vision ? (
        <section className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-medium">圖片理解</h2>
          <p className="mt-2 text-sm">{vision.content}</p>
          <p className="mt-2 text-xs text-muted">學生感：{vision.studentFeel}</p>
          <p className="text-xs text-muted">
            太宗教？{vision.tooReligious ? "是" : "否"} · 太老氣？{vision.tooOld ? "是" : "否"} · 太 AI？{vision.tooAi ? "可能" : "還好"}
          </p>
          <p className="text-xs text-muted">符合淡江學生？{vision.fitsTamkang ? "接近" : "還要再生活一點"}</p>
        </section>
      ) : null}

      {found.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">找到 {found.length} 個相關素材</h2>
          <p className="mt-1 text-xs text-muted">可釘選給 AI 當風格參考。來源會標出來。</p>
          <ul className="mt-3 space-y-2">
            {found.map((hit) => {
              const pinnedHit = pinned.some((row) => row.id === hit.id);
              return (
                <li key={hit.id} className="flex items-start justify-between gap-2 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[var(--shadow-border)]">
                  <div>
                    <p>{hit.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {sourceLine(hit)} · {hit.subtitle}
                    </p>
                  </div>
                  <Button size="sm" variant={pinnedHit ? "default" : "secondary"} onClick={() => togglePin(hit)}>
                    {pinnedHit ? "已參考" : "加入參考"}
                  </Button>
                </li>
              );
            })}
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
            toast.success("已套用學生視角 Hook");
          }}
        />
      ) : null}

      {directions.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">根據過去內容生成 {directions.length} 個方向</h2>
          <ul className="mt-3 grid gap-3">
            {directions.map((dir) => (
              <li key={dir.id || dir.name} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="font-medium">{dir.name}</p>
                <p className="mt-1 text-sm text-muted">{dir.concept}</p>
                <p className="mt-2 text-xs text-muted">{dir.palette} · {dir.composition}</p>
                <p className="mt-1 text-sm">{dir.headline} · {dir.subhead}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant={pickedDirection?.name === dir.name ? "default" : "secondary"} onClick={() => adoptDirection(dir)}>
                    {pickedDirection?.name === dir.name ? "已選這個方向" : "用這個方向"}
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => void generateFromDirection(dir)}>
                    生成圖片
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
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
            <Button onClick={applyToCanvas}>套用到畫布</Button>
            <Button variant="secondary" onClick={saveCampaignAndWaves}>
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
            <p className="mt-3 text-xs text-muted">
              已建立 {campaign.name}，節奏含 {campaign.waves.map((w) => waveLabel(w.kind)).join("、") || "預熱到回顧"}。
            </p>
          ) : null}
        </section>
      ) : null}

      {plan?.reelsScript ? (
        <ReelsBoard script={plan.reelsScript} eventName={eventName || plan.campaignName} onSchedule={saveCampaignAndWaves} />
      ) : null}

      {campaign?.waves.length ? (
        <WaveList
          waves={campaign.waves}
          name={campaign.name}
          schedule={schedule}
          location={location}
          idea={idea}
          onApplyDraft={(draft) => {
            setPacks((rows) =>
              rows.map((pack) => ({
                ...pack,
                hook: draft.hook,
                body: draft.body,
                cta: draft.cta,
              })),
            );
            setPlan((current) => (current ? { ...current, hook: draft.hook, body: draft.body, cta: draft.cta } : current));
            toast.success(`已套用「${draft.title}」文案`);
          }}
        />
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

function sourceLine(hit: CreativeHit) {
  if (hit.source === "drive") return "Google Drive";
  if (hit.source === "canva") return "Canva";
  if (hit.source === "instagram") return "Instagram";
  if (hit.source === "generated") return "AI Generated";
  return "本機／品牌記憶";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function StudentReviewCard({
  review,
  onApplyHook,
}: {
  review: StudentReview;
  onApplyHook?: (hook: string) => void;
}) {
  return (
    <section className="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <h2 className="text-sm font-medium">淡江學生視角</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        <li>會停下來嗎？{review.wouldStop}</li>
        <li>看得懂嗎？{review.understandable}</li>
        <li>太宗教？{review.tooReligious}</li>
        <li>太嚴肅？{review.tooSerious}</li>
        <li>太文青？{review.tooLiterary}</li>
        <li>太 AI？{review.tooAi}</li>
        <li>太長？{review.tooLong}</li>
        <li>知道這活動在幹嘛？{review.knowsWhat}</li>
        <li>知道時間地點嗎？{review.knowsWhenWhere}</li>
        <li>會找朋友嗎？{review.wouldBringFriend}</li>
        <li>知道怎麼報名嗎？{review.knowsHowToSignup}</li>
      </ul>
      {review.rewriteHook ? (
        <div className="mt-3">
          <p className="text-sm">可改 Hook：{review.rewriteHook}</p>
          {onApplyHook ? (
            <Button className="mt-3" size="sm" onClick={() => onApplyHook(review.rewriteHook)}>
              用這個 Hook 改寫
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
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
