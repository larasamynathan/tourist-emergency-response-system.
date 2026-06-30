
-- Storage policies: any authenticated user can upload/read their own files; staff can read all
CREATE POLICY "auth upload incident photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "auth read incident photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'incident-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'responder')));

CREATE POLICY "auth upload tourist photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tourist-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "auth read tourist photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tourist-photos' AND ((storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'responder')));
CREATE POLICY "auth update own tourist photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tourist-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
