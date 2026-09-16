import { createFileRoute } from "@tanstack/react-router";
import { InstagramCenter } from "@/components/ig/instagram-center";

export const Route = createFileRoute("/ig")({ component: InstagramCenter });
