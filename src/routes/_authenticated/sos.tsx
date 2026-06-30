import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Siren, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMyUser } from "@/lib/use-role";
import { useQuery } from "@tanstack/react-query";
import { getCurrentPosition } from "@/lib/google-maps";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/sos")({
  component: SosPage,
});

function SosPage() {
  const { data: user } = useMyUser();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: history, refetch } = useQuery({
    queryKey: ["my-sos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("sos_alerts").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  async function triggerSOS() {
    if (!user) return;
    setSending(true);
    let latitude: number | null = null, longitude: number | null = null;
    try {
      const pos = await getCurrentPosition();
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      toast.warning("Couldn't get GPS — alert sent without coordinates");
    }
    const { data: t } = await supabase.from("tourists").select("id").eq("user_id", user.id).maybeSingle();
    const { error } = await supabase.from("sos_alerts").insert({
      user_id: user.id, tourist_id: t?.id ?? null, latitude, longitude, message: message || null,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("SOS sent — help is on the way");
    setMessage("");
    refetch();
    navigate({ to: "/sos" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Emergency SOS</h1>
        <p className="text-sm text-muted-foreground">Sends your live location to admins & response teams.</p>
      </div>

      <Card className="border-red-500/40 bg-red-50/50 p-6 text-center dark:bg-red-950/20">
        <Siren className="mx-auto h-16 w-16 animate-pulse text-red-600" />
        <h2 className="mt-3 text-lg font-bold">Send Emergency Alert</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use only for real emergencies.</p>
        <Textarea
          placeholder="Optional message: what's happening?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={300}
          className="mt-4"
        />
        <Button
          onClick={triggerSOS}
          disabled={sending}
          size="lg"
          className="mt-4 h-16 w-full bg-red-600 text-base font-bold hover:bg-red-700"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Siren className="mr-2 h-5 w-5" /> ACTIVATE SOS</>)}
        </Button>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Recent alerts</h3>
        <div className="space-y-2">
          {history?.length ? history.map((s) => (
            <div key={s.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    s.status === "active" ? "bg-red-500 animate-pulse" :
                    s.status === "acknowledged" ? "bg-amber-500" : "bg-green-500"}`} />
                  <span className="font-medium capitalize">{s.status}</span>
                  <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
                </div>
                {s.message && <div className="mt-1 truncate text-muted-foreground">{s.message}</div>}
                {s.latitude && (
                  <a href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`} target="_blank" rel="noreferrer"
                     className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <MapPin className="h-3 w-3" /> view on map
                  </a>
                )}
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No alerts yet.</p>}
        </div>
      </Card>
    </div>
  );
}
