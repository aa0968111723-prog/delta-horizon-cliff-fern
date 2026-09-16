import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/assistant")({ component: AssistantRedirect });

function AssistantRedirect() {
  return <Navigate to="/create" search={{ mode: "idea", idea: "下週有一場茶會" }} />;
}
