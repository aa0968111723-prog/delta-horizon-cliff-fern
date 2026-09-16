import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Film,
  Images,
  LayoutGrid,
  MessageCircleMore,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";
import { CreativeBrainPanel } from "@/components/assets/creative-brain-panel";
import { CreationLoop } from "@/components/shared/creation-loop";
import { ProjectCard } from "@/components/shared/project-card";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { upcomingItems, daysUntilLabel } from "@/lib/creative/calendar";
import { categoryLabel } from "@/lib/studio/assets";
import type { Brief } from "@/lib/studio/types";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import { useUi } from "@/stores/ui-store";

const RECOMMENDED_BRIEF: Partial<Brief> = {
  eventName: "09/24 浮游禪光",
  product: "浮游禪光晚間活動",
  schedule: "09/24 19:00–21:00",
  location: "淡江大學校園",
  audience: "剛開學還在適應課表、通勤、宿舍與新關係的淡江學生",
  goal: "awareness",
  features: "一個可以慢下來、整理最近心情，也能自在認識新朋友的晚上",
  style: "夜晚、柔和三色光、有校園生活感，不宗教、不說教",
  notes: "Hook 從開學後的忙亂與很久沒有好好坐下來切入；時間、地點與報名方式要一眼找到。",
  deliverables: { post: true, carousel: true, story: true, reels: true },
};

