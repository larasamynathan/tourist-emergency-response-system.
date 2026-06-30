import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotifications,
});

function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: users } = useQuery({
    queryKey: ["profiles-for-notif"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email")).data ?? [],
  });

  async function broadcast() {
    if (!users?.length) return;
    setBusy(true);
    const rows = users.map((u) => ({ user_id: u.id, title, body, type: "broadcast" }));
    const { error } = await supabase.from("notifications").insert(rows);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${rows.length} users`);
    setTitle(""); setBody("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Broadcast an alert or update to all users.</p>
      </div>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cyclone warning…" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={500} />
          </div>
          <Button onClick={broadcast} disabled={busy || !title} className="w-full gap-2">
            <Bell className="h-4 w-4" /> Broadcast to {users?.length ?? 0} users
          </Button>
        </div>
      </Card>
    </div>
  );
}
