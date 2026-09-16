import { BrainCircuit, Search, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { emptySearchHint, GLOBAL_SEARCH_FILTERS, searchGlobalCreative, type GlobalSearchFilter } from "@/lib/creative/global-search";
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GlobalSearchFilter>("all");
  const stats = useMemo(
    () => creativeMemoryStats({ assets, campaigns, contentItems, externalItems }),
    [assets, campaigns, contentItems, externalItems],
  );
  const results = useMemo(
    () => searchGlobalCreative(query, { assets, campaigns, contentItems, externalItems }, filter),
    [query, assets, campaigns, contentItems, externalItems, filter],
  );

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
          className="h-12 pl-10"
          placeholder="找以前茶會 Canva、浮游禪光、期中、龜龜、Drive 企劃"
        />
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
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-16 rounded-xl bg-bg px-3 py-2">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
