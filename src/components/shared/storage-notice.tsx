import { HardDrive } from "lucide-react";
import { getAssetStorage } from "@/lib/studio/asset-storage";
import { cn } from "@/lib/utils";

export function StorageNotice({ className }: { className?: string }) {
  const storage = getAssetStorage();
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl bg-surface px-3 py-2.5 text-xs text-muted shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <HardDrive className="mt-0.5 size-3.5 shrink-0" />
      <span>
        {storage.label}。檔案只存在這個瀏覽器，尚未同步到雲端；清除網站資料或換裝置不會帶過去。
      </span>
    </p>
  );
}
