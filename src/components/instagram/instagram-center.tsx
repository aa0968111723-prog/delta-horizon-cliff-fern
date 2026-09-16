import { Bookmark, Grid3x3, Heart, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { CONTENT_TYPE_LABELS } from "@/lib/studio/campaign-types";
import { IG_HISTORY_SEED, ZEN_CLUB_IG_DNA, type IgPostHistoryItem } from "@/lib/studio/instagram-insights";

export function InstagramCenter({
  onUseAsTemplate,
}: {
  onUseAsTemplate?: (post: IgPostHistoryItem) => void;
}) {
  const [selectedPost, setSelectedPost] = useState<IgPostHistoryItem>(IG_HISTORY_SEED[0]);
  const scheduledPosts = useCampaignStore((s) => s.scheduledPosts);

  return (
    <div className="space-y-4" data-testid="instagram-center">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-accent">@tku_zenclub</p>
          <h2 className="text-lg font-semibold">IG 九宮格與社團 DNA</h2>
        </div>
        <p className="text-xs text-muted">示範記憶互動率 {ZEN_CLUB_IG_DNA.engagementRate} · 非即時 API</p>
      </div>

      <Tabs defaultValue="grid">
        <TabsList className="grid w-full grid-cols-2 bg-surface-2">
          <TabsTrigger value="grid" className="gap-1.5">
            <Grid3x3 className="size-3.5" />
            九宮格
          </TabsTrigger>
          <TabsTrigger value="dna" className="gap-1.5">
            <Sparkles className="size-3.5" />
            IG DNA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-3">
              <div className="grid grid-cols-3 gap-1.5">
                {scheduledPosts.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex aspect-square flex-col justify-between rounded-lg border border-accent/20 bg-surface-2 p-1.5"
                  >
                    <Badge variant="accent" className="h-4 w-fit px-1 text-[9px]">
                      已排程
                    </Badge>
                    <p className="line-clamp-2 text-[10px] font-medium">{p.title}</p>
                    <span className="text-[9px] text-muted">{CONTENT_TYPE_LABELS[p.contentType]}</span>
                  </div>
                ))}
                {IG_HISTORY_SEED.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 ${
                      selectedPost.id === post.id ? "border-accent" : "border-transparent"
                    }`}
                  >
                    <img src={post.mediaUrl} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted">節奏：宣傳 → 生活感 → 互動 → 呼吸練習</p>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge>
                    {selectedPost.mediaType} · {selectedPost.postedAt}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Heart className="size-3.5" /> {selectedPost.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="size-3.5" /> {selectedPost.saveCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="size-3.5" /> {selectedPost.shareCount}
                    </span>
                  </div>
                </div>
                <p className="max-h-28 overflow-y-auto whitespace-pre-line rounded-lg bg-surface-2 p-2.5 text-xs text-muted">
                  {selectedPost.caption}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block font-semibold text-accent">Hook（{selectedPost.aiDiagnosis.hookStrength}）</span>
                    <span className="text-muted">{selectedPost.aiDiagnosis.hookAnalysis}</span>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-2">
                    <span className="block font-semibold text-accent">學生回饋</span>
                    <span className="text-muted">{selectedPost.aiDiagnosis.studentFeedback}</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => {
                  onUseAsTemplate?.(selectedPost);
                  toast.success("已把這則語氣帶進 AI 創作");
                }}
              >
                <Sparkles className="size-4" />
                用這個風格寫下一則
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dna" className="mt-4">
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{ZEN_CLUB_IG_DNA.voiceStyle}</p>
            <div className="flex flex-wrap gap-2">
              {ZEN_CLUB_IG_DNA.coreColors.map((c) => (
                <Badge key={c}>{c}</Badge>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ZEN_CLUB_IG_DNA.topHooks.map((hook) => (
                <p key={hook} className="rounded-xl bg-surface-2 p-3 text-sm font-medium">
                  {hook}
                </p>
              ))}
            </div>
            <p className="text-xs text-muted">
              場景：克難坡、宮燈、福園、活動中心、紅線淡水站。較佳時段：平日 20:00–22:00 宿舍放鬆。
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
