import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Hospital, Shield } from "lucide-react";
import { loadGoogleMaps, getCurrentPosition } from "@/lib/google-maps";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nearby")({
  component: NearbyPage,
});

type Place = { name: string; address: string; lat: number; lng: number; placeId: string };

function NearbyPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"hospital" | "police">("hospital");
  const [places, setPlaces] = useState<Place[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapInst = useRef<any>(null);
  const markers = useRef<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const google = await loadGoogleMaps();
        let lat = 28.6139, lng = 77.209; // fallback: Delhi
        try {
          const pos = await getCurrentPosition();
          lat = pos.coords.latitude; lng = pos.coords.longitude;
        } catch { toast.warning("Using default location — enable GPS for accurate results"); }
        setCenter({ lat, lng });
        mapInst.current = new google.maps.Map(mapRef.current, {
          center: { lat, lng }, zoom: 14, disableDefaultUI: false,
        });
        new google.maps.Marker({ position: { lat, lng }, map: mapInst.current, label: "You" });
        setLoading(false);
      } catch (e) {
        toast.error((e as Error).message);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!center) return;
    (async () => {
      const apiUrl = "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchNearby";
      // Browser key works for new Places API too via direct REST? Use server route for safety. Quick approach:
      // We use the JS Places library nearbySearch alternative: Places API New via REST needs server proxy.
      // For UX simplicity, fall back to text query in legacy JS Places — but legacy is removed.
      // Use server route via /api/nearby
      try {
        const res = await fetch(`/api/nearby?lat=${center.lat}&lng=${center.lng}&type=${mode}`);
        if (!res.ok) throw new Error(await res.text());
        const j = await res.json();
        setPlaces(j.places);
        // clear markers
        markers.current.forEach((m) => m.setMap(null));
        markers.current = [];
        const google = (window as any).google;
        j.places.forEach((p: Place) => {
          const m = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: mapInst.current,
            title: p.name,
          });
          markers.current.push(m);
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [center, mode]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Nearby Help</h1>
        <p className="text-sm text-muted-foreground">Hospitals & police stations around you.</p>
      </div>
      <div className="flex gap-2">
        <Button variant={mode === "hospital" ? "default" : "outline"} size="sm" onClick={() => setMode("hospital")} className="gap-1">
          <Hospital className="h-4 w-4" /> Hospitals
        </Button>
        <Button variant={mode === "police" ? "default" : "outline"} size="sm" onClick={() => setMode("police")} className="gap-1">
          <Shield className="h-4 w-4" /> Police
        </Button>
      </div>

      <Card className="relative overflow-hidden">
        <div ref={mapRef} className="h-[400px] w-full bg-secondary" />
        {loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-secondary/60">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        {places.map((p) => (
          <Card key={p.placeId} className="p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.address}</div>
                <a className="mt-1 inline-block text-xs text-primary hover:underline"
                   href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">
                  Get directions
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
