import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/instagram/ig-center";

export const Route = createFileRoute("/instagram")({ component: InstagramCenter });
