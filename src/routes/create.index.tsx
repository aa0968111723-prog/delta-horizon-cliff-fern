import { createFileRoute } from "@tanstack/react-router";
import { CreateHub } from "@/components/create/create-hub";

export const Route = createFileRoute("/create/")({ component: CreateHub });
