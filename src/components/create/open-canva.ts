import { toast } from "sonner";
import { createCanvaDraft } from "@/lib/ai/oauth";
import type { CanvaPreset } from "@/lib/zen/canva-draft";
import { rasterB64FromSrc } from "@/lib/zen/ingest";

export async function openCanvaDraft(input: {
  title: string;
  hook?: string;
  notes?: string;
  preset?: CanvaPreset;
  imageSrc?: string | null;
}): Promise<boolean> {
  const raster = input.imageSrc ? await rasterB64FromSrc(input.imageSrc) : null;
  const result = await createCanvaDraft({
    data: {
      title: input.title,
      hook: input.hook,
      notes: input.notes,
      preset: input.preset,
      imageB64: raster?.b64,
      mime: raster?.mime,
    },
  });
  if (!result.ok) {
    toast.message(result.error);
    return false;
  }
  if (input.notes) {
    try {
      await navigator.clipboard.writeText(input.notes);
    } catch {
      /* clipboard is optional */
    }
  }
  toast.success(
    result.uploaded
      ? input.notes
        ? "已把畫面送進 Canva，文案已複製"
        : "已把畫面送進 Canva"
      : input.notes
        ? "已在 Canva 開稿，文案已複製，可貼進去微調"
        : "已在 Canva 開稿，可繼續微調",
  );
  window.open(result.editUrl, "_blank", "noopener,noreferrer");
  return true;
}
