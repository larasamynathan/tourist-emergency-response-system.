import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/tourists")({
  component: AdminTourists,
});

const PAGE = 20;

function AdminTourists() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  const { data } = useQuery({
    queryKey: ["admin-tourists", q, status, page],
    queryFn: async () => {
      let query = supabase.from("tourists").select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (status !== "all") query = query.eq("status", status);
      if (q) query = query.or(`full_name.ilike.%${q}%,tracking_id.ilike.%${q}%,passport_number.ilike.%${q}%,nationality.ilike.%${q}%`);
      const { data, count } = await query;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  async function setStatusFor(id: string, s: string) {
    const { error } = await supabase.from("tourists").update({ status: s }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    qc.invalidateQueries({ queryKey: ["admin-tourists"] });
  }

  async function deleteTourist(id: string) {
    const { error } = await supabase.from("tourists").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tourist deleted");
    qc.invalidateQueries({ queryKey: ["admin-tourists"] });
  }

  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Tourists</h1>
        <p className="text-sm text-muted-foreground">{total} registered</p>
      </div>

      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, passport, tracking ID…"
              value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="safe">Safe</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="danger">Danger</SelectItem>
              <SelectItem value="checked_out">Checked out</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-2">
        {data?.rows.map((t) => (
          <Card key={t.id} className="p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{t.full_name}</h3>
                  <Badge variant="outline">{t.tracking_id}</Badge>
                  <Badge className="capitalize" variant={
                    t.status === "danger" ? "destructive" :
                    t.status === "alert" ? "default" : "secondary"
                  }>{t.status}</Badge>
                </div>
                <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>📧 {t.email || "—"} · 📞 {t.phone}</span>
                  <span>🌐 {t.nationality} · 🛂 {t.passport_number}</span>
                  <span>📅 {format(new Date(t.check_in_date), "MMM d")} → {format(new Date(t.check_out_date), "MMM d, yyyy")}</span>
                  <span>🚨 {t.emergency_contact_name} ({t.emergency_contact_phone})</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Select value={t.status} onValueChange={(v) => setStatusFor(t.id, v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Safe</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="danger">Danger</SelectItem>
                    <SelectItem value="checked_out">Checked out</SelectItem>
                  </SelectContent>
                </Select>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete tourist?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes <strong>{t.full_name}</strong> ({t.tracking_id}) and their travel record. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTourist(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        {!data?.rows.length && <Card className="p-6 text-center text-sm text-muted-foreground">No tourists found.</Card>}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {pages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
