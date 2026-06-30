import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nearby")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const lat = parseFloat(url.searchParams.get("lat") ?? "");
        const lng = parseFloat(url.searchParams.get("lng") ?? "");
        const type = url.searchParams.get("type") ?? "hospital"; // hospital | police

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return new Response("Invalid coordinates", { status: 400 });
        }
        const lovableKey = process.env.LOVABLE_API_KEY;
        const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!lovableKey || !mapsKey) return new Response("Maps not configured", { status: 500 });

        const includedType = type === "police" ? "police" : "hospital";
        const res = await fetch("https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchNearby", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": mapsKey,
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
          },
          body: JSON.stringify({
            includedTypes: [includedType],
            maxResultCount: 15,
            locationRestriction: {
              circle: { center: { latitude: lat, longitude: lng }, radius: 5000 },
            },
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          return new Response(t, { status: res.status });
        }
        const json = await res.json();
        const places = (json.places ?? []).map((p: any) => ({
          placeId: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          lat: p.location?.latitude,
          lng: p.location?.longitude,
        }));
        return Response.json({ places });
      },
    },
  },
});
