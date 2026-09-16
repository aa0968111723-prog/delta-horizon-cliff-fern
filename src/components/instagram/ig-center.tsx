import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { FormatPreview } from "@/components/create/format-preview";
import { IgThumb } from "@/components/create/ig-thumb";
import { IG_DNA } from "@/lib/club/memory";
import { lastPackPreviewSrc, packAssetIds, withPackKind } from "@/lib/club/last-pack";
import { CONVERT_TARGETS } from "@/lib/convert/pack";
import { analysisFromLive, lessonsFromIg, nextCreateIdeaFromLessons } from "@/lib/club/insights";
import { writeHandoff } from "@/lib/create/handoff";
import { completePackPublish } from "@/lib/club/publish-ready";
import { styleBriefFromPublish } from "@/lib/club/publish";
import { toast } from "sonner";
import { listConnectedMedia } from "@/lib/connections/oauth";
import { beginOAuth } from "@/lib/connections/begin";
import { takeOAuthResume } from "@/lib/connections/resume";
import { useCreative, type IgMemoryPost } from "@/stores/creative-store";
import { useAssetUrls } from "@/hooks/use-asset-urls";

export function InstagramCenter() {
  const navigate = useNavigate();
  const posts = useCreative((s) => s.igPosts);
  const ingestIg = useCreative((s) => s.ingestIg);
  const lastPack = useCreative((s) => s.lastPack);
  const setLastPack = useCreative((s) => s.setLastPack);
  const setScheduleStatus = useCreative((s) => s.setScheduleStatus);
  const rememberStyle = useCreative((s) => s.rememberStyle);
  const focusIgId = useCreative((s) => s.focusIgId);
  const setFocusIgId = useCreative((s) => s.setFocusIgId);
  const [active, setActive] = useState<IgMemoryPost | null>(null);
  const [live, setLive] = useState<IgMemoryPost[]>([]);
  const [publishing, setPublishing] = useState(false);
  const urls = useAssetUrls(packAssetIds(lastPack));
  const draftThumb = lastPack ? lastPackPreviewSrc(lastPack, urls) : "";
  const hydrated = useCreative((s) => s.hydrated);

  async function publishDraft() {
    const pack = useCreative.getState().lastPack;
    if (!pack) return;
    setPublishing(true);
    try {
      const result = await completePackPublish(pack, lastPackPreviewSrc(pack, urls));
      setLastPack(result.pack);
      if (result.videoPending) {
        toast.message(result.message);
        return;
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
      const row = useCreative.getState().schedule.find((item) => item.campaignId === pack.campaignId && item.contentKind === pack.kind && item.status !== "published");
      if (row) setScheduleStatus(row.id, "published");
      toast.success(result.message);
    } finally {
      setPublishing(false);
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    if (!takeOAuthResume("ig-publish")) return;
    if (!useCreative.getState().lastPack) return;
    void publishDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    void listConnectedMedia().then((result) => {
      const mapped: IgMemoryPost[] = result.instagram.map((item) => {
        const mediaType = item.kind === "carousel" ? "carousel" : item.kind === "reels" ? "reels" : "image";
        return {
          id: item.id,
          mediaType,
          caption: item.caption || item.title,
          takenAt: item.date ? Date.parse(item.date) : Date.now(),
          thumb: item.thumb,
          permalink: item.notes.startsWith("http") ? item.notes : undefined,
          metrics: item.metrics,
          metricsSource: "live" as const,
          analysis: analysisFromLive({
            caption: item.caption || item.title,
            mediaType,
            metrics: item.metrics,
          }),
        };
      });
      setLive(mapped);
      if (mapped.length) ingestIg(mapped);
    });
  }, [ingestIg]);

  const grid = live.length ? live : posts;
  const lessons = lessonsFromIg(posts);
  const learned = posts.some((post) => (post.analysis || "").includes("剛發布"));
  const draftPost: IgMemoryPost | null = lastPack
    ? {
        id: `draft_${lastPack.projectId}`,
        mediaType: lastPack.kind === "carousel" ? "carousel" : lastPack.kind === "reels" ? "reels" : "image",
        caption: lastPack.caption,
        takenAt: lastPack.updatedAt,
        thumb: draftThumb,
        metricsSource: "memory",
        analysis: `草稿 · ${lastPack.eventName}。Hook：${lastPack.hook}`,
      }
    : null;

  useEffect(() => {
    if (!focusIgId) return;
    const draftId = lastPack ? `draft_${lastPack.projectId}` : "";
    if (lastPack && (focusIgId === draftId || focusIgId === "draft")) {
      setActive({
        id: draftId,
        mediaType: lastPack.kind === "carousel" ? "carousel" : lastPack.kind === "reels" ? "reels" : "image",
        caption: lastPack.caption,
        takenAt: lastPack.updatedAt,
        thumb: draftThumb,
        metricsSource: "memory",
        analysis: `草稿 · ${lastPack.eventName}。Hook：${lastPack.hook}`,
      });
    } else {
      const post = posts.find((item) => item.id === focusIgId) || live.find((item) => item.id === focusIgId);
      if (post) setActive(post);
    }
    setFocusIgId(null);
  }, [focusIgId, lastPack, draftThumb, posts, live, setFocusIgId]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Instagram Center"
        title="IG 是主要輸出"
        description="Feed、Grid、Story、Reels、Caption、排程與歷史記憶都在這裡。連接後會讀官方 API，不會爬蟲。"
        actions={
          <Button asChild variant="secondary">
            <Link to="/connections">連接帳號</Link>
          </Button>
        }
      />

      <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <h2 className="text-sm font-medium">過去 IG</h2>
          <p className="mt-1 text-xs text-muted">
            {live.length ? "官方 Instagram 內容。" : "本機 Creative Memory。官方授權後會換成真實貼文。"}
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-1">
            {draftPost ? (
              <li>
                <button type="button" className="relative block w-full" onClick={() => setActive(draftPost)}>
                  <IgThumb src={draftPost.thumb} caption={lastPack?.hook} />
                  <span className="absolute left-1 top-1 rounded-full bg-accent px-2 py-0.5 text-[10px] text-accent-fg">
                    草稿
                  </span>
                </button>
              </li>
            ) : null}
            {grid.map((post) => (
              <li key={post.id}>
                <button type="button" className="block w-full" onClick={() => setActive(post)}>
                  <IgThumb src={post.thumb} caption={post.caption} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <aside className="rounded-3xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-medium">IG Preview</h2>
          {lastPack ? (
            <div className="mt-4" data-testid="ig-preview">
              <div className="mb-3 flex flex-wrap gap-1">
                {CONVERT_TARGETS.map((item) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant={lastPack.kind === item.id ? "default" : "secondary"}
                    data-testid={`ig-preview-kind-${item.id}`}
                    onClick={() => setLastPack(withPackKind(lastPack, item.id))}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <FormatPreview
                kind={lastPack.kind}
                src={lastPackPreviewSrc(lastPack, urls)}
                hook={lastPack.hook}
                items={lastPack.converted ?? lastPack.packs?.[lastPack.kind] ?? []}
                videoUrl={lastPack.kind === "reels" ? lastPack.reelsVideoUrl : undefined}
              />
              <p className="mt-3 text-sm font-medium">{lastPack.hook}</p>
              <p className="mt-1 whitespace-pre-wrap text-xs text-muted">{lastPack.caption.slice(0, 160)}</p>
              <p className="mt-2 text-[11px] text-subtle">{lastPack.hashtags.join(" ")}</p>
              <Button asChild className="mt-3 w-full" size="sm">
                <Link to="/create" search={{ tab: "campaign" }}>
                  繼續改這篇
                </Link>
              </Button>
              <Button
                className="mt-2 w-full"
                size="sm"
                variant="secondary"
                data-testid="ig-publish"
                disabled={publishing}
                onClick={() => void publishDraft()}
              >
                {publishing ? "發布中…" : "發布到 IG"}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">先做一篇內容，這裡會出現 Feed 預覽。</p>
          )}
        </aside>
      </section>

      {active ? (
        <section className="mt-8 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="flex flex-col gap-4 md:flex-row">
            <img src={active.thumb} alt="" className="w-full max-w-xs rounded-2xl object-cover" />
            <div>
              <p className="text-xs text-muted">
                {format(active.takenAt, "yyyy/MM/dd", { locale: zhTW })} · {active.mediaType} · {active.metricsSource === "memory" ? "本機記憶" : "官方 Insights"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{active.caption}</p>
              {active.metrics ? (
                <p className="mt-3 text-xs text-muted">
                  觸及 {active.metrics.reach} · 收藏 {active.metrics.saves} · 留言 {active.metrics.comments}
                </p>
              ) : null}
              <p className="mt-3 text-sm">{active.analysis}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  data-testid="ig-analyze"
                  onClick={() => {
                    writeHandoff({
                      idea: nextCreateIdeaFromLessons(
                        [active],
                        lastPack?.eventName,
                      ),
                      tab: "campaign",
                      autoRun: true,
                      sourceLabel: `Instagram / ${format(active.takenAt, "yyyy-MM-dd")}`,
                      imageSrc: active.thumb,
                    });
                    void navigate({ to: "/create", search: { tab: "campaign" } });
                  }}
                >
                  AI 分析並做新的
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-10 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">下一次可以怎麼寫</h2>
        <p className="mt-1 text-xs text-muted">用過去表現改善生成，不是報表牆。</p>
        {learned ? (
          <p className="mt-3 text-sm text-accent" data-testid="ig-learned">
            已記住這次第一句。下次生成會先參考，不會改回社團全名。
          </p>
        ) : null}
        <ul className="mt-4 space-y-3 text-sm">
          <li>Hook：{lessons.hook}</li>
          <li>圖片：{lessons.visual}</li>
          <li>活動文案：{lessons.activity}</li>
          <li>Carousel：{lessons.carousel}</li>
          <li>Story：{lessons.story}</li>
        </ul>
        {learned ? (
          <Button
            className="mt-4 w-full"
            data-testid="ig-learned-create"
            onClick={() => {
              writeHandoff({
                idea: nextCreateIdeaFromLessons(posts, lastPack?.eventName),
                tab: "campaign",
                autoRun: true,
                sourceLabel: "Instagram / 剛發布",
              });
              void navigate({ to: "/create", search: { tab: "campaign" } });
            }}
          >
            下一篇延續這個 Hook
          </Button>
        ) : null}
      </section>

      <section className="mt-10 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Zen Club IG DNA</h2>
        <p className="mt-2 text-sm text-muted">{IG_DNA.voice}</p>
        <p className="mt-2 text-sm">配色 {IG_DNA.palette.join("、")}</p>
        <p className="mt-1 text-sm">常用 CTA {IG_DNA.ctas.join("／")}</p>
        <p className="mt-1 text-sm">Caption {IG_DNA.captionLength}</p>
      </section>
    </main>
  );
}
