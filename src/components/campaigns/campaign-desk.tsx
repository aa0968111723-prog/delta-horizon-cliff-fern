import { Link, useNavigate } from "@tanstack/react-router";
import { PublishButton } from "@/components/create/publish-button";
import { Button } from "@/components/ui/button";
import { daysUntil } from "@/lib/club/season";
import { contentKindLabel } from "@/lib/studio/content";
import { STATUS_META } from "@/lib/studio/status";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function CampaignDesk({ campaignId }: { campaignId: string }) {
  const campaign = useCreative((s) => s.campaigns.find((c) => c.id === campaignId));
  const generateWaves = useCreative((s) => s.generateWaves);
  const setLastQuery = useCreative((s) => s.setLastQuery);
  const projects = useStudio((s) => s.projects);
  const navigate = useNavigate();

  if (!campaign) {
    return (
      <main className="px-4 py-10">
        <p>找不到這個活動。</p>
        <Link to="/campaigns">回到列表</Link>
      </main>
    );
  }

  const current = campaign;

  function generate() {
    setLastQuery(current.name);
    void navigate({
      to: "/create",
      search: { q: `幫我做 ${current.name} 完整宣傳`, auto: "1", campaign: current.id },
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <Link to="/campaigns" className="text-xs text-muted">
        全部活動
      </Link>
      <h1 className="mt-2 font-display text-3xl">{campaign.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {campaign.date} {campaign.time} · {campaign.location} · 還有 {daysUntil(campaign.date)} 天
      </p>
      <p className="mt-4 font-display text-xl">{campaign.oneLiner}</p>
      <p className="mt-2 text-sm leading-relaxed">{campaign.fullIntro}</p>
      <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <dt className="text-xs text-muted">學生痛點</dt>
          <dd className="mt-1">{campaign.studentPain || "還沒寫"}</dd>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <dt className="text-xs text-muted">CTA</dt>
          <dd className="mt-1">{campaign.cta}</dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button className="min-h-11 rounded-full" onClick={generate}>
          AI 生成完整宣傳
        </Button>
        <Button variant="secondary" className="min-h-11 rounded-full" onClick={() => generateWaves(campaign.id)}>
          重算發布節奏
        </Button>
      </div>
      <h2 className="mt-10 text-sm font-medium">發布節奏</h2>
      <ol className="mt-3 space-y-2">
        {campaign.waves.map((wave) => {
          const project = wave.projectId ? projects.find((p) => p.id === wave.projectId) : null;
          return (
            <li key={wave.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium">
                {wave.intent} · {wave.topic}
              </p>
              <p className="text-xs text-muted">
                {wave.offsetDays === 0 ? "當天" : wave.offsetDays < 0 ? `提前 ${-wave.offsetDays} 天` : `隔 ${wave.offsetDays} 天`}
                · {contentKindLabel(wave.contentKind)} · {STATUS_META[wave.status].label}
              </p>
              {project ? (
                <Link className="mt-1 inline-block text-xs underline" to="/studio/$projectId" params={{ projectId: project.id }}>
                  打開作品
                </Link>
              ) : (
                <button
                  type="button"
                  className="mt-1 text-xs underline"
                  onClick={() =>
                    void navigate({
                      to: "/create",
                      search: { q: `${campaign.name} ${wave.topic}`, campaign: campaign.id, auto: "1" },
                    })
                  }
                >
                  生成這一波
                </button>
              )}
              {wave.status !== "published" ? (
                <div className="mt-2">
                  <PublishButton
                    campaignId={campaign.id}
                    waveId={wave.id}
                    projectId={wave.projectId ?? project?.id}
                    title={`${wave.intent} · ${wave.topic}`}
                  />
                </div>
              ) : (
                <p className="mt-1 text-xs text-subtle">已進 Content Memory</p>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
