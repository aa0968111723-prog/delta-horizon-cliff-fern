import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELIVERABLE_OPTIONS } from "@/lib/studio/brief";
import { GOALS } from "@/lib/studio/goals";
import type { Brief, CampaignGoal, DeliverableFlags } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

type Props = {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  compact?: boolean;
};

export function BriefFields({ brief, onChange, compact }: Props) {
  function patchDeliverable(id: keyof DeliverableFlags) {
    onChange({ deliverables: { ...brief.deliverables, [id]: !brief.deliverables[id] } });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((goal) => (
          <button
            key={goal.id}
            type="button"
            onClick={() => onChange({ goal: goal.id as CampaignGoal })}
            className={cn(
              "min-h-16 rounded-lg px-3 py-3 text-left shadow-[var(--shadow-border)] transition-colors",
              brief.goal === goal.id ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2",
            )}
          >
            <p className="text-sm font-medium">{goal.label}</p>
            <p className={cn("mt-0.5 text-xs", brief.goal === goal.id ? "text-accent-fg/80" : "text-muted")}>
              {goal.hint}
            </p>
          </button>
        ))}
      </div>

      <Field label="活動名稱">
        <Input
          value={brief.eventName}
          onChange={(e) => {
            const eventName = e.target.value;
            onChange({ eventName, product: brief.product || eventName });
          }}
          placeholder="例如：浮游禪光"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="時間">
          <Input
            value={brief.schedule}
            onChange={(e) => onChange({ schedule: e.target.value })}
            placeholder="例如：9/24 19:00–21:00"
          />
        </Field>
        <Field label="地點">
          <Input
            value={brief.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="例如：淡江校園／社團辦公室"
          />
        </Field>
      </div>

      <Field label="受眾">
        <Input
          value={brief.audience}
          onChange={(e) => onChange({ audience: e.target.value })}
          placeholder="哪一群淡江學生會停下來看"
        />
      </Field>

      <Field label="活動特色">
        <Textarea
          value={brief.features}
          onChange={(e) => onChange({ features: e.target.value })}
          placeholder="活動內容、學生會得到什麼、參加方式"
          className={compact ? "min-h-20" : undefined}
        />
      </Field>

      <Field label="希望風格">
        <Input
          value={brief.style}
          onChange={(e) => onChange({ style: e.target.value })}
          placeholder="例如：舒服、年輕、有晚間校園感"
        />
      </Field>

      {compact ? null : (
        <Field label="參加誘因（選填）">
          <Input
            value={brief.offer}
            onChange={(e) => onChange({ offer: e.target.value })}
            placeholder="例如：免費參加／可帶朋友／不用事先報名"
          />
        </Field>
      )}

      <Field label="補充">
        <Textarea
          value={brief.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="報名連結、必須出現的資訊，以及不要太宗教或太 AI"
          className={compact ? "min-h-20" : undefined}
        />
      </Field>

      <div className="space-y-1.5">
        <Label>需要產出</Label>
        <div className="grid grid-cols-2 gap-2">
          {DELIVERABLE_OPTIONS.map((opt) => {
            const on = brief.deliverables[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => patchDeliverable(opt.id)}
                className={cn(
                  "min-h-14 rounded-lg px-3 py-2 text-left shadow-[var(--shadow-border)] transition-colors",
                  on ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2",
                )}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className={cn("text-xs", on ? "text-accent-fg/80" : "text-muted")}>{opt.hint}</p>
              </button>
            );
          })}
        </div>
      </div>
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
