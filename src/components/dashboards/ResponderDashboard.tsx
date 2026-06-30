import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Siren, MapPin } from "lucide-react";
import { useMyUser } from "@/lib/use-role";

export function ResponderDashboard() {
  const { data: user } = useMyUser();

  const { data } = useQuery({
    queryKey: ["responder-cases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [inc, sos] = await Promise.all([
        supabase.from("incidents").select("*").eq("assigned_to", user!.id).order("created_at", { ascending: false }),
        supabase.from("sos_alerts").select("*").eq("assigned_to", user!.id).order("created_at", { ascending: false }),
      ]);
      return { incidents: inc.data ?? [], sos: sos.data ?? [] };
    },
    refetchInterval: 10_000,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Response Team Console</h1>
        <p className="text-sm text-muted-foreground">Your assigned cases & live SOS feed</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Open incidents</div>
          <div className="mt-1 text-2xl font-bold">
            {data?.incidents.filter((i) => i.status !== "resolved").length ?? 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Active SOS</div>
          <div className="mt-1 text-2xl font-bold">
            {data?.sos.filter((s) => s.status === "active").length ?? 0}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> My assigned incidents</h3>
        <div className="space-y-2">
          {data?.incidents.length ? data.incidents.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="font-medium">{i.incident_type} — {i.severity}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{i.description}</div>
              </div>
              <Link to="/responder/cases"><Button size="sm" variant="outline">Open</Button></Link>
            </div>
          )) : <p className="text-sm text-muted-foreground">No assigned cases yet.</p>}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Siren className="h-4 w-4 text-red-600" /> SOS feed</h3>
        <Link to="/admin/sos"><Button size="sm" variant="secondary" className="gap-2"><MapPin className="h-4 w-4" /> Open live SOS map</Button></Link>
      </Card>
    </div>
  );
}
