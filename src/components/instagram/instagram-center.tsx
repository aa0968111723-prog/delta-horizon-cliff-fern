import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Bookmark, Heart, Lightbulb, Link2, MessageCircle, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalItemCard } from "@/components/search/external-item";
import { IgPostPreview } from "@/components/content/ig-preview";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { analyzeIgPost, researchInspiration } from "@/lib/ai/zen";
import { fetchInstagramFeed } from "@/lib/connections/api";
import type { ExternalItem } from "@/lib/connections/providers";
import { brandMemoryContext } from "@/lib/studio/brand";
import type { ContentItem } from "@/lib/studio/types";
import { computeIgDna, performanceInsights } from "@/lib/zen/ig-dna";
import { INSPIRATION_PATTERNS } from "@/lib/zen/inspiration";
import { CLUB_HANDLE, contentTypeShort } from "@/lib/zen/labels";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type Tab = "grid" | "feed" | "dna" | "inspire" | "stats";

const TABS: { id: Tab; label: string }[] = [
  { id: "grid", label: "過去 IG" },
  { id: "feed", label: "Feed 預覽" },
  { id: "dna", label: "IG DNA" },
  { id: "inspire", label: "靈感" },
  { id: "stats", label: "成效" },
];

export function InstagramCenter({ initialTab }: { initialTab?: Tab }) {
  const navigate = useNavigate();
  const hydrated = useStudio((s) => s.hydrated);
  const brand = useStudio((s) => s.brands[0]);
  const contents = useStudio((s) => s.contents);
  const updateBrand = useStudio((s) => s.updateBrand);
  const [tab, setTab] = useState<Tab>(initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : "grid");
  const [active, setActive] = useState<ContentItem | ExternalItem | null>(null);

  useEffect(() => {
    if (initialTab && TABS.some((t) => t.id === initialTab)) setTab(initialTab);
  }, [initialTab]);

  const live = useQuery({
    queryKey: ["ig-feed"],
    queryFn: () => fetchInstagramFeed({ data: { limit: 30, insights: true } }),
    staleTime: 60_000,
  });

  const published = useMemo(
    () =>
      [...contents]
        .filter((c) => c.status === "published" || c.type === "ig-post" || c.type === "carousel" || c.type === "recap")
        .sort((a, b) => (b.publishedAt ?? b.scheduledAt ?? b.createdAt) - (a.publishedAt ?? a.scheduledAt ?? a.createdAt)),
    [contents],
  );
  const previewQueue = useMemo(
    () =>
      [...contents]
        .filter((c) => c.status === "scheduled" || c.status === "done" || c.status === "published")
        .sort((a, b) => (b.scheduledAt ?? b.publishedAt ?? 0) - (a.scheduledAt ?? a.publishedAt ?? 0)),
    [contents],
  );
  const urls = useAssetUrls(useMemo(() => contents.map((c) => c.coverAssetId ?? "").filter(Boolean), [contents]));
  const dna = useMemo(() => {
    const extras = live.data && live.data.ok
      ? {
          captions: live.data.items.map((i) => i.caption ?? i.title),
          hashtags: live.data.items.flatMap((i) => (i.caption ?? "").match(/#[^\s#]+/g) ?? []),
        }
      : undefined;
    return computeIgDna(contents, extras);
  }, [contents, live.data]);
  const insights = useMemo(() => performanceInsights(contents), [contents]);

  if (!hydrated || !brand) return null;

  const connected = live.data && live.data.ok;
  const gridItems: (ContentItem | ExternalItem)[] = connected && live.data.ok && live.data.items.length ? live.data.items : published;

  function switchTab(next: Tab) {
    setTab(next);
    void navigate({ to: "/instagram", search: { tab: next === "grid" ? undefined : next }, replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram"
        title={connected && live.data && live.data.ok && live.data.profile ? `@${live.data.profile.username}` : CLUB_HANDLE}
        description={
          connected && live.data && live.data.ok && live.data.profile
            ? live.data.profile.biography || "已連接禪學社 IG，Grid 顯示真實貼文。"
            : "還沒連接帳號時，Grid 會顯示本機已發布與示範貼文。連接後讀 Profile、過去貼文、Caption 與 Insights。"
        }
        actions={
          connected ? (
            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">Connected</span>
          ) : (
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/connections">
                <Link2 className="size-3.5" /> 連接 IG
              </Link>
            </Button>
          )
        }
      />

      {connected && live.data && live.data.ok && live.data.profile ? (
        <p className="mt-3 text-xs text-muted tabular-nums">
          {live.data.profile.followers ? `${live.data.profile.followers.toLocaleString()} 追蹤 · ` : ""}
          {live.data.profile.mediaCount ?? live.data.items.length} 則貼文
        </p>
      ) : null}

      <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto rounded-full bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-xs", tab === t.id ? "bg-surface text-fg shadow-[var(--shadow-border)]" : "text-muted")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "grid" ? (
        <section className="mt-5">
          <div className="grid grid-cols-3 gap-[2px] overflow-hidden rounded-2xl bg-border">
            {gridItems.slice(0, 18).map((item) => {
              const isContent = "copy" in item;
              const thumb = isContent ? (item.coverAssetId ? urls[item.coverAssetId] : undefined) : item.thumbnail;
              const kind = isContent ? contentTypeShort(item.type) : item.kind;
              return (
                <button
                  key={isContent ? item.id : `ig-${item.id}`}
                  type="button"
                  onClick={() => setActive(item)}
                  className="relative aspect-square bg-glow-card"
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex size-full items-end bg-night p-2">
                      <span className="line-clamp-4 text-left text-[10px] leading-snug text-night-fg">
                        {isContent ? item.copy.hook : item.title}
                      </span>
                    </div>
                  )}
                  <span className="absolute top-1 right-1 rounded bg-night/70 px-1 text-[9px] text-night-fg">{kind}</span>
                </button>
              );
            })}
          </div>
          {gridItems.length === 0 ? <p className="mt-6 text-center text-sm text-muted">還沒有貼文。去 AI 創作寫一篇，或連接 IG。</p> : null}
        </section>
      ) : null}

      {tab === "feed" ? (
        <section className="mt-6 space-y-6">
          <p className="text-sm text-muted">即將發布與已完成的內容，長得像真實 IG 動態。</p>
          {previewQueue.length === 0 ? (
            <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">把內容排進 Calendar 後，會出現在這裡。</p>
          ) : (
            previewQueue.slice(0, 8).map((c) => (
              <div key={c.id}>
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>
                    {c.status === "published" ? "已發布" : c.status === "scheduled" ? "已排程" : "完成"}
                    {c.scheduledAt || c.publishedAt
                      ? ` · ${formatDate(c.publishedAt ?? c.scheduledAt!, "M/d HH:mm", { locale: zhTW })}`
                      : ""}
                  </span>
                  <Link to="/create" search={{ contentId: c.id }} className="text-accent">
                    編輯
                  </Link>
                </div>
                <IgPostPreview content={c} cover={c.coverAssetId ? urls[c.coverAssetId] : undefined} handle={brand.handle} />
              </div>
            ))
          )}
        </section>
      ) : null}

      {tab === "dna" ? <DnaPanel dna={dna} onRemember={() => {
        updateBrand(brand.id, { memory: { ...brand.memory, igDna: dna.summary } });
        toast.success("已寫進 Brand Memory，之後生成會優先參考自己的 IG。");
      }} remembered={Boolean(brand.memory.igDna)} /> : null}

      {tab === "inspire" ? <InspirePanel brandContext={brandMemoryContext(brand)} /> : null}

      {tab === "stats" ? (
        <section className="mt-6 space-y-3">
          {insights.map((card) => (
            <article key={card.question} className="rounded-[22px] bg-surface p-4 shadow-[var(--shadow-border)]">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">{card.question}</p>
              <p className="mt-2 text-sm leading-relaxed">{card.answer}</p>
            </article>
          ))}
          <p className="text-xs text-muted">成效用來改善下一次生成，不是給主管看的報表。</p>
        </section>
      ) : null}

      <PostSheet
        item={active}
        url={active && "copy" in active && active.coverAssetId ? urls[active.coverAssetId] : undefined}
        brandContext={brandMemoryContext(brand)}
        onClose={() => setActive(null)}
      />
    </main>
  );
}

