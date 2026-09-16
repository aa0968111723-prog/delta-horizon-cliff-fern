import { Button } from "@/components/ui/button";
import type { IgMemoryPost, ScheduleItem } from "@/lib/studio/types";
import { feelLabel, type PostFeel } from "@/lib/zen/feel";
import { contentKindLabel } from "@/lib/studio/content";

export function IgFeedPreview({
  handle,
  upcoming,
  stories,
  memory,
  urls,
  publishingId,
  onPublish,
  onRate,
  onSelect,
}: {
  handle: string;
  upcoming: ScheduleItem[];
  stories: ScheduleItem[];
  memory: IgMemoryPost[];
  urls: Record<string, string>;
  publishingId: string | null;
  onPublish: (item: ScheduleItem) => void;
  onRate: (id: string, feel: PostFeel) => void;
  onSelect: (id: string) => void;
}) {
  const feedUpcoming = upcoming.filter((item) => item.kind === "ig-post" || item.kind === "carousel");

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">Feed Preview</h2>
      <p className="mt-1 text-xs text-muted">像學生滑到的樣子。不是後台列表。</p>
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
          {feedUpcoming.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-2xl bg-bg p-2">
              <p className="text-xs text-muted">即將 · {contentKindLabel(item.kind)}</p>
              {item.imageAssetId && urls[item.imageAssetId] ? (
                <img
                  src={urls[item.imageAssetId]}
                  alt=""
                  className="mt-2 aspect-[4/5] w-full rounded-xl object-cover"
                />
              ) : (
                <div className="mt-2 flex aspect-[4/5] items-end rounded-xl bg-surface-2 p-3 text-sm">{item.title}</div>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm">{item.caption || item.title}</p>
              <Button
                className="mt-2 min-h-11 w-full"
                size="sm"
                disabled={publishingId === item.id}
                data-testid={item.id === feedUpcoming[0]?.id ? "ig-feed-publish" : undefined}
                onClick={() => onPublish(item)}
              >
                發布到 IG
              </Button>
            </li>
          ))}
          {memory.slice(0, 4).map((post) => {
            const src = post.assetId ? urls[post.assetId] : post.mediaUrl;
            return (
              <li key={post.id} className="rounded-2xl bg-bg p-2">
                <button type="button" className="w-full text-left" onClick={() => onSelect(post.id)}>
                  <p className="text-xs text-muted">
                    Instagram / {post.date}
                    {post.feel ? ` · ${feelLabel(post.feel)}` : ""}
                  </p>
                  {src ? (
                    <img src={src} alt="" className="mt-2 aspect-square w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">{post.caption}</div>
                  )}
                  <p className="mt-2 line-clamp-4 text-sm">{post.caption}</p>
                </button>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(["strong", "ok", "weak"] as PostFeel[]).map((feel) => (
                    <Button
                      key={feel}
                      size="sm"
                      variant={post.feel === feel ? "default" : "secondary"}
                      data-testid={feel === "strong" && post.id === memory[0]?.id ? "ig-rate-strong" : undefined}
                      onClick={() => onRate(post.id, feel)}
                    >
                      {feelLabel(feel)}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
