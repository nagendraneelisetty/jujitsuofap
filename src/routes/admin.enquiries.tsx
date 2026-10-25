import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enquiriesQuery } from "@/lib/queries";
import { AdminHeader, ConfirmDelete, errMsg } from "@/components/admin/AdminUI";
import { Empty, ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/enquiries")({ component: AdminEnquiries });

function AdminEnquiries() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(enquiriesQuery);

  async function del(id: string) {
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    if (error) return toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: ["enquiries"] });
  }

  return (
    <>
      <AdminHeader title={`Enquiries${data ? ` (${data.length})` : ""}`} />
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : !data?.length ? <Empty>No enquiries received yet.</Empty> : (
        <div className="space-y-3">
          {data.map((m) => (
            <div key={m.id} className="rounded-md border bg-card p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-IN")}</p>
                </div>
                <ConfirmDelete onConfirm={() => del(m.id)}><Button size="icon" variant="outline" aria-label="Delete"><Trash2 className="text-destructive" /></Button></ConfirmDelete>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a href={`mailto:${m.email}`} className="flex items-center gap-1 break-all text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{m.email}</a>
                {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{m.phone}</a>}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
