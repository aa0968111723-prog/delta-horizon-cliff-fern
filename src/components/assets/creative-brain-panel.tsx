import { BrainCircuit, Search, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { creativeMemoryStats, searchCreativeMemory } from "@/lib/creative/memory";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useConnectionStore } from "@/stores/connection-store";
import { useStudio } from "@/stores/studio-store";

export function CreativeBrainPanel({ onOpenAsset }: { onOpenAsset: (id: string) => void }) {
  const navigate = useNavigate();
  const assets = useStudio((state) => state.assets);
  const campaigns = useCreative((state) => state.campaigns);
  const contentItems = useCreative((state) => state.contentItems);
  const externalItems = useConnectionStore((state) => state.driveItems);
  const [query, setQuery] = useState("");
  const stats = useMemo(
    () => creativeMemoryStats({ assets, campaigns, contentItems, externalItems }),
    [assets, campaigns, contentItems, externalItems],
  );
  const results = useMemo(
    () => searchCreativeMemory(query, { assets, campaigns, contentItems, externalItems }),
    [query, assets, campaigns, contentItems, externalItems],
  );

  return (
    <section className="mt-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="default">
            <BrainCircuit className="size-3.5" />
            Creative Brain
          </Badge>
          <h2 className="mt-3 text-xl font-semibold tracking-tight">從做過的內容開始，不再每次從零</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            同時找目前的素材、Campaign 與內容節奏。未來連接 Google Drive、Canva、Instagram 後，會沿用同一個搜尋與來源標示。
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
          placeholder="試著找：浮游禪光、期中、茶會、龜龜、社員互動"
        />
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
                    else if (result.externalId) void navigate({ to: "/connections" });
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
            目前的 Creative Brain 找不到這個內容。連接外部來源前，不會假裝已搜尋 Drive、Canva 或 Instagram。
          </p>
        )
      ) : (
        <p className="mt-3 text-xs text-subtle">
          目前記得 {stats.sources} 種素材來源、{stats.reusableContent} 則可重用完成內容。
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
