import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, MapPin, Bell, Users, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeTrail — Smart Tourist Safety Monitoring & Incident Response" },
      { name: "description", content: "Register tourists, monitor safety status in real time, and coordinate incident response from one unified command center." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <Shield className="h-6 w-6 text-primary" />
            SafeTrail
          </Link>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/register"><Button variant="ghost" size="sm">Register Tourist</Button></Link>
            <Link to="/auth"><Button size="sm">Admin Login</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[oklch(0.28_0.08_240)] text-primary-foreground">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Activity className="h-3 w-3" /> Live monitoring · 24/7 response
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
            Keep every traveler safe — from arrival to departure.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">
            SafeTrail is a unified tourist safety platform. Register visitors,
            track itineraries, surface emergencies, and dispatch response —
            all from a single command center.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Register as Tourist <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                Authority Portal
              </Button>
            </Link>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 md:grid-cols-4">
            {[
              ["24/7", "Monitoring"],
              ["< 3 min", "Avg response"],
              ["Encrypted", "Tourist data"],
              ["Real-time", "Status updates"],
            ].map(([k, v]) => (
              <div key={v}>
                <dt className="text-2xl font-bold">{k}</dt>
                <dd className="text-sm text-white/70">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl font-bold md:text-4xl">A complete safety operations stack</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Built for tourism boards, police, hotels and emergency response teams.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, title: "Tourist registry", desc: "Capture identity, itinerary, emergency contacts and a unique tracking ID at arrival." },
            { icon: MapPin, title: "Live status", desc: "Mark travelers as safe, on alert, or in danger. Update locations as they move." },
            { icon: Bell, title: "Incident response", desc: "Log incidents with severity, assign officers, and track resolution end-to-end." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition hover:shadow-lg">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ["01", "Tourist registers", "Visitor submits the secure registration form on arrival. Gets a unique tracking ID."],
              ["02", "Authority monitors", "Officers log in to the command center to see every active tourist and their status."],
              ["03", "Respond to incidents", "Report incidents, escalate by severity, coordinate dispatch and close them out."],
            ].map(([n, t, d]) => (
              <div key={n}>
                <div className="font-display text-5xl font-bold text-primary/30">{n}</div>
                <h3 className="mt-3 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>SafeTrail · Smart Tourist Safety Monitoring</span>
          </div>
          <p>For emergencies, contact local authorities immediately.</p>
        </div>
      </footer>
    </div>
  );
}
