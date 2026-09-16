import { importRemoteMedia } from "@/lib/connections/sync";
import type { RemoteItem } from "@/lib/connections/remote";
import { saveDataUrlAsAsset } from "./generated-image";
import { SOURCE_KIND_LABEL } from "./sources";
import type { AssetMeta } from "./types";

/** 把 Drive / Canva / IG 的圖存進本機素材庫，之後就能當成「用這張創作」。 */
export async function bringRemoteIntoLibrary(
  item: RemoteItem,
): Promise<{ ok: true; asset: AssetMeta } | { ok: false; error: string }> {
  const res = await importRemoteMedia({ data: { id: item.provider, remoteId: item.id } });
  if (!res.ok) return res;
  const label = SOURCE_KIND_LABEL[item.provider];
  const asset = await saveDataUrlAsAsset({
    dataUrl: res.dataUrl,
    name: res.name || item.title,
    tags: [label, "遠端"],
    source: "upload",
    notes: [`來自 ${label}：${item.title}`, item.href ?? res.href].filter(Boolean).join(" · "),
    licenseOwner: label,
  });
  return { ok: true, asset };
}
