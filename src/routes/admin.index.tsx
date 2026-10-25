import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { eventsQuery, formatDate } from "@/lib/queries";
import { pathFromUrl, removeMedia } from "@/lib/media";
import { AdminHeader, ConfirmDelete, Field, ImageUpload, errMsg } from "@/components/admin/AdminUI";
import { Empty, ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/")({ component: AdminEvents });

type Ev = Tables<"events">;
const blank = { title: "", event_date: new Date().toISOString().slice(0, 10), description: "", image_url: null as string | null };

function AdminEvents() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(eventsQuery());
  const [editing, setEditing] = useState<Ev | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const refresh = () => qc.invalidateQueries({ predicate: (q) => ["events", "event"].includes(q.queryKey[0] as string) });

  function openNew() {
    setEditing(null);
    setForm(blank);
    setOpen(true);
  }
  function openEdit(e: Ev) {
    setEditing(e);
    setForm({ title: e.title, event_date: e.event_date, description: e.description, image_url: e.image_url });
    setOpen(true);
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    const payload = { ...form, title: form.title.trim() };
    const res = editing ? await supabase.from("events").update(payload).eq("id", editing.id) : await supabase.from("events").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(errMsg(res.error));
    if (editing && editing.image_url && editing.image_url !== form.image_url) removeMedia(pathFromUrl(editing.image_url));
    toast.success(editing ? "Event updated" : "Event added");
    setOpen(false);
    refresh();
  }

  async function del(e: Ev) {
    const { error } = await supabase.from("events").delete().eq("id", e.id);
    if (error) return toast.error(errMsg(error));
    removeMedia(pathFromUrl(e.image_url));
    toast.success("Event deleted");
    refresh();
  }

  return (
    <>
      <AdminHeader title="Event Updates" action={<Button onClick={openNew}><Plus /> Add event</Button>} />
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : !data?.length ? <Empty>No events yet.</Empty> : (
        <div className="space-y-3">
          {data.map((e) => (
            <div key={e.id} className="flex gap-3 rounded-md border bg-card p-3 shadow-card">
              {e.image_url ? <img src={e.image_url} alt="" className="h-16 w-20 shrink-0 rounded object-cover" /> : <div className="h-16 w-20 shrink-0 rounded bg-secondary" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{formatDate(e.event_date)}</p>
                <p className="truncate font-semibold">{e.title}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{e.description}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <Button size="icon" variant="outline" onClick={() => openEdit(e)} aria-label="Edit"><Pencil /></Button>
                <ConfirmDelete onConfirm={() => del(e)}><Button size="icon" variant="outline" aria-label="Delete"><Trash2 className="text-destructive" /></Button></ConfirmDelete>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit event" : "Add event"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <Field label="Title" htmlFor="t"><Input id="t" value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Date" htmlFor="d"><Input id="d" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></Field>
            <Field label="Description" htmlFor="ds"><Textarea id="ds" rows={6} value={form.description} maxLength={5000} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label="Image"><ImageUpload value={form.image_url} folder="events" onChange={(url) => setForm({ ...form, image_url: url })} /></Field>
            <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
