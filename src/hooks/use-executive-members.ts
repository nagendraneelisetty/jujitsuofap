import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { executiveMembersQuery } from "@/lib/queries";

export function useExecutiveMembers() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel(`executive-members-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "executive_members" }, () => {
        void qc.invalidateQueries({ queryKey: ["executive-members"] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);
  return useQuery(executiveMembersQuery);
}