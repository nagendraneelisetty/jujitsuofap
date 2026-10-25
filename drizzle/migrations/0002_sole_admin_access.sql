CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _user_id = '1dc7ec09-9688-41cb-a143-c6ae4f31791d'::uuid
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Account creation is disabled for this single-admin website.' USING ERRCODE = '42501';
END;
$$;
CREATE UNIQUE INDEX IF NOT EXISTS sole_admin_role ON public.user_roles (role) WHERE role = 'admin'::public.app_role;
ALTER POLICY "own roles readable" ON public.user_roles TO authenticated USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::public.app_role));