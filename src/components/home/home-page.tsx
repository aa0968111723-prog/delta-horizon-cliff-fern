import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Wand2,
  Calendar,
  Layers,
  Search,
  Instagram,
  FolderOpen,
  Image as ImageIcon,
  Clock,
  ArrowRight,
  TrendingUp,
  Heart,
  Bookmark,
  Share2,
  CheckCircle2,
  Plus,
  Compass,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { ProjectCard } from "@/components/shared/project-card";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { formatById } from "@/lib/studio/formats";
import { previewTemplate, TEMPLATE_STARTERS } from "@/lib/studio/templates";
import { useStudio } from "@/stores/studio-store";
import { useCampaignStore } from "@/lib/studio/campaign-store";
import { useNavigate } from "@tanstack/react-router";
import { AiCreativeModal } from "@/components/studio/ai-creative-modal";
import { GlobalCreativeSearchModal } from "@/components/studio/global-creative-search-modal";
import { InstagramCenterModal } from "@/components/studio/instagram-center-modal";
import { ConnectionCenterModal } from "@/components/studio/connection-center-modal";
import { toast } from "sonner";

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

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("09/24 浮游禪光 迎新茶會");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [igCenterOpen, setIgCenterOpen] = useState(false);
  const [connectionCenterOpen, setConnectionCenterOpen] = useState(false);

  const brand = brands[0];

  const assetIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of projects) {
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
  }, [projects, brands, assets]);
  const urls = useAssetUrls(assetIds);

  function startTemplate(id: (typeof TEMPLATE_STARTERS)[number]["id"]) {
    if (!brand) return;
    const project = createFromTemplate({ templateId: id, brandId: brand.id });
    void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
  }

  function openAiWithTopic(t: string) {
    setAiTopic(t);
    setAiModalOpen(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8 md:py-8 space-y-8">
      {/* Top Banner / Studio Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              TKU
            </span>
            <span className="text-xs font-semibold text-primary tracking-wide">
              淡江大學禪學社 AI Creative Marketing Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-fg tracking-tight">
            一人網宣創作中控台
          </h1>
          <p className="text-xs text-muted mt-0.5">
            企劃 × 文案 × 圖片生成 × IG 排程 × Google Drive × Canva 設計
          </p>
        </div>

        {/* Quick Hub Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchModalOpen(true)}
            className="text-xs h-8 gap-1.5 bg-surface"
          >
            <Search className="size-3.5 text-emerald-600" />
            跨來源搜尋
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIgCenterOpen(true)}
            className="text-xs h-8 gap-1.5 bg-surface"
          >
            <Instagram className="size-3.5 text-pink-600" />
            IG Center
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConnectionCenterOpen(true)}
            className="text-xs h-8 gap-1.5 bg-surface"
          >
            <FolderOpen className="size-3.5 text-blue-600" />
            第三方連接 ({connections.filter((c) => c.status === "connected").length}/3)
          </Button>

          <Button
            size="sm"
            onClick={() => openAiWithTopic("09/24 浮游禪光 迎新茶會")}
            className="text-xs h-8 gap-1.5 shadow-sm"
          >
            <Sparkles className="size-3.5" />
            AI 創作靈感
          </Button>
        </div>
      </div>

      {/* Hero Section: 今日推薦創作 */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-surface to-surface-2 p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-fg text-xs px-2.5 py-0.5 font-bold">
                今天推薦創作
              </Badge>
              <Badge className="text-xs border border-primary/40 text-primary bg-primary/5">
                09/24 浮游禪光 · 還有 8 天
              </Badge>
              <span className="text-xs text-muted flex items-center gap-1">
                <Clock className="size-3.5" /> 建議發文時間：平日 20:30 (淡江宿舍放鬆時段)
              </span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-fg leading-snug">
                AI 推薦主題：「最近是不是很久沒有好好坐下來？」
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                適合格式：<strong className="text-fg">IG 5頁情緒共鳴 Carousel</strong>。以淡江開學第三週選課人際壓力切入，結合安靜喝茶、三色光靜心，最後引導至迎新茶會免費席位預約。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                onClick={() => openAiWithTopic("最近是不是很久沒有好好坐下來？- 浮游禪光茶會")}
                className="gap-2 shadow-md text-xs sm:text-sm font-semibold h-9"
              >
                <Wand2 className="size-4" />
                AI 幫我創作此篇
              </Button>
              <Button
                variant="outline"
                onClick={() => setIgCenterOpen(true)}
                className="text-xs sm:text-sm h-9 bg-surface/80"
              >
                <Instagram className="size-3.5 text-pink-500 mr-1.5" />
                預覽 IG 9宮格
              </Button>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="shrink-0 w-full lg:w-72 rounded-xl border border-border bg-surface p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-border/60">
              <span className="font-semibold text-fg">AI 即時策略包</span>
              <span className="text-[11px] text-emerald-600 font-medium">已備妥</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>・IG Hook 文案</span>
                <span className="text-fg font-medium">3 秒停留設計</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>・視覺 Prompt</span>
                <span className="text-fg font-medium">晨曦暖光/夜青微光</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>・Story 互動問卷</span>
                <span className="text-fg font-medium">淡水下雨心境投票</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>・Reels 腳本</span>
                <span className="text-fg font-medium">克難坡降心率技巧</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 快速開始區塊 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
            <Compass className="size-4 text-primary" />
            快速開始創作
          </h3>
          <span className="text-xs text-muted">從不同起點瞬間開啟 AI 創作流程</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => openAiWithTopic("生成 IG 貼文與主題圖")}
            className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-left flex flex-col justify-between group shadow-sm hover:border-primary/40"
          >
            <span className="p-2 rounded-lg bg-pink-500/10 text-pink-600 w-fit mb-2 group-hover:scale-105 transition-transform">
              <Instagram className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-fg block">生成 IG 貼文</span>
              <span className="text-[10px] text-muted">單張／圖文圖卡</span>
            </div>
          </button>

          <button
            onClick={() => openAiWithTopic("生成 5P Carousel 輪播")}
            className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-left flex flex-col justify-between group shadow-sm hover:border-primary/40"
          >
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit mb-2 group-hover:scale-105 transition-transform">
              <Layers className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-fg block">生成 Carousel</span>
              <span className="text-[10px] text-muted">情緒共鳴輪播卡</span>
            </div>
          </button>

          <button
            onClick={() => openAiWithTopic("生成 IG Story 限動互動問卷")}
            className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-left flex flex-col justify-between group shadow-sm hover:border-primary/40"
          >
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-600 w-fit mb-2 group-hover:scale-105 transition-transform">
              <Sparkles className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-fg block">生成 Story</span>
              <span className="text-[10px] text-muted">投票／問答／倒數</span>
            </div>
          </button>

          <button
            onClick={() => openAiWithTopic("生成 Reels 20秒減壓短影音腳本")}
            className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-left flex flex-col justify-between group shadow-sm hover:border-primary/40"
          >
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 w-fit mb-2 group-hover:scale-105 transition-transform">
              <Wand2 className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-fg block">生成 Reels</span>
              <span className="text-[10px] text-muted">校園生活實用腳本</span>
            </div>
          </button>

          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-left flex flex-col justify-between group shadow-sm hover:border-primary/40"
          >
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit mb-2 group-hover:scale-105 transition-transform">
              <FolderOpen className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-fg block">從 Drive 素材開始</span>
              <span className="text-[10px] text-muted">歷屆茶會照片</span>
            </div>
          </button>

          <button
            onClick={() => setIgCenterOpen(true)}
            className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-2 transition-all text-left flex flex-col justify-between group shadow-sm hover:border-primary/40"
          >
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-600 w-fit mb-2 group-hover:scale-105 transition-transform">
              <TrendingUp className="size-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-fg block">從以前 IG 貼文</span>
              <span className="text-[10px] text-muted">延伸爆款共鳴文案</span>
            </div>
          </button>
        </div>
      </section>

      {/* 近期 Campaign 與已排程內容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 近期社團活動 Campaign */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
              <Calendar className="size-4 text-primary" />
              社團活動 Campaign
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewProjectOpen(true)}
              className="text-xs h-7 gap-1"
            >
              <Plus className="size-3.5" /> 建立新活動
            </Button>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className="border border-primary/40 text-primary bg-primary/5 text-xs">
                      {camp.type === "tea-party" ? "迎新茶會" : "日常社課"}
                    </Badge>
                    <h4 className="text-sm font-bold text-fg">{camp.name}</h4>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{camp.oneLiner}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted pt-1">
                    <span>📅 {camp.date} {camp.time}</span>
                    <span>📍 {camp.location}</span>
                    <span className="text-primary font-medium">🎯 {camp.theme}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => openAiWithTopic(`${camp.name} 完整宣傳波段`)}
                    className="text-xs h-8 gap-1"
                  >
                    <Sparkles className="size-3.5" /> AI 生成完整宣傳
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      startTemplate("editorial");
                      toast.success(`已將活動「${camp.name}」帶入編輯器！`);
                    }}
                    className="text-xs h-8"
                  >
                    開啟畫布編輯
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 已排程與待發布內容 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
              <Clock className="size-4 text-primary" />
              已排程內容
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIgCenterOpen(true)}
              className="text-xs h-7 text-primary"
            >
              查看日曆
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-2.5">
            {scheduledPosts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="p-2.5 rounded-lg bg-surface-2 border border-border/60 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <Badge className="text-[10px] uppercase bg-surface-2 text-muted">
                    {post.contentType}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted">{post.scheduledAt.split(" ")[0]}</span>
                </div>
                <h5 className="text-xs font-semibold text-fg line-clamp-1">{post.title}</h5>
                <p className="text-[11px] text-muted line-clamp-1">{post.hook}</p>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAiWithTopic("為茶會倒數生成新限動")}
              className="w-full text-xs text-primary h-8"
            >
              + AI 自動排入下一篇
            </Button>
          </div>
        </section>
      </div>

      {/* 既有作品與畫布快速入口 (延續保留可用架構) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-fg flex items-center gap-1.5">
            <Layers className="size-4 text-primary" />
            進行中的畫布專案 ({projects.length})
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewProjectOpen(true)}
            className="text-xs h-8 gap-1"
          >
            <Plus className="size-3.5" /> 新建專案
          </Button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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

      {/* 經典模板庫 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-fg">社團經典網宣版型</h3>
          <span className="text-xs text-muted">已套用淡江禪學社專屬配色與思源字體</span>
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
                  className="w-full rounded-2xl bg-surface p-3 text-left shadow-[var(--shadow-border)] transition-all hover:shadow-md hover:border-primary/40 border border-border"
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
                  <p className="mt-2.5 truncate text-xs font-bold text-fg">{tpl.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{tpl.description}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Modals */}
      <AiCreativeModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        initialTopic={aiTopic}
        onApplyPlan={(dir) => {
          if (projects[0]) {
            void navigate({ to: "/studio/$projectId", params: { projectId: projects[0].id } });
          }
        }}
      />

      <GlobalCreativeSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectAsset={(title) => {
          openAiWithTopic(`以素材「${title}」為核心生成新 IG 貼文`);
        }}
      />

      <InstagramCenterModal
        open={igCenterOpen}
        onOpenChange={setIgCenterOpen}
        onUseAsTemplate={(post) => {
          openAiWithTopic(`延續 IG 貼文「${post.caption.slice(0, 15)}...」的風格創作新活動`);
        }}
      />

      <ConnectionCenterModal
        open={connectionCenterOpen}
        onOpenChange={setConnectionCenterOpen}
      />

      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </main>
  );
}
