import { saveDataUrlAsAsset, urlToDataUrl } from "./generated-image.ts";
import { LOCAL_REVISE_NOTE, presetForRatio, reviseImageLocal, type ReviseRatio } from "./image-revise-local.ts";
import { LOCAL_VISUAL_NOTE } from "./local-visual.ts";
import type { AssetMeta } from "./types.ts";

/** 把示範照片依選定 IG 尺寸重構後存進素材庫。不生假畫面。 */
export async function frameAndSaveLocalVisual(input: {
  sourceUrl: string;
  name: string;
  tags: string[];
  ratio: ReviseRatio;
}): Promise<{ meta: AssetMeta; dataUrl: string }> {
  const dataUrl = await urlToDataUrl(input.sourceUrl);
  const local = await reviseImageLocal({
    imageUrl: dataUrl,
    presetId: presetForRatio(input.ratio),
    ratio: input.ratio,
  });
  const meta = await saveDataUrlAsAsset({
    dataUrl: local.dataUrl,
    name: input.name,
    tags: ["本機素材", ...input.tags, input.ratio],
    source: "upload",
    notes: `${LOCAL_VISUAL_NOTE} ${LOCAL_REVISE_NOTE}`,
  });
  return { meta, dataUrl: local.dataUrl };
}
