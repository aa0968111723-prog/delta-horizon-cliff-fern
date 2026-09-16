import { createFileRoute } from "@tanstack/react-router";
import { AssetLibrary } from "@/components/assets/asset-library";

export const Route = createFileRoute("/assets")({
  validateSearch: (raw: Record<string, unknown>): { asset?: string; category?: string } => ({
    asset: typeof raw.asset === "string" ? raw.asset : undefined,
    category: typeof raw.category === "string" ? raw.category : undefined,
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const search = Route.useSearch();
  return <AssetLibrary initialAssetId={search.asset} initialCategory={search.category} />;
}
