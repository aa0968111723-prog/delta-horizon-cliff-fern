import { useState } from "react";
import { Sparkles, Wand2, Eye, RefreshCw, Send, CheckCircle2, ChevronRight, Share2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  generateZenVisualDirections,
  auditStudentPerspective,
  convertContentMultimodal,
  type ZenVisualDirection,
} from "@/lib/studio/zen-prompt-engine";
import { analyzeZenImageVisual } from "@/lib/studio/image-analyzer";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { toast } from "sonner";

interface AiCreativeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTopic?: string;
  onApplyPlan?: (direction: ZenVisualDirection) => void;
}

export function AiCreativeModal({ open, onOpenChange, initialTopic = "09/24 浮游禪光 迎新茶會", onApplyPlan }: AiCreativeModalProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [directions, setDirections] = useState<ZenVisualDirection[]>(() => generateZenVisualDirections(initialTopic));
  const [selectedDir, setSelectedDir] = useState<ZenVisualDirection>(directions[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("directions");
  
  // Student audit
  const [auditResult, setAuditResult] = useState(() =>
    auditStudentPerspective({
      headline: selectedDir.headline,
      caption: `開學第三週，待辦清單突然變長。好不容易坐下來滑手機，心裡卻一直在想明天要交的報告。\n其實你不是不夠努力，只是太久沒有好好深呼吸了。\n淡江禪學社 09/24（四）晚間 18:30「浮游禪光」迎新茶會。\n不說教、不用懂深奧佛學，只要帶上你想放空的心情來坐坐。\n地點：淡江大學活動中心\n免費報名連結在主頁簡介。`,
      cta: selectedDir.subhead,
    })
  );

  // Multimodal conversion
  const [conversion, setConversion] = useState(() =>
    convertContentMultimodal({
      topic,
      headline: selectedDir.headline,
      caption: "",
      date: "09/24 (四) 18:30",
      location: "淡江大學活動中心",
    })
  );

  // Vision inspection
  const [visionAnalysis, setVisionAnalysis] = useState(() =>
    analyzeZenImageVisual("淡江茶會熱茶手捧特寫.jpg", "photo")
  );

  const addScheduledPost = useCampaignStore((s) => s.addScheduledPost);

  function handleGenerateNew() {
    setIsGenerating(true);
    setTimeout(() => {
      const dirs = generateZenVisualDirections(topic);
      setDirections(dirs);
      setSelectedDir(dirs[0]);
      setConversion(
        convertContentMultimodal({
          topic,
          headline: dirs[0].headline,
          caption: "",
          date: "09/24 (四) 18:30",
          location: "淡江大學活動中心",
        })
      );
      setAuditResult(
        auditStudentPerspective({
          headline: dirs[0].headline,
          caption: `開學第三週，待辦清單突然變長。好不容易坐下來滑手機，心裡卻一直在想明天要交的報告。\n其實你不是不夠努力，只是太久沒有好好深呼吸了。\n淡江禪學社 09/24（四）晚間 18:30「浮游禪光」迎新茶會。\n不說教、不用懂深奧佛學，只要帶上你想放空的心情來坐坐。\n地點：淡江大學活動中心\n免費報名連結在主頁簡介。`,
          cta: dirs[0].subhead,
        })
      );
      setIsGenerating(false);
      toast.success("已根據淡江學生生活語境生成 3 個創意方向！");
    }, 400);
  }

  function handleSchedulePost(format: "carousel" | "ig-post" | "story" | "reels") {
    addScheduledPost({
      title: `${topic} (${format.toUpperCase()})`,
      contentType: format,
      status: "scheduled",
      scheduledAt: "2026-09-22 20:00",
      hook: selectedDir.headline.replace("\n", " "),
      caption: conversion.igPost.caption,
      hashtags: conversion.igPost.hashtags,
      cta: selectedDir.subhead,
      visualDirection: selectedDir.concept,
      sourceKind: "ai-generated",
      sourceRef: `AI Creative Studio / ${selectedDir.name}`,
    });
    toast.success(`已將「${format.toUpperCase()}」排入內容日曆！`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden bg-surface text-fg rounded-2xl">
        <DialogHeader className="shrink-0 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">
                  淡江禪學社 AI Creative Studio
                </DialogTitle>
                <DialogDescription className="text-xs text-muted">
                  一人創作中控台：多模態視覺概念、文案 Hook、反向學生模擬與一鍵多格式轉換
                </DialogDescription>
              </div>
            </div>
            <Badge className="hidden sm:inline-flex border border-primary/30 text-primary bg-primary/5 text-xs">
              Tamkang Zen Club Brain
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="輸入活動名稱或一句靈感想法，例如：09/24 浮游禪光 迎新茶會"
              className="flex-1 bg-surface-2 text-sm"
            />
            <Button
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="gap-1.5 shrink-0"
            >
              {isGenerating ? <RefreshCw className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              AI 創意發想
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-4 shrink-0 bg-surface-2 text-xs">
            <TabsTrigger value="directions" className="gap-1">
              🎨 3 視覺方向
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1">
              🎓 淡江學生模擬 ({auditResult.studentScore}分)
            </TabsTrigger>
            <TabsTrigger value="multimodal" className="gap-1">
              ⚡ 一鍵轉多平台
            </TabsTrigger>
            <TabsTrigger value="vision" className="gap-1">
              🔍 圖片理解分析
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-3 pr-2">
            {/* Tab 1: Visual Directions */}
            <TabsContent value="directions" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {directions.map((dir) => (
                  <div
                    key={dir.id}
                    onClick={() => {
                      setSelectedDir(dir);
                      setAuditResult(
                        auditStudentPerspective({
                          headline: dir.headline,
                          caption: conversion.igPost.caption,
                          cta: dir.subhead,
                        })
                      );
                    }}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                      selectedDir.id === dir.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-surface hover:bg-surface-2/60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`text-xs ${selectedDir.id === dir.id ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"}`}>
                          {dir.name.split("：")[0]}
                        </Badge>
                        <span className="text-[11px] text-muted">{dir.aspectRatio}</span>
                      </div>
                      <h4 className="font-bold text-sm text-fg mb-1">{dir.name.split("：")[1]}</h4>
                      <p className="text-xs text-muted mb-3 line-clamp-2">{dir.concept}</p>
                      
                      <div className="bg-surface-2 rounded-lg p-2.5 mb-3 border border-border/60">
                        <p className="text-xs font-semibold text-primary whitespace-pre-line mb-1">
                          {dir.headline}
                        </p>
                        <p className="text-[11px] text-muted">{dir.subhead}</p>
                      </div>

                      <div className="flex items-center gap-1.5 mb-2">
                        {dir.colorPalette.map((c, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                            <span className="text-[10px] text-muted">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-muted text-[11px]">{dir.atmosphere.split("、")[0]}</span>
                      {selectedDir.id === dir.id && (
                        <span className="text-primary font-medium flex items-center gap-1 text-xs">
                          <CheckCircle2 className="size-3.5" /> 已選取
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Details */}
              <div className="rounded-xl border border-border bg-surface-2/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fg flex items-center gap-1.5">
                    <Wand2 className="size-3.5 text-primary" />
                    已選視覺方向之 AI 繪圖 Prompt 與排版建議
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDir.imagePrompt);
                      toast.success("已複製 AI 圖片 Prompt！");
                    }}
                  >
                    <Copy className="size-3" /> 複製 Prompt
                  </Button>
                </div>
                <div className="text-xs font-mono bg-bg/80 border border-border p-2.5 rounded-lg text-muted select-all">
                  {selectedDir.imagePrompt}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-surface border border-border/60">
                    <span className="font-semibold text-primary block mb-0.5">構圖與留白策略</span>
                    <span className="text-muted">{selectedDir.composition}</span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-border/60">
                    <span className="font-semibold text-primary block mb-0.5">字體與層級</span>
                    <span className="text-muted">{selectedDir.typography}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (onApplyPlan) onApplyPlan(selectedDir);
                      onOpenChange(false);
                      toast.success(`已將「${selectedDir.name}」套用至畫布編輯器！`);
                    }}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="size-4" /> 套用至畫布編輯器
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSchedulePost("carousel")}
                    className="gap-1.5"
                  >
                    📅 排入內容日曆 (Carousel)
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Student Perspective Audit */}
            <TabsContent value="audit" className="m-0 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-fg">淡江學生真實視角模擬檢驗</h4>
                    <p className="text-xs text-muted">
                      由 AI 切換為淡江大一新生、住宿生、通勤生視角，反向檢視會不會停下來看
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">{auditResult.studentScore}</span>
                    <span className="text-xs text-muted block">學生共鳴度評分</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border/60">
                    <span className="text-xs text-muted block">IG 停留感</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {auditResult.willStopScrolling ? "✅ 第一眼會停下來" : "⚠️ 略顯平淡"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border/60">
                    <span className="text-xs text-muted block">宗教說教感</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {!auditResult.isTooReligious ? "✅ 零說教、零佛學" : "❌ 太過宗教化"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border/60">
                    <span className="text-xs text-muted block">AI 罐頭感</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {!auditResult.isTooAiFlavored ? "✅ 自然具學生人味" : "⚠️ 略有 AI 味"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-2 border border-border/60">
                    <span className="text-xs text-muted block">約朋友意願</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {auditResult.wouldInviteFriend ? "✅ 會想找室友一起" : "⚠️ 吸引力待加強"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-fg">AI 學生視角具體改進建議：</span>
                  <div className="space-y-1.5">
                    {auditResult.suggestions.map((s, idx) => (
                      <div key={idx} className="text-xs p-2 rounded bg-surface-2 text-muted">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Multimodal Conversion */}
            <TabsContent value="multimodal" className="m-0 space-y-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-pink-600">IG Carousel (5P)</Badge>
                      <span className="text-xs text-muted">情緒共鳴 → 解決方案結構</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleSchedulePost("carousel")}
                    >
                      排入 Calendar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {conversion.carousel.pages.map((p) => (
                      <div key={p.page} className="p-2.5 rounded-lg bg-surface-2 border border-border/60 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-primary block mb-1">
                            P{p.page} · {p.role}
                          </span>
                          <p className="text-xs font-semibold text-fg whitespace-pre-line mb-1">
                            {p.headline}
                          </p>
                          <p className="text-[11px] text-muted">{p.body}</p>
                        </div>
                        <span className="text-[9px] text-muted/80 mt-2 block border-t border-border/40 pt-1">
                          💡 {p.visualTip}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Story */}
                  <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-600">IG Story 互動串 (3P)</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => handleSchedulePost("story")}
                      >
                        排入限動
                      </Button>
                    </div>
                    {conversion.story.cards.map((c) => (
                      <div key={c.step} className="p-2 rounded bg-surface-2 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-fg">限動 {c.step}：{c.title}</span>
                          <Badge className="text-[10px] h-4 border border-border bg-surface-2 text-muted">{c.interactiveType}</Badge>
                        </div>
                        <p className="text-muted whitespace-pre-line text-[11px]">{c.copy}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reels */}
                  <div className="rounded-xl border border-border bg-surface p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-600">Reels 20s 短影音企劃</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => handleSchedulePost("reels")}
                      >
                        排入短影音
                      </Button>
                    </div>
                    {conversion.reelsScript.scenes.slice(0, 3).map((sc, i) => (
                      <div key={i} className="p-2 rounded bg-surface-2 text-xs">
                        <span className="font-mono text-[10px] text-primary">{sc.time}</span>
                        <p className="font-semibold text-fg text-[11px]">{sc.subtitle}</p>
                        <p className="text-[10px] text-muted">畫面：{sc.visual}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 4: Vision Analysis */}
            <TabsContent value="vision" className="m-0 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-fg">AI 多模態圖片視覺理解與轉譯</h4>
                    <p className="text-xs text-muted">
                      丟入照片、歷屆海報、Canva 設計或校園照片，AI 自動分析色彩、留白與品牌感
                    </p>
                  </div>
                  <Badge className="text-xs bg-surface-2 text-primary font-bold">
                    視覺評分 {visionAnalysis.brandFitScore}/100
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img src="/seed/cup.jpg" alt="分析範例" className="w-full h-36 object-cover" />
                    <div className="p-2 text-xs bg-surface-2">
                      <span className="font-semibold block text-fg">茶會暖心熱茶手捧.jpg</span>
                      <span className="text-[11px] text-muted">Google Drive 歷史素材</span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-2">
                      <span className="font-semibold text-primary block mb-1">畫面內容與氛圍</span>
                      <p className="text-muted">{visionAnalysis.contentSummary}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-2">
                      <span className="font-semibold text-primary block mb-1">視覺層級與留白</span>
                      <p className="text-muted">{visionAnalysis.composition}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-fg block mb-2">可進行的一鍵延伸操作：</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visionAnalysis.adaptationActions.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-2 transition-colors cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          toast.success(`已執行：${act.label}`);
                        }}
                      >
                        <div>
                          <span className="text-xs font-semibold text-fg block">{act.label}</span>
                          <span className="text-[11px] text-muted">{act.description}</span>
                        </div>
                        <ChevronRight className="size-4 text-muted shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
