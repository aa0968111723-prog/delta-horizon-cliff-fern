import { BrainCircuit, Search, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptySearchHint, GLOBAL_SEARCH_FILTERS, searchGlobalCreative, type GlobalSearchFilter } from "@/lib/creative/global-search";
import { searchConnectedSources } from "@/lib/connections/live-search";
import type { ExternalMemoryItem } from "@/lib/connections/types";
import { creativeMemoryStats } from "@/lib/creative/memory";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { allExternalItems, useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";

export function CreativeBrainPanel({ onOpenAsset, compact = false }: { onOpenAsset: (id: string) => void; compact?: boolean }) {
  const navigate = useNavigate();
  const assets = useStudio((state) => state.assets);
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const driveItems = useConnectionStore((state) => state.driveItems);
  const canvaItems = useConnectionStore((state) => state.canvaItems);
  const instagramItems = useConnectionStore((state) => state.instagramItems);
  const externalItems = useMemo(
    () => allExternalItems({ driveItems, canvaItems, instagramItems }),
    [driveItems, canvaItems, instagramItems],
  );
  const rememberDriveItems = useConnectionStore((state) => state.rememberDriveItems);
  const rememberCanvaItems = useConnectionStore((state) => state.rememberCanvaItems);
  const syncInstagramItems = useConnectionStore((state) => state.syncInstagramItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GlobalSearchFilter>("all");
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveNotes, setLiveNotes] = useState<string[]>([]);
  const stats = useMemo(
    () => creativeMemoryStats({ assets, campaigns, contentItems, externalItems }),
    [assets, campaigns, contentItems, externalItems],
  );
  const results = useMemo(
    () => searchGlobalCreative(query, { assets, campaigns, contentItems, externalItems }, filter),
    [query, assets, campaigns, contentItems, externalItems, filter],
  );

  async function searchLive() {
    const needle = query.trim();
    if (!needle) return;
    setLiveBusy(true);
    try {
      const bundle = await searchConnectedSources({ data: { query: needle } });
      const notes: string[] = [];
      absorb(bundle.drive, rememberDriveItems, notes, "Google Drive");
      absorb(bundle.canva, rememberCanvaItems, notes, "Canva");
      absorb(bundle.instagram, (items) => {
        const previous = useConnectionStore.getState().instagramItems;
        const merged = new Map(previous.map((item) => [item.id, item]));
        for (const item of items) merged.set(item.id, item);
        syncInstagramItems([...merged.values()]);
      }, notes, "Instagram");
      setLiveNotes(notes);
      if ([bundle.drive, bundle.canva, bundle.instagram].some((item) => item.ok)) {
        toast.success("已把已連接來源的真實結果併入 Creative Brain");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "連線來源搜尋失敗");
    } finally {
      setLiveBusy(false);
    }
  }

  return (
    <section className={cn("rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6", !compact && "mt-6")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="default">
            <BrainCircuit className="size-3.5" />
            Creative Brain
          </Badge>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">從做過的內容開始，不再每次從零</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            同一個搜尋框會同時找素材、Campaign、內容節奏、Drive、Canva 與 Instagram。沒連接的來源不會假裝有結果。
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat value={stats.assets} label="素材" />
          <Stat value={stats.analyzedAssets} label="已理解" />
          <Stat value={stats.campaigns} label="活動" />
          <Stat value={stats.externalItems} label="外部" />
        </div>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void searchLive();
          }}
          className="h-12 pl-10"
          placeholder="找以前茶會 Canva、浮游禪光、期中、龜龜、Drive 企劃"
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">本機索引會即時過濾。已連接來源只在你按下搜尋時才會問官方 API。</p>
        <Button size="sm" className="min-h-11" disabled={!query.trim() || liveBusy} onClick={() => void searchLive()}>
          {liveBusy ? "搜尋連接中…" : "同時搜尋已連接來源"}
        </Button>
      </div>

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {GLOBAL_SEARCH_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "min-h-10 shrink-0 rounded-full px-3 text-xs",
              filter === item.id ? "bg-accent text-accent-fg" : "bg-bg text-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {query.trim() ? (
        results.length ? (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (result.assetId) onOpenAsset(result.assetId);
                    else if (result.providerKind === "instagram") void navigate({ to: "/instagram" });
                    else if (result.externalId) void navigate({ to: "/connections" });
                    else if (result.kind === "content") void navigate({ to: "/calendar" });
                    else void navigate({ to: "/campaigns" });
                  }}
                  className="flex min-h-20 w-full items-start gap-3 rounded-2xl bg-bg p-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                    result.kind === "asset" ? "bg-accent text-accent-fg" : "bg-surface-2 text-accent",
                  )}>
                    {result.kind === "asset" ? <Sparkles className="size-4" /> : <BrainCircuit className="size-4" />}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{result.title}</span>
                      <Badge variant="default">{result.provider}</Badge>
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{result.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl bg-bg px-4 py-6 text-center text-sm text-muted">
            {emptySearchHint(filter)}
          </p>
        )
      ) : (
        <p className="mt-3 text-xs text-subtle">
          目前記得 {stats.sources} 種素材來源、{stats.reusableContent} 則可重用完成內容、{stats.externalItems} 筆外部索引。
        </p>
      )}
      {liveNotes.length ? (
        <ul className="mt-3 space-y-1 text-xs leading-5 text-muted">
          {liveNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

function absorb(
  result: { ok: true; data: ExternalMemoryItem[] } | { ok: false; message: string },
  remember: (items: ExternalMemoryItem[]) => void,
  notes: string[],
  label: string,
) {
  if (result.ok) {
    remember(result.data);
    notes.push(`${label}：找到 ${result.data.length} 筆真實結果`);
    return;
  }
  notes.push(`${label}：${result.message}`);
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-16 rounded-xl bg-bg px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
