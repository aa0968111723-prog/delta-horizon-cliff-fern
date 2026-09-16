import { Heart, MessageCircle, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { igPostText, packStats, IG_CAPTION_LIMIT } from "@/lib/studio/post-pack";
import { contentKindLabel } from "@/lib/studio/status";
import type { BrandKit, Project } from "@/lib/studio/types";
import { CLUB_HANDLE, CLUB_NAME } from "@/lib/zen/club";
import { cn } from "@/lib/utils";

/**
 * IG 動態預覽：像打開 Instagram 那樣往下刷。
 * 不編造讚數；連接之後才會有真實互動。
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
        <header className="flex items-center gap-2 border-b border-transparent px-3 py-2.5 shadow-[var(--shadow-border)]">
          <span className="three-lights size-7 rounded-full" />
          <span className="text-sm font-medium">{CLUB_HANDLE}</span>
        </header>
        <ul>
          {projects.slice(0, 4).map((project) => {
            const board = project.artboards[project.activeFormatId];
            const caption = igPostText(project.copy);
            const stats = packStats(caption, IG_CAPTION_LIMIT);
            return (
              <li key={project.id} className="min-w-0 shadow-[var(--shadow-border)]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="three-lights size-8 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{CLUB_HANDLE}</p>
                    <p className="truncate text-xs text-subtle">{CLUB_NAME}</p>
                  </div>
                  <span className="text-xs text-subtle">{contentKindLabel(project.contentKind)}</span>
                </div>
                <Link
                  to="/studio/$projectId"
                  params={{ projectId: project.id }}
                  className="block aspect-[4/5] overflow-hidden bg-surface-2"
                >
                  {board && brand ? (
                    <span className="flex size-full items-center justify-center">
                      <ArtboardView artboard={board} brand={brand} urls={urls} width={360} />
                    </span>
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs text-muted">
                      {project.name}
                    </span>
                  )}
                </Link>
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
          })}
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
