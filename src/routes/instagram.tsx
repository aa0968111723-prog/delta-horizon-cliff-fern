import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/instagram/instagram-center";

export const Route = createFileRoute("/instagram")({
  component: InstagramCenter,
});