const QUICK_STARTS: {
  label: string;
  hint: string;
  icon: LucideIcon;
  preset: Partial<Brief>;
}[] = [
  {
    label: "生成 IG 貼文",
    hint: "Hook、Caption、CTA",
    icon: MessageCircleMore,
    preset: { deliverables: { post: true, carousel: false, story: false, reels: false } },
  },
  {
    label: "生成 Carousel",
    hint: "六頁說完一個主題",
    icon: LayoutGrid,
    preset: { deliverables: { post: true, carousel: true, story: false, reels: false } },
  },
  {
    label: "生成 Story",
    hint: "3–5 張限動節奏",
    icon: Camera,
    preset: { deliverables: { post: false, carousel: false, story: true, reels: false } },
  },
  {
    label: "生成 Reels",
    hint: "封面與短影音企劃",
    icon: Film,
    preset: { deliverables: { post: false, carousel: false, story: false, reels: true } },
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const contentItems = useCreative((s) => s.contentItems);
  const campaign = useCreative((s) => s.campaigns[0]);
  const startCreative = useUi((s) => s.startCreative);
  const upcoming = useMemo(() => upcomingItems(contentItems), [contentItems]);
  const recent = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4),
    [projects],
  );

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of recent) {
      const board = p.artboards[p.activeFormatId];
      if (!board) continue;
      for (const l of board.layers) {
        if (l.type === "image") ids.push(l.assetId);
        if (l.type === "logo" && l.assetId) ids.push(l.assetId);
      }
    }
    for (const b of brands) if (b.logoAssetId) ids.push(b.logoAssetId);
    for (const a of assets) ids.push(a.id);
    return ids;
  }, [recent, brands, assets]);
  const urls = useAssetUrls(assetIds);

  function begin(preset: Partial<Brief>) {
    startCreative({
      ...preset,
      deliverables: preset.deliverables ?? {
        post: true,
        carousel: true,
        story: true,
        reels: false,
      },
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-widest text-accent">淡江大學禪學社</p>
          <h1 className="mt-1 font-display text-2xl tracking-tight md:text-3xl">禪作所</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => begin({})}>
          <WandSparkles className="size-4" />
          開始創作
        </Button>
      </header>

      <section className="mt-5 overflow-hidden rounded-2xl bg-accent text-accent-fg shadow-[var(--shadow-artboard)]">
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 text-xs text-accent-fg/75">
              <span className="rounded-full bg-accent-fg/10 px-2.5 py-1">今天推薦創作</span>
              <span>
                {campaign
                  ? `${campaign.eventDate.slice(5).replace("-", "/")}・${daysUntilLabel(campaign.eventDate)}`
                  : "先從下一場活動開始"}
              </span>
            </div>
            <h2 className="mt-5 max-w-xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              最近是不是很久沒有
              <br />
              好好坐下來？
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-accent-fg/80">
              {campaign
                ? `用開學後的忙亂切入「${campaign.name.replace(/^\d{2}\/\d{2}\s*/, "")}」，做一組不說教、有夜晚校園感的 IG Carousel。`
                : "先建立下一場活動，再做一組給淡江學生看的 IG 內容。"}
            </p>
            <Button
              className="mt-6 bg-accent-fg text-accent hover:bg-accent-fg/90"
              onClick={() => begin(RECOMMENDED_BRIEF)}
            >
              <Sparkles className="size-4" />
              AI 幫我創作
            </Button>
          </div>
          <div className="relative min-h-52 overflow-hidden bg-surface-2/15 p-5">
            <div className="absolute -right-10 -top-12 size-44 rounded-full bg-warn/40 blur-3xl" />
            <div className="absolute -bottom-10 left-4 size-40 rounded-full bg-danger/30 blur-3xl" />
            <div className="relative mx-auto flex h-full max-w-64 items-center justify-center">
              <div className="w-40 rotate-3 rounded-2xl bg-surface p-3 text-fg shadow-[var(--shadow-artboard)]">
                <div className="aspect-[4/5] rounded-xl bg-bg p-4">
                  <p className="text-xs font-medium text-accent">09.24 / TKU</p>
                  <p className="mt-8 font-display text-2xl leading-tight">浮游<br />禪光</p>
                  <div className="mt-6 h-1 w-10 rounded-full bg-warn" />
                  <p className="mt-3 text-xs leading-5 text-muted">留一個晚上<br />和自己坐在一起</p>
                </div>
              </div>
              <div className="-ml-5 mt-8 w-28 -rotate-6 rounded-xl bg-surface p-2 shadow-[var(--shadow-artboard)]">
                <div className="aspect-[9/16] rounded-lg bg-accent p-3 text-accent-fg">
                  <p className="text-xs">今晚</p>
                  <p className="mt-8 font-display text-lg">先不用<br />急著想通</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <CreationLoop />
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">先選一種尺寸</p>
            <h2 className="mt-1 font-display text-xl">我現在想創作什麼？</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/assistant">打開 AI 創作 <ChevronRight className="size-4" /></Link>
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_STARTS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => begin(item.preset)}
              className="min-h-32 rounded-2xl bg-surface p-4 text-left shadow-[var(--shadow-border)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 text-accent">
                <item.icon className="size-5" />
              </span>
              <span className="mt-4 block text-sm font-medium">{item.label}</span>
              <span className="mt-1 block text-xs text-muted">{item.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <div>
            <p className="text-xs text-muted">最近網宣</p>
            <h2 className="mt-1 font-display text-xl">最近網宣</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigate({ to: "/studio" })}
            >
              打開 Studio <ChevronRight className="size-4" />
            </Button>
          </div>
          <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0">
            {recent.map((project) => (
              <li key={project.id} className="min-w-64 sm:min-w-0">
                <ProjectCard
                  project={project}
                  brand={brands.find((b) => b.id === project.brandId)}
                  urls={urls}
                  compact
                />
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-3">
          <Link
            to="/calendar"
            className="block rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-accent" />
              <h2 className="font-display text-lg">接下來的內容節奏</h2>
            </div>
            <ol className="mt-4 space-y-4">
              {upcoming.length ? upcoming.map((item) => (
                <li key={item.id} className="grid grid-cols-[3.5rem_1fr] gap-2">
                  <span className="text-xs font-medium text-accent">{item.plannedAt.slice(5, 10).replace("-", "/")}</span>
                  <span>
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted">{item.type}｜{item.angle}</span>
                  </span>
                </li>
              )) : (
                <li className="text-sm text-muted">還沒有節奏。到排程依活動生成一版。</li>
              )}
            </ol>
          </Link>
          <Link
            to="/instagram"
            hash="learn"
            className="block rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)]"
          >
            <div className="flex items-center gap-2">
              <MessageCircleMore className="size-5 text-accent" />
              <h2 className="font-display text-lg">現場筆記</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              貼出去之後記下誰來了、哪句 Hook 像淡江。寫進 Brand Memory，不是模擬讚數。
            </p>
          </Link>
        </aside>
      </div>

      <CreativeBrainPanel onOpenAsset={() => void navigate({ to: "/assets" })} compact />

      <section className="mt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">此裝置</p>
            <h2 className="mt-1 font-display text-xl">最近素材</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/assets">素材庫 <ChevronRight className="size-4" /></Link>
          </Button>
        </div>
        <ul className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-6 sm:px-0">
          {assets.slice(0, 6).map((asset) => (
            <li key={asset.id} className="min-w-32 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] sm:min-w-0">
              <Link to="/assets" className="block">
                <div className="flex aspect-square items-center justify-center bg-bg">
                  {urls[asset.id] ? (
                    <img src={urls[asset.id]} alt={asset.name} className="size-full object-cover" />
                  ) : (
                    <Images className="size-5 text-subtle" />
                  )}
                </div>
                <p className="truncate px-2 pt-2 text-xs font-medium">{asset.name}</p>
                <p className="truncate px-2 pb-2 text-xs text-subtle">{categoryLabel(asset.category)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
