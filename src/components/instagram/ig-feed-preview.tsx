import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { pagesOf } from "@/lib/studio/layers";
import { igPostText, packStats, IG_CAPTION_LIMIT } from "@/lib/studio/post-pack";
import { contentKindLabel } from "@/lib/studio/status";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CLUB_HANDLE, CLUB_NAME } from "@/lib/zen/club";
import { cn } from "@/lib/utils";

/**
 * IG 動態預覽：像打開 Instagram 那樣往下刷。
 * 輪播可以翻頁。不編造讚數；連接之後才會有真實互動。
 */
export function IgFeedPreview({
  projects,
  brand,
  urls,
}: {
  projects: Project[];
  brand?: BrandKit;
  urls: Record<string, string>;
}) {
  if (!projects.length) return null;

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="mb-2 text-xs text-subtle">動態預覽 · {CLUB_HANDLE}</p>
      <div className="overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-lift)]">
        <ul>
          {projects.slice(0, 4).map((project) => (
            <FeedPost key={project.id} project={project} brand={brand} urls={urls} />
          ))}
        </ul>
        <p className="px-3 py-2 text-xs text-subtle">讚、留言是 IG 上的，這裡不編造數字。</p>
      </div>
      <div className="mt-3 flex justify-center">
        <Button asChild size="sm" variant="secondary">
          <Link to="/create" search={{ from: "idea" }}>
            再寫一篇
          </Link>
        </Button>
      </div>
    </div>
  );
}

function FeedPost({
  project,
  brand,
  urls,
}: {
  project: Project;
  brand?: BrandKit;
  urls: Record<string, string>;
}) {
  const pages = pagesOf(project);
  const [index, setIndex] = useState(0);
  const page = pages[Math.min(index, Math.max(pages.length - 1, 0))];
  const caption = igPostText(project.copy);
  const stats = packStats(caption, IG_CAPTION_LIMIT);
  const last = pages.length - 1;

  return (
    <li className="min-w-0 shadow-[var(--shadow-border)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="three-lights size-8 shrink-0 rounded-full" />
        <Link to="/studio/$projectId" params={{ projectId: project.id }} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{CLUB_HANDLE}</p>
          <p className="truncate text-xs text-subtle">{CLUB_NAME}</p>
        </Link>
        <span className="text-xs text-subtle">{contentKindLabel(project.contentKind)}</span>
      </div>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {page && brand ? (
          <span className="flex size-full items-center justify-center">
            <ArtboardView artboard={page} brand={brand} urls={urls} width={360} />
          </span>
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted">{project.name}</span>
        )}
        {pages.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="上一頁"
              disabled={index <= 0}
              onClick={() => setIndex((current) => Math.max(0, current - 1))}
              className="absolute inset-y-0 left-0 flex w-12 items-center justify-center text-accent-fg disabled:opacity-0"
            >
              <ChevronLeft className="size-5 drop-shadow" />
            </button>
            <button
              type="button"
              aria-label="下一頁"
              disabled={index >= last}
              onClick={() => setIndex((current) => Math.min(last, current + 1))}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-accent-fg disabled:opacity-0"
            >
              <ChevronRight className="size-5 drop-shadow" />
            </button>
            <p className="pointer-events-none absolute top-2 right-2 rounded-full bg-fg/55 px-2 py-0.5 text-xs text-accent-fg tabular-nums">
              {index + 1}/{pages.length}
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {pages.map((item, i) => (
                <span
                  key={item.role ?? i}
                  className={cn("size-1.5 rounded-full", i === index ? "bg-accent-fg" : "bg-accent-fg/40")}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-3 px-3 py-2 text-muted" aria-hidden>
        <Heart className="size-5" />
        <MessageCircle className="size-5" />
        <Send className="size-5" />
      </div>
      <p className={cn("px-3 pb-3 text-sm leading-relaxed", !caption && "text-subtle")}>
        <span className="font-medium">{CLUB_HANDLE} </span>
        {stats.preview || project.copy.headline || project.name}
        {stats.hasMore ? "…" : ""}
      </p>
    </li>
  );
}
