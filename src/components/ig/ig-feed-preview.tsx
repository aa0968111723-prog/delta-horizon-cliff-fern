import { Button } from "@/components/ui/button";
import { AssetMedia } from "@/components/shared/asset-media";
import type { IgMemoryPost, ScheduleItem } from "@/lib/studio/types";
import { feelLabel, type PostFeel } from "@/lib/zen/feel";
import { isDue } from "@/lib/zen/schedule";
import { encodedCarouselIds } from "@/lib/ai/carousel-pages";
import { previewMediaId, reelsPreviewReady } from "@/lib/ai/reels-asset";
import { contentKindLabel } from "@/lib/studio/content";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function IgFeedPreview({
  handle,
  upcoming,
  stories,
  reels,
  memory,
  urls,
  videoIds,
  publishingId,
  postedId,
  onPublish,
  onRate,
  onSelect,
}: {
  handle: string;
  upcoming: ScheduleItem[];
  stories: ScheduleItem[];
  reels: ScheduleItem[];
  memory: IgMemoryPost[];
  urls: Record<string, string>;
  videoIds: string[];
  publishingId: string | null;
  postedId?: string;
  onPublish: (item: ScheduleItem) => void;
  onRate: (id: string, feel: PostFeel) => void;
  onSelect: (id: string) => void;
}) {
  const feedUpcoming = upcoming.filter((item) => item.kind === "ig-post" || item.kind === "carousel");
  const nextCarousel =
    upcoming.find((item) => item.kind === "carousel" && encodedCarouselIds(item).length >= 2) ??
    upcoming.find((item) => item.kind === "carousel");
  const nextUp = feedUpcoming.find((item) => item.id !== nextCarousel?.id) ?? (nextCarousel ? undefined : feedUpcoming[0]);
  const nextReel = reels[0];
  const showReels = reelsPreviewReady(nextReel, urls);
  const orderedMemory = postedId
    ? [...memory.filter((post) => post.id === postedId), ...memory.filter((post) => post.id !== postedId)]
    : memory;
  const videoSet = new Set(videoIds);

  return (
    <section className="mt-8">
      {nextCarousel ? <CarouselPreview item={nextCarousel} urls={urls} publishingId={publishingId} onPublish={onPublish} /> : null}

      {showReels && nextReel ? (
        <div className="mx-auto mb-8 w-full max-w-[12rem] sm:max-w-[16rem] md:max-w-[18rem]" data-testid="ig-reels-preview">
          <h2 className="text-sm font-medium">Reels Preview</h2>
          <p className="mt-1 text-xs text-muted">9:16 短影音。編成後在這裡看，再排入 Calendar。</p>
          <div className="mt-3 overflow-hidden rounded-[1.75rem] bg-surface p-2 shadow-[var(--shadow-artboard)]">
            {previewMediaId(nextReel) && urls[previewMediaId(nextReel)!] ? (
              <AssetMedia
                src={urls[previewMediaId(nextReel)!]}
                video={Boolean(nextReel.videoAssetId && videoSet.has(nextReel.videoAssetId))}
                controls
                className="aspect-[9/16] w-full rounded-[1.4rem]"
                testId={
                  nextReel.videoAssetId && videoSet.has(nextReel.videoAssetId) ? "ig-reels-film" : "ig-reels-cover"
                }
              />
            ) : (
              <div className="flex aspect-[9/16] items-end rounded-[1.4rem] bg-surface-2 p-4 text-sm">{nextReel.title}</div>
            )}
            <p className="mt-2 px-1 text-xs text-muted">{isDue(nextReel) ? "現在可以發" : "即將"} · Reels</p>
            <p className="mt-1 line-clamp-2 px-1 text-sm">{nextReel.caption || nextReel.title}</p>
            {nextReel.videoAssetId ? (
              <Button
                className="mt-2 min-h-11 w-full"
                size="sm"
                disabled={publishingId === nextReel.id}
                data-testid="ig-reels-publish"
                onClick={() => onPublish(nextReel)}
              >
                發布到 IG
              </Button>
            ) : (
              <Button className="mt-2 min-h-11 w-full" size="sm" variant="secondary" asChild>
                <Link to="/create" search={{ mode: "reels", idea: nextReel.caption || nextReel.title }}>
                  編成短影音
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <h2 className="text-sm font-medium">Feed Preview</h2>
      <p className="mt-1 text-xs text-muted">像學生滑到的樣子。剛發布的在上面，可以標記會不會停。</p>
      <div
        className="mx-auto mt-4 w-full max-w-[22rem] overflow-hidden rounded-[1.75rem] bg-surface p-3 shadow-[var(--shadow-artboard)]"
        data-testid="ig-feed"
      >
        <p className="px-1 text-sm font-medium">{handle}</p>
        {stories.length ? (
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" data-testid="ig-story-strip">
            {stories.slice(0, 8).map((item) => {
              const src = item.imageAssetId ? urls[item.imageAssetId] : undefined;
              return (
                <li key={item.id} className="flex w-16 shrink-0 flex-col items-center gap-1">
                  <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-accent/20 ring-2 ring-amber">
                    {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="text-xs">限</span>}
                  </div>
                  <p className="w-full truncate text-center text-xs text-muted">{contentKindLabel(item.kind)}</p>
                </li>
              );
            })}
          </ul>
        ) : null}
        <ul className="mt-3 space-y-5">
          {orderedMemory.slice(0, 6).map((post, index) => {
            const src = post.assetId ? urls[post.assetId] : post.mediaUrl;
            const isFilm = Boolean(post.assetId && videoSet.has(post.assetId));
            return (
              <li key={post.id} className="rounded-2xl bg-bg p-2">
                <button type="button" className="w-full text-left" onClick={() => onSelect(post.id)}>
                  <p className="text-xs text-muted">
                    Instagram / {post.date}
                    {post.feel ? ` · ${feelLabel(post.feel)}` : ""}
                  </p>
                  {src ? (
                    <AssetMedia
                      src={src}
                      video={isFilm}
                      className={
                        isFilm
                          ? "mt-2 aspect-[9/16] w-full rounded-xl object-cover"
                          : "mt-2 aspect-square w-full rounded-xl object-cover"
                      }
                    />
                  ) : (
                    <div className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">{post.caption}</div>
                  )}
                  <p className="mt-2 line-clamp-4 text-sm" data-testid={index === 0 ? "ig-memory-first" : undefined}>
                    {post.caption}
                  </p>
                </button>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(["strong", "ok", "weak"] as PostFeel[]).map((feel) => (
                    <Button
                      key={feel}
                      size="sm"
                      variant={post.feel === feel ? "default" : "secondary"}
                      data-testid={feel === "strong" && index === 0 ? "ig-rate-strong" : undefined}
                      onClick={() => onRate(post.id, feel)}
                    >
                      {feelLabel(feel)}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
          {nextUp ? (
            <li className="flex gap-3 rounded-2xl bg-bg p-2">
              {nextUp.imageAssetId && urls[nextUp.imageAssetId] ? (
                <img src={urls[nextUp.imageAssetId]} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex size-16 shrink-0 items-end rounded-xl bg-surface-2 p-2 text-xs">{nextUp.title}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted" data-testid={isDue(nextUp) ? "ig-due" : undefined}>
                  {isDue(nextUp) ? "現在可以發" : "即將"} · {contentKindLabel(nextUp.kind)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm">{nextUp.caption || nextUp.title}</p>
                <Button
                  className="mt-2 min-h-11 w-full"
                  size="sm"
                  disabled={publishingId === nextUp.id}
                  data-testid="ig-feed-publish"
                  onClick={() => onPublish(nextUp)}
                >
                  發布到 IG
                </Button>
              </div>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

function CarouselPreview({
  item,
  urls,
  publishingId,
  onPublish,
}: {
  item: ScheduleItem;
  urls: Record<string, string>;
  publishingId: string | null;
  onPublish: (item: ScheduleItem) => void;
}) {
  const slides = encodedCarouselIds(item);
  const [page, setPage] = useState(0);
  const cover = item.imageAssetId ? urls[item.imageAssetId] : undefined;
  const src = slides[page] ? urls[slides[page]!] : cover;

  return (
    <div className="mx-auto mb-8 w-full max-w-[18rem] sm:max-w-[20rem]" data-testid="ig-carousel-preview">
      <h2 className="text-sm font-medium">Carousel Preview</h2>
      <p className="mt-1 text-xs text-muted">4:5 多頁。第一頁是學生 Hook。</p>
      <div className="mt-3 overflow-hidden rounded-[1.75rem] bg-surface p-2 shadow-[var(--shadow-artboard)]">
        {src ? (
          <AssetMedia src={src} className="aspect-[4/5] w-full rounded-[1.4rem]" testId="ig-carousel-page" />
        ) : (
          <div className="flex aspect-[4/5] items-end rounded-[1.4rem] bg-surface-2 p-4 text-sm">{item.title}</div>
        )}
        {slides.length >= 2 ? (
          <div className="mt-2 flex items-center justify-between gap-2 px-1">
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11"
              disabled={page === 0}
              onClick={() => setPage((n) => Math.max(0, n - 1))}
            >
              上一頁
            </Button>
            <p className="text-xs text-muted">
              {page + 1} / {slides.length}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11"
              disabled={page >= slides.length - 1}
              data-testid="ig-carousel-next"
              onClick={() => setPage((n) => Math.min(slides.length - 1, n + 1))}
            >
              下一頁
            </Button>
          </div>
        ) : (
          <Button className="mt-2 min-h-11 w-full" size="sm" variant="secondary" asChild>
            <Link to="/create" search={{ mode: "carousel", idea: item.caption || item.title }}>
              編成 Carousel
            </Link>
          </Button>
        )}
        <p className="mt-2 px-1 text-xs text-muted">{isDue(item) ? "現在可以發" : "即將"} · Carousel</p>
        <p className="mt-1 line-clamp-2 px-1 text-sm">{item.caption || item.title}</p>
        {slides.length >= 2 ? (
          <Button
            className="mt-2 min-h-11 w-full"
            size="sm"
            disabled={publishingId === item.id}
            data-testid="ig-carousel-publish"
            onClick={() => onPublish(item)}
          >
            發布到 IG
          </Button>
        ) : null}
      </div>
    </div>
  );
}
