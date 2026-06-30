import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({ meta: [{ title: "Incidents — SafeTrail" }] }),
  component: IncidentsPage,
});

type Incident = {
  id: string;
  tourist_id: string | null;
  incident_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: string | null;
  status: "open" | "investigating" | "resolved" | "closed";
  created_at: string;
};
type TouristLite = { id: string; full_name: string; tracking_id: string };

const SEV: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-[color:var(--alert)]/15 text-[color:var(--alert)] border-[color:var(--alert)]/30",
  high: "bg-[color:var(--danger)]/15 text-[color:var(--danger)] border-[color:var(--danger)]/30",
  critical: "bg-destructive text-destructive-foreground",
};
const STATUS: Record<string, string> = {
  open: "bg-[color:var(--danger)]/15 text-[color:var(--danger)]",
  investigating: "bg-[color:var(--alert)]/15 text-[color:var(--alert)]",
  resolved: "bg-[color:var(--safe)]/15 text-[color:var(--safe)]",
  closed: "bg-muted text-muted-foreground",
};

function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [tourists, setTourists] = useState<TouristLite[]>([]);
  const [open, setOpen] = useState(false);
  const [touristMap, setTouristMap] = useState<Map<string, TouristLite>>(new Map());

  async function load() {
    const [{ data: inc, error: e1 }, { data: tr, error: e2 }] = await Promise.all([
      supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("tourists").select("id, full_name, tracking_id").order("created_at", { ascending: false }),
    ]);
    if (e1) return toast.error(e1.message);
    if (e2) return toast.error(e2.message);
    setIncidents(inc as Incident[]);
    setTourists((tr ?? []) as TouristLite[]);
    setTouristMap(new Map((tr ?? []).map((t: any) => [t.id, t])));
  }

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const l = incidents ?? [];
    return {
      open: l.filter((i) => i.status === "open").length,
      investigating: l.filter((i) => i.status === "investigating").length,
      resolved: l.filter((i) => i.status === "resolved" || i.status === "closed").length,
      total: l.length,
    };
  }, [incidents]);

  async function updateStatus(id: string, status: Incident["status"]) {
    const { error } = await supabase.from("incidents").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Incidents</h1>
          <p className="text-muted-foreground">Report and track safety incidents involving tourists.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Report incident</Button>
          </DialogTrigger>
          <ReportDialog tourists={tourists} onDone={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Open" value={stats.open} tone="danger" />
        <Stat label="Investigating" value={stats.investigating} tone="alert" />
        <Stat label="Resolved" value={stats.resolved} tone="safe" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tourist</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents === null ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : incidents.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No incidents reported.</TableCell></TableRow>
            ) : incidents.map((i) => {
              const t = i.tourist_id ? touristMap.get(i.tourist_id) : null;
              return (
                <TableRow key={i.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{i.incident_type}</TableCell>
                  <TableCell>{t ? <span>{t.full_name} <span className="text-muted-foreground">· {t.tracking_id}</span></span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{i.location || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={SEV[i.severity]}>{i.severity}</Badge></TableCell>
                  <TableCell>
                    <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v as Incident["status"])}>
                      <SelectTrigger className={`h-8 w-[140px] ${STATUS[i.status]}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate" title={i.description}>{i.description}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ReportDialog({ tourists, onDone }: { tourists: TouristLite[]; onDone: () => void }) {
  const [touristId, setTouristId] = useState<string>("none");
  const [severity, setSeverity] = useState("low");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("incidents").insert({
      tourist_id: touristId === "none" ? null : touristId,
      incident_type: String(fd.get("incident_type")),
      severity,
      description: String(fd.get("description")),
      location: String(fd.get("location") || "") || null,
      reported_by: u.user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Incident reported");
    onDone();
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Report an incident</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label>Tourist (optional)</Label>
          <Select value={touristId} onValueChange={setTouristId}>
            <SelectTrigger><SelectValue placeholder="Link to a tourist" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Not linked —</SelectItem>
              {tourists.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.full_name} · {t.tracking_id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="incident_type">Type</Label>
          <Input id="incident_type" name="incident_type" required placeholder="e.g. Medical, Theft, Missing person" />
        </div>
        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Where did it happen?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" required rows={4} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Report incident"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger"|"alert"|"safe" }) {
  const map: Record<string, string> = {
    danger: "text-[color:var(--danger)]",
    alert: "text-[color:var(--alert)]",
    safe: "text-[color:var(--safe)]",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${tone ? map[tone] : ""}`}>{value}</div>
    </div>
  );
}
