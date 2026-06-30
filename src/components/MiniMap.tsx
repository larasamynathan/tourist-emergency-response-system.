import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export function MiniMap({ lat, lng, label, height = 200 }: { lat: number; lng: number; label?: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !ref.current) return;
        const map = new google.maps.Map(ref.current, {
          center: { lat, lng },
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
        });
        new google.maps.Marker({ position: { lat, lng }, map, title: label ?? "Location" });
      } catch (e) {
        console.error("MiniMap load failed", e);
      }
    })();
    return () => { cancelled = true; };
  }, [lat, lng, label]);

  return <div ref={ref} className="w-full rounded-md bg-secondary" style={{ height }} />;
}
