import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { contactQuery } from "@/lib/queries";
import { AdminHeader, Field, errMsg } from "@/components/admin/AdminUI";
import { ErrorState, Loading } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/contact")({ component: AdminContact });

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

function AdminContact() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(contactQuery);
  const [address, setAddress] = useState("");
  const [emails, setEmails] = useState("");
  const [phones, setPhones] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setAddress(data.address);
      setEmails(data.emails.join("\n"));
      setPhones(data.phones.join("\n"));
    }
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const em = lines(emails);
    if (em.some((x) => !/^\S+@\S+\.\S+$/.test(x))) { toast.error("Please check the email addresses"); return; }
    setSaving(true);
    const { error } = await supabase.from("contact_info").upsert({ id: 1, address: address.trim(), emails: em, phones: lines(phones) });
    setSaving(false);
    if (error) { toast.error(errMsg(error)); return; }
    toast.success("Contact details saved");
    qc.invalidateQueries({ queryKey: ["contact"] });
  }

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => refetch()} />;

  return (
    <>
      <AdminHeader title="Contact Details" />
      <form onSubmit={save} className="max-w-2xl space-y-4 rounded-md border bg-card p-5 shadow-card">
        <Field label="Office address" htmlFor="a"><Textarea id="a" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} /></Field>
        <Field label="Email IDs (one per line)" htmlFor="e"><Textarea id="e" rows={3} value={emails} onChange={(e) => setEmails(e.target.value)} /></Field>
        <Field label="Phone numbers (one per line)" htmlFor="p"><Textarea id="p" rows={3} value={phones} onChange={(e) => setPhones(e.target.value)} /></Field>
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save changes</Button>
      </form>
    </>
  );
}
