import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, FileText, MapPin, MessageSquare, Phone, BookOpen, AlertTriangle, Shield } from "lucide-react";
import { useMyUser } from "@/lib/use-role";

export function TouristDashboard() {
  const { data: user } = useMyUser();

  const { data: tourist } = useQuery({
    queryKey: ["my-tourist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tourists")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["my-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [inc, sos] = await Promise.all([
        supabase.from("incidents").select("id,status", { count: "exact" }).eq("reported_by", user!.id),
        supabase.from("sos_alerts").select("id,status", { count: "exact" }).eq("user_id", user!.id),
      ]);
      const active = (inc.data?.filter((i) => i.status !== "resolved").length ?? 0) +
        (sos.data?.filter((s) => s.status !== "resolved").length ?? 0);
      return { incidents: inc.data?.length ?? 0, sos: sos.data?.length ?? 0, active };
    },
  });

  const statusColor = tourist?.status === "danger" ? "bg-red-500"
    : tourist?.status === "alert" ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.08_240)] p-6 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs text-white/80">
          <Shield className="h-4 w-4" /> Your safety dashboard
        </div>
        <h1 className="mt-2 text-2xl font-bold">Hello, {user?.user_metadata?.full_name || user?.email?.split("@")[0]}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1`}>
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            Status: {tourist?.status ?? "Not registered"}
          </span>
          {tourist?.tracking_id && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs">ID: {tourist.tracking_id}</span>
          )}
        </div>
        {!tourist && (
          <Link to="/profile" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">Complete travel profile</Button>
          </Link>
        )}
      </div>

      {/* Emergency SOS big button */}
      <Card className="border-red-500/30 bg-red-500/5 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-red-700 dark:text-red-400">
              <Siren className="h-5 w-5" /> Emergency SOS
            </h2>
            <p className="text-sm text-muted-foreground">One tap shares your live location with response teams.</p>
          </div>
          <Link to="/sos">
            <Button size="lg" className="h-14 gap-2 bg-red-600 px-8 text-base hover:bg-red-700">
              <Siren className="h-5 w-5" /> Activate SOS
            </Button>
          </Link>
        </div>
      </Card>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Active alerts</div><div className="mt-1 text-2xl font-bold">{counts?.active ?? 0}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Incidents reported</div><div className="mt-1 text-2xl font-bold">{counts?.incidents ?? 0}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">SOS sent</div><div className="mt-1 text-2xl font-bold">{counts?.sos ?? 0}</div></Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: "/report", icon: FileText, title: "Report incident", desc: "Photo + location attached automatically" },
          { to: "/nearby", icon: MapPin, title: "Nearby help", desc: "Hospitals & police stations on a map" },
          { to: "/chatbot", icon: MessageSquare, title: "AI assistant", desc: "Ask anything about safe travel" },
          { to: "/contacts", icon: Phone, title: "Emergency contacts", desc: "Manage trusted people" },
          { to: "/safety", icon: BookOpen, title: "Safety tips", desc: "Travel guidelines & best practices" },
          { to: "/my-incidents", icon: AlertTriangle, title: "My reports", desc: "Track status & responses" },
        ].map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="p-4 transition hover:shadow-md hover:-translate-y-0.5">
              <c.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-semibold">{c.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
