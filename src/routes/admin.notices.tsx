import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allNoticesQuery } from "@/lib/queries";
import { AdminHeader, ConfirmDelete, errMsg } from "@/components/admin/AdminUI";
import { Empty, ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/notices")({
  head: () => ({ meta: [
    { title: "Manage Notices — Ju Jitsu AP" },
    { name: "description", content: "Manage association notices." },
    { property: "og:title", content: "Manage Notices — Ju Jitsu AP" },
    { property: "og:description", content: "Manage association notices." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminNotices,
});

function AdminNotices() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(allNoticesQuery);
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["notices"] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    const { error } = await supabase.from("notices").insert({ message: msg.trim().slice(0, 500) });
    if (error) { toast.error(errMsg(error)); return; }
    setMsg("");
    toast.success("Notice added");
    refresh();
  }
  async function update(id: string, patch: { message?: string; is_active?: boolean }) {
    const { error } = await supabase.from("notices").update(patch).eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    refresh();
  }
  async function del(id: string) {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Notice deleted");
    refresh();
  }

  return (
    <>
      <AdminHeader title="Notices" />
      <form onSubmit={add} className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a new notice…" maxLength={500} className="bg-card" />
        <Button type="submit"><Plus /> Add notice</Button>
      </form>
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : !data?.length ? <Empty>No notices yet.</Empty> : (
        <div className="space-y-2">
          {data.map((n) => (
            <div key={n.id} className="flex flex-col gap-3 rounded-md border bg-card p-3 shadow-card sm:flex-row sm:items-center">
              {editId === n.id ? (
                <div className="flex flex-1 gap-2">
                  <Input value={editMsg} onChange={(e) => setEditMsg(e.target.value)} maxLength={500} />
                  <Button size="icon" onClick={() => { update(n.id, { message: editMsg.trim() }); setEditId(null); }} aria-label="Save"><Check /></Button>
                  <Button size="icon" variant="outline" onClick={() => setEditId(null)} aria-label="Cancel"><X /></Button>
                </div>
              ) : (
                <p className="flex-1 text-sm">{n.message}</p>
              )}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <Switch checked={n.is_active} onCheckedChange={(v) => update(n.id, { is_active: v })} />
                  {n.is_active ? "Active" : "Inactive"}
                </label>
                <Button size="icon" variant="outline" onClick={() => { setEditId(n.id); setEditMsg(n.message); }} aria-label="Edit"><Pencil /></Button>
                <ConfirmDelete onConfirm={() => del(n.id)}><Button size="icon" variant="outline" aria-label="Delete"><Trash2 className="text-destructive" /></Button></ConfirmDelete>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