function DnaPanel({ dna, onRemember, remembered }: { dna: ReturnType<typeof computeIgDna>; onRemember: () => void; remembered: boolean }) {
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-[24px] bg-night p-5 text-night-fg">
        <p className="text-xs tracking-[0.18em] text-night-fg/60 uppercase">Zen Club IG DNA</p>
        <p className="mt-2 text-sm leading-relaxed">{dna.summary}</p>
        <p className="mt-3 text-xs text-night-fg/50">依 {dna.sample} 則內容推估 · Caption 約 {dna.captionAvg} 字</p>
      </div>
      <div className="flex h-10 overflow-hidden rounded-2xl">
        {dna.palette.map((hex) => (
          <span key={hex} className="flex-1" style={{ backgroundColor: hex }} title={hex} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChipBlock title="有效 Hook" items={dna.hooks} />
        <ChipBlock title="Hashtag" items={dna.hashtags} />
        <ChipBlock title="常用 CTA" items={dna.ctas} />
        <ChipBlock title="視覺" items={dna.visualNotes} />
      </div>
      <Button className="rounded-full" onClick={onRemember}>
        <Sparkles className="size-4" />
        {remembered ? "更新 Brand Memory 裡的 DNA" : "記住這個 DNA"}
      </Button>
    </section>
  );
}

function ChipBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium text-muted">{title}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.length ? items.map((h) => (
          <li key={h} className="rounded-full bg-surface-2 px-2.5 py-1 text-xs">
            {h}
          </li>
        )) : <li className="text-xs text-muted">樣本還少</li>}
      </ul>
    </div>
  );
}

