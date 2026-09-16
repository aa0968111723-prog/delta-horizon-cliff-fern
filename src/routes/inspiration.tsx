import { createFileRoute } from "@tanstack/react-router";
import { InspirationPage } from "@/components/inspiration/inspiration-page";

export const Route = createFileRoute("/inspiration")({ component: InspirationPage });
