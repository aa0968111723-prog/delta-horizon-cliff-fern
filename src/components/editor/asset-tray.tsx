import { Images, Star, Upload } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { AssetUploadError, decodeAssetImage } from "@/lib/studio/asset-upload";
import { ASSET_DRAG_MIME, ASSET_CATEGORIES, assetPreviewFitClass, isStampAsset, kindFromCategory, matchesAssetQuery } from "@/lib/studio/assets";
import { uid } from "@/lib/studio/ids";
import type { AssetCategory } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function AssetTray({ projectId }: { projectId: string }) {
  const assets = useStudio((s) => s.assets);
  const addAsset = useStudio((s) => s.addAsset);
  const placeAsset = useStudio((s) => s.placeAsset);
  const applyVisualToPack = useStudio((s) => s.applyVisualToPack);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const urls = useAssetUrls(assets.map((a) => a.id));
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<"all" | AssetCategory | "favorite">("all");

  const visible = useMemo(() => {
    return assets.filter((asset) => {
      if (!matchesAssetQuery(asset, q)) return false;
      if (category === "favorite") return asset.favorite;
      if (category !== "all" && asset.category !== category) return false;
      return true;
    });
  }, [assets, q, category]);

  async function onFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      let ok = 0;
      for (const file of Array.from(files)) {
        try {
          const { blob, width, height, mime } = await decodeAssetImage(file);
          const id = uid("asset");
          await getAssetStorage().put(id, blob);
          addAsset({
            id,
            name: file.name.replace(/\.[^.]+$/, ""),
            kind: kindFromCategory("photo"),
            category: "photo",
            mime,
            width,
            height,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: "upload",
            licenseNotes: "",
            licenseOwner: "",
            favorite: false,
            lastUsedAt: null,
            useCount: 0,
          });
          ok += 1;
        } catch (err) {
          toast.error(err instanceof AssetUploadError || err instanceof Error ? err.message : "上傳失敗");
        }
      }
      if (ok) toast.success(`已加入 ${ok} 張（僅存此裝置）`);
    } finally {
      setBusy(false);
    }
  }

  function place(assetId: string, name: string) {
    const ok = placeAsset(projectId, assetId);
    if (ok) toast.success(`已放入「${name}」`);
    else toast.error("無法放到畫布");
  }

  function useAsset(assetId: string, name: string, stamp: boolean) {
    if (stamp) {
      place(assetId, name);
      return;
    }
    const count = applyVisualToPack(projectId, assetId);
    if (count > 1) toast.success(`「${name}」已套成全套主視覺。`);
    else if (count === 1) toast.success(`「${name}」已套成主視覺。`);
    else toast.error("套不到畫面，再試一次。");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-xs font-medium text-muted">素材</p>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          {busy ? "處理中…" : "上傳"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <div className="px-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋" className="h-9" />
      </div>
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          全部
        </Chip>
        <Chip active={category === "favorite"} onClick={() => setCategory("favorite")}>
          <Star className="size-3" />
        </Chip>
        {ASSET_CATEGORIES.filter((item) => !item.virtual).map((item) => (
          <Chip key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>
            {item.label}
          </Chip>
        ))}
      </div>
      <p className="px-3 pb-1 text-xs text-subtle">照片點一下當主視覺，Logo 點一下放入。也可以拖到畫布。</p>
      {visible.length === 0 ? (
        <div className="p-3">
          <EmptyState icon={Images} title="沒有素材" description="上傳商品圖或 Logo，點一下就能放到畫布。" />
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="grid grid-cols-2 gap-2 p-3">
            {visible.map((asset) => {
              const stamp = isStampAsset(asset);
              return (
              <li key={asset.id}>
                <button
                  type="button"
                  draggable
                  aria-label={stamp ? `放入 ${asset.name}` : `${asset.name} 當主視覺`}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(ASSET_DRAG_MIME, asset.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => useAsset(asset.id, asset.name, stamp)}
                  className="w-full overflow-hidden rounded-lg bg-bg text-left shadow-[var(--shadow-border)]"
                >
                  <div className="aspect-square">
                    {urls[asset.id] ? (
                      <img
                        src={urls[asset.id]}
                        alt=""
                        className={cn("size-full", assetPreviewFitClass(asset, urls[asset.id]))}
                        draggable={false}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted">載入中</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <p className="truncate text-xs">{asset.name}</p>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          toggleFavorite(asset.id);
                        }
                      }}
                    >
                      <Star className={cn("size-3", asset.favorite && "fill-warn text-warn")} />
                    </span>
                  </div>
                </button>
              </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 shrink-0 items-center rounded-full px-2 text-xs",
        active ? "bg-accent text-accent-fg" : "bg-surface-2 text-muted",
      )}
    >
      {children}
    </button>
  );
}
