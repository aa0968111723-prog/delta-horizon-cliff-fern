import { captionMeter } from "@/lib/studio/ig-surfaces";
import { cn } from "@/lib/utils";

export function CaptionMeter({
  caption,
  hashtags = [],
}: {
  caption: string;
  hashtags?: string[];
}) {
  const meter = captionMeter(caption, hashtags);
  return (
    <p
      data-testid="caption-meter"
      className={cn(
        "text-xs tabular-nums leading-5",
        meter.overCharLimit || meter.overHashtags ? "text-danger" : meter.overPreview ? "text-warn" : "text-muted",
      )}
    >
      貼文 {meter.chars}/{meter.charLimit} 字
      {" · "}
      第一行 {meter.previewChars}/{meter.previewLimit}
      {" · "}
      Hashtag {meter.hashtags}/{meter.hashtagLimit}
      {meter.overPreview ? " · 第一行會被「更多」收合" : ""}
    </p>
  );
}
