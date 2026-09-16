import { createFileRoute } from "@tanstack/react-router";
import { StudioWorkspace } from "@/components/editor/studio-workspace";

export const Route = createFileRoute("/studio/$projectId")({
  component: StudioPage,
});

function StudioPage() {
  const { projectId } = Route.useParams();
  return <StudioWorkspace projectId={projectId} />;
}
