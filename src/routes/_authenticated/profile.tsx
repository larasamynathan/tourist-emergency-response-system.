import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMyUser } from "@/lib/use-role";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user } = useMyUser();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useQuery({
    queryKey: ["my-tourist-edit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("tourists").select("*").eq("user_id", user!.id).maybeSingle();
      setForm({
        full_name: data?.full_name ?? user?.user_metadata?.full_name ?? "",
        email: data?.email ?? user?.email ?? "",
        phone: data?.phone ?? "",
        nationality: data?.nationality ?? "",
        passport_number: data?.passport_number ?? "",
        emergency_contact_name: data?.emergency_contact_name ?? "",
        emergency_contact_phone: data?.emergency_contact_phone ?? "",
        check_in_date: data?.check_in_date ?? "",
        check_out_date: data?.check_out_date ?? "",
        itinerary: data?.itinerary ?? "",
      });
      return data ?? null;
    },
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const payload = {
      user_id: user.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      nationality: form.nationality,
      passport_number: form.passport_number,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
      itinerary: form.itinerary || null,
    };
    const { data: existing } = await supabase.from("tourists").select("id").eq("user_id", user.id).maybeSingle();
    const res = existing
      ? await supabase.from("tourists").update(payload).eq("id", existing.id)
      : await supabase.from("tourists").insert(payload);
    setBusy(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["my-tourist", user.id] });
    qc.invalidateQueries({ queryKey: ["my-tourist-edit", user.id] });
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Travel Profile</h1>
        <p className="text-sm text-muted-foreground">Required for SOS, incident response, and tracking.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required value={form.full_name} onChange={set("full_name")} />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} />
          <Field label="Phone" required value={form.phone} onChange={set("phone")} />
          <Field label="Nationality" required value={form.nationality} onChange={set("nationality")} />
          <Field label="Passport / ID" required value={form.passport_number} onChange={set("passport_number")} />
          <div />
          <Field label="Emergency contact name" required value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
          <Field label="Emergency contact phone" required value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
          <Field label="Check-in" type="date" required value={form.check_in_date} onChange={set("check_in_date")} />
          <Field label="Check-out" type="date" required value={form.check_out_date} onChange={set("check_out_date")} />
          <div className="sm:col-span-2">
            <Label>Itinerary (optional)</Label>
            <Textarea value={form.itinerary} onChange={set("itinerary")} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
