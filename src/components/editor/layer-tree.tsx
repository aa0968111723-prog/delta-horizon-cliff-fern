import {
  ChevronDown,
  ChevronUp,
  Circle,
  Copy,
  Eye,
  EyeOff,
  ImageIcon,
  Lock,
  Minus,
  Plus,
  Square,
  Trash2,
  Type,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createImageLayer,
  createLineLayer,
  createLogoLayer,
  createShapeLayer,
  createTextLayer,
} from "@/lib/studio/layers";
import type { Artboard, BrandKit, Layer } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function LayerTree({
  projectId,
  artboard,
  brand,
}: {
  projectId: string;
  artboard: Artboard;
  brand: BrandKit;
}) {
  const selectedId = useStudio((s) => s.editor.selectedId);
  const select = useStudio((s) => s.select);
  const addLayer = useStudio((s) => s.addLayer);
  const removeLayer = useStudio((s) => s.removeLayer);
  const duplicateLayer = useStudio((s) => s.duplicateLayer);
  const updateLayer = useStudio((s) => s.updateLayer);
  const reorderLayer = useStudio((s) => s.reorderLayer);
  const assets = useStudio((s) => s.assets);
  const layers = [...artboard.layers].reverse();

  function addLogo() {
    const layer = createLogoLayer(brand);
    if (layer) addLayer(projectId, layer);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-medium text-muted">圖層</p>
        <div className="flex items-center">
          {selectedId && (
            <>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="上移"
                onClick={() => reorderLayer(projectId, selectedId, "up")}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="下移"
                onClick={() => reorderLayer(projectId, selectedId, "down")}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="複製圖層"
                onClick={() => duplicateLayer(projectId, selectedId)}
              >
                <Copy className="size-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="刪除圖層"
                onClick={() => removeLayer(projectId, selectedId)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="新增圖層">
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => addLayer(projectId, createTextLayer(brand))}>
                文字
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addLayer(projectId, createShapeLayer(brand, "rect"))}>
                矩形
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addLayer(projectId, createShapeLayer(brand, "ellipse"))}>
                圓形
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addLayer(projectId, createShapeLayer(brand, "pill"))}>
                膠囊
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addLayer(projectId, createLineLayer(brand))}>
                線條
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={addLogo} disabled={!brand.logoAssetId}>
                Logo
              </DropdownMenuItem>
              {assets.slice(0, 8).map((asset) => (
                <DropdownMenuItem
                  key={asset.id}
                  onSelect={() => addLayer(projectId, createImageLayer(asset.id, asset.name))}
                >
                  圖片 · {asset.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="px-2 pb-4">
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              selected={selectedId === layer.id}
              onSelect={() => select(layer.id)}
              onToggleHide={() => updateLayer(projectId, layer.id, { hidden: !layer.hidden })}
              onToggleLock={() => updateLayer(projectId, layer.id, { locked: !layer.locked })}
            />
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function LayerIcon({ type }: { type: Layer["type"] }) {
  const cls = "size-3.5 shrink-0 text-muted";
  if (type === "text") return <Type className={cls} />;
  if (type === "image") return <ImageIcon className={cls} />;
  if (type === "logo") return <Circle className={cls} />;
  if (type === "line") return <Minus className={cls} />;
  return <Square className={cls} />;
}

function LayerRow({
  layer,
  selected,
  onSelect,
  onToggleHide,
  onToggleLock,
}: {
  layer: Layer;
  selected: boolean;
  onSelect: () => void;
  onToggleHide: () => void;
  onToggleLock: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center rounded-md",
        selected ? "bg-surface-2" : "hover:bg-bg",
        layer.hidden && "opacity-50",
      )}
    >
      <button
        type="button"
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 truncate px-2 py-2 text-left text-sm"
        onClick={onSelect}
      >
        <LayerIcon type={layer.type} />
        <span className="truncate">{layer.name}</span>
      </button>
      <Button variant="ghost" size="icon-sm" aria-label={layer.hidden ? "顯示" : "隱藏"} onClick={onToggleHide}>
        {layer.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label={layer.locked ? "解鎖" : "鎖定"} onClick={onToggleLock}>
        {layer.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
      </Button>
    </li>
  );
}
