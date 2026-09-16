import { lastPackPreviewSrc, packForScheduleRow, type LastPack } from "./last-pack.ts";
import { completePackPublish } from "./publish-ready.ts";
import type { ContentKind } from "../studio/types.ts";

export type PublishableRow = {
  id: string;
  campaignId: string | null;
  projectId: string | null;
  title: string;
  contentKind: ContentKind;
};

export async function publishScheduleRow(input: {
  row: PublishableRow;
  lastPack: LastPack | null;
  assetUrls?: Record<string, string>;
}) {
  const pack = packForScheduleRow(input.row, input.lastPack);
  const previewSrc = lastPackPreviewSrc(pack, input.assetUrls ?? {}, input.row.contentKind);
  return completePackPublish(pack, previewSrc);
}
