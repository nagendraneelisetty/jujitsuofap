import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import emblem from "@/assets/emblem.png";
import { formatDate } from "@/lib/queries";
import type { Tables } from "@/integrations/supabase/types";

export function EventCard({ event }: { event: Tables<"events"> }) {
  return (
    <Link
      to="/events/$id"
      params={{ id: event.id }}
      className="group flex flex-col overflow-hidden rounded-md border bg-card shadow-card transition hover:border-primary/40"
    >
      <div className="aspect-[16/9] overflow-hidden bg-secondary">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <img src={emblem} alt="" className="h-20 w-20 opacity-40" loading="lazy" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-accent-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(event.event_date)}
        </p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug text-primary group-hover:underline">{event.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
        <span className="mt-auto pt-3 text-sm font-semibold text-primary">Read more →</span>
      </div>
    </Link>
  );
}
