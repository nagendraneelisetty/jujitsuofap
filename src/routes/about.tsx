import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { aboutQuery, bearersQuery, galleryQuery } from "@/lib/queries";
import { Empty, ErrorState, Loading, PageTitle } from "@/components/site/States";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "About Us — Ju Jitsu Association of Andhra Pradesh" },
      { name: "description", content: "History, mission, office bearers and photo gallery of the Ju Jitsu Association of Andhra Pradesh." },
      { property: "og:title", content: "About the Ju Jitsu Association of Andhra Pradesh" },
      { property: "og:description", content: "History, mission, office bearers and photo gallery." },
    ],
  }),
  component: About,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-primary md:text-2xl">{title}</h2>
      <div className="mt-2 h-1 w-12 bg-saffron" />
      <div className="mt-4">{children}</div>
    </section>
  );
}

function About() {
  const about = useQuery(aboutQuery);
  const bearers = useQuery(bearersQuery);
  const gallery = useQuery(galleryQuery);
  const [preview, setPreview] = useState<{ url: string; caption: string } | null>(null);

  return (
    <>
      <PageTitle title="About the Association" subtitle="Our history, mission and leadership" />
      <div className="mx-auto max-w-6xl px-4">
        {about.isLoading ? (
          <Loading />
        ) : about.error ? (
          <ErrorState error={about.error} retry={() => about.refetch()} />
        ) : (
          <div className="grid gap-x-10 md:grid-cols-2">
            <Section title="Our History">
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{about.data?.history || "—"}</p>
            </Section>
            <Section title="Our Mission">
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{about.data?.mission || "—"}</p>
            </Section>
          </div>
        )}

        <Section title="Office Bearers">
          {bearers.isLoading ? (
            <Loading />
          ) : bearers.error ? (
            <ErrorState error={bearers.error} retry={() => bearers.refetch()} />
          ) : bearers.data?.length ? (
            <div className="overflow-hidden rounded-md border bg-card shadow-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr><th className="px-4 py-3 w-12">#</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Designation</th></tr>
                </thead>
                <tbody>
                  {bearers.data.map((b, i) => (
                    <tr key={b.id} className="border-t even:bg-muted">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold">{b.name}</td>
                      <td className="px-4 py-3">{b.designation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>Office bearers will be listed soon.</Empty>
          )}
        </Section>

        <Section title="Photo Gallery">
          {gallery.isLoading ? (
            <Loading />
          ) : gallery.error ? (
            <ErrorState error={gallery.error} retry={() => gallery.refetch()} />
          ) : gallery.data?.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.data.map((g) => (
                <button key={g.id} onClick={() => setPreview({ url: g.image_url, caption: g.caption })} className="group overflow-hidden rounded-md border bg-card text-left">
                  <img src={g.image_url} alt={g.caption || "Gallery photo"} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                  {g.caption && <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{g.caption}</p>}
                </button>
              ))}
            </div>
          ) : (
            <Empty>No photos in the gallery yet.</Empty>
          )}
        </Section>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{preview?.caption || "Photo"}</DialogTitle>
          {preview && <img src={preview.url} alt={preview.caption} className="max-h-[80vh] w-full rounded object-contain" />}
          {preview?.caption && <p className="px-2 pb-2 text-sm">{preview.caption}</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
