import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { activeNoticesQuery } from "@/lib/queries";

export function NoticeTicker() {
  const qc = useQueryClient();
  const { data } = useQuery(activeNoticesQuery);

  useEffect(() => {
    const channel = supabase
      .channel(`notices-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => {
        qc.invalidateQueries({ queryKey: ["notices"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  if (!data || data.length === 0) return null;
  const items = [...data, ...data];
  const duration = Math.max(20, data.reduce((n, d) => n + d.message.length, 0) / 4);

  return (
    <div className="sticky top-0 z-50 flex h-9 items-center overflow-hidden bg-primary-deep text-sm text-primary-foreground">
      <div className="z-10 flex h-full shrink-0 items-center gap-1.5 bg-saffron px-3 font-semibold text-saffron-foreground">
        <Megaphone className="h-4 w-4" /> <span className="hidden sm:inline">Notice</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-marquee flex w-max whitespace-nowrap" style={{ ["--marquee-duration" as string]: `${duration}s` }}>
          {items.map((n, i) => (
            <span key={`${n.id}-${i}`} className="px-8">
              <span className="mr-3 text-saffron">◆</span>
              {n.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
