import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConvertPanel } from "@/components/create/convert-panel";
import { applyVisualDirection } from "@/components/create/apply-visual";
import { PackResult } from "@/components/create/pack-result";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { migrateBrief } from "@/lib/studio/brief";
import { CAMPAIGN_TYPES } from "@/lib/zen/types";
import type { CampaignType } from "@/lib/zen/types";
import { igDnaBlock } from "@/lib/zen/insights";
import { clientMemoryLines, composeMemoryNotes } from "@/lib/zen/ingest";
import { searchCreativeKnowledge } from "@/lib/zen/search";
import {
  emptyCampaign,
  applyPackToWaves,
  copyKindForWave,
  nextWaveAngle,
  nextWaveVisual,
  suggestWaves,
} from "@/lib/zen/schedule";
import { formatMd } from "@/lib/zen/season";
import { useCreative } from "@/stores/creative-store";
import { useStudio } from "@/stores/studio-store";

export function CampaignList() {
  const campaigns = useCreative((s) => s.campaigns);
  const upsert = useCreative((s) => s.upsertCampaign);
  const [open, setOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <PageHeader
        kicker="Campaign"
        title="活動"
        description="沒有負責人、沒有審核。建立後即可讓 AI 生成預熱到回顧。"
        actions={
          <Button onClick={() => setOpen((v) => !v)}>
            <Plus className="size-4" />
            建立活動
          </Button>
        }
      />
      {open ? <CampaignForm onSave={(c) => { upsert(c); setOpen(false); }} /> : null}
      <ul className="mt-6 space-y-2">
        {campaigns.map((camp) => (
          <li key={camp.id}>
            <Link
              to="/campaigns/$campaignId"
              params={{ campaignId: camp.id }}
              className="flex min-h-16 items-center justify-between rounded-2xl bg-surface px-4 shadow-[var(--shadow-border)]"
            >
              <span>
                <span className="block text-sm font-medium">{camp.name}</span>
                <span className="text-xs text-muted">
                  {formatMd(camp.date)} {camp.time} · {camp.location}
                </span>
              </span>
              <span className="text-xs text-muted">{camp.tagline.slice(0, 18)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function CampaignForm({ onSave }: { onSave: (c: ReturnType<typeof emptyCampaign>) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("2026-09-24");
  const [time, setTime] = useState("19:30");
  const [location, setLocation] = useState("淡江大學淡水校園");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [studentPain, setStudentPain] = useState("");
  const [cta, setCta] = useState("晚上見");
  const [signupUrl, setSignupUrl] = useState("");
  const [type, setType] = useState<CampaignType>("tea");

  return (
    <form
      className="mt-4 space-y-3 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        const camp = emptyCampaign({
          name,
          date,
          time,
          location,
          tagline,
          description,
          theme,
          studentPain,
          cta,
          signupUrl,
          type,
        });
        camp.waves = suggestWaves({ date, type, name });
        onSave(camp);
      }}
    >
      <Field label="活動名稱">
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="浮游禪光" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="日期">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <Field label="時間">
          <Input value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="地點">
        <Input value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <Field label="一句介紹">
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="最近是不是很久沒坐好？" />
      </Field>
      <Field label="完整介紹">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="活動主題">
        <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="夜燈、三色光、慢下來" />
      </Field>
      <Field label="學生痛點">
        <Input value={studentPain} onChange={(e) => setStudentPain(e.target.value)} placeholder="連休息都有罪惡感" />
      </Field>
      <Field label="主要 CTA">
        <Input value={cta} onChange={(e) => setCta(e.target.value)} />
      </Field>
      <Field label="報名連結">
        <Input
          value={signupUrl}
          onChange={(e) => setSignupUrl(e.target.value)}
          placeholder="https://…（沒有也可以之後再補）"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {CAMPAIGN_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setType(item.id)}
            className={`rounded-full px-3 py-2 text-xs ${type === item.id ? "bg-accent text-accent-fg" : "bg-bg"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Button type="submit">建立並排出節奏</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const navigate = useNavigate();
  const campaign = useCreative((s) => s.campaigns.find((c) => c.id === campaignId));
  const brands = useStudio((s) => s.brands);
  const assets = useStudio((s) => s.assets);
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const attach = useCreative((s) => s.attachProject);
  const patchWave = useCreative((s) => s.patchWave);
  const patchCampaign = useCreative((s) => s.patchCampaign);
  const upsertCampaign = useCreative((s) => s.upsertCampaign);
  const lastPack = useCreative((s) => s.lastPack);
  const setLastPack = useCreative((s) => s.setLastPack);
  const igPosts = useCreative((s) => s.igPosts);
  const memory = useCreative((s) => s.memory);
  const [busy, setBusy] = useState(false);
  const [waveBusy, setWaveBusy] = useState<string | null>(null);
  const [signupUrl, setSignupUrl] = useState(campaign?.signupUrl ?? "");

  useEffect(() => {
    setSignupUrl(campaign?.signupUrl ?? "");
  }, [campaign?.id, campaign?.signupUrl]);

  if (!campaign) {
    return (
      <main className="px-4 py-16 text-center text-sm text-muted">
        找不到活動。
        <Button className="mt-4" onClick={() => navigate({ to: "/campaigns" })}>
          回列表
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <p className="text-xs text-muted">
        {campaign.date} {campaign.time} · {campaign.location}
      </p>
      <h1 className="mt-2 font-display text-3xl">{campaign.name}</h1>
      <p className="mt-3 text-lg">{campaign.tagline}</p>
      <p className="mt-2 text-sm text-muted">{campaign.description}</p>
      <p className="mt-2 text-sm">學生痛點：{campaign.studentPain || "—"}</p>
      <p className="mt-1 text-sm">主題：{campaign.theme || "—"} · CTA：{campaign.cta}</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          patchCampaign(campaign.id, { signupUrl: signupUrl.trim() });
          toast.success(signupUrl.trim() ? "已記下報名連結" : "已清空報名連結");
        }}
      >
        <Input
          value={signupUrl}
          onChange={(e) => setSignupUrl(e.target.value)}
          placeholder="報名連結"
          aria-label="報名連結"
        />
        <Button type="submit" variant="secondary">
          儲存報名
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap gap-2">
      <Button
        disabled={busy}
        onClick={async () => {
          const brand = brands[0];
          if (!brand) return;
          setBusy(true);
          try {
            const { generateCreativePack } = await import("@/lib/ai/pack");
            const { toBriefInput } = await import("@/lib/ai/payload");
            const brief = migrateBrief({
              eventName: campaign.name,
              schedule: `${campaign.date} ${campaign.time}`,
              location: campaign.location,
              audience: "淡江大學學生",
              features: campaign.theme,
              notes: [campaign.studentPain, campaign.signupUrl && `報名：${campaign.signupUrl}`]
                .filter(Boolean)
                .join("\n"),
              offer: campaign.cta,
              deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
            });
            const world = searchCreativeKnowledge(`${campaign.name} ${campaign.theme} ${campaign.tagline}`, {
              assets,
              campaigns: useCreative.getState().campaigns,
              igPosts,
              memory,
            });
            const result = await generateCreativePack({
              data: toBriefInput(brief, brand, {
                dnaNotes: igDnaBlock(igPosts),
                memoryNotes: composeMemoryNotes([world.memoryNotes, clientMemoryLines(memory)]),
                foundCount: world.foundCount,
                citedSources: world.sources,
              }),
            });
            if (!result.ok) {
              toast.error("完整宣傳沒有生成出來");
              return;
            }
            setLastPack(result.pack);
            upsertCampaign(applyPackToWaves(campaign, result.pack));
            toast.success("已生成主軸、三個方向、每一波文案。還沒進畫布。");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "生成中…" : "AI 生成完整宣傳"}
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          upsertCampaign({
            ...campaign,
            updatedAt: Date.now(),
            waves: campaign.waves.map((wave) =>
              wave.status === "published" || wave.status === "done" ? wave : { ...wave, status: "scheduled" },
            ),
          });
          toast.success("已把這檔活動排進日曆");
          void navigate({ to: "/calendar" });
        }}
      >
        排進日曆
      </Button>
      {lastPack && lastPack.campaignName === campaign.name ? (
        <Button
          variant="ghost"
          onClick={() => {
            const brand = brands[0];
            if (!brand || !lastPack) return;
            const brief = migrateBrief({
              eventName: campaign.name,
              schedule: `${campaign.date} ${campaign.time}`,
              location: campaign.location,
              audience: "淡江大學學生",
              features: campaign.theme,
              notes: campaign.studentPain,
              deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
            });
            const project = createProject({
              name: campaign.name,
              brandId: brand.id,
              formatId: "feed-portrait",
              brief,
              templateId: lastPack.plan.templateId,
            });
            applyCampaignPlan(project.id, lastPack.plan, brief);
            attach(campaign.id, project.id);
            void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
          }}
        >
          打開畫布
        </Button>
      ) : null}
      </div>
      {lastPack && lastPack.campaignName === campaign.name ? (
        <section className="mt-6">
          <PackResult
            pack={lastPack}
            campaignId={campaign.id}
            onApply={async (directionId) => {
              const result = await applyVisualDirection({
                pack: lastPack,
                directionId,
                campaignId: campaign.id,
              });
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("已生成主視覺，打開 IG Preview");
              void navigate({ to: "/instagram" });
            }}
            onSuiteDone={() => navigate({ to: "/calendar" })}
          />
          <ConvertPanel pack={lastPack} campaignId={campaign.id} />
        </section>
      ) : null}
      <ol className="mt-8 space-y-2">
        {campaign.waves.map((wave) => (
          <li key={wave.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">{new Date(wave.scheduledAt).toLocaleString("zh-TW")}</p>
            <p className="text-sm font-medium">{wave.title}</p>
            {wave.copyPreview ? <p className="mt-2 text-sm leading-relaxed">{wave.copyPreview}</p> : null}
            {wave.notes ? <p className="mt-1 text-xs text-muted">{wave.notes}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={waveBusy === wave.id || busy}
              onClick={async () => {
                setWaveBusy(wave.id);
                try {
                  const { generateCopyPack } = await import("@/lib/ai/copy");
                  const result = await generateCopyPack({
                    data: {
                      idea: `${campaign.name} ${wave.title} ${campaign.tagline}`,
                      kind: copyKindForWave(wave.kind),
                      eventName: campaign.name,
                      schedule: `${campaign.date} ${campaign.time}`,
                      location: campaign.location,
                      signupUrl: campaign.signupUrl,
                      dnaNotes: igDnaBlock(igPosts),
                      memoryNotes: composeMemoryNotes([
                        searchCreativeKnowledge(`${campaign.name} ${wave.title}`, {
                          assets,
                          campaigns: useCreative.getState().campaigns,
                          igPosts,
                          memory,
                        }).memoryNotes,
                        clientMemoryLines(memory),
                      ]),
                    },
                  });
                  if (!result.ok) return;
                  patchWave(campaign.id, wave.id, { copyPreview: result.pack.hook, status: "creating" });
                } finally {
                  setWaveBusy(null);
                }
              }}
            >
              重新生成這波
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={waveBusy === wave.id || busy}
              onClick={async () => {
                const next = nextWaveAngle(wave.kind, wave.angleIndex ?? 0);
                setWaveBusy(wave.id);
                try {
                  const { generateCopyPack } = await import("@/lib/ai/copy");
                  const result = await generateCopyPack({
                    data: {
                      idea: `${campaign.name} ${wave.title} ${campaign.tagline}`,
                      kind: copyKindForWave(wave.kind),
                      eventName: campaign.name,
                      schedule: `${campaign.date} ${campaign.time}`,
                      location: campaign.location,
                      signupUrl: campaign.signupUrl,
                      angle: next.angle,
                      dnaNotes: igDnaBlock(igPosts),
                    },
                  });
                  if (!result.ok) return;
                  patchWave(campaign.id, wave.id, {
                    copyPreview: result.pack.hook,
                    status: "creating",
                    angleIndex: next.index,
                    notes: `換角度：${next.angle}`,
                  });
                  toast.success(`已換成「${next.angle}」`);
                } finally {
                  setWaveBusy(null);
                }
              }}
            >
              換角度
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={waveBusy === wave.id}
              onClick={() => {
                const packDirs =
                  lastPack && lastPack.campaignName === campaign.name ? lastPack.directions : undefined;
                const next = packDirs?.length
                  ? {
                      index: ((wave.visualIndex ?? 0) + 1) % packDirs.length,
                      direction: packDirs[((wave.visualIndex ?? 0) + 1) % packDirs.length]!,
                    }
                  : nextWaveVisual(`${campaign.name} ${campaign.tagline}`, wave.visualIndex ?? 0);
                const dir = next.direction;
                patchWave(campaign.id, wave.id, {
                  visualIndex: next.index,
                  notes: `${dir.title}｜${dir.imagePrompt}`,
                  copyPreview:
                    wave.kind === "key-visual"
                      ? `${dir.headline.replace(/\n/g, " ")}\n${dir.concept}`
                      : wave.copyPreview,
                  status: wave.status === "published" || wave.status === "done" ? wave.status : "creating",
                });
                toast.success(`已換成視覺「${dir.title}」`);
              }}
            >
              換視覺
            </Button>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
