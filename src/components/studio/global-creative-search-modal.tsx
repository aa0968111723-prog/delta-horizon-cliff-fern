import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchClubDrive } from "@/lib/ai/drive";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import type { CreativeSourceItem } from "@/lib/studio/campaign-types";

const QUICK = ["浮游禪光", "茶會", "龜龜", "克難坡", "三色光", "宮燈", "下雨日常", "招生活動"];

type SourceFilter = "all" | "google-drive" | "canva" | "instagram" | "ai-generated";

interface GlobalCreativeSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAsset?: (title: string, src: string) => void;
}

export function GlobalCreativeSearchModal({ open, onOpenChange, onSelectAsset }: GlobalCreativeSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceFilter>("all");
  const [driveItems, setDriveItems] = useState<CreativeSourceItem[]>([]);
  const [driveDetail, setDriveDetail] = useState<string | null>(null);

  const searchCreativeSources = useCampaignStore((s) => s.searchCreativeSources);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      void searchClubDrive({ data: { query } })
        .then((result) => {
          if (!alive) return;
          setDriveItems(result.items);
          setDriveDetail(result.detail);
        })
        .catch(() => {
          if (!alive) return;
          setDriveDetail("Drive 閘道暫時無法使用，改顯示社團示範資料夾。");
        });
    }, 280);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const results = useMemo(() => {
    const local = searchCreativeSources(query, selectedSource);
    if (selectedSource !== "all" && selectedSource !== "google-drive") return local;
    const seen = new Set(local.map((item) => `${item.source}:${item.title}`));
    const extra = driveItems.filter((item) => {
      const key = `${item.source}:${item.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [...local, ...extra];
  }, [query, selectedSource, searchCreativeSources, driveItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface p-4 text-fg sm:p-6">
        <DialogHeader className="shrink-0 border-b border-border pb-2">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Search className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">跨來源 Global Creative Search</DialogTitle>
              <DialogDescription className="text-xs text-muted">
                Drive 走官方閘道（有憑證才讀檔）。Canva / IG / AI 庫是社團記憶，不是假裝已授權。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 space-y-3 py-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 size-4 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例如：找以前晚上的茶會照片、龜龜、克難坡"
              className="bg-surface-2 pl-9 text-sm"
              data-testid="global-search-input"
              autoFocus
            />
          </div>
          {driveDetail ? <p className="text-[11px] text-muted">{driveDetail}</p> : null}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] text-muted">推薦：</span>
            {QUICK.map((kw) => (
              <Badge
                key={kw}
                className={`cursor-pointer text-[11px] ${
                  query === kw ? "bg-accent text-accent-fg" : "border border-border bg-surface text-muted hover:bg-surface-2"
                }`}
                onClick={() => setQuery(kw)}
              >
                {kw}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2 text-xs">
            {(
              [
                ["all", "全部"],
                ["google-drive", "Drive"],
                ["canva", "Canva"],
                ["instagram", "IG 歷史"],
                ["ai-generated", "AI 庫"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedSource(id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  selectedSource === id ? "bg-accent font-medium text-accent-fg" : "text-muted hover:bg-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 pr-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">找不到與「{query}」相關的素材，換個關鍵字試試。</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2">
              {results.map((item) => {
                const sourceBadge =
                  item.source === "google-drive"
                    ? "Google Drive"
                    : item.source === "canva"
                      ? "Canva"
                      : item.source === "ai-generated"
                        ? "AI 庫"
                        : "Instagram";
                return (
                  <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-surface p-3">
                    <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-surface-2">
                      <img src={item.thumbnailUrl} alt="" className="size-full object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="mb-1 flex items-center gap-1.5">
                          <Badge className="text-[10px]">{sourceBadge}</Badge>
                          <span className="text-[10px] text-muted">{item.category}</span>
                        </div>
                        <h4 className="line-clamp-1 text-xs font-semibold">{item.title}</h4>
                        <p className="line-clamp-1 text-[11px] text-muted">{item.subtitle}</p>
                        {item.metrics ? (
                          <span className="mt-0.5 block text-[10px] font-medium text-success">{item.metrics}</span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center justify-between border-t border-border/40 pt-1">
                        <span className="text-[10px] text-muted">{item.date}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 px-2 text-[11px] text-accent"
                          onClick={() => {
                            onSelectAsset?.(item.title, item.thumbnailUrl);
                            onOpenChange(false);
                            toast.success(`已把「${item.title}」帶進創作`);
                          }}
                        >
                          <Plus className="size-3" /> 加入創作
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
