import { createFileRoute } from "@tanstack/react-router";
import { AssetLibrary } from "@/components/assets/asset-library";

export const Route = createFileRoute("/assets")({ component: AssetsPage });

function AssetsPage() {
  return <AssetLibrary />;
}
