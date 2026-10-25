import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { contactQuery } from "@/lib/queries";
import { ErrorState, Loading, PageTitle } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Ju Jitsu Association of Andhra Pradesh" },
      { name: "description", content: "Address, phone numbers, email and enquiry form for the Ju Jitsu Association of Andhra Pradesh." },
      { property: "og:title", content: "Contact the Ju Jitsu Association of Andhra Pradesh" },
      { property: "og:description", content: "Reach the association office or send an enquiry." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(20).regex(/^[0-9+\-\s]*$/, "Digits only").optional(),
  message: z.string().trim().min(1, "Please enter a message").max(2000),
});

function Contact() {
  const { data, isLoading, error, refetch } = useQuery(contactQuery);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setSending(true);
    const { error } = await supabase.from("enquiries").insert({ ...parsed.data, phone: parsed.data.phone || null });
    setSending(false);
    if (error) { toast.error("Could not send your message. Please try again."); return; }
    toast.success("Thank you! Your enquiry has been received.");
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  const field = (k: keyof typeof form) => ({
    id: k,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }),
  });

  return (
    <>
      <PageTitle title="Contact Us" subtitle="We are happy to help with your queries" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-5">
        <div className="md:col-span-2">
          {isLoading ? (
            <Loading />
          ) : error ? (
            <ErrorState error={error} retry={() => refetch()} />
          ) : (
            <div className="space-y-4">
              <Info icon={MapPin} title="Office Address"><p className="whitespace-pre-line">{data?.address || "—"}</p></Info>
              <Info icon={Phone} title="Phone">
                {data?.phones.length ? data.phones.map((p) => <a key={p} href={`tel:${p}`} className="block text-primary hover:underline">{p}</a>) : "—"}
              </Info>
              <Info icon={Mail} title="Email">
                {data?.emails.length ? data.emails.map((m) => <a key={m} href={`mailto:${m}`} className="block break-all text-primary hover:underline">{m}</a>) : "—"}
              </Info>
            </div>
          )}
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-md border bg-card p-5 shadow-card md:col-span-3" noValidate>
          <h2 className="text-xl font-bold text-primary">Send an Enquiry</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Full name *" err={errors.name}><Input {...field("name")} maxLength={100} /></F>
            <F label="Email *" err={errors.email}><Input type="email" {...field("email")} maxLength={255} /></F>
          </div>
          <F label="Phone" err={errors.phone}><Input type="tel" {...field("phone")} maxLength={20} /></F>
          <F label="Message *" err={errors.message}><Textarea rows={5} {...field("message")} maxLength={2000} /></F>
          <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
            {sending && <Loader2 className="animate-spin" />} Submit Enquiry
          </Button>
        </form>
      </div>
    </>
  );
}

function F({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

function Info({ icon: Icon, title, children }: { icon: typeof Mail; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border bg-card p-4 shadow-card">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><Icon className="h-5 w-5 text-primary" /></div>
      <div className="min-w-0 text-sm">
        <p className="mb-1 font-bold text-primary">{title}</p>
        {children}
      </div>
    </div>
  );
}
