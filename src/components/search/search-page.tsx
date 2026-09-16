import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Images, Link2, Search, Sparkles, Tent } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssetCard } from "@/components/assets/asset-card";
import { ContentCard } from "@/components/content/content-card";
import { ExternalItemCard } from "@/components/search/external-item";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { searchExternal } from "@/lib/connections/api";
import { PROVIDER_ORDER, PROVIDERS } from "@/lib/connections/providers";
import { matchesAssetQuery } from "@/lib/studio/assets";
import { campaignTypeLabel } from "@/lib/zen/labels";
import { useStudio } from "@/stores/studio-store";

const SUGGESTIONS = ["浮游禪光", "找以前晚上的茶會照片", "找有龜龜的素材", "找適合 IG 主視覺的照片", "找招生活動版型", "期中"];

export function SearchPage({ initialQuery }: { initialQuery: string }) {
  const navigate = useNavigate();
  const [text, setText] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const assets = useStudio((s) => s.assets);
  const contents = useStudio((s) => s.contents);
  const campaigns = useStudio((s) => s.campaigns);
  const hydrated = useStudio((s) => s.hydrated);
  const toggleFavorite = useStudio((s) => s.toggleFavorite);

  useEffect(() => {
    setText(initialQuery);
    setQuery(initialQuery);
  }, [initialQuery]);

  const q = query.trim().toLowerCase();
  const localAssets = useMemo(
    () =>
      q
        ? assets.filter(
            (a) =>
              matchesAssetQuery(a, q) ||
              (a.insight?.summary ?? "").toLowerCase().includes(q) ||
              (a.insight?.subjects ?? []).some((s) => s.toLowerCase().includes(q)) ||
              (a.externalRef?.label ?? "").toLowerCase().includes(q),
          )
        : [],
    [assets, q],
  );
  const localContents = useMemo(
    () => (q ? contents.filter((c) => `${c.title} ${c.copy.hook} ${c.copy.body} ${c.copy.hashtags.join(" ")}`.toLowerCase().includes(q)) : []),
    [contents, q],
  );
  const localCampaigns = useMemo(() => (q ? campaigns.filter((c) => `${c.name} ${c.theme} ${c.oneLiner} ${c.location}`.toLowerCase().includes(q)) : []), [campaigns, q]);
  const urls = useAssetUrls(useMemo(() => [...localAssets.map((a) => a.id), ...localContents.map((c) => c.coverAssetId ?? "")], [localAssets, localContents]));

  const external = useQuery({
    queryKey: ["external-search", query],
    queryFn: () => searchExternal({ data: { query, limit: 12 } }),
    enabled: Boolean(q),
    staleTime: 60_000,
  });

  const connectedCount = external.data?.groups.filter((g) => g.status === "ok").length ?? 0;
  const externalTotal = external.data?.groups.reduce((n, g) => n + g.items.length, 0) ?? 0;
  const total = localAssets.length + localContents.length + localCampaigns.length + externalTotal;

  function submit() {
    setQuery(text);
    void navigate({ to: "/search", search: { q: text || undefined }, replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader kicker="Creative Search" title="一個框，找遍所有素材" description="同時搜尋 Google Drive、Canva、Instagram、AI 生成與素材庫。可以用自然語言，AI 會幫你展開關鍵字。" />
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="找以前晚上的茶會照片…" className="h-12 rounded-full pl-11 text-base" />
        </div>
        <Button type="submit" className="h-12 rounded-full px-5">
          搜尋
        </Button>
      </form>
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="shrink-0 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-muted hover:text-fg"
            onClick={() => {
              setText(s);
              setQuery(s);
              void navigate({ to: "/search", search: { q: s }, replace: true });
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {q && hydrated ? (
        <p className="mt-6 text-sm text-muted">
          「{query}」 · 找到 {total} 個相關素材
          {external.data?.keywords.length ? <span className="text-subtle"> · AI 展開：{external.data.keywords.join("、")}</span> : null}
          {external.isLoading ? " · 正在問 Drive / Canva / IG…" : ""}
        </p>
      ) : null}

      {q ? (
        <div className="mt-4 space-y-8">
          {localCampaigns.length ? (
            <section>
              <SectionHeader title="活動" hint={`${localCampaigns.length} 個`} />
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {localCampaigns.map((c) => (
                  <li key={c.id}>
                    <Link to="/campaigns/$campaignId" params={{ campaignId: c.id }} className="flex items-center gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-glow-card">
                        <Tent className="size-4 text-accent" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="block text-xs text-muted">
                          {c.date} · {campaignTypeLabel(c.type)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {localContents.length ? (
            <section>
              <SectionHeader title="AI 生成 / 內容" hint={`${localContents.length} 則`} />
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {localContents.map((c) => (
                  <li key={c.id}>
                    <ContentCard content={c} urls={urls} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {localAssets.length ? (
            <section>
              <SectionHeader title="素材庫" hint={`${localAssets.length} 個（含 AI 生成與已匯入的 Drive / Canva / IG）`} />
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {localAssets.slice(0, 15).map((a) => (
                  <li key={a.id}>
                    <AssetCard asset={a} url={urls[a.id]} usage="unused" draggable={false} onOpen={() => void navigate({ to: "/assets", search: { asset: a.id } })} onFavorite={() => toggleFavorite(a.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {PROVIDER_ORDER.map((p) => {
            const g = external.data?.groups.find((x) => x.provider === p);
            const meta = PROVIDERS[p];
            return (
              <section key={p}>
                <SectionHeader
                  title={meta.label}
                  hint={g ? (g.status === "ok" ? `${g.items.length} 個` : g.status === "disconnected" ? "尚未連接" : g.error) : external.isLoading ? "搜尋中…" : ""}
                  action={
                    g?.status === "disconnected" ? (
                      <Button size="sm" variant="secondary" className="rounded-full" asChild>
                        <Link to="/connections">
                          <Link2 className="size-3.5" /> 連接
                        </Link>
                      </Button>
                    ) : null
                  }
                />
                {g?.status === "ok" && g.items.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((item) => (
                      <li key={item.id}>
                        <ExternalItemCard item={item} />
                      </li>
                    ))}
                  </ul>
                ) : g?.status === "ok" ? (
                  <p className="text-sm text-muted">沒有找到。</p>
                ) : g?.status === "disconnected" ? (
                  <p className="rounded-2xl bg-surface/70 px-4 py-3 text-sm text-muted shadow-[var(--shadow-border)]">連接 {meta.label} 後，這裡會出現{meta.reads.slice(0, 2).join("、")}。</p>
                ) : null}
              </section>
            );
          })}

          {total === 0 && !external.isLoading ? (
            <p className="rounded-2xl bg-surface/70 px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              沒有找到「{query}」。{connectedCount === 0 ? "連接 Drive / Canva / IG 之後，搜尋範圍會大很多。" : "換個說法試試，例如「茶會」或「龜龜」。"}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Hint icon={Images} title="素材庫 + AI 生成" text="名稱、標籤、AI 看到的內容都會被搜到。" />
          <Hint icon={Link2} title="Drive / Canva / IG" text="連接後同時搜三個服務，來源一律標示。" />
          <Hint icon={Sparkles} title="直接加入創作" text="搜到的舊素材可以一鍵變成新的活動內容。" />
        </div>
      )}
    </main>
  );
}

function Hint({ icon: Icon, title, text }: { icon: typeof Images; title: string; text: string }) {
  return (
    <div className="rounded-[22px] bg-glow-card p-4">
      <Icon className="size-5 text-accent" />
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted">{text}</p>
    </div>
  );
}
