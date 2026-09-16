import { createFileRoute } from "@tanstack/react-router";
import { IgCenter } from "@/components/ig/ig-center";

type Search = {
  item?: string;
};

export const Route = createFileRoute("/ig")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    item: typeof s.item === "string" ? s.item : undefined,
  }),
  component: IgRoute,
});

function IgRoute() {
  const { item } = Route.useSearch();
  return <IgCenter focusProjectId={item} />;
}
