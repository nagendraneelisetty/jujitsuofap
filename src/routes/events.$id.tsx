import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { eventQuery, formatDate } from "@/lib/queries";
import { Empty, ErrorState, Loading } from "@/components/site/States";

export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Event Details — Ju Jitsu Association of Andhra Pradesh" },
      { name: "description", content: "Event details from the Ju Jitsu Association of Andhra Pradesh." },
      { property: "og:title", content: "Event Details — Ju Jitsu AP" },
      { property: "og:description", content: "Event details from the Ju Jitsu Association of Andhra Pradesh." },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error, refetch } = useQuery(eventQuery(id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/events" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={() => refetch()} />
      ) : !data ? (
        <Empty>This event could not be found.</Empty>
      ) : (
        <article className="mt-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
            <CalendarDays className="h-4 w-4" /> {formatDate(data.event_date)}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-primary md:text-3xl">{data.title}</h1>
          <div className="mt-3 h-1 w-14 bg-saffron" />
          {data.image_url && <img src={data.image_url} alt={data.title} className="mt-6 w-full rounded-md border object-cover" />}
          <p className="mt-6 whitespace-pre-line leading-relaxed">{data.description}</p>
        </article>
      )}
    </div>
  );
}
