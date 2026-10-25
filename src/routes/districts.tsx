import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Mail, MapPin, Phone, Search, User } from "lucide-react";
import { districtsQuery } from "@/lib/queries";
import { Empty, ErrorState, Loading, PageTitle } from "@/components/site/States";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/districts")({
  head: () => ({
    meta: [
      { title: "District Members — Ju Jitsu Association of Andhra Pradesh" },
      { name: "description", content: "Find district Ju Jitsu units and coordinator contacts across Andhra Pradesh." },
      { property: "og:title", content: "District Members — Ju Jitsu AP" },
      { property: "og:description", content: "District units and coordinator contacts across Andhra Pradesh." },
    ],
  }),
  component: Districts,
});

function Districts() {
  const { data, isLoading, error, refetch } = useQuery(districtsQuery);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter((d) => [d.district_name, d.coordinator_name, d.phone, d.email].some((v) => v.toLowerCase().includes(s)));
  }, [data, q]);

  return (
    <>
      <PageTitle title="District Members" subtitle="District units and their coordinators" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by district or coordinator" className="h-11 bg-card pl-9" aria-label="Search districts" />
        </div>
        <div className="mt-6">
          {isLoading ? (
            <Loading />
          ) : error ? (
            <ErrorState error={error} retry={() => refetch()} />
          ) : list.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((d) => (
                <article key={d.id} className="rounded-md border border-l-4 border-l-primary bg-card p-5 shadow-card">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-primary"><MapPin className="h-4 w-4 text-saffron" />{d.district_name}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex gap-2"><User className="h-4 w-4 shrink-0 text-muted-foreground" />{d.coordinator_name}</li>
                    {d.phone && <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" /><a className="text-primary hover:underline" href={`tel:${d.phone}`}>{d.phone}</a></li>}
                    {d.email && <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-muted-foreground" /><a className="break-all text-primary hover:underline" href={`mailto:${d.email}`}>{d.email}</a></li>}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <Empty>{q ? "No districts match your search." : "No district units listed yet."}</Empty>
          )}
        </div>
      </div>
    </>
  );
}
