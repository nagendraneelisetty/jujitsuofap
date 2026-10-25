import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aboutQuery, bearersQuery, galleryQuery } from "@/lib/queries";
import { removeMedia, uploadMedia } from "@/lib/media";
import { AdminHeader, ConfirmDelete, Field, errMsg } from "@/components/admin/AdminUI";
import { Empty, ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/about")({ component: AdminAbout });

function AdminAbout() {
  return (
    <>
      <AdminHeader title="About Page" />
      <div className="space-y-6">
        <TextSection />
        <BearersSection />
        <GallerySection />
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border bg-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-bold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function TextSection() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(aboutQuery);
  const [history, setHistory] = useState("");
  const [mission, setMission] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) { setHistory(data.history); setMission(data.mission); }
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("about_content").upsert({ id: 1, history, mission });
    setSaving(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("About text saved");
    qc.invalidateQueries({ queryKey: ["about"] });
  }

  return (
    <Card title="History & Mission">
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : (
        <form onSubmit={save} className="space-y-4">
          <Field label="History" htmlFor="h"><Textarea id="h" rows={6} value={history} onChange={(e) => setHistory(e.target.value)} maxLength={10000} /></Field>
          <Field label="Mission" htmlFor="m"><Textarea id="m" rows={4} value={mission} onChange={(e) => setMission(e.target.value)} maxLength={5000} /></Field>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save text</Button>
        </form>
      )}
    </Card>
  );
}

function BearersSection() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(bearersQuery);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["bearers"] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !designation.trim()) { toast.error("Name and designation are required"); return; }
    const sort_order = (data?.length ?? 0) + 1;
    const { error } = await supabase.from("office_bearers").insert({ name: name.trim(), designation: designation.trim(), sort_order });
    if (error) { toast.error(errMsg(error)); return; }
    setName(""); setDesignation("");
    refresh();
  }
  async function update(id: string, patch: { name?: string; designation?: string; sort_order?: number }) {
    const { error } = await supabase.from("office_bearers").update(patch).eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    refresh();
  }
  async function del(id: string) {
    const { error } = await supabase.from("office_bearers").delete().eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    refresh();
  }

  return (
    <Card title="Office Bearers">
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : (
        <div className="space-y-2">
          {data?.map((b) => (
            <div key={b.id} className="grid grid-cols-[4rem_1fr_auto] gap-2 sm:grid-cols-[4rem_1fr_1fr_auto]">
              <Input type="number" defaultValue={b.sort_order} aria-label="Order" onBlur={(e) => Number(e.target.value) !== b.sort_order && update(b.id, { sort_order: Number(e.target.value) })} />
              <Input defaultValue={b.name} aria-label="Name" onBlur={(e) => e.target.value.trim() !== b.name && update(b.id, { name: e.target.value.trim() })} />
              <Input defaultValue={b.designation} aria-label="Designation" className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto" onBlur={(e) => e.target.value.trim() !== b.designation && update(b.id, { designation: e.target.value.trim() })} />
              <ConfirmDelete onConfirm={() => del(b.id)}><Button size="icon" variant="outline" aria-label="Delete" className="col-start-3 row-start-1 sm:col-start-auto"><Trash2 className="text-destructive" /></Button></ConfirmDelete>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Changes save automatically when you leave a box.</p>
          <form onSubmit={add} className="flex flex-col gap-2 border-t pt-3 sm:flex-row">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            <Input placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} maxLength={100} />
            <Button type="submit"><Plus /> Add</Button>
          </form>
        </div>
      )}
    </Card>
  );
}

function GallerySection() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(galleryQuery);
  const ref = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["gallery"] });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const { url, path } = await uploadMedia(f, "gallery");
        const { error } = await supabase.from("gallery_images").insert({ image_url: url, storage_path: path, caption: caption.trim() });
        if (error) throw error;
      }
      setCaption("");
      toast.success("Photos uploaded");
      refresh();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  async function del(id: string, path: string | null) {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) { toast.error(errMsg(error)); return; }
    removeMedia(path);
    refresh();
  }

  return (
    <Card title="Image Gallery">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} />
        <Button onClick={() => ref.current?.click()} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Upload photos</Button>
        <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>
      {isLoading ? <Loading /> : error ? <ErrorState error={error} retry={() => refetch()} /> : !data?.length ? <Empty>No photos yet.</Empty> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.map((g) => (
            <div key={g.id} className="relative overflow-hidden rounded-md border">
              <img src={g.image_url} alt={g.caption} className="aspect-square w-full object-cover" loading="lazy" />
              {g.caption && <p className="truncate px-2 py-1 text-xs">{g.caption}</p>}
              <ConfirmDelete onConfirm={() => del(g.id, g.storage_path)}>
                <Button size="icon" variant="destructive" className="absolute right-1.5 top-1.5 h-8 w-8" aria-label="Delete photo"><Trash2 /></Button>
              </ConfirmDelete>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
