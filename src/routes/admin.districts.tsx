import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { districtsQuery } from "@/lib/queries";
import { AdminHeader, ConfirmDelete, Field, errMsg } from "@/components/admin/AdminUI";
import { Empty, ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/districts")({
  head: () => ({ meta: [
    { title: "Manage District Members — Ju Jitsu AP" },
    { name: "description", content: "Manage district contacts and leadership." },
    { property: "og:title", content: "Manage District Members — Ju Jitsu AP" },
    { property: "og:description", content: "Manage district contacts and leadership." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminDistricts,
});

type D = Tables<"districts">;
const blank = { district_name: "", coordinator_name: "", president_name: "", secretary_name: "", phone: "", email: "" };

function AdminDistricts() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(districtsQuery);
  const [editing, setEditing] = useState<D | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["districts"] });

  function edit(d: D | null) {
    setEditing(d);
    setForm(d ? { district_name: d.district_name, coordinator_name: d.coordinator_name, president_name: d.president_name, secretary_name: d.secretary_name, phone: d.phone, email: d.email } : blank);
    setOpen(true);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.district_name.trim() || !form.coordinator_name.trim()) { toast.error("District and coordinator are required"); return; }
    setSaving(true);
    const p = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])) as typeof form;
    const res = editing ? await supabase.from("districts").update(p).eq("id", editing.id) : await supabase.from("districts").insert(p);
    setSaving(false);
    if (res.error) { toast.error(errMsg(res.error)); return; }
    toast.success("Saved");
    setOpen(false);
    refresh();
  }
  async function del(id: string) {
    const { error } = await supabase.from("districts").delete().eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Deleted");
    refresh();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <AdminHeader title="District Members" action={<Button onClick={() => edit(null)}><Plus /> Add district</Button>} />
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : !data?.length ? <Empty>No districts yet.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((d) => (
            <div key={d.id} className="rounded-md border bg-card p-4 shadow-card">
              <p className="font-bold text-primary">{d.district_name}</p>
              <p className="text-sm">{d.coordinator_name}</p>
              <p className="text-sm">President: {d.president_name || "—"}</p>
              <p className="text-sm">Secretary: {d.secretary_name || "—"}</p>
              <p className="text-sm text-muted-foreground">{d.phone || "—"} · <span className="break-all">{d.email || "—"}</span></p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(d)}><Pencil /> Edit</Button>
                <ConfirmDelete onConfirm={() => del(d.id)}><Button size="sm" variant="outline"><Trash2 className="text-destructive" /> Delete</Button></ConfirmDelete>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit district" : "Add district"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <Field label="District name" htmlFor="dn"><Input id="dn" value={form.district_name} onChange={set("district_name")} maxLength={100} /></Field>
            <Field label="Coordinator name" htmlFor="cn"><Input id="cn" value={form.coordinator_name} onChange={set("coordinator_name")} maxLength={100} /></Field>
            <Field label="President name" htmlFor="pn"><Input id="pn" value={form.president_name} onChange={set("president_name")} maxLength={100} /></Field>
            <Field label="Secretary name" htmlFor="sn"><Input id="sn" value={form.secretary_name} onChange={set("secretary_name")} maxLength={100} /></Field>
            <Field label="Phone" htmlFor="ph"><Input id="ph" type="tel" value={form.phone} onChange={set("phone")} maxLength={20} /></Field>
            <Field label="Email" htmlFor="em"><Input id="em" type="email" value={form.email} onChange={set("email")} maxLength={255} /></Field>
            <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
