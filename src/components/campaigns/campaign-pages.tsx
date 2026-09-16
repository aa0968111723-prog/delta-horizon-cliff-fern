import { Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CAMPAIGN_TYPES } from "@/lib/zen/types";
import type { CampaignType } from "@/lib/zen/types";
import { igDnaBlock } from "@/lib/zen/insights";
import { emptyCampaign, suggestWaves } from "@/lib/zen/schedule";
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
  const [type, setType] = useState<CampaignType>("tea");

  return (
    <form
      className="mt-4 space-y-3 rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        const camp = emptyCampaign({ name, date, time, location, tagline, description, type });
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
  const createProject = useStudio((s) => s.createProject);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const attach = useCreative((s) => s.attachProject);
  const patchWave = useCreative((s) => s.patchWave);
  const upsertCampaign = useCreative((s) => s.upsertCampaign);
  const igPosts = useCreative((s) => s.igPosts);
  const [busy, setBusy] = useState(false);

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
            const { migrateBrief } = await import("@/lib/studio/brief");
            const brief = migrateBrief({
              eventName: campaign.name,
              schedule: `${campaign.date} ${campaign.time}`,
              location: campaign.location,
              audience: "淡江大學學生",
              features: campaign.theme,
              notes: campaign.studentPain,
              deliverables: { post: true, story: true, carousel: true, reels: true, threads: true, line: true },
            });
            const result = await generateCreativePack({
              data: toBriefInput(brief, brand, { dnaNotes: igDnaBlock(igPosts) }),
            });
            if (!result.ok) return;
            const project = createProject({
              name: campaign.name,
              brandId: brand.id,
              formatId: "feed-portrait",
              brief,
              templateId: result.pack.plan.templateId,
            });
            applyCampaignPlan(project.id, result.pack.plan, brief);
            attach(campaign.id, project.id);
            void navigate({ to: "/studio/$projectId", params: { projectId: project.id } });
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
      </div>
      <ol className="mt-8 space-y-2">
        {campaign.waves.map((wave) => (
          <li key={wave.id} className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">{new Date(wave.scheduledAt).toLocaleString("zh-TW")}</p>
            <p className="text-sm font-medium">{wave.title}</p>
            {wave.copyPreview ? <p className="mt-2 text-sm leading-relaxed">{wave.copyPreview}</p> : null}
            <Button
              className="mt-2"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const { generateCopyPack } = await import("@/lib/ai/copy");
                  const kind =
                    wave.kind === "emotion"
                      ? "emotion"
                      : wave.kind === "countdown"
                        ? "countdown"
                        : wave.kind === "day-of"
                          ? "story"
                          : wave.kind === "recap"
                            ? "recap"
                            : "event";
                  const result = await generateCopyPack({
                    data: {
                      idea: `${campaign.name} ${wave.title} ${campaign.tagline}`,
                      kind,
                      eventName: campaign.name,
                      schedule: `${campaign.date} ${campaign.time}`,
                      location: campaign.location,
                      dnaNotes: igDnaBlock(igPosts),
                    },
                  });
                  if (!result.ok) return;
                  patchWave(campaign.id, wave.id, { copyPreview: result.pack.hook, status: "creating" });
                } finally {
                  setBusy(false);
                }
              }}
            >
              重新生成這波
            </Button>
          </li>
        ))}
      </ol>
    </main>
  );
}