function InspirePanel({ brandContext }: { brandContext: string }) {
  const [liveRows, setLiveRows] = useState<{ observed: string; composition: string; color: string; layout: string; hook: string; form: string; zenUse: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function research() {
    setBusy(true);
    try {
      const { studentContextPrompt } = await import("@/lib/zen/context");
      const res = await researchInspiration({ data: { studentContext: studentContextPrompt(), brandContext } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setLiveRows(res.patterns);
      toast.success(res.source === "live" ? "已抽象成可重組的元素，沒有抄任何帳號" : "本機靈感庫（AI 連線後會再研究一輪）");
    } finally {
      setBusy(false);
    }
  }

  const rows = liveRows ?? INSPIRATION_PATTERNS.map((p) => ({
    observed: p.observed,
    composition: p.abstract.composition,
    color: p.abstract.color,
    layout: p.abstract.layout,
    hook: p.abstract.hook,
    form: p.abstract.form,
    zenUse: p.zenUse,
  }));

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">研究大學生社群手法，抽象成構圖 / 配色 / Hook，再轉成禪學社自己的內容。</p>
        <Button size="sm" className="rounded-full" onClick={() => void research()} disabled={busy}>
          {busy ? "研究中…" : "AI 再研究一次"}
        </Button>
      </div>
      <ul className="mt-4 space-y-3">
        {rows.map((p, i) => (
          <li key={i} className="rounded-[22px] bg-surface p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 size-4 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{p.observed}</p>
                <p className="mt-2 text-sm">
                  構圖 {p.composition} · 配色 {p.color} · 形式 {p.form}
                </p>
                <p className="mt-1 text-sm font-medium">禪學社可以這樣用：{p.zenUse}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 rounded-full"
                  onClick={() => void navigate({ to: "/create", search: { mode: "idea", idea: p.zenUse } })}
                >
                  <Wand2 className="size-3.5" /> 用這個開始
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostSheet({
  item,
  url,
  brandContext,
  onClose,
}: {
  item: ContentItem | ExternalItem | null;
  url?: string;
  brandContext: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<{ hook: string; visual: string; theme: string; captionLength: number; cta: string; direction: string; improvements: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!item) return null;
  const current = item;
  const isContent = "copy" in current;
  const caption = isContent ? [current.copy.hook, current.copy.body, current.copy.cta, current.copy.hashtags.join(" ")].filter(Boolean).join("\n\n") : (current.caption || current.title);
  const when = isContent ? current.publishedAt ?? current.scheduledAt : current.date ? Date.parse(current.date) : null;
  const metrics = isContent ? current.metrics : current.metrics;

  async function analyze() {
    setBusy(true);
    try {
      const res = await analyzeIgPost({
        data: {
          caption,
          kind: isContent ? current.type : current.kind,
          metrics: metrics ? { reach: metrics.reach, likes: metrics.likes, comments: metrics.comments, saves: metrics.saves, shares: metrics.shares } : undefined,
          brandContext,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setAnalysis(res.analysis);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="flex max-h-[88dvh] flex-col gap-4 overflow-y-auto rounded-t-[28px]">
        <SheetTitle>{isContent ? current.copy.hook || current.title : current.title}</SheetTitle>
        <div className="flex gap-3">
          <div className="size-24 overflow-hidden rounded-xl bg-glow-card">
            {isContent ? (url ? <img src={url} alt="" className="size-full object-cover" /> : null) : current.thumbnail ? <img src={current.thumbnail} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : null}
          </div>
          <div className="min-w-0 flex-1 text-xs text-muted">
            <p>{isContent ? contentTypeShort(current.type) : current.kind}</p>
            {when ? <p className="mt-1 tabular-nums">{formatDate(when, "yyyy/M/d HH:mm", { locale: zhTW })}</p> : null}
            {metrics && (metrics.likes != null || metrics.reach != null) ? (
              <p className="mt-2 flex flex-wrap gap-2 text-fg">
                <span className="flex items-center gap-1"><Heart className="size-3" />{metrics.likes ?? "—"}</span>
                <span className="flex items-center gap-1"><MessageCircle className="size-3" />{metrics.comments ?? "—"}</span>
                <span className="flex items-center gap-1"><Bookmark className="size-3" />{metrics.saves ?? "—"}</span>
                {metrics.reach != null ? <span>觸及 {metrics.reach}</span> : null}
              </p>
            ) : null}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{caption}</p>
        {isContent && current.sources.length ? (
          <p className="text-[11px] text-subtle">來源：{current.sources.map((s) => s.label).join(" · ")}</p>
        ) : !isContent ? (
          <p className="text-[11px] text-subtle">來源：{current.subtitle}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="rounded-full" onClick={() => void analyze()} disabled={busy}>
            <Sparkles className="size-3.5" />
            {busy ? "分析中…" : "AI 分析"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              onClose();
              void navigate({ to: "/create", search: { mode: "ig", idea: `延伸這篇舊貼文：${caption.slice(0, 80)}` } });
            }}
          >
            延伸成新內容
          </Button>
        </div>

        {analysis ? (
          <div className="rounded-2xl bg-glow-card p-4 text-sm">
            <p><span className="text-xs text-muted">Hook</span> {analysis.hook}</p>
            <p className="mt-1"><span className="text-xs text-muted">主題</span> {analysis.theme} · {analysis.captionLength} 字</p>
            <p className="mt-1"><span className="text-xs text-muted">方向</span> {analysis.direction}</p>
            <p className="mt-1"><span className="text-xs text-muted">CTA</span> {analysis.cta}</p>
            <ul className="mt-2 space-y-1 text-xs">
              {analysis.improvements.map((s, i) => (
                <li key={i}>· {s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!isContent ? <ExternalItemCard item={current} /> : null}
      </SheetContent>
    </Sheet>
  );
}
