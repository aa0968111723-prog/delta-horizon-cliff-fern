import { BrainCircuit, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ASSET_DRAG_MIME, categoryLabel, provenanceLabel, sourceLabel, usageLabel } from "@/lib/studio/assets";
import type { AssetMeta, AssetUsageStatus } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export function AssetCard({
  asset,
  url,
  usage,
  draggable = true,
  onOpen,
  onFavorite,
  onDelete,
  onPlace,
  onCreate,
}: {
  asset: AssetMeta;
  url?: string;
  usage: AssetUsageStatus;
  draggable?: boolean;
  onOpen: () => void;
  onFavorite: () => void;
  onDelete?: () => void;
  onPlace?: () => void;
  onCreate?: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const referenceOnly = !url && asset.width === 0 && !asset.seedSrc;

  return (
    <article
      className="group overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]"
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData(ASSET_DRAG_MIME, asset.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-square bg-bg">
          {url && !broken ? (
            <img
              src={url}
              alt={asset.name}
              className="size-full object-cover"
              draggable={false}
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center px-3 text-center text-xs text-muted">
              {referenceOnly ? "來源參考，沒有原圖像素" : broken ? "預覽失敗" : "載入中"}
            </div>
          )}
          <span className="absolute top-2 left-2">
            <Badge variant={usage === "in-use" ? "success" : usage === "used" ? "default" : "default"}>
              {usageLabel(usage)}
            </Badge>
          </span>
          <span className="absolute bottom-2 left-2">
            <Badge variant="accent">{sourceLabel(asset.source)}</Badge>
          </span>
          {asset.analysis ? (
            <span className="absolute top-2 right-2 rounded-full bg-surface/90 p-1.5 text-accent shadow-sm" title="已有 AI 視覺分析">
              <BrainCircuit className="size-3.5" />
            </span>
          ) : null}
        </div>
      </button>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{asset.name}</p>
            <p className="truncate text-xs text-muted">
              {categoryLabel(asset.category)} · {provenanceLabel(asset)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={asset.favorite ? "取消收藏" : "收藏"}
            onClick={onFavorite}
          >
            <Star className={cn("size-4", asset.favorite && "fill-warn text-warn")} />
          </Button>
        </div>
        <p className="truncate text-xs text-subtle tabular-nums">
          {asset.width}×{asset.height}
          {asset.licenseOwner ? ` · ${asset.licenseOwner}` : ""}
        </p>
        {asset.tags.length > 0 ? (
          <p className="truncate text-xs text-subtle">{asset.tags.slice(0, 3).join(" · ")}</p>
        ) : null}
        <div className="flex items-center gap-1 pt-1">
          {onPlace && !referenceOnly ? (
            <Button size="sm" variant="secondary" className="min-h-11 flex-1" onClick={onPlace}>
              放到畫布
            </Button>
          ) : null}
          {referenceOnly ? (
            <p className="flex-1 text-xs leading-5 text-muted">沒有原圖，不能放到畫布。</p>
          ) : null}
          {onDelete ? (
            <Button variant="ghost" size="icon-sm" aria-label={`刪除 ${asset.name}`} onClick={onDelete}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
