import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, AlertTriangle, Siren, CheckCircle2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { format, subDays } from "date-fns";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [tourists, incidents, sos] = await Promise.all([
        supabase.from("tourists").select("id,status,created_at"),
        supabase.from("incidents").select("id,status,severity,incident_type,created_at"),
        supabase.from("sos_alerts").select("id,status,created_at"),
      ]);

      const totalTourists = tourists.data?.length ?? 0;
      const activeIncidents = incidents.data?.filter((i) => i.status !== "resolved").length ?? 0;
      const activeSos = sos.data?.filter((s) => s.status === "active").length ?? 0;
      const resolvedCases =
        (incidents.data?.filter((i) => i.status === "resolved").length ?? 0) +
        (sos.data?.filter((s) => s.status === "resolved").length ?? 0);

      // Last 7 days line chart (incidents per day)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        const k = format(d, "yyyy-MM-dd");
        return {
          day: format(d, "EEE"),
          incidents: incidents.data?.filter((x) => x.created_at.startsWith(k)).length ?? 0,
          sos: sos.data?.filter((x) => x.created_at.startsWith(k)).length ?? 0,
        };
      });

      // Bar — incidents by severity
      const sevMap: Record<string, number> = {};
      incidents.data?.forEach((i) => (sevMap[i.severity] = (sevMap[i.severity] ?? 0) + 1));
      const severity = Object.entries(sevMap).map(([name, value]) => ({ name, value }));

      // Pie — incident types
      const typeMap: Record<string, number> = {};
      incidents.data?.forEach((i) => (typeMap[i.incident_type] = (typeMap[i.incident_type] ?? 0) + 1));
      const types = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Status distribution (incidents)
      const statusMap: Record<string, number> = {};
      incidents.data?.forEach((i) => (statusMap[i.status] = (statusMap[i.status] ?? 0) + 1));
      const statuses = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // SOS status pie
      const sosMap: Record<string, number> = {};
      sos.data?.forEach((s) => (sosMap[s.status] = (sosMap[s.status] ?? 0) + 1));
      const sosStatus = Object.entries(sosMap).map(([name, value]) => ({ name, value }));

      // Tourist status
      const touristMap: Record<string, number> = {};
      tourists.data?.forEach((t) => (touristMap[t.status ?? "unknown"] = (touristMap[t.status ?? "unknown"] ?? 0) + 1));
      const touristStatus = Object.entries(touristMap).map(([name, value]) => ({ name, value }));

      const totalIncidents = incidents.data?.length ?? 0;
      const resolvedIncidents = incidents.data?.filter((i) => i.status === "resolved").length ?? 0;
      const resolutionRate = totalIncidents ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

      return { totalTourists, activeIncidents, activeSos, resolvedCases, days, severity, types, statuses, sosStatus, touristStatus, resolutionRate };
    },
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Command Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of tourist safety operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Tourists" value={stats?.totalTourists ?? 0} icon={Users} tone="primary" />
        <StatCard label="Active Incidents" value={stats?.activeIncidents ?? 0} icon={AlertTriangle} tone="amber" />
        <StatCard label="Active SOS" value={stats?.activeSos ?? 0} icon={Siren} tone="red" />
        <StatCard label="Resolved Cases" value={stats?.resolvedCases ?? 0} icon={CheckCircle2} tone="green" />
      </div>

      {/* Charts grid — compact, one screen */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">7-Day Activity</h3>
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={stats?.days ?? []} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="incidents" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="sos" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Incident Types</h3>
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats?.types ?? []} dataKey="value" nameKey="name" innerRadius={32} outerRadius={60}>
                  {(stats?.types ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Incidents by Severity</h3>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={stats?.severity ?? []} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Resolution Rate</h3>
          <div className="flex h-40 flex-col items-center justify-center">
            <div className="text-5xl font-bold text-green-600">{stats?.resolutionRate ?? 0}%</div>
            <div className="mt-1 text-xs text-muted-foreground">Incidents resolved</div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Incident Status</h3>
          <div className="h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats?.statuses ?? []} dataKey="value" nameKey="name" innerRadius={28} outerRadius={56}>
                  {(stats?.statuses ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">SOS Status</h3>
          <div className="h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats?.sosStatus ?? []} dataKey="value" nameKey="name" innerRadius={28} outerRadius={56}>
                  {(stats?.sosStatus ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Tourists by Status</h3>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={stats?.touristStatus ?? []} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, tone,
}: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; tone: "primary" | "amber" | "red" | "green" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600",
    red: "bg-red-500/10 text-red-600",
    green: "bg-green-500/10 text-green-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </Card>
  );
}
