import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CreativeHits } from "@/components/search/creative-hits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { convertContent } from "@/lib/ai/convert";
import { generateCopy, type CopyBlock } from "@/lib/ai/copy";
import { generateStudioImage, listVisualDirections } from "@/lib/ai/image";
import { applyStudentRevisions } from "@/lib/ai/pack-mock";
import { generateCreativePack, type CreativePack } from "@/lib/ai/pack";
import { analyzeImage, type VisionReport } from "@/lib/ai/vision";
import { clubDnaFromMemory, dnaPromptBlock } from "@/lib/club/dna";
import { clubInsightsFromPosts } from "@/lib/club/insights";
import { gatherCreativeMemory, createCanvaDesign } from "@/lib/connect/oauth";
import { inferCampaignType, inferEventDate } from "@/lib/creative/schedule";
import { searchCreative } from "@/lib/creative/search";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { createGeneratedAsset } from "@/lib/studio/assets";
import { emptyBrief } from "@/lib/studio/brief";
import { uid } from "@/lib/studio/ids";
import { COPY_TONES } from "@/lib/studio/content";
import type { CreativeDirection } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

const ASPECTS = [
  { id: "4:5" as const, label: "IG 4:5" },
  { id: "1:1" as const, label: "IG 1:1 / LINE" },
  { id: "9:16" as const, label: "Story / Reels" },
];

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
}: {
  initialQuery?: string;
  autoRun?: boolean;
  mode?: string;
  campaignId?: string;
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
  const updateCampaign = useCreative((s) => s.updateCampaign);
  const addCampaign = useCreative((s) => s.addCampaign);
  const addMemory = useCreative((s) => s.addMemory);
  const ingestIgPosts = useCreative((s) => s.ingestIgPosts);
  const setWaveStatus = useCreative((s) => s.setWaveStatus);
  const assets = useStudio((s) => s.assets);
  const projects = useStudio((s) => s.projects);
  const campaign = campaignId ? campaigns.find((c) => c.id === campaignId) : undefined;

  const [query, setQuery] = useState(initialQuery || starterQuery(mode, campaign?.name));
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<CreativePack | null>(null);
  const [dirId, setDirId] = useState<string | null>(null);
  const [copies, setCopies] = useState<CopyBlock[]>([]);
  const [tone, setTone] = useState<CopyBlock["tone"]>("student");
  const [vision, setVision] = useState<VisionReport | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [directions, setDirections] = useState<CreativeDirection[]>([]);
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]["id"]>("4:5");
  const fileRef = useRef<HTMLInputElement>(null);
  const ran = useRef(false);

  const hits = useMemo(
    () => searchCreative({ query, memory, assets, campaigns, igPosts, projects }),
    [query, memory, assets, campaigns, igPosts, projects],
  );

  async function runPack() {
    setBusy(true);
    try {
      try {
        const gathered = await gatherCreativeMemory({ data: { query: query.slice(0, 80) } });
        if (gathered.ok) {
          for (const item of gathered.items) addMemory(item);
          if (gathered.posts?.length) ingestIgPosts(gathered.posts);
        }
      } catch {
        /* 沒連上官方來源就用本機 Creative Memory */
      }
      const liveHits = searchCreative({
        query,
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
      const dna = clubDnaFromMemory({
        igPosts: useCreative.getState().igPosts,
        memory: useCreative.getState().memory,
      });
      const result = await generateCreativePack({
        data: {
          query,
          eventName: campaign?.name,
          schedule: campaign ? `${campaign.date} ${campaign.time}` : undefined,
          location: campaign?.location,
          oneLiner: campaign?.oneLiner,
          sources,
          dnaNotes: dnaPromptBlock(dna).slice(0, 2400),
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
    if (mode === "vision") fileRef.current?.click();
  }, [mode]);

  useEffect(() => {
    if (!autoRun || ran.current) return;
    ran.current = true;
    void runPack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  async function runCopy() {
    setBusy(true);
    try {
      const result = await generateCopy({
        data: {
          topic: query,
          kind: mode,
          when: campaign ? `${campaign.date} ${campaign.time}` : undefined,
          where: campaign?.location,
          insightNotes: dnaPromptBlock(
            clubDnaFromMemory({
              igPosts: useCreative.getState().igPosts,
              memory: useCreative.getState().memory,
            }),
          ).slice(0, 1500),
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
      const result = await listVisualDirections({ data: { topic: query } });
      if (result.ok) {
        setDirections(result.directions);
        setDirId(result.directions[0]?.id ?? null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function runImage(prompt: string) {
    setBusy(true);
    try {
      const result = await generateStudioImage({ data: { prompt, topic: query, aspect } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setImageSrc(result.src);
      const id = uid("asset");
      const blob = await (await fetch(result.src)).blob();
      await getAssetStorage().put(id, blob);
      addAsset(
        createGeneratedAsset({
          id,
          name: query.slice(0, 18) || "AI 主視覺",
          mime: blob.type || "image/png",
          width: aspect === "9:16" ? 1080 : 1080,
          height: aspect === "9:16" ? 1920 : aspect === "1:1" ? 1080 : 1350,
          category: "poster",
        }),
      );
      toast.success("主視覺已進素材庫");
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

  function applyToStudio(andSchedule: boolean) {
    const brand = brands[0];
    if (!brand || !pack) return;
    let camp = campaignId ? campaigns.find((c) => c.id === campaignId) : undefined;
    if (!camp && andSchedule) {
      camp = addCampaign({
        name: pack.plan.campaignName,
        date: inferEventDate(query),
        type: inferCampaignType(`${query} ${pack.plan.campaignName}`),
        oneLiner: pack.plan.hook,
        fullIntro: pack.plan.body,
        studentPain: pack.plan.insight,
        cta: pack.plan.cta,
        theme: pack.plan.visualTheme,
        location: campaign?.location ?? "淡江校園",
      });
    }
    const brief = {
      ...emptyBrief(),
      eventName: pack.plan.campaignName,
      product: pack.plan.campaignName,
      schedule: camp ? `${camp.date} ${camp.time}` : "",
      location: camp?.location ?? "淡江校園",
      audience: pack.studentContext,
      features: pack.plan.concept,
      style: pack.plan.visualTheme,
      deliverables: { post: true, story: true, carousel: true, reels: true },
    };
    const project = createProject({
      name: pack.plan.campaignName,
      brandId: brand.id,
      formatId: "feed-portrait",
      brief,
      templateId: pack.plan.templateId,
    });
    applyCampaignPlan(project.id, pack.plan, brief);
    const scheduledAt = camp ? Date.parse(`${camp.date}T19:00:00+08:00`) - 7 * 86400000 : Date.now() + 86400000;
    useStudio.getState().updateProject(project.id, {
      contentKind: "carousel",
      campaignId: camp?.id ?? null,
      sourceRefs: pack.sources,
      status: andSchedule ? "scheduled" : "creating",
      scheduledAt: andSchedule ? scheduledAt : null,
    });
    if (camp) {
      generateWaves(camp.id);
      const latest = useCreative.getState().campaigns.find((c) => c.id === camp.id);
      const visual = latest?.waves.find((w) => w.intent === "主視覺") ?? latest?.waves[0];
      if (visual) setWaveStatus(camp.id, visual.id, andSchedule ? "scheduled" : "creating", project.id);
      updateCampaign(camp.id, { projectIds: [...new Set([...camp.projectIds, project.id])] });
    }
    toast.success(andSchedule ? "已套進畫布並排進月曆節奏" : "已套進畫布");
    if (andSchedule) {
      void navigate({ to: "/calendar" });
      return;
    }
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  async function sendCanva() {
    if (!pack) return;
    const result = await createCanvaDesign({ data: { title: pack.plan.campaignName, kind: "carousel" } });
    if (!result.ok) {
      toast.message(result.message);
      if (result.reason === "connect") void navigate({ to: "/connect" });
      return;
    }
    window.open(result.url, "_blank", "noopener");
    toast.success("已在 Canva 開一個新設計");
  }

  const activeDir = pack?.directions.find((d) => d.id === dirId) ?? directions.find((d) => d.id === dirId);
  const copy = copies.find((c) => c.tone === tone) ?? copies[0];
  const sim = pack?.plan.studentSim;
  const insights = clubInsightsFromPosts(igPosts);

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

      {hits.length ? (
        <div className="mt-4">
          <p className="text-sm text-muted">找到 {hits.length} 個相關素材 · 根據過去內容準備 3 個方向</p>
          <CreativeHits
            hits={hits}
            onPick={(hit) => {
              setQuery((prev) => `${prev}（參考 ${hit.sourceLabel}）`);
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
              {pack.sources.map((s) => (
                <span key={`${s.source}-${s.label}`} className="rounded-full bg-surface-2 px-2 py-1 text-xs text-muted">
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
                  <Button size="sm" variant="secondary" onClick={() => void runImage(`${activeDir.imagePrompt}, different composition`)}>
                    換構圖
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(`${activeDir.imagePrompt}, dusk Tamsui mood`)}>
                    換氣氛
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(`${activeDir.imagePrompt}, new background campus path`)}>
                    換背景
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(`${activeDir.imagePrompt}, editorial film still, less illustration more photo`)}>
                    換風格
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void runImage(`${activeDir.imagePrompt}, less text, bigger hook, more empty space`)}>
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

          <PackKit pack={pack} />

          <div>
            <h2 className="text-sm font-medium">再轉一版</h2>
            <ConvertPreview title={pack.plan.campaignName} hook={pack.plan.hook} when={campaign?.date} where={campaign?.location} />
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
          </div>
        </section>
      ) : null}

      {imageSrc ? (
        <img src={imageSrc} alt="生成或上傳的畫面" className="mt-6 w-full rounded-3xl shadow-[var(--shadow-artboard)]" />
      ) : null}
      {vision ? (
        <section className="mt-4 rounded-2xl bg-surface p-4 text-sm shadow-[var(--shadow-border)]">
          <p>{vision.scene}</p>
          <p className="mt-1 text-muted">{vision.studentFit}</p>
          <p className="mt-2 text-xs">
            太宗教 {vision.tooReligious ? "是" : "沒有"} · 太老氣 {vision.tooOld ? "是" : "沒有"} · 太 AI {vision.tooAi ? "是" : "沒有"}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {vision.next.map((n) => (
              <span key={n} className="rounded-full bg-surface-2 px-2 py-1 text-xs">
                {n}
              </span>
            ))}
          </div>
          <Button className="mt-3" size="sm" onClick={() => void runImage(vision.imagePrompt)}>
            延續這個風格
          </Button>
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

function PackKit({ pack }: { pack: CreativePack }) {
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
      <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs tracking-[0.14em] text-muted uppercase">Story</p>
        <ol className="mt-2 space-y-2">
          {pack.conversions.story.map((frame, index) => (
            <li key={`${frame.headline}-${index}`} className="text-sm">
              <p className="font-medium">{frame.headline}</p>
              <p className="text-xs text-muted">
                {frame.body} · 畫面：{frame.visualNote}
              </p>
            </li>
          ))}
        </ol>
      </div>
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
      <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs tracking-[0.14em] text-muted uppercase">Reels 腳本</p>
        <ol className="mt-2 space-y-3">
          {pack.conversions.reels.map((beat) => (
            <li key={`${beat.start}-${beat.end}`} className="text-sm">
              <p className="font-medium">
                {beat.start}–{beat.end} {beat.caption}
              </p>
              <p className="text-xs text-muted">畫面：{beat.visual}</p>
              <p className="text-xs text-muted">旁白：{beat.voice}</p>
              <p className="text-xs text-subtle">轉場：{beat.transition} · 素材：{beat.assetHint}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ConvertPreview({ title, hook, when, where }: { title: string; hook: string; when?: string; where?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const labels: Record<string, string> = {
    carousel: "轉 Carousel",
    story: "轉 Story",
    threads: "轉 Threads",
    line: "轉 LINE",
    reels: "轉 Reels 腳本",
  };
  async function run(kind: string) {
    const result = await convertContent({ data: { title, hook, when, where } });
    if (!result.ok) return;
    setOpen(kind);
    if (kind === "carousel") setText(result.carousel.map((p, i) => `${i + 1}. ${p.title}\n${p.body}`).join("\n\n"));
    if (kind === "story") setText(result.story.map((p) => `${p.headline}\n${p.body}`).join("\n\n"));
    if (kind === "threads") setText(result.threads);
    if (kind === "line") setText(result.line);
    if (kind === "reels") setText(result.reels.map((b) => `${b.start}-${b.end} ${b.caption}\n畫面：${b.visual}\n旁白：${b.voice}`).join("\n\n"));
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
      {text ? <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-bg p-3 font-sans text-xs leading-relaxed">{text}</pre> : null}
    </div>
  );
}
