import { createFileRoute } from "@tanstack/react-router";
import { MiraApp } from "@/components/game/mira-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <MiraApp />;
}
