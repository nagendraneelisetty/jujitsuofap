import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function run<T>(p: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

export const eventsQuery = (limit?: number) =>
  queryOptions({
    queryKey: ["events", limit ?? "all"],
    queryFn: () => {
      let q = supabase.from("events").select("*").order("event_date", { ascending: false }).order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      return run(q);
    },
  });

export const eventQuery = (id: string) =>
  queryOptions({
    queryKey: ["event", id],
    queryFn: () => run(supabase.from("events").select("*").eq("id", id).maybeSingle()),
  });

export const activeNoticesQuery = queryOptions({
  queryKey: ["notices", "active"],
  queryFn: () => run(supabase.from("notices").select("*").eq("is_active", true).order("created_at", { ascending: false })),
});

export const allNoticesQuery = queryOptions({
  queryKey: ["notices", "all"],
  queryFn: () => run(supabase.from("notices").select("*").order("created_at", { ascending: false })),
});

export const contactQuery = queryOptions({
  queryKey: ["contact"],
  queryFn: () => run(supabase.from("contact_info").select("*").eq("id", 1).maybeSingle()),
});

export const aboutQuery = queryOptions({
  queryKey: ["about"],
  queryFn: () => run(supabase.from("about_content").select("*").eq("id", 1).maybeSingle()),
});

export const bearersQuery = queryOptions({
  queryKey: ["bearers"],
  queryFn: () => run(supabase.from("office_bearers").select("*").order("sort_order")),
});

export const galleryQuery = queryOptions({
  queryKey: ["gallery"],
  queryFn: () => run(supabase.from("gallery_images").select("*").order("created_at", { ascending: false })),
});

export const districtsQuery = queryOptions({
  queryKey: ["districts"],
  queryFn: () => run(supabase.from("districts").select("*").order("district_name")),
});

export const enquiriesQuery = queryOptions({
  queryKey: ["enquiries"],
  queryFn: () => run(supabase.from("enquiries").select("*").order("created_at", { ascending: false })),
});

export function formatDate(d: string) {
  return new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
