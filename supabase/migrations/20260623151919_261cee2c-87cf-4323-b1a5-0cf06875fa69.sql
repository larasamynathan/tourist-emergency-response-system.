
-- ============ TOURISTS: link to auth user + GPS + photo ============
ALTER TABLE public.tourists
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS photo_url text;

CREATE INDEX IF NOT EXISTS idx_tourists_user_id ON public.tourists(user_id);

-- ============ INCIDENTS: photo, GPS, assignment, resolution ============
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS response_notes text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);

-- ============ SOS ALERTS ============
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id uuid REFERENCES public.tourists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  latitude double precision,
  longitude double precision,
  message text,
  status text NOT NULL DEFAULT 'active', -- active | acknowledged | resolved
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tourist insert own sos" ON public.sos_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "tourist read own sos" ON public.sos_alerts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'responder'));
CREATE POLICY "staff update sos" ON public.sos_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'responder'));
CREATE POLICY "admin delete sos" ON public.sos_alerts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_sos_updated BEFORE UPDATE ON public.sos_alerts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ EMERGENCY CONTACTS (per user) ============
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own contacts all" ON public.emergency_contacts FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());

-- ============ FEEDBACK (5-star) ============
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert own feedback" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "read feedback" ON public.feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifs" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "update own notifs" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "staff insert notifs" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'responder') OR user_id = auth.uid());

-- ============ CHAT MESSAGES (AI) ============
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'user' | 'assistant'
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat" ON public.chat_messages FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============ ENABLE REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ Update tourists RLS so tourists can manage their own row ============
-- Drop existing public-insert policy (recreated below) and add owner policies
DO $$ BEGIN
  CREATE POLICY "tourist read own row" ON public.tourists FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'responder'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "tourist update own row" ON public.tourists FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "auth insert own tourist" ON public.tourists FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow tourists to read their own incidents
DO $$ BEGIN
  CREATE POLICY "tourist read own incidents" ON public.incidents FOR SELECT TO authenticated
    USING (
      reported_by = auth.uid()
      OR tourist_id IN (SELECT id FROM public.tourists WHERE user_id = auth.uid())
      OR assigned_to = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'officer')
      OR public.has_role(auth.uid(),'responder')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "tourist insert incidents" ON public.incidents FOR INSERT TO authenticated
    WITH CHECK (reported_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Updated handle_new_user: respect signup_role metadata ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_count INT;
  desired_role public.app_role;
  meta_role text;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  meta_role := NEW.raw_user_meta_data->>'signup_role';

  IF user_count = 0 THEN
    desired_role := 'admin';
  ELSIF meta_role IN ('tourist','officer','responder','admin') THEN
    desired_role := meta_role::public.app_role;
  ELSE
    desired_role := 'tourist';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, desired_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Get current user's roles (helper) ============
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = auth.uid() $$;
