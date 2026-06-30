import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyUser } from "@/lib/use-role";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/my-incidents")({
  component: MyIncidents,
});

function MyIncidents() {
  const { data: user } = useMyUser();
  const { data } = useQuery({
    queryKey: ["my-incidents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("incidents").select("*")
        .eq("reported_by", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My Reports</h1>
        <p className="text-sm text-muted-foreground">Track incident status and response notes.</p>
      </div>

      <div className="space-y-3">
        {data?.length ? data.map((i) => (
          <Card key={i.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{i.incident_type}</h3>
                  <Badge variant="outline" className="capitalize">{i.severity}</Badge>
                  <Badge variant={i.status === "resolved" ? "default" : "secondary"} className="capitalize">{i.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {i.location && <>📍 {i.location} · </>}
                  {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}
                </div>
                {i.response_notes && (
                  <div className="mt-2 rounded-md bg-secondary p-2 text-xs">
                    <span className="font-medium">Response:</span> {i.response_notes}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )) : <Card className="p-6 text-center text-sm text-muted-foreground">No reports yet.</Card>}
      </div>
    </div>
  );
}
