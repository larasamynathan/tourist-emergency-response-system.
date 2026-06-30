import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Phone, MapPin, Cloud, Lock, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/safety")({
  component: SafetyTips,
});

const tips = [
  { icon: Phone, title: "Save emergency numbers", body: "Local police, ambulance, and your country's embassy. Add at least 2 emergency contacts in the app." },
  { icon: MapPin, title: "Share your itinerary", body: "Keep your travel profile updated. Loved ones and authorities can find you faster." },
  { icon: Lock, title: "Secure your valuables", body: "Use hotel safes, money belts, and avoid flashing cash or expensive electronics in public." },
  { icon: AlertTriangle, title: "Trust your instincts", body: "Leave any situation that feels unsafe. The SOS button works one-tap, even with the screen locked." },
  { icon: Cloud, title: "Check weather & alerts", body: "Avoid travel during storms, floods, or curfews. Local advisories update daily." },
  { icon: Users, title: "Travel with awareness", body: "Avoid isolated areas at night. Use registered taxis and verified accommodations." },
  { icon: ShieldCheck, title: "Keep documents safe", body: "Carry copies of your passport and visa. Store originals in a hotel safe when possible." },
];

function SafetyTips() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Safety Tips & Travel Guidelines</h1>
        <p className="text-sm text-muted-foreground">Curated by tourism safety experts.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tips.map((t) => (
          <Card key={t.title} className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
