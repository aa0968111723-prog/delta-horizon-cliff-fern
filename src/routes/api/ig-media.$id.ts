import { createFileRoute } from "@tanstack/react-router";
import { isIgMediaId } from "@/lib/zen/ig-media";

async function handle({ request }: { request: Request }) {
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  if (!isIgMediaId(id)) {
    return new Response("not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const { getIgPublishMedia } = await import("@/lib/ai/ig-media.server");
  const row = await getIgPublishMedia(id);
  if (!row) {
    return new Response("not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return new Response(Uint8Array.from(row.bytes), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.bytes.byteLength),
      "Cache-Control": "public, max-age=300",
    },
  });
}

export const Route = createFileRoute("/api/ig-media/$id")({
  server: { handlers: { GET: handle } },
});
