import { createFileRoute } from "@tanstack/react-router";
import { ImageStudio } from "@/components/create/image-studio";

export const Route = createFileRoute("/create/image")({ component: ImageStudio });
