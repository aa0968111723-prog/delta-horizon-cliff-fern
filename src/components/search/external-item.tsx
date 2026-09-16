import { useNavigate } from "@tanstack/react-router";
import { ExternalLink, FolderPlus, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProviderMark } from "@/components/connections/connections-page";
import { Button } from "@/components/ui/button";
import { fetchExternalImage } from "@/lib/connections/api";
import type { ExternalItem } from "@/lib/connections/providers";
import { PROVIDERS } from "@/lib/connections/providers";
import { saveGeneratedImage } from "@/lib/studio/generated-assets";
import type { AssetCategory } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

export function sourceLabel(item: ExternalItem) {
  return `${PROVIDERS[item.provider].label} / ${item.date ? item.date.slice(0, 10) : item.title.slice(0, 16)}`;
}

/** 外部項目卡（Drive / Canva / IG）：一律標示來源，可存進素材庫或直接加入創作。 */
export function ExternalItemCard({ item, className }: { item: ExternalItem; className?: string }) {
  const navigate = useNavigate();
  const addAsset = useStudio((s) => s.addAsset);
  const assets = useStudio((s) => s.assets);
  const [busy, setBusy] = useState(false);
  const existing = assets.find((a) => a.externalRef?.provider === item.provider && a.externalRef.id === item.id);

  async function importToLibrary(): Promise<string | null> {
    if (existing) return existing.id;
    if (!item.thumbnail) {
      toast.message("這個項目沒有縮圖，無法存成素材。");
      return null;
    }
    setBusy(true);
    try {
      const res = await fetchExternalImage({ data: { provider: item.provider, url: item.thumbnail } });
      if (!res.ok) {
        toast.error(res.error);
        return null;
      }
      const category: AssetCategory = item.provider === "instagram" ? "ig" : item.provider === "canva" ? "poster" : "archive";
      const meta = await saveGeneratedImage({
        src: res.dataUrl,
        name: item.title,
        prompt: "",
        category,
        source: item.provider,
        tags: [PROVIDERS[item.provider].label, item.kind],
      });
      addAsset({ ...meta, licenseNotes: `來源：${sourceLabel(item)}`, externalRef: { provider: item.provider, id: item.id, url: item.url ?? undefined, label: sourceLabel(item) } });
      toast.success(`已存進素材庫（${sourceLabel(item)}）`);
      return meta.id;
    } finally {
      setBusy(false);
    }
  }

  async function useInCreate() {
    const id = await importToLibrary();
    void navigate({
      to: "/create",
      search: { mode: item.provider === "instagram" ? "ig" : item.provider === "canva" ? "canva" : "drive", idea: `${item.provider === "instagram" ? "延伸這篇舊貼文" : "延續這個素材"}：${(item.caption || item.title).slice(0, 80)}${id ? "" : ""}` },
    });
  }

  return (
    <div className={cn("flex gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]", className)}>
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-glow-card">
        {item.thumbnail ? <img src={item.thumbnail} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : null}
        <ProviderMark provider={item.provider} className="absolute bottom-1 left-1 size-5 rounded-md text-[9px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {item.subtitle} · {item.kind}
        </p>
        {item.metrics && (item.metrics.likes != null || item.metrics.reach != null) ? (
          <p className="mt-0.5 text-[11px] text-subtle tabular-nums">
            {item.metrics.likes != null ? `♥ ${item.metrics.likes} ` : ""}
            {item.metrics.comments != null ? `💬 ${item.metrics.comments} ` : ""}
            {item.metrics.saves != null ? `收藏 ${item.metrics.saves} ` : ""}
            {item.metrics.reach != null ? `觸及 ${item.metrics.reach}` : ""}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" className="h-7 rounded-full px-2 text-xs" onClick={() => void useInCreate()} disabled={busy}>
            <Sparkles className="size-3" /> 加入創作
          </Button>
          <Button size="sm" variant="ghost" className="h-7 rounded-full px-2 text-xs" onClick={() => void importToLibrary()} disabled={busy || Boolean(existing)}>
            {busy ? <RefreshCw className="size-3 animate-spin" /> : <FolderPlus className="size-3" />}
            {existing ? "已在素材庫" : "存進素材庫"}
          </Button>
          {item.url ? (
            <Button size="sm" variant="ghost" className="h-7 rounded-full px-2 text-xs" asChild>
              <a href={item.url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3" /> 開啟
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
