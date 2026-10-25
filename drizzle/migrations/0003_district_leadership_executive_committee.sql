ALTER TABLE public.districts ADD COLUMN president_name text NOT NULL DEFAULT '', ADD COLUMN secretary_name text NOT NULL DEFAULT '';
CREATE TABLE public.executive_members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 role text NOT NULL,
 image_url text NOT NULL,
 storage_path text,
 sort_order integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.executive_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.executive_members TO authenticated;
GRANT ALL ON public.executive_members TO service_role;
ALTER TABLE public.executive_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.executive_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin insert" ON public.executive_members FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update" ON public.executive_members FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete" ON public.executive_members FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch BEFORE UPDATE ON public.executive_members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE public.executive_members;