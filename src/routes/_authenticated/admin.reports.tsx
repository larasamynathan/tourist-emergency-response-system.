import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Star } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const [tourists, incidents, sos, feedback] = await Promise.all([
        supabase.from("tourists").select("*"),
        supabase.from("incidents").select("*"),
        supabase.from("sos_alerts").select("*"),
        supabase.from("feedback").select("*"),
      ]);
      const avgRating = feedback.data?.length
        ? feedback.data.reduce((s, f) => s + f.rating, 0) / feedback.data.length
        : 0;
      return {
        tourists: tourists.data ?? [],
        incidents: incidents.data ?? [],
        sos: sos.data ?? [],
        feedback: feedback.data ?? [],
        avgRating,
      };
    },
  });

  function exportCsv<T extends Record<string, unknown>>(rows: T[], name: string) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) =>
      headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(",")
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}-${format(new Date(), "yyyyMMdd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Download tourist reports and view system stats.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tourists" value={data?.tourists.length ?? 0} />
        <Stat label="Incidents" value={data?.incidents.length ?? 0} />
        <Stat label="SOS alerts" value={data?.sos.length ?? 0} />
        <Stat label="Avg rating" value={`${data?.avgRating.toFixed(1) ?? "0.0"}`} extra={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} />
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Export data</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="outline" className="gap-2" onClick={() => exportCsv(data?.tourists ?? [], "tourists")}>
            <Download className="h-4 w-4" /> Tourists CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => exportCsv(data?.incidents ?? [], "incidents")}>
            <Download className="h-4 w-4" /> Incidents CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => exportCsv(data?.sos ?? [], "sos")}>
            <Download className="h-4 w-4" /> SOS CSV
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Recent feedback</h3>
        <div className="space-y-2">
          {data?.feedback.slice(0, 10).map((f) => (
            <div key={f.id} className="rounded-md border p-2 text-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < f.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              {f.comment && <p className="mt-1 text-muted-foreground">{f.comment}</p>}
            </div>
          ))}
          {!data?.feedback.length && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, extra }: { label: string; value: number | string; extra?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2 text-2xl font-bold">{value} {extra}</div>
    </Card>
  );
}
