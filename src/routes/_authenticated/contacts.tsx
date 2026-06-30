import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyUser } from "@/lib/use-role";
import { toast } from "sonner";
import { Phone, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  const { data: user } = useMyUser();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rel, setRel] = useState("");

  const { data: contacts } = useQuery({
    queryKey: ["contacts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("emergency_contacts").select("*").eq("user_id", user!.id).order("created_at");
      return data ?? [];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: user.id, name, phone, relationship: rel || null,
    });
    if (error) return toast.error(error.message);
    setName(""); setPhone(""); setRel("");
    toast.success("Contact added");
    qc.invalidateQueries({ queryKey: ["contacts", user.id] });
  }

  async function remove(id: string) {
    await supabase.from("emergency_contacts").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["contacts", user?.id] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Emergency Contacts</h1>
        <p className="text-sm text-muted-foreground">People we notify in an emergency.</p>
      </div>

      <Card className="p-4">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1"><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="sm:col-span-1"><Label>Phone</Label><Input required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="sm:col-span-1"><Label>Relationship</Label><Input value={rel} onChange={(e) => setRel(e.target.value)} placeholder="Parent, friend…" /></div>
          <div className="flex items-end"><Button type="submit" className="w-full gap-1"><Plus className="h-4 w-4" /> Add</Button></div>
        </form>
      </Card>

      <div className="space-y-2">
        {contacts?.length ? contacts.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium">{c.name} <span className="ml-1 text-xs text-muted-foreground">{c.relationship}</span></div>
                <a href={`tel:${c.phone}`} className="text-sm text-primary hover:underline">{c.phone}</a>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </Card>
        )) : <Card className="p-6 text-center text-sm text-muted-foreground">No emergency contacts yet.</Card>}
      </div>
    </div>
  );
}
