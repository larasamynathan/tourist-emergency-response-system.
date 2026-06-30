import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useMyUser } from "@/lib/use-role";
import { getCurrentPosition } from "@/lib/google-maps";

export const Route = createFileRoute("/_authenticated/report")({
  component: ReportPage,
});

function ReportPage() {
  const { data: user } = useMyUser();
  const navigate = useNavigate();
  const [type, setType] = useState("Theft");
  const [severity, setSeverity] = useState("medium");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function captureLocation() {
    try {
      const p = await getCurrentPosition();
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      setLocation(`${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`);
      toast.success("Location captured");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    let photo_url: string | null = null;
    try {
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("incident-photos").upload(path, file);
        if (upErr) throw upErr;
        photo_url = path;
      }
      const { data: t } = await supabase.from("tourists").select("id").eq("user_id", user.id).maybeSingle();
      const { error } = await supabase.from("incidents").insert({
        incident_type: type, severity, description, location: location || null,
        latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
        photo_url, reported_by: user.id, tourist_id: t?.id ?? null, status: "open",
      });
      if (error) throw error;
      toast.success("Incident reported");
      navigate({ to: "/my-incidents" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Report an Incident</h1>
        <p className="text-sm text-muted-foreground">Authorities are notified instantly.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Theft","Lost item","Medical","Harassment","Accident","Scam","Lost/Stranded","Other"].map((x) =>
                    <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low","medium","high","critical"].map((x) =>
                    <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={1000} />
          </div>

          <div>
            <Label>Location</Label>
            <div className="flex gap-2">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or coordinates" />
              <Button type="button" variant="outline" onClick={captureLocation} className="shrink-0 gap-1">
                <MapPin className="h-4 w-4" /> Auto
              </Button>
            </div>
          </div>

          <div>
            <Label>Photo (optional)</Label>
            <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-secondary">
              <ImagePlus className="h-4 w-4" />
              {file ? file.name : "Click to attach a photo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit report"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
