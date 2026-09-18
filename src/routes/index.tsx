import { createFileRoute } from "@tanstack/react-router";
import { CockpitProvider } from "@/features/sentinel/state/CockpitProvider";
import { Cockpit } from "@/features/sentinel/components/Cockpit";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <CockpitProvider>
      <Cockpit />
    </CockpitProvider>
  );
}
