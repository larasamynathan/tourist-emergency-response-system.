
DROP POLICY "Public can register tourist" ON public.tourists;
CREATE POLICY "Public can register tourist" ON public.tourists FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(full_name)) > 1
  AND length(trim(passport_number)) > 2
  AND length(trim(phone)) > 4
  AND length(trim(emergency_contact_name)) > 1
  AND length(trim(emergency_contact_phone)) > 4
  AND length(trim(nationality)) > 1
  AND check_in_date >= CURRENT_DATE - INTERVAL '1 day'
  AND check_out_date >= check_in_date
);
