import { toast } from "sonner";
import { useAssetUrls } from "@/hooks/use-asset-urls";
import { assetPreviewFitClass, isStampAsset } from "@/lib/studio/assets";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio-store";

/** 示範／素材庫照片捷徑。點一下回呼，由畫面或視覺方向決定怎麼套。 */
export function PhotoHeroButtons({
  onPick,
  testIdPrefix = "hero-photo",
}: {
  onPick: (assetId: string, name: string) => void;
  testIdPrefix?: string;
}) {
  const assets = useStudio((s) => s.assets);
  const photos = assets.filter((asset) => !isStampAsset(asset)).slice(0, 6);
  const urls = useAssetUrls(photos.map((asset) => asset.id));

  if (!photos.length) return null;

  return (
    <ul className="flex gap-2 overflow-x-auto pb-0.5">
      {photos.map((asset) => (
        <li key={asset.id} className="shrink-0">
          <button
            type="button"
            aria-label={`${asset.name} 當主視覺`}
            data-testid={`${testIdPrefix}-${asset.id}`}
            onClick={() => onPick(asset.id, asset.name)}
            className="overflow-hidden rounded-lg bg-surface-2 text-left shadow-[var(--shadow-border)]"
          >
            <span className="block size-11">
              {urls[asset.id] ? (
                <img
                  src={urls[asset.id]}
                  alt=""
                  className={cn("size-full", assetPreviewFitClass(asset, urls[asset.id]))}
                />
              ) : (
                <span className="flex size-full items-center justify-center text-[0.6rem] text-muted">…</span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** 編輯列上的照片捷徑：點一下就當主視覺，不必先開左側素材分頁。 */
export function HeroPhotoStrip({ projectId }: { projectId: string }) {
  const applyVisualToPack = useStudio((s) => s.applyVisualToPack);

  return (
    <PhotoHeroButtons
      testIdPrefix="hero-strip"
      onPick={(assetId, name) => {
        const count = applyVisualToPack(projectId, assetId);
        if (count > 1) toast.success(`「${name}」已套成全套主視覺。`);
        else if (count === 1) toast.success(`「${name}」已套成主視覺。`);
        else toast.error("套不到畫面，再試一次。");
      }}
    />
  );
}
