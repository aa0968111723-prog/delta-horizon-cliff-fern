import { createFileRoute } from "@tanstack/react-router";
import { ExportCenter } from "@/components/export/export-center";

export const Route = createFileRoute("/export")({ component: ExportCenter });
