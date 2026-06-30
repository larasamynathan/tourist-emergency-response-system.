import { createFileRoute } from "@tanstack/react-router";
import { useMyRoles, isAdmin, isResponder } from "@/lib/use-role";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { TouristDashboard } from "@/components/dashboards/TouristDashboard";
import { ResponderDashboard } from "@/components/dashboards/ResponderDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: roles, isLoading } = useMyRoles();
  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (isAdmin(roles)) return <AdminDashboard />;
  if (isResponder(roles)) return <ResponderDashboard />;
  return <TouristDashboard />;
}
