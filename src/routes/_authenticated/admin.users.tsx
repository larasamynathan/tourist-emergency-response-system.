import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useMyUser } from "@/lib/use-role";
import { toast } from "sonner";
import { useState } from "react";

async function deleteAccountViaEdgeFunction(userId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to delete account");
  }
  return res.json();
}

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type Filter = "all" | "admin" | "responder" | "tourist" | "officer";

function AdminUsers() {
  const qc = useQueryClient();
  const { data: me } = useMyUser();
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["all-accounts"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles.data ?? []).forEach((r) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });
      return (profiles.data ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  async function onDelete(id: string) {
    setBusy(id);
    try {
      await deleteAccountViaEdgeFunction(id);
      toast.success("Account deleted");
      qc.invalidateQueries({ queryKey: ["all-accounts"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    } finally {
      setBusy(null);
    }
  }

  const filters: Filter[] = ["all", "admin", "responder", "tourist", "officer"];
  const rows = (data ?? []).filter((u) => filter === "all" || u.roles.includes(filter));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Accounts</h1>
        <p className="text-sm text-muted-foreground">{rows.length} of {data?.length ?? 0} accounts</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="capitalize"
            onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((u) => {
          const isSelf = me?.id === u.id;
          return (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="font-medium">{u.full_name || u.email} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}</div>
                <div className="text-xs text-muted-foreground">{u.email} · joined {format(new Date(u.created_at), "MMM d, yyyy")}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {u.roles.map((r: string) => <Badge key={r} variant="outline" className="capitalize">{r}</Badge>)}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={isSelf || busy === u.id}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes <strong>{u.full_name || u.email}</strong> and their associated profile and roles. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          );
        })}
        {!rows.length && <Card className="p-6 text-center text-sm text-muted-foreground">No accounts in this filter.</Card>}
      </div>
    </div>
  );
}