import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { ReelsPreview } from "@/components/content/reels-preview";
import type { ContentItem } from "@/lib/studio/types";
import { CLUB_HANDLE } from "@/lib/zen/labels";
import { cn } from "@/lib/utils";

export function igCaption(content: Pick<ContentItem, "copy">) {
  const { hook, body, cta, hashtags } = content.copy;
  return [hook, body, cta, hashtags.join(" ")].filter((s) => s && s.trim()).join("\n\n");
}

/** 手機感的 IG 貼文預覽：封面 + 帳號列 + Caption。 */
export function IgPostPreview({
  content,
  cover,
  handle = CLUB_HANDLE,
  className,
}: {
  content: ContentItem;
  cover?: string;
  handle?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const caption = igCaption(content);
  if (content.type === "reels") {
    return <ReelsPreview beats={content.reels} cover={cover} handle={handle} className={className} />;
  }
  const isStory = content.type === "story" || content.type === "poll";
  const slides = content.type === "carousel" && content.carousel.length ? content.carousel : null;

  return (
    <div className={cn("mx-auto w-full max-w-[22rem] overflow-hidden rounded-[26px] bg-surface shadow-[var(--shadow-float)]", className)}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="size-8 rounded-full bg-[conic-gradient(from_180deg,#F2B56B,#7FB7A8,#C9B8E8,#F2B56B)] p-[2px]">
          <span className="block size-full rounded-full bg-surface" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-xs font-semibold">{handle.replace(/^@/, "")}</p>
          <p className="truncate text-[10px] text-muted">淡水 · 淡江大學</p>
        </div>
      </div>

      <div className={cn("relative overflow-hidden bg-glow-card", isStory ? "aspect-[9/16]" : "aspect-[4/5]")}>
        {cover ? <img src={cover} alt="" className="absolute inset-0 size-full object-cover" /> : null}
        {!cover ? (
          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <p className="font-display text-2xl leading-tight text-fg drop-shadow-sm">{content.copy.hook || content.title}</p>
            <p className="mt-2 text-xs text-muted">{content.visualDirection || "主視覺尚未生成"}</p>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/70 to-transparent p-5 pt-16">
            <p className="font-display text-2xl leading-tight text-night-fg">{content.copy.hook || content.title}</p>
          </div>
        )}
        {slides ? (
          <span className="absolute top-3 right-3 rounded-full bg-night/70 px-2 py-0.5 text-[10px] text-night-fg">
            1/{slides.length}
          </span>
        ) : null}
        {isStory ? (
          <div className="absolute inset-x-3 top-3 flex gap-1">
            {(content.storyFrames.length ? content.storyFrames : [0, 1, 2]).map((_, i) => (
              <span key={i} className={cn("h-0.5 flex-1 rounded-full", i === 0 ? "bg-night-fg" : "bg-night-fg/40")} />
            ))}
          </div>
        ) : null}
      </div>

      {!isStory ? (
        <div className="px-3 pt-2.5 pb-3">
          <div className="flex items-center gap-3 text-fg">
            <Heart className="size-5" />
            <MessageCircle className="size-5" />
            <Send className="size-5" />
            <Bookmark className="ml-auto size-5" />
          </div>
          <p className={cn("mt-2 text-xs leading-relaxed whitespace-pre-wrap", !expanded && "line-clamp-3")}>
            <span className="font-semibold">{handle.replace(/^@/, "")} </span>
            {caption || "還沒有文案。"}
          </p>
          {caption.length > 80 ? (
            <button type="button" className="mt-1 text-xs text-muted" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "收合" : "…更多"}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="px-3 py-3">
          <p className="text-xs text-muted">{content.storyFrames[0]?.text || content.copy.hook || "限動第一張的字"}</p>
        </div>
      )}
    </div>
  );
}
