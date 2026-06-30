import { createFileRoute, Outlet, redirect, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, LogOut, LayoutDashboard, AlertTriangle, Siren, FileText, MapPin,
  Users, MessageSquare, Star, BookOpen, Phone, UserCircle, Menu, X, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyRoles, isAdmin, isResponder } from "@/lib/use-role";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: ProtectedLayout,
});

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

function ProtectedLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { data: roles } = useMyRoles();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const admin = isAdmin(roles);
  const responder = isResponder(roles);

  const touristNav: NavItem[] = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/sos", label: "SOS", icon: Siren },
    { to: "/report", label: "Report Incident", icon: FileText },
    { to: "/my-incidents", label: "My Reports", icon: AlertTriangle },
    { to: "/nearby", label: "Nearby Help", icon: MapPin },
    { to: "/contacts", label: "Emergency Contacts", icon: Phone },
    { to: "/safety", label: "Safety Tips", icon: BookOpen },
    { to: "/chatbot", label: "AI Assistant", icon: MessageSquare },
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/feedback", label: "Feedback", icon: Star },
  ];

  const adminNav: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/tourists", label: "Tourists", icon: Users },
    { to: "/incidents", label: "Incidents", icon: AlertTriangle },
    { to: "/admin/sos", label: "SOS Alerts", icon: Siren },
    { to: "/response-team", label: "Response Team", icon: Shield },
    { to: "/admin/users", label: "Accounts", icon: UserCircle },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
  ];

  const responderNav: NavItem[] = [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/responder/cases", label: "My Cases", icon: AlertTriangle },
    { to: "/response-team", label: "Response Team", icon: Shield },
    { to: "/admin/sos", label: "SOS Feed", icon: Siren },
    { to: "/incidents", label: "All Incidents", icon: FileText },
  ];


  const nav: NavItem[] = admin ? adminNav : responder ? responderNav : touristNav;
  const role = admin ? "Admin" : responder ? "Responder" : "Tourist";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold">
              <Shield className="h-5 w-5 text-primary" />
              <span className="truncate">SafeTrail</span>
            </Link>
            <span className="ml-2 hidden rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
              {role}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 shrink-0">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-20 mt-[57px] w-64 shrink-0 border-r border-border bg-background transition-transform lg:static lg:mt-0 lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-1 p-3">
            {nav.map((n) => {
              const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        {open && (
          <div className="fixed inset-0 z-10 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
