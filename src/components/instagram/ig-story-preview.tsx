import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { pagesOf } from "@/lib/studio/layers";
import { contentKindLabel } from "@/lib/studio/status";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CLUB_HANDLE } from "@/lib/zen/club";
import { cn } from "@/lib/utils";

/**
 * IG 限動預覽：直式 9:16，點右邊進下一頁／下一則。
 * 沒有限動時誠實說，不拿貼文硬塞進直式框。
 */
export function IgStoryPreview({
  projects,
  brand,
  urls,
}: {
  projects: Project[];
  brand?: BrandKit;
  urls: Record<string, string>;
}) {
  const [storyIdx, setStoryIdx] = useState(0);
  const [pageIdx, setPageIdx] = useState(0);
  const story = projects[Math.min(storyIdx, Math.max(projects.length - 1, 0))];
  const pages = story ? pagesOf(story) : [];

  useEffect(() => {
    setPageIdx(0);
  }, [storyIdx, story?.id]);

  if (!projects.length || !story) {
    return (
      <div className="rounded-2xl bg-surface px-4 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs text-subtle">限動預覽 · {CLUB_HANDLE}</p>
        <p className="mt-2 text-sm text-muted">還沒有限動或 Reels 可以預覽。</p>
        <p className="mt-1 text-xs text-subtle">做成限動之後，這裡會用直式 9:16 看。</p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/create" search={{ from: "idea", kind: "story" }}>
            做一則限動
          </Link>
        </Button>
      </div>
    );
  }

  const page = pages[Math.min(pageIdx, Math.max(pages.length - 1, 0))];
  const lastPage = pages.length - 1;
  const lastStory = projects.length - 1;

  function goPrev() {
    if (pageIdx > 0) {
      setPageIdx((current) => current - 1);
      return;
    }
    if (storyIdx > 0) setStoryIdx((current) => current - 1);
  }

  function goNext() {
    if (pageIdx < lastPage) {
      setPageIdx((current) => current + 1);
      return;
    }
    if (storyIdx < lastStory) setStoryIdx((current) => current + 1);
  }

  return (
    <div className="mx-auto w-full max-w-[18rem]">
      <p className="mb-2 text-xs text-subtle">
        限動預覽 · {contentKindLabel(story.contentKind)} · {storyIdx + 1}/{projects.length}
      </p>
      <div className="relative overflow-hidden rounded-[1.75rem] bg-surface shadow-[var(--shadow-lift)]">
        <div className="flex gap-1 px-3 pt-3">
          {pages.map((item, i) => (
            <span
              key={item.role ?? i}
              className={cn("h-0.5 flex-1 rounded-full", i <= pageIdx ? "bg-accent" : "bg-border-strong")}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="three-lights size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{CLUB_HANDLE}</p>
            <p className="truncate text-xs text-subtle">{story.name}</p>
          </div>
        </div>
        <div className="relative aspect-[9/16] overflow-hidden bg-surface-2">
          {page && brand ? (
            <span className="flex size-full items-center justify-center">
              <ArtboardView artboard={page} brand={brand} urls={urls} width={280} />
            </span>
          ) : (
            <span className="flex size-full items-center justify-center px-4 text-center text-sm text-muted">
              {story.copy.headline || story.name}
            </span>
          )}
          <button
            type="button"
            aria-label="上一則限動"
            onClick={goPrev}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            type="button"
            aria-label="下一則限動"
            onClick={goNext}
            className="absolute inset-y-0 right-0 w-2/3"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link to="/studio/$projectId" params={{ projectId: story.id }}>
            打開這則
          </Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/create" search={{ from: "idea", kind: "story" }}>
            再做一則限動
          </Link>
        </Button>
      </div>
    </div>
  );
}
