import { format as formatDate } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { openScheduledPreview } from "@/components/create/open-preview";
import { PublishIgButton } from "@/components/instagram/publish-button";
import { Button } from "@/components/ui/button";
import { nextCreateHint } from "@/lib/zen/insights";
import { CONTENT_KIND_LABEL } from "@/lib/zen/types";
import type { ScheduleItem } from "@/lib/zen/types";
import { useCreative } from "@/stores/creative-store";

export function rememberDueSlot(itemId: string) {
  useCreative.getState().markPublished(itemId);
  const hint = nextCreateHint(useCreative.getState().igPosts);
  toast.success(`已寫進過去 IG。${hint.line}`);
}

export function DueSlotActions({
  item,
  imageSrc,
  showPreview = true,
}: {
  item: ScheduleItem;
  imageSrc?: string | null;
  showPreview?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      <PublishIgButton
        caption={item.captionPreview || item.title}
        imageSrc={imageSrc}
        onPublished={() => rememberDueSlot(item.id)}
      />
      {showPreview ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            openScheduledPreview(item);
            void navigate({ to: "/instagram" });
          }}
        >
          看畫面
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" data-testid="due-remember" onClick={() => rememberDueSlot(item.id)}>
        寫進過去 IG
      </Button>
    </div>
  );
}

export function DueSlotCard({ item, imageSrc }: { item: ScheduleItem; imageSrc?: string | null }) {
  return (
    <li className="rounded-[1.5rem] bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs text-muted">
        {formatDate(item.scheduledAt, "M/d HH:mm", { locale: zhTW })} · {CONTENT_KIND_LABEL[item.contentKind]}
      </p>
      <p className="mt-1 text-sm font-medium">{item.title}</p>
      {item.captionPreview ? <p className="mt-1 line-clamp-2 text-sm text-muted">{item.captionPreview}</p> : null}
      <DueSlotActions item={item} imageSrc={imageSrc} />
    </li>
  );
}
