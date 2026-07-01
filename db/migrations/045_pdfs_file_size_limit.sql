-- =====================================================================
-- Micro Guias — Migração 045: limite de tamanho e mime do bucket de PDFs
--   Sobe o limite do bucket 'pdfs' para 50 MB e restringe a PDFs.
--
-- ATENÇÃO: o limite EFETIVO é o menor entre este valor e o limite GLOBAL
-- do projeto (Dashboard → Storage → Settings → Upload file size limit).
-- No plano Free o máximo global é 50 MB. Para arquivos maiores, é preciso
-- o plano Pro e elevar o limite global no painel.
-- =====================================================================

update storage.buckets
set
  file_size_limit = 52428800,            -- 50 MB em bytes
  allowed_mime_types = array['application/pdf']
where id = 'pdfs';
