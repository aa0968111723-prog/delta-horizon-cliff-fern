import { createFileRoute } from "@tanstack/react-router";
import { ImageStudioPage } from "@/components/image/image-studio-page";

export const Route = createFileRoute("/image")({ component: ImageStudioPage });
