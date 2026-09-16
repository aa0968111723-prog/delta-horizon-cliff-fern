import { useNavigate } from "@tanstack/react-router";
import { Images, Star, Upload } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AssetCard } from "@/components/assets/asset-card";
import { AssetDetailSheet } from "@/components/assets/asset-detail";
import { BrandSubnav } from "@/components/brand/brand-subnav";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StorageNotice } from "@/components/shared/storage-notice";
import { ArtboardView } from "@/components/studio/artboard-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { AssetUploadError, decodeAssetImage } from "@/lib/studio/asset-upload";
import {
  ASSET_CATEGORIES,
  ASSET_SOURCES,
  assetUsageStatus,
  collectUsedAssetIds,
  kindFromCategory,
  matchesAssetQuery,
} from "@/lib/studio/assets";
import { formatById } from "@/lib/studio/formats";
import { uid } from "@/lib/studio/ids";
import { previewTemplate, TEMPLATE_STARTERS } from "@/lib/studio/templates";
import type { AssetCategory, AssetMeta, AssetSourceKind } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type FilterId = "all" | AssetCategory | "favorite";

export function AssetLibrary({ initialAssetId, initialCategory }: { initialAssetId?: string; initialCategory?: string } = {}) {
  const navigate = useNavigate();
  const assets = useStudio((s) => s.assets);
  const brands = useStudio((s) => s.brands);
  const projects = useStudio((s) => s.projects);
  const campaigns = useStudio((s) => s.campaigns);
  const contents = useStudio((s) => s.contents);
  const lastProjectId = useStudio((s) => s.lastProjectId);
  const addAsset = useStudio((s) => s.addAsset);
  const removeAsset = useStudio((s) => s.removeAsset);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);
  const placeAsset = useStudio((s) => s.placeAsset);
  const createFromTemplate = useStudio((s) => s.createFromTemplate);
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>(
    initialCategory && ASSET_CATEGORIES.some((c) => c.id === initialCategory) ? (initialCategory as FilterId) : "all",
  );
  const [source, setSource] = useState<"all" | AssetSourceKind>("all");
  const [usageFilter, setUsageFilter] = useState<"all" | "in-use" | "used" | "unused">("all");
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>("photo");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialAssetId ?? null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState(false);

  const usedIds = useMemo(
    () => collectUsedAssetIds(projects, brands, [...campaigns, ...contents]),
    [projects, brands, campaigns, contents],
  );
  const brand = brands[0];

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      if (!matchesAssetQuery(asset, q) && !(asset.insight?.summary ?? "").toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (source !== "all" && asset.source !== source) return false;
      const usage = assetUsageStatus(asset, usedIds);
      if (usageFilter !== "all" && usage !== usageFilter) return false;
      if (filter === "favorite") return asset.favorite;
      if (filter === "history") return usage !== "unused";
      if (filter === "template") return false;
      if (filter !== "all" && asset.category !== filter) return false;
      return true;
    });
  }, [assets, q, filter, source, usageFilter, usedIds]);

  const urls = useAssetUrls(assets.map((a) => a.id));
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: assets.length, favorite: assets.filter((a) => a.favorite).length };
    for (const cat of ASSET_CATEGORIES) {
      if (cat.id === "template") {
        map[cat.id] = TEMPLATE_STARTERS.length;
      } else if (cat.id === "history") {
        map[cat.id] = assets.filter((a) => assetUsageStatus(a, usedIds) !== "unused").length;
      } else {
        map[cat.id] = assets.filter((a) => a.category === cat.id).length;
      }
    }
    return map;
  }, [assets, usedIds]);

  async function onFiles(files: FileList | File[]) {
    setBusy(true);
    setErrors([]);
    const nextErrors: string[] = [];
    let ok = 0;
    try {
      for (const file of Array.from(files)) {
        try {
          const decoded = await decodeAssetImage(file);
          const id = uid("asset");
          await getAssetStorage().put(id, decoded.blob);
          const meta: AssetMeta = {
            id,
            name: file.name.replace(/\.[^.]+$/, "") || "未命名素材",
            kind: kindFromCategory(uploadCategory),
            category: uploadCategory,
            mime: decoded.mime,
            width: decoded.width,
            height: decoded.height,
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: "upload",
            licenseNotes: "",
            licenseOwner: brand?.name ?? "",
            favorite: false,
            lastUsedAt: null,
            useCount: 0,
          };
          addAsset(meta);
          ok += 1;
        } catch (err) {
          const message =
            err instanceof AssetUploadError
              ? err.message
              : err instanceof Error
                ? `${file.name}：${err.message}`
                : `${file.name} 上傳失敗`;
          nextErrors.push(message);
        }
      }
      if (ok) toast.success(`已加入 ${ok} 張（僅存此裝置）`);
      if (nextErrors.length) {
        setErrors(nextErrors);
        toast.error(nextErrors[0]);
      }
    } finally {
      setBusy(false);
    }
  }

  function place(asset: AssetMeta) {
    if (!lastProjectId) {
      toast.error("還沒有開啟的專案。");
      return;
    }
    const ok = placeAsset(lastProjectId, asset.id);
    if (!ok) {
      toast.error("無法放到畫布");
      return;
    }
    toast.success(`已放入「${asset.name}」`);
    void navigate({ to: "/studio/$projectId", params: { projectId: lastProjectId } });
  }

  const active = assets.find((a) => a.id === activeId) ?? null;
  const showTemplates = filter === "all" || filter === "template";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="AI Creative Library"
        title="素材庫"
        description="Logo、龜龜、活動照片、社員、淡江校園、淡水、海報、AI 生成、IG。每個素材都能請 AI 分析、延伸生成、直接加入創作。"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <BrandSubnav current="assets" />
            <Button disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              {busy ? "處理中…" : "上傳圖片"}
            </Button>
          </div>
        }
      />

      <StorageNotice className="mt-4" />

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

      <div
        className={cn(
          "mt-6 rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition-colors",
          dropOver ? "border-accent bg-surface-2 text-fg" : "border-border-strong bg-surface text-muted",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDropOver(true);
        }}
        onDragLeave={() => setDropOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropOver(false);
          if (e.dataTransfer.files.length) void onFiles(e.dataTransfer.files);
        }}
      >
        <p>把圖片拖到這裡：活動照、歷屆海報、IG 截圖、社員照、校園與淡水照。JPG / PNG / WebP / GIF / SVG，單檔 8 MB。</p>
        <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
          <span className="text-xs">上傳分類</span>
          <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as AssetCategory)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSET_CATEGORIES.filter((item) => !item.virtual).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="mt-4">
          <ErrorState
            title="部分檔案沒有加入"
            message={errors.join(" ")}
            onRetry={() => {
              setErrors([]);
              fileRef.current?.click();
            }}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋名稱、標籤、AI 看到的內容" className="max-w-sm" />
        <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="來源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部來源</SelectItem>
            {ASSET_SOURCES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={usageFilter} onValueChange={(v) => setUsageFilter(v as typeof usageFilter)}>
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="使用狀態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="in-use">使用中</SelectItem>
            <SelectItem value="used">曾使用</SelectItem>
            <SelectItem value="unused">未使用</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-subtle tabular-nums">{filter === "template" ? TEMPLATE_STARTERS.length : filtered.length} 件</p>
      </div>

      <div className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
          全部
        </FilterChip>
        <FilterChip active={filter === "favorite"} onClick={() => setFilter("favorite")} count={counts.favorite}>
          <Star className="size-3.5" />
          收藏
        </FilterChip>
        {ASSET_CATEGORIES.map((item) => (
          <FilterChip
            key={item.id}
            active={filter === item.id}
            onClick={() => setFilter(item.id)}
            count={counts[item.id] ?? 0}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      {filter === "template" || (filter === "all" && showTemplates && !q) ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium">模板</h2>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {TEMPLATE_STARTERS.map((tpl) => {
              const preview = brand ? previewTemplate(tpl, brand, assets.find((a) => a.kind === "image")?.id) : null;
              const format = formatById(tpl.formatId);
              return (
                <li key={tpl.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!brand) return;
                      const project = createFromTemplate({ templateId: tpl.id, brandId: brand.id });
                      void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
                    }}
                    className="w-full rounded-2xl bg-surface p-3 text-left shadow-[var(--shadow-border)]"
                  >
                    <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-bg">
                      {preview && brand ? (
                        <ArtboardView
                          artboard={preview}
                          brand={brand}
                          urls={urls}
                          width={Math.min(110, (110 * format.width) / format.height)}
                        />
                      ) : (
                        <span className="text-xs text-muted">預覽</span>
                      )}
                    </div>
                    <p className="mt-3 truncate text-sm font-medium">{tpl.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{tpl.description}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {filter === "template" ? null : filtered.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Images}
          title={assets.length === 0 ? "還沒有素材" : "沒有符合的素材"}
          description={
            assets.length === 0
              ? "上傳活動照片、人物或 Logo。檔案會壓縮後存在這個瀏覽器。"
              : "試試別的關鍵字、分類或來源。"
          }
          action={
            assets.length === 0 ? (
              <Button onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" />
                上傳圖片
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <li key={asset.id}>
              <AssetCard
                asset={asset}
                url={urls[asset.id]}
                usage={assetUsageStatus(asset, usedIds)}
                onOpen={() => setActiveId(asset.id)}
                onFavorite={() => toggleFavorite(asset.id)}
                onDelete={() => setPendingDelete(asset.id)}
                onPlace={lastProjectId ? () => place(asset) : undefined}
                onCreate={() =>
                  void navigate({
                    to: "/create",
                    search: { mode: "photo", idea: `用素材「${asset.name}」` },
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}

      <AssetDetailSheet
        asset={active}
        url={active ? urls[active.id] : undefined}
        usage={active ? assetUsageStatus(active, usedIds) : "unused"}
        open={Boolean(active)}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
        onDelete={() => {
          if (active) setPendingDelete(active.id);
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這個素材？</AlertDialogTitle>
            <AlertDialogDescription>
              此裝置上的檔案會一併移除。已放上畫布的圖層會變成空白預覽，無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                await getAssetStorage().delete(pendingDelete);
                removeAsset(pendingDelete);
                if (activeId === pendingDelete) setActiveId(null);
                setPendingDelete(null);
                toast.success("已從此裝置刪除");
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs",
        active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
      )}
    >
      {children}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );
}
