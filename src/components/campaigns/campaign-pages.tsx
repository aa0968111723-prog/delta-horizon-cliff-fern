import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { writeHandoff } from "@/lib/create/handoff";
import { generateCopyPack, type CopyTone } from "@/lib/copy/generate";
import { generateImageDirections } from "@/lib/image/studio";
import { lessonPrompt, rhythmMemoryFromIg } from "@/lib/club/insights";
import { FEATURED_EVENT, featuredCampaignIdea } from "@/lib/club/memory";
import { buildCampaignRhythm, leadDaysUntil } from "@/lib/club/schedule";
import { adoptIdeaFromAsset } from "@/lib/search/hits";
import { assetsByIds, sourceLabel } from "@/lib/studio/assets";
import { CONTENT_KIND_META } from "@/lib/studio/status";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";
import type { CampaignWave } from "@/lib/studio/types";

export function CampaignListPage() {
  const campaigns = useCreative((s) => s.campaigns);
  const upsertCampaign = useCreative((s) => s.upsertCampaign);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Campaign"
        title="活動"
        description="名稱、時間、地點、學生痛點與 CTA。沒有負責人，也沒有審核。"
      />
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const campaign = upsertCampaign({ name: name.trim(), type: "活動", oneLiner: "最近是不是很久沒有好好坐下來？" });
          setName("");
          void navigate({ to: "/campaigns/$campaignId", params: { campaignId: campaign.id } });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：下週茶會" />
        <Button type="submit">建立活動</Button>
      </form>
      <ul className="mt-8 space-y-3">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: campaign.id }}
              className="block rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <p className="text-xs text-muted">
                {campaign.date} · {campaign.type}
              </p>
              <h2 className="mt-1 font-display text-2xl">{campaign.name}</h2>
              <p className="mt-2 text-sm text-muted">{campaign.oneLiner}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const campaign = useCreative((s) => s.campaigns.find((c) => c.id === campaignId));
  const upsertCampaign = useCreative((s) => s.upsertCampaign);
  const setWaves = useCreative((s) => s.setWaves);
  const setDirections = useCreative((s) => s.setDirections);
  const assets = useStudio((s) => s.assets);
  const igPosts = useCreative((s) => s.igPosts);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const related = assetsByIds(assets, [...(campaign?.relatedAssetIds ?? []), ...(campaign?.imageAssetIds ?? [])]);
  const urls = useAssetUrls(related.map((item) => item.id));
  if (!campaign) {
    return (
      <main className="px-4 py-10">
        <p>找不到這個活動。</p>
        <Button asChild className="mt-4">
          <Link to="/campaigns">回列表</Link>
        </Button>
      </main>
    );
  }
  const current = campaign;

  function startFullCreate() {
    writeHandoff({
      idea: featuredCampaignIdea({
        ...FEATURED_EVENT,
        name: current.name,
        date: current.date,
        time: current.time,
        location: current.location,
        oneLiner: current.oneLiner || FEATURED_EVENT.oneLiner,
      }),
      tab: "campaign",
      autoRun: true,
      sourceLabel: `活動 / ${current.name}`,
    });
    void navigate({ to: "/create", search: { tab: "campaign" } });
  }

  async function rewriteWave(wave: CampaignWave, tone: CopyTone, idea?: string) {
    setBusy(true);
    try {
      const result = await generateCopyPack({
        data: {
          idea: idea || wave.hook,
          intent: wave.label,
          tone,
          eventName: current.name,
          schedule: `${current.date} ${current.time}`,
          location: current.location,
          igLessons: lessonPrompt(igPosts),
          styleMemory: (useCreative.getState().styleMemory ?? []).slice(0, 2).join("／").slice(0, 400),
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setWaves(
        current.id,
        current.waves.map((row) =>
          row.id === wave.id ? { ...row, hook: result.pack.hook, topic: result.pack.body.split("\n")[0] ?? row.topic } : row,
        ),
      );
      toast.success("這一波已改寫");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader kicker={current.type} title={current.name} description={current.oneLiner} />
      <section className="mt-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]" data-testid="campaign-related-assets">
        <p className="text-xs tracking-[0.16em] text-muted">相關素材 · Drive / Canva / IG / AI</p>
        {related.length ? (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {related.map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-2xl bg-bg" data-testid="campaign-related-asset" data-asset-source={asset.source}>
                <img src={urls[asset.id] || asset.seedSrc || ""} alt={asset.name} className="aspect-square w-full object-cover" />
                <div className="space-y-2 px-2 py-2">
                  <p className="truncate text-xs font-medium">{asset.name}</p>
                  <p className="truncate text-[10px] text-muted">{sourceLabel(asset.source)}</p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      data-testid="campaign-asset-adopt"
                      onClick={() => {
                        writeHandoff({
                          idea: adoptIdeaFromAsset(asset),
                          tab: "campaign",
                          autoRun: true,
                          imageSrc: asset.seedSrc,
                          assetId: asset.id,
                          sourceLabel: `${sourceLabel(asset.source)} / ${asset.name}`,
                        });
                        void navigate({ to: "/create", search: { tab: "campaign" } });
                      }}
                    >
                      加入創作
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid="campaign-asset-analyze"
                      onClick={() => {
                        writeHandoff({
                          tab: "vision",
                          imageSrc: asset.seedSrc,
                          assetId: asset.id,
                          visionNote: `${sourceLabel(asset.source)} / ${asset.name}`,
                          autoRun: true,
                          sourceLabel: `${sourceLabel(asset.source)} / ${asset.name}`,
                        });
                        void navigate({ to: "/create", search: { tab: "vision" } });
                      }}
                    >
                      分析
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">做完整宣傳後，Drive、Canva、IG 與 AI 生成會出現在這裡。</p>
        )}
      </section>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button className="sm:col-span-3" data-testid="campaign-generate" onClick={() => startFullCreate()}>
          AI 生成完整宣傳
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/calendar">看排程</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/instagram">IG Preview</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/assets">素材庫</Link>
        </Button>
      </div>
      <details className="mt-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <summary className="cursor-pointer text-sm font-medium">活動資訊</summary>
        <div className="mt-4 space-y-3">
        {(
          [
            ["活動名稱", "name"],
            ["活動類型", "type"],
            ["日期", "date"],
            ["時間", "time"],
            ["地點", "location"],
            ["一句介紹", "oneLiner"],
            ["主題", "theme"],
            ["學生痛點", "studentPain"],
            ["CTA", "cta"],
            ["報名連結", "signupUrl"],
          ] as const
        ).map(([label, key]) => (
          <label key={key} className="block text-sm">
            {label}
            <Input
              className="mt-1"
              value={current[key]}
              onChange={(e) => upsertCampaign({ ...current, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="block text-sm">
          完整介紹
          <Textarea
            className="mt-1"
            value={current.description}
            onChange={(e) => upsertCampaign({ ...current, description: e.target.value })}
          />
        </label>
        </div>
      </details>
      {current.waves.length ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">發布節奏</h2>
            <Button
              size="sm"
              variant="secondary"
              data-testid="campaign-rerhythm"
              onClick={() =>
                setWaves(
                  current.id,
                  buildCampaignRhythm({
                    eventDate: current.date,
                    eventType: current.type || current.name,
                    leadDays: leadDaysUntil(current.date),
                    memory: rhythmMemoryFromIg(igPosts),
                  }),
                  { syncCalendar: true },
                )
              }
            >
              依過去表現重排節奏
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted" data-testid="rhythm-note">
            {rhythmMemoryFromIg(igPosts).note}
          </p>
          <ul className="mt-3 space-y-2">
            {current.waves.map((wave) => (
              <li key={wave.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
                <p className="text-xs text-muted">
                  {wave.offsetDays === 0 ? "當天" : wave.offsetDays > 0 ? `後 ${wave.offsetDays} 天` : `提前 ${Math.abs(wave.offsetDays)} 天`} · {CONTENT_KIND_META[wave.contentKind].label}
                </p>
                <p className="font-medium">{wave.label} · {wave.topic}</p>
                <p className="text-sm text-muted">{wave.hook}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  data-testid="wave-regen"
                  disabled={busy}
                  onClick={() => void rewriteWave(wave, "學生版", `${current.oneLiner} ${wave.label} ${current.name}`)}
                >
                  重新生成
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void rewriteWave(wave, "學生版")}
                >
                  改寫這一波
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void rewriteWave(wave, "生活版")}
                >
                  換角度
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link
                    to="/create"
                    search={{ tab: "image" }}
                    onClick={() => writeHandoff({ idea: `${wave.hook} ${current.name}`, tab: "image", sourceLabel: `活動 / ${current.name}` })}
                  >
                    換視覺
                  </Link>
                </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {current.directions.length ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">3 個創意方向</h2>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                void (async () => {
                  setBusy(true);
                  try {
                    const result = await generateImageDirections({
                      data: {
                        idea: current.oneLiner || current.name,
                        eventName: current.name,
                        igLessons: lessonPrompt(igPosts),
                        styleMemory: (useCreative.getState().styleMemory ?? []).slice(0, 2).join("／").slice(0, 400),
                      },
                    });
                    setDirections(current.id, result.directions);
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
            >
              換視覺方向
            </Button>
          </div>
          <ul className="mt-3 space-y-3">
            {current.directions.map((dir) => (
              <li key={dir.id} className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="font-display text-lg">{dir.name}</p>
                <p className="mt-1 text-sm">{dir.concept}</p>
                <p className="mt-2 text-xs text-muted">{dir.palette} · {dir.composition} · {dir.typeDirection}</p>
                <p className="mt-2 text-sm">{dir.headline}</p>
                <p className="text-xs text-muted">{dir.subhead}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-3"
                  asChild
                >
                  <Link
                    to="/create"
                    search={{ tab: "image" }}
                    onClick={() => writeHandoff({ idea: dir.imagePrompt, tab: "image", sourceLabel: `活動 / ${current.name}` })}
                  >
                    用這個方向生成圖片
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
