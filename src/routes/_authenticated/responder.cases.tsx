import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, MapPin, Map as MapIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMyUser } from "@/lib/use-role";
import { formatDistanceToNow } from "date-fns";
import { MiniMap } from "@/components/MiniMap";

export const Route = createFileRoute("/_authenticated/responder/cases")({
  component: ResponderCases,
});

function ResponderCases() {
  const qc = useQueryClient();
  const { data: user } = useMyUser();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const { data } = useQuery({
    queryKey: ["my-assigned", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("incidents").select("*, tourists(full_name, phone, tracking_id)")
        .eq("assigned_to", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 10_000,
  });

  async function update(id: string, patch: Partial<{ status: string; response_notes: string; resolved_at: string }>) {
    const { error } = await supabase.from("incidents").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["my-assigned", user?.id] });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My Cases</h1>
        <p className="text-sm text-muted-foreground">Incidents assigned to you</p>
      </div>
      <div className="space-y-3">
        {data?.length ? data.map((i) => (
          <Card key={i.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{i.incident_type}</h3>
                  <Badge variant="outline" className="capitalize">{i.severity}</Badge>
                  <Badge variant={i.status === "resolved" ? "default" : "secondary"} className="capitalize">{i.status}</Badge>
                </div>
                {(i as any).tourists?.full_name && (
                  <div className="mt-1 text-sm">
                    Tourist: <span className="font-medium">{(i as any).tourists.full_name}</span> ({(i as any).tourists.tracking_id}) · 📞 {(i as any).tourists.phone}
                  </div>
                )}
                <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}</span>
                  {i.latitude != null && i.longitude != null && (
                    <>
                      <button
                        onClick={() => setOpenMap((m) => ({ ...m, [i.id]: !m[i.id] }))}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <MapIcon className="h-3 w-3" /> {openMap[i.id] ? "Hide map" : "Show live location"}
                      </button>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${i.latitude},${i.longitude}`}
                         target="_blank" rel="noreferrer"
                         className="inline-flex items-center gap-1 text-primary hover:underline">
                        <MapPin className="h-3 w-3" /> Navigate
                      </a>
                    </>
                  )}
                </div>
                {openMap[i.id] && i.latitude != null && i.longitude != null && (
                  <div className="mt-3">
                    <MiniMap lat={Number(i.latitude)} lng={Number(i.longitude)} label={(i as any).tourists?.full_name ?? "Tourist"} height={220} />
                  </div>
                )}

                <Textarea
                  placeholder="Add response notes…" className="mt-3"
                  defaultValue={i.response_notes ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Select
                    value={i.status ?? "open"}
                    onValueChange={(v) => update(i.id, { status: v, ...(v === "resolved" ? { resolved_at: new Date().toISOString() } : {}) })}
                  >
                    <SelectTrigger className="h-9 w-[170px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline"
                    onClick={() => update(i.id, { response_notes: notes[i.id] ?? i.response_notes ?? "" })}>
                    Save notes
                  </Button>
                  {i.status !== "resolved" && (
                    <Button size="sm" className="gap-1"
                      onClick={() => update(i.id, { status: "resolved", resolved_at: new Date().toISOString(), response_notes: notes[i.id] ?? i.response_notes ?? "" })}>
                      <CheckCircle2 className="h-4 w-4" /> Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )) : <Card className="p-6 text-center text-sm text-muted-foreground">No cases assigned to you yet.</Card>}
      </div>
    </div>
  );
}
