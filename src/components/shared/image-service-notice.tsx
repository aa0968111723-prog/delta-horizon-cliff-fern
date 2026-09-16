import type { ImageAiStatus } from "@/lib/ai/image-status";
import { cn } from "@/lib/utils";

export function ImageServiceNotice({
  status,
  className,
  purpose = "generate",
}: {
  status: ImageAiStatus | null;
  className?: string;
  purpose?: "generate" | "analyze";
}) {
  if (!status || status.available) return null;
  return (
    <div className={cn("rounded-xl bg-warn/15 px-4 py-3", className)} role="status">
      <p className="text-sm font-medium">{purpose === "analyze" ? status.analyzeBlockedMessage : status.label}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{purpose === "analyze" ? status.analyzeDetail : status.detail}</p>
    </div>
  );
}
