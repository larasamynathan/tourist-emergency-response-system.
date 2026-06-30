import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Siren, MapPin, CheckCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useMyUser } from "@/lib/use-role";

export const Route = createFileRoute("/_authenticated/admin/sos")({
  component: AdminSOS,
});

function AdminSOS() {
  const qc = useQueryClient();
  const { data: user } = useMyUser();

  const { data } = useQuery({
    queryKey: ["all-sos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sos_alerts")
        .select("*, tourists(full_name, tracking_id, phone)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 5_000,
  });

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("sos-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_alerts" }, () => {
        qc.invalidateQueries({ queryKey: ["all-sos"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function update(id: string, patch: Partial<{ status: string; assigned_to: string | null; acknowledged_at: string; resolved_at: string }>) {
    const { error } = await supabase.from("sos_alerts").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["all-sos"] });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Live SOS Alerts</h1>
        <p className="text-sm text-muted-foreground">Auto-refreshing in real time</p>
      </div>
      <div className="space-y-3">
        {data?.length ? data.map((s) => (
          <Card key={s.id} className={`p-4 ${s.status === "active" ? "border-red-500/40 bg-red-500/5" : ""}`}>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Siren className={`h-5 w-5 ${s.status === "active" ? "text-red-600 animate-pulse" : "text-muted-foreground"}`} />
                  <span className="font-semibold">{(s as any).tourists?.full_name ?? "Unknown tourist"}</span>
                  {(s as any).tourists?.tracking_id && <Badge variant="outline">{(s as any).tourists.tracking_id}</Badge>}
                  <Badge className="capitalize" variant={s.status === "active" ? "destructive" : "secondary"}>{s.status}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
                </div>
                {s.message && <p className="mt-1 text-sm">{s.message}</p>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {(s as any).tourists?.phone && <span>📞 {(s as any).tourists.phone}</span>}
                  {s.latitude != null && s.longitude != null && (
                    <a href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-primary hover:underline">
                      <MapPin className="h-3 w-3" /> {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.status === "active" && (
                  <Button size="sm" variant="secondary" className="gap-1"
                    onClick={() => update(s.id, { status: "acknowledged", assigned_to: user?.id, acknowledged_at: new Date().toISOString() })}>
                    <Eye className="h-4 w-4" /> Acknowledge & assign me
                  </Button>
                )}
                {s.status !== "resolved" && (
                  <Button size="sm" className="gap-1"
                    onClick={() => update(s.id, { status: "resolved", resolved_at: new Date().toISOString() })}>
                    <CheckCircle className="h-4 w-4" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )) : <Card className="p-6 text-center text-sm text-muted-foreground">No SOS alerts.</Card>}
      </div>
    </div>
  );
}
