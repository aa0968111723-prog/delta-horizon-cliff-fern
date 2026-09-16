import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { whyPostWorked } from "@/lib/zen/insights";
import type { IgMemoryPost } from "@/lib/zen/types";

const MEDIA_LABEL: Record<IgMemoryPost["mediaType"], string> = {
  image: "單張",
  carousel: "Carousel",
  reels: "Reels",
};

export function IgPostSheet({
  post,
  src,
  open,
  onOpenChange,
  analyzeBusy,
  createBusy,
  onAnalyze,
  onCreate,
}: {
  post: IgMemoryPost | null;
  src?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analyzeBusy: boolean;
  createBusy: boolean;
  onAnalyze: () => void;
  onCreate: () => void;
}) {
  if (!post) return null;
  const day = new Date(post.postedAt).toISOString().slice(0, 10);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto" data-testid="ig-post-sheet">
        <DialogHeader>
          <DialogTitle className="pr-8">{post.hook || MEDIA_LABEL[post.mediaType]}</DialogTitle>
          <DialogDescription>
            {day} · {MEDIA_LABEL[post.mediaType]}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-2xl bg-bg">
          {src ? (
            <img src={src} alt="" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-sm text-muted">
              {MEDIA_LABEL[post.mediaType]}
            </div>
          )}
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{post.caption}</p>
        <p className="mt-3 text-xs text-muted">
          讚 {post.likes} · 收藏 {post.saves} · 留言 {post.comments} · 觸及 {post.reach}
        </p>
        <p className="mt-2 text-sm">{whyPostWorked(post)}</p>
        {post.analysis ? <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{post.analysis}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={analyzeBusy} onClick={onAnalyze}>
            {analyzeBusy ? "分析中…" : "AI 分析"}
          </Button>
          <Button size="sm" data-testid="ig-post-create" disabled={createBusy} onClick={onCreate}>
            <Sparkles className="size-4" />
            {createBusy ? "正在延續…" : "用這則做新的"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
