import { createFileRoute } from "@tanstack/react-router";
import { InspirePage } from "@/components/inspire/inspire-page";

export const Route = createFileRoute("/inspire")({ component: InspirePage });
