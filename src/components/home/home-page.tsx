import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock,
  Compass,
  FolderOpen,
  Instagram,
  Layers,
  Plus,
  Search,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CampaignEditorDialog } from "@/components/campaigns/campaign-editor";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { ProjectCard } from "@/components/shared/project-card";
import { ArtboardView } from "@/components/studio/artboard-view";
import { AiCreativeModal } from "@/components/studio/ai-creative-modal";
import { ConnectionCenterModal } from "@/components/studio/connection-center-modal";
import { GlobalCreativeSearchModal } from "@/components/studio/global-creative-search-modal";
import { InstagramCenterModal } from "@/components/studio/instagram-center-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { CAMPAIGN_TYPE_LABELS, type Campaign } from "@/lib/studio/campaign-types";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { formatById } from "@/lib/studio/formats";
import { previewTemplate, TEMPLATE_STARTERS } from "@/lib/studio/templates";
import { useStudio } from "@/stores/studio-store";

export function HomePage() {
  const navigate = useNavigate();
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const duplicateProject = useStudio((s) => s.duplicateProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const createFromTemplate = useStudio((s) => s.createFromTemplate);

  const campaigns = useCampaignStore((s) => s.campaigns);
  const scheduledPosts = useCampaignStore((s) => s.scheduledPosts);
  const connections = useCampaignStore((s) => s.connections);
  const selectCampaign = useCampaignStore((s) => s.selectCampaign);

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [campaignEditorOpen, setCampaignEditorOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("09/24 浮游禪光 迎新茶會");
  const [aiCampaign, setAiCampaign] = useState<Campaign | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [igCenterOpen, setIgCenterOpen] = useState(false);
  const [connectionCenterOpen, setConnectionCenterOpen] = useState(false);

  const brand = brands[0];
  const featured = campaigns[0];

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of projects) {
      const board = p.artboards[p.activeFormatId];
      if (!board) continue;
      for (const l of board.layers) {
        if (l.type === "image") ids.push(l.assetId);
        if (l.type === "logo" && l.assetId) ids.push(l.assetId);
      }
      if (result.needsConnect) {
        const started = await beginOAuth({ provider: "instagram", next: "instagram", resume: "ig-publish" });
        if (started.ok) {
          toast.message("正在連接 Instagram，回來後會接著發布。");
          return;
        }
        ingestIg([result.post]);
        rememberStyle(styleBriefFromPublish(result.pack));
        toast.message(started.error);
        void navigate({ to: "/connections" });
        return;
      }
      ingestIg([result.post]);
      rememberStyle(styleBriefFromPublish(result.pack));
      setFocusIgId(result.post.id);
      setScheduleStatus(row.id, "published");
      if (row.projectId) {
        updateProject(row.projectId, { contentStatus: "published", publishedAt: Date.now() });
      }
      toast.success(result.message);
      void navigate({ to: "/instagram" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "發布失敗");
    } finally {
      setPublishingId(null);
    }
    for (const b of brands) if (b.logoAssetId) ids.push(b.logoAssetId);
    for (const a of assets) ids.push(a.id);
    return ids;
  }, [projects, brands, assets]);
  const urls = useAssetUrls(assetIds);

  function startFeatured() {
    if (!featured) return;
    writeHandoff({
      idea: featuredCampaignIdea({
        ...FEATURED_EVENT,
        name: featured.name,
        date: featured.date,
        time: featured.time,
        location: featured.location,
        oneLiner: featuredHook,
      }),
      tab: "campaign",
      autoRun: true,
      sourceLabel: `活動 / ${featured.name}`,
    });
    void navigate({ to: "/create", search: { tab: "campaign" } });
  }

  function openAi(topic: string, camp?: Campaign | null) {
    setAiTopic(topic);
    setAiCampaign(camp ?? null);
    if (camp) selectCampaign(camp.id);
    setAiModalOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-5 md:px-8 md:py-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent/10 font-display text-xs font-bold text-accent">
              禪
            </span>
            <span className="text-xs font-semibold tracking-wide text-accent">淡江大學禪學社</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-fg sm:text-2xl">一人網宣創作中控台</h1>
          <p className="mt-0.5 text-xs text-muted">企劃、文案、畫布、IG 排程。穩定、陪伴，不說教。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" data-testid="open-search" onClick={() => setSearchModalOpen(true)} className="h-8 bg-surface text-xs">
            <Search className="size-3.5" />
            跨來源搜尋
          </Button>
          <Button variant="outline" size="sm" data-testid="open-ig-center" onClick={() => setIgCenterOpen(true)} className="h-8 bg-surface text-xs">
            <Instagram className="size-3.5" />
            IG
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConnectionCenterOpen(true)} className="h-8 bg-surface text-xs">
            <FolderOpen className="size-3.5" />
            連接 {connections.filter((c) => c.status === "connected" || c.status === "demo").length}/3
          </Button>
          <Button size="sm" onClick={() => openAi(featured ? `${featured.name} 完整宣傳波段` : "迎新茶會", featured)} className="h-8 text-xs">
            <Sparkles className="size-3.5" />
            AI 創作
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-accent/20 bg-surface p-5 shadow-[var(--shadow-border)] sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">今天推薦</Badge>
              {featured ? <Badge>{featured.date} {featured.name}</Badge> : null}
              <span className="flex items-center gap-1 text-xs text-muted">
                <Clock className="size-3.5" /> 平日 20:30 宿舍時段
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug sm:text-xl">最近是不是很久沒有好好坐下來？</h2>
            <p className="text-sm leading-relaxed text-muted">
              適合 5 頁情緒共鳴 Carousel。用開學第三週與克難坡切入，最後引導到迎新茶會免費席位。
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => openAi("最近是不是很久沒有好好坐下來？", featured)} className="h-9 text-sm">
                <Wand2 className="size-4" />
                AI 幫我寫這篇
              </Button>
              <Button variant="outline" asChild className="h-9 bg-surface text-sm">
                <Link to="/instagram">預覽 IG 九宮格</Link>
              </Button>
            </div>
          </div>
          <div className="w-full shrink-0 space-y-2.5 rounded-xl border border-border bg-bg p-3.5 lg:w-72">
            <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-xs">
              <span className="font-semibold">策略包</span>
              <span className="font-medium text-success">可套用畫布</span>
            </div>
            <ul className="space-y-1.5 text-xs text-muted">
              <li className="flex justify-between"><span>Hook</span><span className="text-fg">3 秒停留</span></li>
              <li className="flex justify-between"><span>視覺</span><span className="text-fg">晨曦暖光 / 夜青</span></li>
              <li className="flex justify-between"><span>限動</span><span className="text-fg">下雨心境投票</span></li>
              <li className="flex justify-between"><span>Reels</span><span className="text-fg">克難坡降心率</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Compass className="size-4 text-accent" />
            快速開始
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "生成 IG 貼文", hint: "單張／圖文", topic: "生成 IG 貼文與主題圖" },
            { label: "生成 Carousel", hint: "情緒共鳴輪播", topic: "生成 5P Carousel 輪播" },
            { label: "生成 Story", hint: "投票／問答", topic: "生成 IG Story 限動互動" },
            { label: "生成 Reels", hint: "20 秒減壓腳本", topic: "生成 Reels 20秒減壓短影音腳本" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => openAi(item.topic, featured)}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-3 text-left shadow-sm transition-all hover:border-accent/40 hover:bg-surface-2"
            >
              <span className="mb-2 w-fit rounded-lg bg-accent/10 p-2 text-accent">
                <Sparkles className="size-4" />
              </span>
              <span className="block text-xs font-bold">{item.label}</span>
              <span className="text-[10px] text-muted">{item.hint}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3 text-left shadow-sm hover:border-accent/40 hover:bg-surface-2"
          >
            <span className="mb-2 w-fit rounded-lg bg-accent/10 p-2 text-accent">
              <FolderOpen className="size-4" />
            </span>
            <span className="block text-xs font-bold">從素材開始</span>
            <span className="text-[10px] text-muted">Drive / Canva 記憶</span>
          </button>
          <button
            type="button"
            onClick={() => setIgCenterOpen(true)}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-3 text-left shadow-sm hover:border-accent/40 hover:bg-surface-2"
          >
            <span className="mb-2 w-fit rounded-lg bg-accent/10 p-2 text-accent">
              <Instagram className="size-4" />
            </span>
            <span className="block text-xs font-bold">從以前 IG</span>
            <span className="text-[10px] text-muted">延續高收藏語氣</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <CalendarDays className="size-4 text-accent" />
              社團活動
            </h3>
            <Button variant="ghost" size="sm" data-testid="create-campaign" className="h-7 gap-1 text-xs" onClick={() => setCampaignEditorOpen(true)}>
              <Plus className="size-3.5" /> 建立活動
            </Button>
          </div>
          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div key={camp.id} className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{CAMPAIGN_TYPE_LABELS[camp.type]}</Badge>
                    <h4 className="text-sm font-bold">{camp.name}</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{camp.oneLiner}</p>
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted">
                    <span>
                      {camp.date} {camp.time}
                    </span>
                    <span>{camp.location}</span>
                    <span className="font-medium text-accent">{camp.theme}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <Button size="sm" className="h-8 text-xs" onClick={() => openAi(`${camp.name} 完整宣傳波段`, camp)}>
                    <Sparkles className="size-3.5" /> 生成宣傳
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => startTemplate("editorial")}>
                    開啟畫布
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <Clock className="size-4 text-accent" />
              已排程
            </h3>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-accent">
              <Link to="/calendar">查看日曆</Link>
            </Button>
          </div>
          <div className="space-y-2.5 rounded-xl border border-border bg-surface p-3">
            {scheduledPosts.slice(0, 4).map((post) => (
              <div key={post.id} className="space-y-1 rounded-lg border border-border/60 bg-surface-2 p-2.5">
                <div className="flex items-center justify-between">
                  <Badge className="text-[10px] uppercase">{post.contentType}</Badge>
                  <span className="font-mono text-[10px] text-muted">{post.scheduledAt.slice(0, 10)}</span>
                </div>
                <h5 className="line-clamp-1 text-xs font-semibold">{post.title}</h5>
                <p className="line-clamp-1 text-[11px] text-muted">{post.hook}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-bold">
            <Layers className="size-4 text-accent" />
            進行中的畫布（{projects.length}）
          </h3>
          <Button size="sm" variant="outline" onClick={() => setNewProjectOpen(true)} className="h-8 gap-1 text-xs">
            <Plus className="size-3.5" /> 新建專案
          </Button>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <li key={project.id}>
              <ProjectCard
                project={project}
                brand={brands.find((b) => b.id === project.brandId)}
                urls={urls}
                onDuplicate={() => duplicateProject(project.id)}
                onDelete={() => deleteProject(project.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">社團經典版型</h3>
          <span className="text-xs text-muted">淡江禪學社配色與思源字體</span>
        </div>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TEMPLATE_STARTERS.map((tpl) => {
            const preview = brand ? previewTemplate(tpl, brand, assets.find((a) => a.kind === "image")?.id) : null;
            const format = formatById(tpl.formatId);
            return (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => startTemplate(tpl.id)}
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-left shadow-[var(--shadow-border)] transition-all hover:border-accent/40 hover:shadow-md"
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
                  <p className="mt-2.5 truncate text-xs font-bold">{tpl.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{tpl.description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <AiCreativeModal open={aiModalOpen} onOpenChange={setAiModalOpen} initialTopic={aiTopic} campaign={aiCampaign} />
      <GlobalCreativeSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectAsset={(title) => openAi(`以素材「${title}」為核心生成新 IG 貼文`, featured)}
      />
      <InstagramCenterModal
        open={igCenterOpen}
        onOpenChange={setIgCenterOpen}
        onUseAsTemplate={(post) => openAi(`延續 IG「${post.caption.slice(0, 18)}」的語氣`, featured)}
      />
      <ConnectionCenterModal open={connectionCenterOpen} onOpenChange={setConnectionCenterOpen} />
      <CampaignEditorDialog
        open={campaignEditorOpen}
        onOpenChange={setCampaignEditorOpen}
        onSaved={(campaign, generate) => {
          selectCampaign(campaign.id);
          if (generate) openAi(`${campaign.name} 完整宣傳波段`, campaign);
        }}
      />
      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </main>
  );
}
