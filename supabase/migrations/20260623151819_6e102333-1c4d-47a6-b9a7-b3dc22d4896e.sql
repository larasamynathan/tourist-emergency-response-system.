
-- Expand role enum to include tourist and responder
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tourist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'responder';
