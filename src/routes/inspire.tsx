import { createFileRoute } from "@tanstack/react-router";
import { InspirationPage } from "@/components/inspire/inspiration-page";

export const Route = createFileRoute("/inspire")({ component: InspirationPage });
