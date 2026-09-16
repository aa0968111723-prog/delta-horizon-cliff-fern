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
          placeholder="例如：九月單品・耶加雪菲"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="時間">
          <Input
            value={brief.schedule}
            onChange={(e) => onChange({ schedule: e.target.value })}
            placeholder="例如：9/12–9/30"
          />
        </Field>
        <Field label="地點">
          <Input
            value={brief.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="門市、線上或城市"
          />
        </Field>
      </div>

      <Field label="受眾">
        <Input
          value={brief.audience}
          onChange={(e) => onChange({ audience: e.target.value })}
          placeholder="誰會停下來看這則"
        />
      </Field>

      <Field label="活動特色">
        <Textarea
          value={brief.features}
          onChange={(e) => onChange({ features: e.target.value })}
          placeholder="最多三件要被記住的事"
          className={compact ? "min-h-20" : undefined}
        />
      </Field>

      <Field label="希望風格">
        <Input
          value={brief.style}
          onChange={(e) => onChange({ style: e.target.value })}
          placeholder="例如：沉靜、留白、不叫賣"
        />
      </Field>

      {compact ? null : (
        <Field label="優惠（選填）">
          <Input
            value={brief.offer}
            onChange={(e) => onChange({ offer: e.target.value })}
            placeholder="期間限定、到店禮"
          />
        </Field>
      )}

      <Field label="補充">
        <Textarea
          value={brief.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="語氣、禁用、必須出現的資訊"
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
