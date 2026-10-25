import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { eventsQuery } from "@/lib/queries";
import { EventCard } from "@/components/site/EventCard";
import { Empty, ErrorState, Loading, PageTitle } from "@/components/site/States";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Event Updates — Ju Jitsu Association of Andhra Pradesh" },
      { name: "description", content: "Championships, camps and seminars organised by the Ju Jitsu Association of Andhra Pradesh." },
      { property: "og:title", content: "Event Updates — Ju Jitsu AP" },
      { property: "og:description", content: "Championships, camps and seminars across Andhra Pradesh." },
    ],
  }),
  component: Events,
});

function Events() {
  const { data, isLoading, error, refetch } = useQuery(eventsQuery());
  return (
    <>
      <PageTitle title="Event Updates" subtitle="Championships, camps and announcements" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} retry={() => refetch()} />
        ) : data?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        ) : (
          <Empty>No events published yet.</Empty>
        )}
      </div>
    </>
  );
}
