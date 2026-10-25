import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useExecutiveMembers } from "@/hooks/use-executive-members";
import { pathFromUrl, removeMedia, uploadMedia } from "@/lib/media";
import { AdminHeader, ConfirmDelete, Field, errMsg } from "@/components/admin/AdminUI";
import { Empty, ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/executive-committee")({
  head: () => ({ meta: [
    { title: "Manage Executive Committee — Ju Jitsu AP" },
    { name: "description", content: "Manage the association's executive members and display order." },
    { property: "og:title", content: "Manage Executive Committee — Ju Jitsu AP" },
    { property: "og:description", content: "Executive Committee administration." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminExecutiveCommittee,
});

type Member = Tables<"executive_members">;
const blank = { name: "", role: "", sort_order: 0 };

function AdminExecutiveCommittee() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useExecutiveMembers();
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["executive-members"] });

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function edit(member: Member | null) {
    setEditing(member);
    setForm(member ? { name: member.name, role: member.role, sort_order: member.sort_order } : { ...blank, sort_order: data?.length ? Math.max(...data.map((m) => m.sort_order)) + 1 : 0 });
    setFile(null);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) { toast.error("Name and role are required"); return; }
    if (!file && !editing?.image_url) { toast.error("Please upload a profile image"); return; }
    if (!Number.isSafeInteger(form.sort_order)) { toast.error("Display order must be a whole number"); return; }
    setSaving(true);
    let uploaded: { path: string; url: string } | null = null;
    try {
      if (file) uploaded = await uploadMedia(file, "executive");
      const image_url = uploaded?.url ?? editing?.image_url;
      if (!image_url) throw new Error("Please upload a profile image");
      const payload = { name: form.name.trim(), role: form.role.trim(), sort_order: form.sort_order, image_url, storage_path: uploaded?.path ?? editing?.storage_path ?? null };
      const result = editing ? await supabase.from("executive_members").update(payload).eq("id", editing.id) : await supabase.from("executive_members").insert(payload);
      if (result.error) throw result.error;
      if (uploaded && editing) await removeMedia(editing.storage_path ?? pathFromUrl(editing.image_url));
      toast.success("Member saved");
      setOpen(false);
      setFile(null);
      await refresh();
    } catch (e) {
      if (uploaded) await removeMedia(uploaded.path);
      toast.error(errMsg(e));
    } finally { setSaving(false); }
  }

  async function del(member: Member) {
    const { error } = await supabase.from("executive_members").delete().eq("id", member.id);
    if (error) { toast.error(errMsg(error)); return; }
    await removeMedia(member.storage_path ?? pathFromUrl(member.image_url));
    toast.success("Member deleted");
    await refresh();
  }

  return <>
    <AdminHeader title="Executive Committee" action={<Button onClick={() => edit(null)}><Plus /> Add member</Button>} />
    {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : !data?.length ? <Empty>No executive members yet.</Empty> : (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((member) => <article key={member.id} className="min-w-0 rounded-md border bg-card p-4 text-center shadow-card">
          <img src={member.image_url} alt={member.name} className="mx-auto h-24 w-24 rounded-full object-cover" />
          <h2 className="mt-3 break-words font-bold text-primary">{member.name}</h2>
          <p className="break-words text-sm text-muted-foreground">{member.role}</p>
          <p className="mt-1 text-xs text-muted-foreground">Display order: {member.sort_order}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => edit(member)}><Pencil /> Edit</Button>
            <ConfirmDelete onConfirm={() => del(member)}><Button size="sm" variant="outline"><Trash2 className="text-destructive" /> Delete</Button></ConfirmDelete>
          </div>
        </article>)}
      </div>
    )}
    <Dialog open={open} onOpenChange={(value) => { if (!saving) { setOpen(value); if (!value) setFile(null); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit member" : "Add member"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <Field label="Profile image">
            {(preview || editing?.image_url) && <img src={preview ?? editing?.image_url} alt="Profile preview" className="mb-2 h-24 w-24 rounded-full object-cover" />}
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => input.current?.click()}><ImagePlus /> {editing || file ? "Change image" : "Upload image"}</Button>
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </Field>
          <Field label="Name" htmlFor="member-name"><Input id="member-name" required maxLength={100} value={form.name} disabled={saving} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Role" htmlFor="member-role"><Input id="member-role" required maxLength={100} value={form.role} disabled={saving} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Display order" htmlFor="member-order"><Input id="member-order" type="number" step={1} required value={form.sort_order} disabled={saving} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field>
          <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}