import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ArtboardView } from "@/components/studio/artboard-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useAssetUrls, resolveAssetSrc } from "@/hooks/use-asset-urls";
import { generateCopyPack } from "@/lib/ai/copy";
import { FORMATS } from "@/lib/studio/formats";
import { pagesOf } from "@/lib/studio/layers";
import { SEED_ASSETS } from "@/lib/studio/seed";
import type { FormatId } from "@/lib/studio/types";
import { uid } from "@/lib/studio/ids";
import { dnaPromptIdea, igDnaBlock, learnFromPosts } from "@/lib/zen/insights";
import { IG_DNA } from "@/lib/zen/memory";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import { tonightAt } from "@/lib/zen/convert";
import { cn } from "@/lib/utils";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

type Tab = "grid" | "preview" | "calendar";

const PREVIEW_FORMATS: FormatId[] = ["feed-portrait", "feed-square", "story", "reels-cover", "threads"];

export function InstagramCenter() {
  const navigate = useNavigate();
  const igPosts = useCreative((s) => s.igPosts);
  const schedule = useCreative((s) => s.schedule);
  const addIgPost = useCreative((s) => s.addIgPost);
  const upsertSchedule = useCreative((s) => s.upsertSchedule);
  const projects = useStudio((s) => s.projects);
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const setCopy = useStudio((s) => s.setCopy);
  const ensureArtboard = useStudio((s) => s.ensureArtboard);
  const setActiveFormat = useStudio((s) => s.setActiveFormat);
  const urls = useAssetUrls(useMemo(() => [...assets.map((a) => a.id), ...igPosts.map((p) => p.assetId)], [assets, igPosts]));
  const [tab, setTab] = useState<Tab>("grid");
  const [active, setActive] = useState(igPosts[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [dnaBusy, setDnaBusy] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<FormatId>("feed-portrait");
  const [caption, setCaption] = useState("");
  const post = igPosts.find((p) => p.id === active);
  const brand = brands[0];
  const learned = useMemo(() => learnFromPosts(igPosts), [igPosts]);
  const previewProject =
    projects.find((p) => p.activeFormatId === previewFormat) ??
    projects.find((p) => pagesOf(p, previewFormat).length) ??
    projects[0];
  const previewPages = previewProject ? pagesOf(previewProject, previewFormat) : [];
  const upcoming = [...schedule]
    .filter((item) => ["ig-post", "carousel", "story", "reels", "threads"].includes(item.contentKind))
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  useEffect(() => {
    if (previewProject) setCaption(previewProject.copy.caption || previewProject.copy.headline);
  }, [previewProject?.id, previewProject?.copy.caption, previewProject?.copy.headline]);

  async function analyze() {
    if (!post) return;
    setBusy(true);
    try {
      const result = await generateCopyPack({
        data: {
          idea: post.caption,
          kind: post.mediaType === "reels" ? "reels" : post.mediaType === "carousel" ? "carousel" : "emotion",
          dnaNotes: igDnaBlock(igPosts),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const review = result.pack.studentReview;
      addIgPost({
        ...post,
        hook: result.pack.hook,
        analysis: `Hook：${result.pack.hook}\n視覺／主題：看學生會不會停。${review.wouldStop}\n太宗教？${review.tooReligious} 太 AI？${review.tooAi} 太長？${review.tooLong}\n時間地點：${review.knowsWhenWhere}`,
      });
      toast.success("已寫入 IG 記憶");
    } finally {
      setBusy(false);
    }
  }

  async function writeFromDna() {
    setDnaBusy(true);
    try {
      const result = await generateCopyPack({
        data: {
          idea: dnaPromptIdea(igPosts),
          kind: "emotion",
          dnaNotes: igDnaBlock(igPosts),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      upsertSchedule({
        id: uid("sch"),
        title: result.pack.hook,
        contentKind: "ig-post",
        status: "idea",
        scheduledAt: tonightAt(2),
        publishedAt: null,
        projectId: null,
        campaignId: null,
        captionPreview: result.pack.body,
      });
      toast.success("已用 IG DNA 寫出新文案，並放進日曆草稿");
      await navigate({ to: "/create" });
    } finally {
      setDnaBusy(false);
    }
  }

  function saveCaption() {
    if (!previewProject) return;
    ensureArtboard(previewProject.id, previewFormat);
    setActiveFormat(previewProject.id, previewFormat);
    setCopy(previewProject.id, { caption });
    toast.success("已更新 Caption");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="過去 IG"
        description={`DNA：${IG_DNA.voice} Caption ${IG_DNA.captionLength}`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {([
          ["grid", "Grid"],
          ["preview", "Preview"],
          ["calendar", "Calendar"],
        ] as const).map(([id, label]) => (
          <Button key={id} size="sm" variant={tab === id ? "default" : "secondary"} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      <section className="mt-6 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs text-muted">Zen Club IG DNA</p>
        <p className="mt-2 text-sm">{IG_DNA.visual}</p>
        <p className="mt-1 text-xs text-muted">
          CTA {IG_DNA.cta.join("／")} · {IG_DNA.hashtags.join(" ")}
        </p>
        <p className="mt-3 text-xs text-muted">有效 Hook：{learned.winningHooks.join("／")}</p>
        <Button className="mt-3" size="sm" disabled={dnaBusy} onClick={() => void writeFromDna()}>
          {dnaBusy ? "寫作中…" : "用這個 DNA 寫新文案"}
        </Button>
      </section>

      {tab === "grid" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div>
            <div className="grid grid-cols-3 gap-1">
              {igPosts.map((item) => {
                const seedSrc =
                assets.find((a) => a.id === item.assetId)?.seedSrc ??
                SEED_ASSETS.find((a) => a.id === item.assetId)?.seedSrc;
              const src = resolveAssetSrc(item.assetId, urls, seedSrc);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(item.id)}
                    className={cn("aspect-square overflow-hidden bg-surface", active === item.id && "ring-2 ring-accent")}
                  >
                    {src ? (
                      <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs text-muted">{item.mediaType}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {post ? (
              <article className="mt-6 rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {new Date(post.postedAt).toISOString().slice(0, 10)} · {post.mediaType}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.caption}</p>
                <p className="mt-3 text-xs text-muted">
                  收藏 {post.saves} · 留言 {post.comments} · 觸及 {post.reach}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm">{post.analysis}</p>
                <Button className="mt-4" variant="secondary" size="sm" disabled={busy} onClick={() => void analyze()}>
                  {busy ? "分析中…" : "AI 分析"}
                </Button>
              </article>
            ) : null}
          </div>
          <aside className="space-y-4">
            <p className="text-sm font-medium">哪種 Hook 比較有效</p>
            <ul className="space-y-2">
              {learned.ranked.slice(0, 4).map((item) => (
                <li key={item.id} className="rounded-2xl bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
                  <p className="text-xs text-muted">收藏 {item.saves} · 觸及 {item.reach}</p>
                  <p className="text-sm">{item.hook}</p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}

      {tab === "preview" ? (
        <section className="mt-6">
          <div className="flex flex-wrap gap-2">
            {PREVIEW_FORMATS.map((id) => {
              const meta = FORMATS.find((f) => f.id === id);
              return (
                <Button
                  key={id}
                  size="sm"
                  variant={previewFormat === id ? "default" : "secondary"}
                  onClick={() => {
                    setPreviewFormat(id);
                    if (previewProject) {
                      ensureArtboard(previewProject.id, id);
                      setActiveFormat(previewProject.id, id);
                    }
                  }}
                >
                  {meta?.name ?? id}
                </Button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-artboard)]">
              {previewPages[0] && brand ? (
                <ArtboardView artboard={previewPages[0]} brand={brand} urls={urls} width={280} />
              ) : (
                <p className="py-16 text-center text-xs text-muted">還沒有這個尺寸的預覽，先去創作一則。</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Caption</p>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} />
              <p className="text-xs text-muted">{IG_DNA.hashtags.join(" ")}</p>
              <Button size="sm" onClick={saveCaption} disabled={!previewProject}>
                更新文案
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">IG 排程</p>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/calendar">打開完整日曆</Link>
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {upcoming.map((item) => (
              <li key={item.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {format(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
                </p>
                <p className="text-sm">{item.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
