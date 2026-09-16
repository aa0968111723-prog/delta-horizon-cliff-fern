import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  GraduationCap,
  ImageIcon,
  LayoutGrid,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { describeAdapter, type AiStatus } from "@/lib/ai/campaign";
import {
  generateZenCreativeWave,
  getZenCreativeStatus,
  type CreativeWave,
} from "@/lib/ai/zen-creative";
import { applyCreativeToStudio, scheduleCreativeWave } from "@/lib/studio/apply-creative";
import type { Campaign } from "@/lib/studio/campaign-types";
import { analyzeZenImageVisual } from "@/lib/studio/image-analyzer";
import { buildLocalCreativeWave, type ZenVisualDirection } from "@/lib/studio/zen-prompt-engine";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
  campaign?: Campaign | null;
};

export function AiCreativeModal({
  open,
  onOpenChange,
  initialTopic = "09/24 浮游禪光 迎新茶會",
  campaign,
}: Props) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(initialTopic);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [wave, setWave] = useState<CreativeWave>(() =>
    buildLocalCreativeWave({ topic: initialTopic, date: campaign?.date, location: campaign?.location, cta: campaign?.mainCta }),
  );
  const [selectedDir, setSelectedDir] = useState<ZenVisualDirection>(wave.directions[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adapter, setAdapter] = useState<"live" | "mock">("mock");
  const [liveFailed, setLiveFailed] = useState(false);
  const [activeTab, setActiveTab] = useState("directions");
  const [visionAnalysis, setVisionAnalysis] = useState(() => analyzeZenImageVisual("淡江茶會熱茶手捧特寫.jpg", "photo"));

  useEffect(() => {
    if (!open) return;
    setTopic(initialTopic);
    const local = buildLocalCreativeWave({
      topic: initialTopic,
      date: campaign ? `${campaign.date} ${campaign.time}` : undefined,
      location: campaign?.location,
      studentPain: campaign?.studentPain,
      cta: campaign?.mainCta,
    });
    setWave(local);
    setSelectedDir(local.directions[0]);
    setLiveFailed(false);
    let alive = true;
    getZenCreativeStatus()
      .then((next) => {
        if (alive) setStatus(next);
      })
      .catch(() => {
        if (alive) setStatus(describeAdapter(false));
      });
    return () => {
      alive = false;
    };
  }, [open, initialTopic, campaign]);

  async function generate(forceMock = false) {
    const nextTopic = topic.trim() || initialTopic;
    if (!nextTopic) {
      toast.error("請先寫活動或一句靈感。");
      return;
    }
    setIsGenerating(true);
    try {
      const connected = status?.available ?? false;
      const result = await generateZenCreativeWave({
        data: {
          topic: nextTopic,
          date: campaign ? `${campaign.date} ${campaign.time}` : undefined,
          location: campaign?.location,
          studentPain: campaign?.studentPain,
          cta: campaign?.mainCta,
          details: campaign?.oneLiner,
          forceMock: forceMock || !connected,
        },
      });
      if (!result.ok) {
        setLiveFailed(result.adapter === "live");
        toast.error(result.error);
        return;
      }
      setLiveFailed(false);
      setAdapter(result.adapter);
      setWave(result.wave);
      setSelectedDir(result.wave.directions[0]);
      toast.success(result.adapter === "live" ? "已用 Grok 寫出 3 個創意方向" : "已用本機草案寫出 3 個方向");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成失敗");
    } finally {
      setIsGenerating(false);
    }
  }

  function applyToCanvas() {
    try {
      const { projectId } = applyCreativeToStudio({
        topic: topic.trim() || initialTopic,
        direction: selectedDir,
        conversion: wave.conversion,
        source: adapter,
        campaign,
        schedule: false,
      });
      onOpenChange(false);
      toast.success(`已把「${selectedDir.name}」排上畫布`);
      void navigate({ to: "/studio/$projectId", params: { projectId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "無法套用到畫布");
    }
  }

  function schedule(format: "carousel" | "ig-post" | "story" | "reels") {
    scheduleCreativeWave({
      topic: topic.trim() || initialTopic,
      direction: selectedDir,
      conversion: wave.conversion,
      campaignId: campaign?.id,
      eventDate: campaign?.date,
    });
    toast.success(`已將 ${format} 波段排入內容日曆`);
  }

  const mockMode = status ? !status.available || liveFailed : false;
  const audit = wave.audit;
  const conversion = wave.conversion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface p-4 text-fg sm:p-6">
        <DialogHeader className="shrink-0 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Sparkles className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">淡江禪學社 AI 創作</DialogTitle>
              <DialogDescription className="text-xs text-muted">
                {status ? status.detail : "正在確認有沒有連到 Grok。不會假裝已經連線。"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex shrink-0 flex-col gap-2 py-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              data-testid="ai-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="活動名稱或一句靈感，例如：09/24 浮游禪光"
              className="flex-1 bg-surface-2 text-sm"
            />
            <Button
              data-testid="ai-creative-generate"
              onClick={() => void generate(mockMode)}
              disabled={isGenerating || !status}
              className="shrink-0 gap-1.5"
            >
              {isGenerating ? <RefreshCw className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {isGenerating ? "生成中…" : mockMode ? "生成本機草案" : "AI 創意發想"}
            </Button>
          </div>
          {liveFailed ? (
            <Button variant="secondary" size="sm" onClick={() => void generate(true)}>
              改用本機草案
            </Button>
          ) : null}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid shrink-0 grid-cols-4 bg-surface-2 text-xs">
            <TabsTrigger value="directions" className="gap-1">
              <LayoutGrid className="size-3.5" />
              視覺方向
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1">
              <GraduationCap className="size-3.5" />
              學生模擬 {audit.studentScore}
            </TabsTrigger>
            <TabsTrigger value="multimodal" className="gap-1">
              <Sparkles className="size-3.5" />
              多平台
            </TabsTrigger>
            <TabsTrigger value="vision" className="gap-1">
              <ImageIcon className="size-3.5" />
              圖片理解
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="mt-3 flex-1 pr-2">
            <TabsContent value="directions" className="m-0 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {wave.directions.map((dir) => (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => setSelectedDir(dir)}
                    className={`flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                      selectedDir.id === dir.id
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-border bg-surface hover:bg-surface-2/60"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge className={selectedDir.id === dir.id ? "bg-accent text-accent-fg" : ""}>
                        {dir.name.split("：")[0]}
                      </Badge>
                      <span className="text-[11px] text-muted">{dir.aspectRatio}</span>
                    </div>
                    <h4 className="mb-1 text-sm font-bold">{dir.name.split("：")[1]}</h4>
                    <p className="mb-3 line-clamp-2 text-xs text-muted">{dir.concept}</p>
                    <div className="mb-3 rounded-lg border border-border/60 bg-surface-2 p-2.5">
                      <p className="mb-1 whitespace-pre-line text-xs font-semibold text-accent">{dir.headline}</p>
                      <p className="text-[11px] text-muted">{dir.subhead}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                      <span className="text-[11px] text-muted">{dir.atmosphere.split("、")[0]}</span>
                      {selectedDir.id === dir.id ? (
                        <span className="flex items-center gap-1 font-medium text-accent">
                          <CheckCircle2 className="size-3.5" /> 已選
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-surface-2/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold">
                    <Wand2 className="size-3.5 text-accent" />
                    繪圖 Prompt 與排版
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      void navigator.clipboard.writeText(selectedDir.imagePrompt);
                      toast.success("已複製 Prompt");
                    }}
                  >
                    <Copy className="size-3" /> 複製 Prompt
                  </Button>
                </div>
                <div className="select-all rounded-lg border border-border bg-bg/80 p-2.5 font-mono text-xs text-muted">
                  {selectedDir.imagePrompt}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button data-testid="apply-to-canvas" size="sm" onClick={applyToCanvas} className="gap-1.5">
                    <CheckCircle2 className="size-4" /> 套用至畫布
                  </Button>
                  <Button
                    data-testid="schedule-to-calendar"
                    variant="outline"
                    size="sm"
                    onClick={() => schedule("carousel")}
                  >
                    排入內容日曆
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="m-0 space-y-4">
              <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold">淡江學生視角</h4>
                    <p className="text-xs text-muted">會不會停下來、像不像說教、有沒有 AI 味</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-accent">{audit.studentScore}</span>
                    <span className="block text-xs text-muted">共鳴分數</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <AuditChip label="停留感" ok={audit.willStopScrolling} yes="第一眼會停" no="略平" />
                  <AuditChip label="說教感" ok={!audit.isTooReligious} yes="沒有佛學腔" no="太宗教" />
                  <AuditChip label="罐頭感" ok={!audit.isTooAiFlavored} yes="像人在說話" no="有 AI 味" />
                  <AuditChip label="約朋友" ok={audit.wouldInviteFriend} yes="會想揪室友" no="還不夠" />
                </div>
                <div className="space-y-1.5 border-t border-border/60 pt-2">
                  {audit.suggestions.map((s) => (
                    <p key={s} className="rounded bg-surface-2 p-2 text-xs text-muted">
                      {s}
                    </p>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="multimodal" className="m-0 space-y-3">
              <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">Carousel {conversion.carousel.pages.length}P</Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => schedule("carousel")}>
                    排入日曆
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                  {conversion.carousel.pages.map((p) => (
                    <div key={p.page} className="flex flex-col rounded-lg border border-border/60 bg-surface-2 p-2.5">
                      <span className="mb-1 text-[10px] font-bold text-accent">
                        P{p.page} · {p.role}
                      </span>
                      <p className="mb-1 whitespace-pre-line text-xs font-semibold">{p.headline}</p>
                      <p className="text-[11px] text-muted">{p.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-border bg-surface p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">限動 3 則</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => schedule("story")}>
                      排入限動
                    </Button>
                  </div>
                  {conversion.story.cards.map((c) => (
                    <div key={c.step} className="rounded bg-surface-2 p-2 text-xs">
                      <p className="font-semibold">
                        {c.step}. {c.title}
                        <span className="ml-2 text-[10px] text-muted">{c.interactiveType}</span>
                      </p>
                      <p className="whitespace-pre-line text-[11px] text-muted">{c.copy}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 rounded-xl border border-border bg-surface p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Reels 20 秒</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => schedule("reels")}>
                      排入短影音
                    </Button>
                  </div>
                  {conversion.reelsScript.scenes.slice(0, 3).map((sc) => (
                    <div key={sc.time} className="rounded bg-surface-2 p-2 text-xs">
                      <span className="font-mono text-[10px] text-accent">{sc.time}</span>
                      <p className="text-[11px] font-semibold">{sc.subtitle}</p>
                      <p className="text-[10px] text-muted">畫面：{sc.visual}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vision" className="m-0 space-y-4">
              <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold">圖片理解</h4>
                    <p className="text-xs text-muted">示範分析茶會熱茶照片。完整分析在素材庫單張頁。</p>
                  </div>
                  <Badge>視覺 {visionAnalysis.brandFitScore}/100</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img src="/seed/cup.jpg" alt="分析範例" className="h-36 w-full object-cover" />
                    <div className="bg-surface-2 p-2 text-xs">
                      <span className="block font-semibold">茶會暖心熱茶手捧</span>
                      <span className="text-[11px] text-muted">示範素材 · Drive 記憶</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs sm:col-span-2">
                    <p className="rounded-lg bg-surface-2 p-2.5 text-muted">{visionAnalysis.contentSummary}</p>
                    <p className="rounded-lg bg-surface-2 p-2.5 text-muted">{visionAnalysis.composition}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {visionAnalysis.adaptationActions.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5 text-left hover:bg-surface-2"
                      onClick={() => {
                        if (act.id === "make-similar-visual") {
                          setTopic(`延續熱茶手捧的晨曦暖光，為「${topic}」生成同風格`);
                          setActiveTab("directions");
                          toast.success("已把風格帶進主題，按 AI 創意發想");
                          return;
                        }
                        setVisionAnalysis(analyzeZenImageVisual(act.label, "photo"));
                        toast.success(`已記下：${act.label}`);
                      }}
                    >
                      <span>
                        <span className="block text-xs font-semibold">{act.label}</span>
                        <span className="text-[11px] text-muted">{act.description}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted" />
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AuditChip({ label, ok, yes, no }: { label: string; ok: boolean; yes: string; no: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-2 p-2.5">
      <span className="block text-xs text-muted">{label}</span>
      <span className={`text-sm font-semibold ${ok ? "text-success" : "text-warn"}`}>{ok ? yes : no}</span>
    </div>
  );
}
