import { useState, useMemo } from "react";
import { Search, FolderOpen, Image, Sparkles, Instagram, ExternalLink, Plus, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { toast } from "sonner";

interface GlobalCreativeSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAsset?: (title: string, src: string) => void;
}

export function GlobalCreativeSearchModal({ open, onOpenChange, onSelectAsset }: GlobalCreativeSearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  const creativeSources = useCampaignStore((s) => s.creativeSources);
  const searchCreativeSources = useCampaignStore((s) => s.searchCreativeSources);

  const results = useMemo(() => {
    return searchCreativeSources(query, selectedSource);
  }, [query, selectedSource, searchCreativeSources]);

  const quickKeywords = ["浮游禪光", "茶會", "龜龜", "克難坡", "三色光", "宮燈", "下雨日常", "招生活動"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden bg-surface text-fg rounded-2xl">
        <DialogHeader className="shrink-0 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Search className="size-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                跨來源 Global Creative Search
              </DialogTitle>
              <DialogDescription className="text-xs text-muted">
                一個搜尋框同時檢索：Google Drive 素材、Canva 設計、Instagram 歷史貼文、AI 生成庫
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋素材、照片、Canva、IG 歷史，例如：找以前晚上的茶會照片、找有龜龜的素材..."
              className="pl-9 bg-surface-2 text-sm"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted mr-1">推薦關鍵字：</span>
            {quickKeywords.map((kw) => (
              <Badge
                key={kw}
                className={`cursor-pointer text-[11px] ${
                  query === kw ? "bg-primary text-primary-fg" : "border border-border bg-surface text-muted hover:bg-surface-2"
                }`}
                onClick={() => setQuery(kw)}
              >
                {kw}
              </Badge>
            ))}
          </div>

          <div className="flex gap-1.5 border-b border-border/60 pb-2 text-xs">
            <button
              onClick={() => setSelectedSource("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedSource === "all" ? "bg-primary text-primary-fg font-medium" : "text-muted hover:bg-surface-2"
              }`}
            >
              全部來源 ({results.length})
            </button>
            <button
              onClick={() => setSelectedSource("google-drive")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                selectedSource === "google-drive" ? "bg-primary text-primary-fg font-medium" : "text-muted hover:bg-surface-2"
              }`}
            >
              <FolderOpen className="size-3.5" /> Google Drive
            </button>
            <button
              onClick={() => setSelectedSource("canva")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                selectedSource === "canva" ? "bg-primary text-primary-fg font-medium" : "text-muted hover:bg-surface-2"
              }`}
            >
              <Image className="size-3.5" /> Canva
            </button>
            <button
              onClick={() => setSelectedSource("instagram")}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                selectedSource === "instagram" ? "bg-primary text-primary-fg font-medium" : "text-muted hover:bg-surface-2"
              }`}
            >
              <Instagram className="size-3.5" /> Instagram 歷史
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-muted text-xs">
              找不到與「{query}」相關的跨來源素材，請換個關鍵字試試。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {results.map((item) => {
                const sourceBadge =
                  item.source === "google-drive"
                    ? { label: "Google Drive", color: "bg-blue-600/10 text-blue-600 border-blue-200" }
                    : item.source === "canva"
                    ? { label: "Canva Design", color: "bg-indigo-600/10 text-indigo-600 border-indigo-200" }
                    : { label: "Instagram", color: "bg-pink-600/10 text-pink-600 border-pink-200" };

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-surface p-3 flex gap-3 hover:bg-surface-2/40 transition-colors"
                  >
                    <div className="size-20 rounded-lg overflow-hidden shrink-0 border border-border/80 bg-surface-2">
                      <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge className={`text-[10px] px-1.5 py-0 border ${sourceBadge.color}`}>
                            {sourceBadge.label}
                          </Badge>
                          <span className="text-[10px] text-muted">{item.category}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-fg line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-muted line-clamp-1">{item.subtitle}</p>
                        {item.metrics && (
                          <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                            📊 {item.metrics}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-border/40">
                        <span className="text-[10px] text-muted">{item.date}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[11px] gap-1 px-2 text-primary"
                          onClick={() => {
                            if (onSelectAsset) onSelectAsset(item.title, item.thumbnailUrl);
                            onOpenChange(false);
                            toast.success(`已將「${item.title}」加入當前創作！`);
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
