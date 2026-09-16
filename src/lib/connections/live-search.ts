import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { unwrapServerInput } from "./json.ts";
import type { ConnectorResult, ExternalMemoryItem } from "./types.ts";

const SearchSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export type ConnectedSearchBundle = {
  query: string;
  drive: ConnectorResult<ExternalMemoryItem[]> | { ok: true; data: ExternalMemoryItem[] } | { ok: false; message: string };
  canva: ConnectorResult<ExternalMemoryItem[]>;
  instagram: ConnectorResult<ExternalMemoryItem[]>;
};

export const searchConnectedSources = createServerFn({ method: "POST" })
  .validator((input: unknown) => SearchSchema.parse(unwrapServerInput(input)))
  .handler(async ({ data }): Promise<ConnectedSearchBundle> => {
    const { searchGoogleDrive } = await import("./google-drive.ts");
    const { listCanvaDesignRecords } = await import("./canva-oauth.server.ts");
    const { listInstagramRecords } = await import("./instagram-oauth.server.ts");
    const [drive, canva, instagram] = await Promise.all([
      searchGoogleDrive({ data: { query: data.query } }),
      listCanvaDesignRecords(data.query),
      listInstagramRecords(data.query),
    ]);
    return { query: data.query, drive, canva, instagram };
  });
