import { createFileRoute } from "@tanstack/react-router";
import { BrandEditor } from "@/components/brand/brand-editor";

export const Route = createFileRoute("/brand")({ component: BrandPage });

function BrandPage() {
  return <BrandEditor />;
}
