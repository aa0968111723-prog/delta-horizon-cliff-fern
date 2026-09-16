import { useState } from "react";
import { IgThumb } from "@/components/create/ig-thumb";
import { kindAspectClass } from "@/lib/club/last-pack";
import type { ConvertedPack } from "@/lib/convert/pack";
import type { ContentKind } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export function FormatPreview({
  kind,
  src,
  hook,
  handle = "@tku.zen",
  items,
  className,
}: {
  kind: ContentKind;
  src: string;
  hook: string;
  handle?: string;
  items: ConvertedPack["items"];
  className?: string;
}) {
  const [page, setPage] = useState(0);
  const slides = items.length ? items : [{ heading: "Hook", body: hook, visual: "主視覺" }];
  const current = slides[Math.min(page, slides.length - 1)] ?? slides[0];
  const tall = kind === "story" || kind === "reels";

  return (
    <div className={cn("space-y-3", className)} data-testid="format-preview" data-kind={kind}>
      <p className="text-xs tracking-[0.16em] text-muted">
        {kind === "carousel"
          ? "IG Carousel Preview"
          : kind === "story"
            ? "IG Story Preview"
            : kind === "reels"
              ? "Reels Preview"
              : kind === "threads"
                ? "Threads Preview"
                : kind === "line"
                  ? "LINE Preview"
                  : "IG Preview"}{" "}
        · {handle}
      </p>
      <div className={cn("mx-auto w-full", tall ? "max-w-[16rem]" : "max-w-sm")}>
        <div className="overflow-hidden rounded-[1.6rem] bg-[#111] shadow-[var(--shadow-float)]">
          {kind === "story" ? (
            <div className="relative">
              <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
                {slides.map((item, index) => (
                  <button
                    key={`${item.heading}-${index}`}
                    type="button"
                    className={cn("h-0.5 flex-1 rounded-full", index <= page ? "bg-white" : "bg-white/30")}
                    onClick={() => setPage(index)}
                    aria-label={item.heading}
                  />
                ))}
              </div>
              <p className="absolute left-3 top-6 z-10 text-[11px] text-white/90">{handle}</p>
              <IgThumb src={src} caption={current.body} className={kindAspectClass(kind)} />
            </div>
          ) : kind === "reels" ? (
            <button type="button" className="relative block w-full" onClick={() => setPage((page + 1) % slides.length)}>
              <IgThumb src={src} caption={current.body.split("\n")[0]} className={kindAspectClass(kind)} />
              <span className="absolute left-1/2 top-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white">
                ▶
              </span>
              <span className="absolute right-3 bottom-10 z-10 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white">
                {current.heading}
              </span>
            </button>
          ) : kind === "carousel" ? (
            <div>
              <IgThumb src={src} caption={current.body} className={kindAspectClass(kind)} />
              <div className="flex items-center justify-center gap-1 bg-[#111] py-2">
                {slides.map((item, index) => (
                  <button
                    key={`${item.heading}-${index}`}
                    type="button"
                    data-testid="format-page"
                    className={cn("size-1.5 rounded-full", index === page ? "bg-white" : "bg-white/35")}
                    onClick={() => setPage(index)}
                    aria-label={item.heading}
                  />
                ))}
              </div>
            </div>
          ) : (
            <IgThumb src={src} caption={kind === "ig-post" ? hook : current.body} className={kindAspectClass(kind)} />
          )}
        </div>
      </div>
      {kind === "carousel" || kind === "story" || kind === "reels" ? (
        <div className="rounded-2xl bg-bg px-3 py-2 text-sm">
          <p className="text-xs text-muted">{current.heading}</p>
          <p className="mt-1 whitespace-pre-wrap">{current.body}</p>
          <p className="mt-1 text-xs text-muted">畫面：{current.visual}</p>
          {slides.length > 1 ? (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="text-xs text-muted"
                onClick={() => setPage((page - 1 + slides.length) % slides.length)}
              >
                上一頁
              </button>
              <button type="button" className="text-xs text-muted" onClick={() => setPage((page + 1) % slides.length)}>
                下一頁
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
