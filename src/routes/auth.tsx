import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ArrowLeft, Sparkles } from "lucide-react";
import { ensureDemoAdmin, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/demo.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — SafeTrail" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "tourist" | "staff">("login");
  const ensureDemo = useServerFn(ensureDemoAdmin);

  // login — pre-filled with demo admin credentials for quick exploration
  const [email, setEmail] = useState(DEMO_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD);
  // signup
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPwd, setSignupPwd] = useState("");
  const [staffCode, setStaffCode] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // If signing in with demo creds, ensure the account exists first.
    if (email === DEMO_ADMIN_EMAIL) {
      try { await ensureDemo({}); } catch { /* ignore — try sign-in anyway */ }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  async function handleDemoAdmin() {
    setLoading(true);
    try {
      await ensureDemo({});
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_ADMIN_PASSWORD,
      });
      if (error) throw error;
      toast.success("Signed in as Demo Admin");
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Demo sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(role: "tourist" | "officer" | "responder") {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPwd,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name, signup_role: role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created! Signing you in…");
    const { error: e2 } = await supabase.auth.signInWithPassword({
      email: signupEmail,
      password: signupPwd,
    });
    if (e2) return toast.error(e2.message);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/40 via-background to-primary/5 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold">SafeTrail Access</h1>
        </div>

        <Card className="p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="tourist">Tourist signup</TabsTrigger>
              <TabsTrigger value="staff">Staff signup</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or try the demo</span>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full gap-2" disabled={loading} onClick={handleDemoAdmin}>
                  <Sparkles className="h-4 w-4" /> Sign in as Demo Admin
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Demo: <code>{DEMO_ADMIN_EMAIL}</code> / <code>{DEMO_ADMIN_PASSWORD}</code>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="tourist" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSignup("tourist");
                }}
                className="space-y-4"
              >
                <div>
                  <Label>Full name</Label>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" required minLength={6} value={signupPwd} onChange={(e) => setSignupPwd(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Create tourist account
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  You'll complete your travel profile after signing in.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="staff" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const role = staffCode === "RESPONDER-2026" ? "responder" : "officer";
                  handleSignup(role);
                }}
                className="space-y-4"
              >
                <div>
                  <Label>Full name</Label>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Work email</Label>
                  <Input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" required minLength={6} value={signupPwd} onChange={(e) => setSignupPwd(e.target.value)} />
                </div>
                <div>
                  <Label>Department code (optional)</Label>
                  <Input
                    placeholder="Enter RESPONDER-2026 for response team"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Leave blank for Officer access. First account automatically becomes Admin.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Create staff account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
