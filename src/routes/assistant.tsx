import { createFileRoute } from "@tanstack/react-router";
import { CreateHub } from "@/components/create/create-hub";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

function AssistantPage() {
  return <CreateHub initialTab="campaign" />;
}
