import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { writeHandoff } from "@/lib/create/handoff";
import { generateCampaignPlan } from "@/lib/ai/campaign";
import { toBriefInput } from "@/lib/ai/payload";
import { generateCopyPack } from "@/lib/copy/generate";
import { generateImageDirections } from "@/lib/image/studio";
import { emptyBrief } from "@/lib/studio/brief";
import { lessonPrompt } from "@/lib/club/insights";
import { lastPackFromPlan } from "@/lib/club/last-pack";
import { convertPlan } from "@/lib/convert/pack";
import { buildCampaignRhythm } from "@/lib/club/schedule";
import { CONTENT_KIND_META } from "@/lib/studio/status";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

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
  const brands = useStudio((s) => s.brands);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const updateProject = useStudio((s) => s.updateProject);
  const attachProject = useCreative((s) => s.attachProject);
  const setLastPack = useCreative((s) => s.setLastPack);
  const igPosts = useCreative((s) => s.igPosts);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
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

  async function generate() {
    const brand = brands[0];
    if (!brand) return;
    setBusy(true);
    try {
      const brief = {
        ...emptyBrief(),
        eventName: current.name,
        product: current.name,
        schedule: `${current.date} ${current.time}`,
        location: current.location,
        audience: "淡江大學學生",
        features: current.description,
        notes: `${current.oneLiner} 痛點：${current.studentPain}`,
        deliverables: { post: true, story: true, carousel: true, reels: true },
      };
      const result = await generateCampaignPlan({
        data: toBriefInput(brief, brand, { igLessons: lessonPrompt(igPosts) }),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.plan.directions) setDirections(current.id, result.plan.directions);
      const project = createProject({
        name: result.plan.campaignName,
        brandId: brand.id,
        formatId: "feed-portrait",
        brief,
        templateId: result.plan.templateId,
      });
      applyCampaignPlan(project.id, result.plan, brief);
      attachProject(current.id, project.id);
      if (result.plan.waves?.length) setWaves(current.id, result.plan.waves, { syncCalendar: true });
      else setWaves(current.id, buildCampaignRhythm({ eventDate: current.date, eventType: current.type || current.name }), { syncCalendar: true });
      updateProject(project.id, {
        campaignId: current.id,
        contentStatus: "scheduled",
        scheduledAt: Date.now(),
      });
      setLastPack(
        lastPackFromPlan({
          projectId: project.id,
          campaignId: current.id,
          eventName: current.name,
          plan: result.plan,
          kind: "ig-post",
          converted: convertPlan(result.plan, "ig-post").items,
          directionName: result.plan.directions?.[0]?.name,
        }),
      );
      toast.success("已生成完整宣傳並排入 Calendar");
      void navigate({ to: "/instagram" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader kicker={current.type} title={current.name} description={current.oneLiner} />
      <div className="mt-6 space-y-3 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)]">
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
      <Button className="mt-6 w-full" disabled={busy} onClick={() => void generate()}>
        {busy ? "生成中…" : "AI 生成完整宣傳"}
      </Button>
      {current.waves.length ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">發布節奏</h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setWaves(current.id, buildCampaignRhythm({ eventDate: current.date, eventType: current.type || current.name }), {
                  syncCalendar: true,
                })
              }
            >
              依活動重排節奏
            </Button>
          </div>
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
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      try {
                        const result = await generateCopyPack({
                          data: {
                            idea: wave.hook,
                            intent: wave.label,
                            tone: "學生版",
                            eventName: current.name,
                            schedule: `${current.date} ${current.time}`,
                            location: current.location,
                            igLessons: lessonPrompt(igPosts),
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
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
                >
                  改寫這一波
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    void (async () => {
                      setBusy(true);
                      try {
                        const result = await generateCopyPack({
                          data: {
                            idea: wave.hook,
                            intent: wave.label,
                            tone: "生活版",
                            eventName: current.name,
                            schedule: `${current.date} ${current.time}`,
                            location: current.location,
                            igLessons: lessonPrompt(igPosts),
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
                      } finally {
                        setBusy(false);
                      }
                    })();
                  }}
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
