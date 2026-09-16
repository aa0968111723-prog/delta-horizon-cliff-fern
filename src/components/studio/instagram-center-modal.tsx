import { useState } from "react";
import { Instagram, Grid, Heart, MessageCircle, Bookmark, Share2, Sparkles, TrendingUp, Calendar, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IG_HISTORY_SEED, ZEN_CLUB_IG_DNA, type IgPostHistoryItem } from "@/lib/studio/instagram-insights";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { toast } from "sonner";

interface InstagramCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseAsTemplate?: (post: IgPostHistoryItem) => void;
}

export function InstagramCenterModal({ open, onOpenChange, onUseAsTemplate }: InstagramCenterModalProps) {
  const [selectedPost, setSelectedPost] = useState<IgPostHistoryItem>(IG_HISTORY_SEED[0]);
  const [activeTab, setActiveTab] = useState("grid");
  const scheduledPosts = useCampaignStore((s) => s.scheduledPosts);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden bg-surface text-fg rounded-2xl">
        <DialogHeader className="shrink-0 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600">
                <Instagram className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">
                  淡江大學禪學社 Instagram Center
                </DialogTitle>
                <DialogDescription className="text-xs text-muted">
                  IG 9宮格排版、歷史貼文診斷、Zen Club IG DNA 學習與成效回饋
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs border border-border bg-surface-2 text-muted">
                @tku_zenclub
              </Badge>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="size-3.5" /> 互動率 8.4%
              </span>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 pt-2">
          <TabsList className="grid grid-cols-3 shrink-0 bg-surface-2 text-xs">
            <TabsTrigger value="grid" className="gap-1">
              <Grid className="size-3.5" /> IG 9宮格與歷史貼文
            </TabsTrigger>
            <TabsTrigger value="dna" className="gap-1">
              🧬 Zen Club IG DNA
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1">
              📅 內容排程日曆 ({scheduledPosts.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-3 pr-2">
            {/* Tab 1: Grid & History */}
            <TabsContent value="grid" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Simulated IG Grid */}
                <div className="rounded-xl border border-border p-3.5 bg-surface-2/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-semibold text-fg">即時 IG Feed / Grid 預覽</span>
                    <span className="text-[11px] text-muted">點選檢視貼文成效分析</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden bg-black/5 p-1.5">
                    {/* Combine scheduled and history */}
                    {scheduledPosts.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="aspect-square bg-surface border border-primary/20 rounded relative flex flex-col justify-between p-1.5 cursor-pointer hover:opacity-90"
                      >
                        <Badge className="bg-primary/80 text-[8px] h-3.5 px-1 w-fit">已排程</Badge>
                        <p className="text-[10px] font-medium line-clamp-2 text-fg">{p.title}</p>
                        <span className="text-[8px] text-muted">{p.contentType}</span>
                      </div>
                    ))}
                    {IG_HISTORY_SEED.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`aspect-square relative rounded overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedPost.id === post.id ? "border-pink-500 scale-[0.98]" : "border-transparent"
                        }`}
                      >
                        <img src={post.mediaUrl} alt="IG" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-[10px] font-bold">
                          <span className="flex items-center gap-0.5"><Heart className="size-3 fill-white" /> {post.likeCount}</span>
                          <span className="flex items-center gap-0.5"><Bookmark className="size-3 fill-white" /> {post.saveCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted text-center">
                    AI 建議節奏：宣傳 (茶會) → 生活感 (下雨生存) → 互動 (爬坡減壓) → 知識 (呼吸靜心)
                  </p>
                </div>

                {/* Selected Post AI Analysis */}
                <div className="rounded-xl border border-border p-4 bg-surface space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="text-xs border border-pink-400 bg-pink-500/10 text-pink-600">
                        {selectedPost.mediaType} · {selectedPost.postedAt}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Heart className="size-3.5 text-pink-500" /> {selectedPost.likeCount}</span>
                        <span className="flex items-center gap-1"><Bookmark className="size-3.5 text-amber-500" /> {selectedPost.saveCount}</span>
                        <span className="flex items-center gap-1"><Share2 className="size-3.5 text-blue-500" /> {selectedPost.shareCount}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-surface-2 text-xs text-muted max-h-28 overflow-y-auto whitespace-pre-line">
                      {selectedPost.caption}
                    </div>

                    <div className="space-y-2 border-t border-border/60 pt-2">
                      <span className="text-xs font-bold text-fg flex items-center gap-1">
                        <Sparkles className="size-3.5 text-primary" /> AI 貼文成效診斷與學習點
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-surface-2">
                          <span className="font-semibold text-primary block">Hook 強度 ({selectedPost.aiDiagnosis.hookStrength})</span>
                          <span className="text-muted">{selectedPost.aiDiagnosis.hookAnalysis}</span>
                        </div>
                        <div className="p-2 rounded bg-surface-2">
                          <span className="font-semibold text-primary block">淡江學生回饋</span>
                          <span className="text-muted">{selectedPost.aiDiagnosis.studentFeedback}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-surface-2 text-[11px]">
                        <span className="font-semibold text-emerald-600 block mb-0.5">下一次創作建議</span>
                        <span className="text-muted">{selectedPost.aiDiagnosis.nextImprovement}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full gap-1.5 mt-2"
                    onClick={() => {
                      if (onUseAsTemplate) onUseAsTemplate(selectedPost);
                      onOpenChange(false);
                      toast.success(`已將「${selectedPost.caption.slice(0, 15)}...」的文案風格帶入創作！`);
                    }}
                  >
                    <Sparkles className="size-4" /> 參考這個風格創作新內容
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Zen Club IG DNA */}
            <TabsContent value="dna" className="m-0 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-fg">淡江大學禪學社專屬 IG DNA</h4>
                  <p className="text-xs text-muted">
                    AI 創作時優先讀取此記憶，避免套用一般大眾品牌模板，保持淡江禪學社獨特的溫暖人味與生活感
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-surface-2 border border-border/60 space-y-2">
                    <span className="font-bold text-primary block">🎨 常用代表色盤</span>
                    <div className="flex flex-wrap gap-2">
                      {ZEN_CLUB_IG_DNA.coreColors.map((c, i) => (
                        <Badge key={i} className="text-[11px] border border-border bg-surface text-fg">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-2 border border-border/60 space-y-2">
                    <span className="font-bold text-primary block">🗣️ 文案語氣方針</span>
                    <p className="text-muted leading-relaxed">{ZEN_CLUB_IG_DNA.voiceStyle}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-border/60 space-y-2 text-xs">
                  <span className="font-bold text-primary block">✨ 歷屆高共鳴第一句 Hook 範本</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ZEN_CLUB_IG_DNA.topHooks.map((hook, i) => (
                      <div key={i} className="p-2 rounded bg-surface border border-border/60 text-fg font-medium">
                        {hook}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-border/60 space-y-1.5 text-xs">
                  <span className="font-bold text-primary block">📍 淡江受眾與校園生活特徵</span>
                  <p className="text-muted">
                    生活場景：克難坡、淡江宮燈、福園、活動中心、紅線淡水捷運站、大田寮、大學城雨天。
                    <br />
                    切入時機：開學第三週選課報告壓力、淡水連續陰雨天、期中考週前焦慮急救、晚間 20:00 - 22:00 宿舍放鬆時段。
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Calendar */}
            <TabsContent value="calendar" className="m-0 space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-fg">一人網宣內容排程表</h4>
                    <p className="text-xs text-muted">
                      圍繞「09/24 浮游禪光」茶會自動安排節奏：預熱 → 情緒共鳴 → 主視覺 → 倒數 → 當日提醒
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {scheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-3 rounded-xl border border-border bg-surface-2/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] uppercase bg-surface border border-border text-muted">
                            {post.contentType}
                          </Badge>
                          <span className="text-xs font-bold text-fg">{post.title}</span>
                        </div>
                        <p className="text-xs text-muted line-clamp-1">{post.hook}</p>
                        <span className="text-[10px] text-muted block">來源：{post.sourceRef}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-primary flex items-center gap-1">
                          <Calendar className="size-3.5" /> {post.scheduledAt}
                        </span>
                        <Badge
                          className={`text-[11px] ${post.status === "scheduled" ? "bg-primary text-primary-fg" : "bg-surface text-muted border border-border"}`}
                        >
                          {post.status === "scheduled" ? "已排程" : post.status === "completed" ? "已就緒" : "發布中"}
                        </Badge>
                      </div>
                    </div>
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
