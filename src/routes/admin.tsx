import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { CalendarDays, ExternalLink, Info, Loader2, LogOut, Megaphone, Menu, MessageSquare, Phone, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import emblem from "@/assets/emblem.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Admin Panel — Ju Jitsu Association of Andhra Pradesh" },
      { name: "description", content: "Administration panel for the association website." },
      { property: "og:title", content: "Admin Panel — Ju Jitsu AP" },
      { property: "og:description", content: "Administration panel for the association website." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const LINKS = [
  { to: "/admin", label: "Event Updates", icon: CalendarDays },
  { to: "/admin/notices", label: "Notices", icon: Megaphone },
  { to: "/admin/districts", label: "District Members", icon: Users },
  { to: "/admin/executive-committee", label: "Executive Committee", icon: Users },
  { to: "/admin/about", label: "About Page", icon: Info },
  { to: "/admin/contact", label: "Contact Details", icon: Phone },
  { to: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
] as const;

type Status = "loading" | "signedOut" | "notAdmin" | "admin";

function AdminLayout() {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    async function check(s: Session | null) {
      setSession(s);
      if (!s) { setStatus("signedOut"); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin").maybeSingle();
      setStatus(data ? "admin" : "notAdmin");
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") setTimeout(() => check(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await qc.cancelQueries({ queryKey: ["enquiries"] });
    qc.removeQueries({ queryKey: ["enquiries"] });
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  }

  if (status === "loading")
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (status === "signedOut") return <AdminLogin />;
  if (status === "notAdmin")
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="font-semibold">This account does not have admin access.</p>
        <Button onClick={signOut}>Sign out</Button>
      </div>
    );

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {LINKS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          activeOptions={{ exact: true }}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 hover:bg-sidebar-accent"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground! border-l-4 border-sidebar-primary" }}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar md:flex">
        <SidebarHead />
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-sidebar">
            <SidebarHead />
            {nav}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-card px-4 py-3">
          <button className="rounded p-1 text-primary md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <p className="truncate text-sm text-muted-foreground">{session?.user.email}</p>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="outline" size="sm"><a href="/" target="_blank" rel="noreferrer"><ExternalLink /> <span className="hidden sm:inline">View site</span></a></Button>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut /> <span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarHead() {
  return (
    <div className="flex items-center gap-2 border-b border-sidebar-border p-4">
      <img src={emblem} alt="" className="h-10 w-10 rounded-full bg-card object-contain p-0.5" />
      <div>
        <p className="text-sm font-bold text-sidebar-foreground">Admin Panel</p>
        <p className="text-xs text-sidebar-foreground/70">Ju Jitsu AP</p>
      </div>
    </div>
  );
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr("Invalid email or password.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-md border-t-4 border-saffron bg-card p-6 shadow-card">
        <div className="text-center">
          <img src={emblem} alt="" className="mx-auto h-16 w-16 object-contain" />
          <h1 className="mt-2 text-xl font-bold text-primary">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Ju Jitsu Association of Andhra Pradesh</p>
        </div>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Sign in</Button>
        <a href="/" className="block text-center text-sm text-primary hover:underline">← Back to website</a>
      </form>
    </div>
  );
}
