import { toast } from "sonner";
import { CopyStudio } from "@/components/assistant/copy-studio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ASSET_NEED_LABEL, PAGE_ROLE_LABEL } from "@/lib/studio/brief";
import { TEMPLATE_META } from "@/lib/studio/layout";
import type { CampaignPlan, CarouselPagePlan } from "@/lib/studio/types";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

type Props = {
  projectId: string;
  onOpenEditor?: (id: string) => void;
};

export function PlanResult({ projectId, onOpenEditor }: Props) {
  const project = useStudio((s) => s.projects.find((p) => p.id === projectId));
  const patchPlan = useStudio((s) => s.patchPlan);
  const applyCampaignPlan = useStudio((s) => s.applyCampaignPlan);
  const restorePlanVersion = useStudio((s) => s.restorePlanVersion);
  const reflow = useStudio((s) => s.reflow);
  const plan = project?.plan;
  if (!project || !plan) return null;
  const current = project;

  function set<K extends keyof CampaignPlan>(key: K, value: CampaignPlan[K]) {
    patchPlan(projectId, { [key]: value });
  }

  function applyToCanvas() {
    if (!current.plan) return;
    applyCampaignPlan(projectId, current.plan, current.brief);
    toast.success("已套用到專案與畫布");
  }

  return (
    <div className="space-y-4" data-testid="plan-result">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={plan.source === "mock" ? "warn" : "success"}>
          {plan.source === "mock" ? "本機草案" : "AI 企劃"}
        </Badge>
        <p className="text-sm text-muted">{plan.campaignName}</p>
      </div>

      <Field label="核心概念">
        <Textarea value={plan.concept} onChange={(e) => set("concept", e.target.value)} />
      </Field>
      <Field label="視覺主題">
        <Textarea value={plan.visualTheme} onChange={(e) => set("visualTheme", e.target.value)} className="min-h-20" />
      </Field>
      <Field label="標題">
        <Textarea value={plan.headline} onChange={(e) => set("headline", e.target.value)} className="min-h-20" />
      </Field>
      <Field label="副標">
        <Textarea value={plan.subhead} onChange={(e) => set("subhead", e.target.value)} className="min-h-20" />
      </Field>
      <Field label="CTA">
        <Input value={plan.cta} onChange={(e) => set("cta", e.target.value)} />
      </Field>
      <Field label="Caption">
        <Textarea
          rows={6}
          value={plan.captions[0]?.text ?? ""}
          onChange={(e) => {
            const next = plan.captions.length
              ? plan.captions.map((item, i) => (i === 0 ? { ...item, text: e.target.value } : item))
              : [{ style: "敘事", text: e.target.value }];
            set("captions", next);
          }}
        />
      </Field>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(plan.captions[0]?.text ?? "");
            toast.success("已複製 Caption");
          }}
        >
          複製文案
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(plan.hashtags.join(" "));
            toast.success("已複製標籤");
          }}
        >
          複製標籤
        </Button>
      </div>
      {plan.captions.slice(1).map((item) => (
        <button
          key={item.style}
          type="button"
          className="block w-full rounded-md bg-bg p-3 text-left text-sm hover:bg-surface-2"
          onClick={() => {
            const next = [{ ...item, style: plan.captions[0]?.style ?? item.style }, ...plan.captions.filter((c) => c !== item)];
            set("captions", next);
            toast.success(`已套用「${item.style}」文案`);
          }}
        >
          <span className="text-xs text-muted">{item.style}</span>
          <p className="mt-1">{item.text}</p>
        </button>
      ))}
      <Field label="Hashtags">
        <Textarea
          className="min-h-20"
          value={plan.hashtags.join(" ")}
          onChange={(e) =>
            set(
              "hashtags",
              e.target.value
                .split(/\s+/)
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
            )
          }
        />
      </Field>

      <CopyStudio projectId={projectId} />

      <div className="space-y-1.5">
        <Label>建議版型</Label>
        <div className="flex flex-wrap gap-1">
          {TEMPLATE_META.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={plan.templateId === t.id ? "default" : "secondary"}
              onClick={() => {
                patchPlan(projectId, { templateId: t.id });
                reflow(projectId, t.id);
              }}
            >
              {t.name}
            </Button>
          ))}
        </div>
      </div>

      {plan.carouselPages.length ? (
        <div className="space-y-2">
          <Label>輪播頁面</Label>
          {plan.carouselPages.map((page, index) => (
            <CarouselPageEditor
              key={`${page.role}-${index}`}
              page={page}
              index={index}
              onChange={(patch) => {
                const carouselPages = plan.carouselPages.map((item, i) => (i === index ? { ...item, ...patch } : item));
                set("carouselPages", carouselPages);
              }}
            />
          ))}
        </div>
      ) : null}

      {plan.assetNeeds.length ? (
        <div className="space-y-2">
          <Label>素材需求</Label>
          {plan.assetNeeds.map((need, index) => (
            <div key={`${need.title}-${index}`} className="rounded-lg bg-bg p-3">
              <p className="text-xs text-muted">
                {ASSET_NEED_LABEL[need.kind]}
                {need.required ? " · 必要" : " · 選用"}
              </p>
              <Input
                className="mt-2"
                value={need.title}
                onChange={(e) => {
                  const assetNeeds = plan.assetNeeds.map((item, i) =>
                    i === index ? { ...item, title: e.target.value } : item,
                  );
                  set("assetNeeds", assetNeeds);
                }}
              />
              <Textarea
                className="mt-2 min-h-16"
                value={need.detail}
                onChange={(e) => {
                  const assetNeeds = plan.assetNeeds.map((item, i) =>
                    i === index ? { ...item, detail: e.target.value } : item,
                  );
                  set("assetNeeds", assetNeeds);
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {plan.checklist.length ? (
        <div className="space-y-2">
          <Label>發布前檢查</Label>
          {plan.checklist.map((item, index) => (
            <Input
              key={`${item}-${index}`}
              value={item}
              onChange={(e) => {
                const checklist = plan.checklist.map((row, i) => (i === index ? e.target.value : row));
                set("checklist", checklist);
              }}
            />
          ))}
        </div>
      ) : null}

      <Button className="w-full" onClick={applyToCanvas}>
        套用到畫布
      </Button>
      {onOpenEditor ? (
        <Button className="w-full" variant="secondary" onClick={() => onOpenEditor(projectId)}>
          進入編輯器
        </Button>
      ) : null}

      {current.planVersions.length > 1 ? (
        <div className="space-y-2">
          <Label>企劃版本</Label>
          <ul className="space-y-1">
            {current.planVersions.map((version) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => {
                    restorePlanVersion(projectId, version.id);
                    toast.success("已還原此企劃版本");
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm hover:bg-surface-2",
                    current.plan?.generatedAt === version.plan.generatedAt ? "bg-surface-2" : "bg-bg",
                  )}
                >
                  <span className="truncate">{version.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted">
                    {new Date(version.createdAt).toLocaleString("zh-TW", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CarouselPageEditor({
  page,
  index,
  onChange,
}: {
  page: CarouselPagePlan;
  index: number;
  onChange: (patch: Partial<CarouselPagePlan>) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg bg-bg p-3">
      <p className="text-xs text-muted">
        第 {index + 1} 頁 · {PAGE_ROLE_LABEL[page.role]}
      </p>
      <Input value={page.headline} onChange={(e) => onChange({ headline: e.target.value })} />
      <Input value={page.subhead} onChange={(e) => onChange({ subhead: e.target.value })} />
      <Textarea className="min-h-16" value={page.body} onChange={(e) => onChange({ body: e.target.value })} />
      <Input value={page.cta} onChange={(e) => onChange({ cta: e.target.value })} />
      <p className="text-xs text-muted">{page.visualNote}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
