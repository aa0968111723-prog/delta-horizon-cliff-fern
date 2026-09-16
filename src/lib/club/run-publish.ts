import { publishToInstagram } from "@/lib/connections/oauth";
import type { LastPack } from "./last-pack.ts";
import { graphImageUrl, memoryPostFromPublish, publishCaption, publishNeedsVideo } from "./publish.ts";

export async function runPackPublish(pack: LastPack, previewSrc: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const imageUrl = graphImageUrl(previewSrc, origin);
  let live = false;
  let mediaId: string | undefined;
  let error = "";
  let needsConnect = false;

  if (publishNeedsVideo(pack.kind)) {
    error = "Reels 需要影片檔，官方 API 不能只發封面。";
  } else if (imageUrl) {
    const result = await publishToInstagram({
      data: { imageUrl, caption: publishCaption(pack), kind: pack.kind },
    });
    if (result.ok) {
      live = true;
      mediaId = result.mediaId;
    } else {
      error = result.error;
      needsConnect = "needsConnect" in result && Boolean(result.needsConnect);
    }
  } else {
    error = "官方 API 需要公開的 JPG/PNG 網址。";
  }

  return {
    live,
    error,
    needsConnect,
    post: memoryPostFromPublish({ pack, thumb: previewSrc, live, mediaId }),
    message: live
      ? "已發到社團 IG，並寫進內容記憶。下次生成會參考這篇第一句。"
      : publishNeedsVideo(pack.kind)
        ? "Reels 需要影片檔。封面與腳本已寫進 IG 記憶。"
        : needsConnect
          ? `${error} 這篇已先寫進 IG 記憶。`
          : "官方發布需要公開 JPG/PNG。這篇已寫進 IG 記憶，下次生成會參考第一句。",
  };
}
