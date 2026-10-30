import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import emblem from "@/assets/emblem.png";
import { contactQuery } from "@/lib/queries";
import { NoticeTicker } from "./NoticeTicker";

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/districts", label: "District Members" },
  { to: "/executive-committee", label: "Executive Committee" },
  { to: "/events", label: "Event Updates" },
  { to: "/contact", label: "Contact Us" },
] as const;

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: contact } = useQuery(contactQuery);

  return (
    <div className="flex min-h-screen flex-col">
      <NoticeTicker />
      <div className="tricolor-bar h-1" />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/emblem.png" alt="Association emblem" width={56} height={56} className="h-12 w-12 shrink-0 object-contain md:h-16 md:w-16" />
            <div className="min-w-0">
              <p className="font-serif text-sm font-bold leading-tight text-primary sm:text-base md:text-xl">
                JU JITSU ASSOCIATION OF ANDHRA PRADESH
              </p>
              <p className="text-xs text-muted-foreground md:text-sm">Official State Body for Ju Jitsu</p>
            </div>
          </Link>
          <button
            className="ml-auto rounded-md p-2 text-primary md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <nav className="bg-primary">
          <ul className="mx-auto hidden max-w-6xl px-4 md:flex">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="block border-b-3 border-transparent px-4 py-3 text-sm font-semibold text-primary-foreground/90 hover:bg-primary-deep hover:text-primary-foreground"
                  activeProps={{ className: "border-saffron! bg-primary-deep text-primary-foreground!" }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          {open && (
            <ul className="border-t border-primary-deep md:hidden">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: n.to === "/" }}
                    className="block border-l-4 border-transparent px-4 py-3 font-semibold text-primary-foreground"
                    activeProps={{ className: "border-saffron! bg-primary-deep" }}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 bg-primary-deep text-primary-foreground/85">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <img src="/emblem.png" alt="" width={44} height={44} loading="lazy" className="h-11 w-11 rounded-full bg-card object-contain p-0.5" />
              <p className="font-serif font-bold text-primary-foreground">Ju Jitsu Association of Andhra Pradesh</p>
            </div>
            <p className="mt-3 text-sm">Promoting discipline, fitness and self-defence through Ju Jitsu across every district of the state.</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-saffron">Quick Links</h3>
            <ul className="space-y-1.5 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-primary-foreground hover:underline">{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-saffron">Contact</h3>
            <ul className="space-y-2 text-sm">
              {contact?.address && (
                <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{contact.address}</li>
              )}
              {contact?.phones.map((p) => (
                <li key={p} className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${p}`}>{p}</a></li>
              ))}
              {contact?.emails.map((e) => (
                <li key={e} className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${e}`} className="break-all">{e}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-sidebar-border">
          <div className="mx-auto flex max-w-6xl flex-col-reverse items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/admin"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary-foreground/40 px-4 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Lock className="h-3.5 w-3.5" /> Admin Login
            </Link>
            <p className="text-xs">© {new Date().getFullYear()} Ju Jitsu Association of Andhra Pradesh. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
