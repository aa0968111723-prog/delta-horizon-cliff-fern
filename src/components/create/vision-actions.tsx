import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  createSearchFromVision,
  VISION_ACTIONS,
  type VisionActionId,
} from "@/lib/zen/vision-action";

export function VisionActions({
  idea,
  assetId,
  remoteId,
  busy,
  onAction,
}: {
  idea: string;
  assetId?: string;
  remoteId?: string;
  busy?: boolean;
  onAction?: (action: VisionActionId) => void | Promise<void>;
}) {
  const navigate = useNavigate();

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {VISION_ACTIONS.map((item) => (
        <Button
          key={item.id}
          size="sm"
          variant={item.id === "continue-style" ? "default" : "secondary"}
          disabled={busy}
          data-testid={`vision-action-${item.id}`}
          onClick={() => {
            if (onAction) {
              void onAction(item.id);
              return;
            }
            void navigate({
              to: "/create",
              search: createSearchFromVision({
                action: item.id,
                idea,
                assetId,
                remoteId,
              }),
            });
          }}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
