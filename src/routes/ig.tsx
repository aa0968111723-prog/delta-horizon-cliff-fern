import { createFileRoute } from "@tanstack/react-router";
import { IgCenter } from "@/components/ig/ig-center";

export const Route = createFileRoute("/ig")({ component: IgCenter });
