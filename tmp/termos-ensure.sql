insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values (
  'termos',
  convert_from(decode('VGVybW9zIGRlIFVzbyBlIENvbmRpw6fDtWVzIEdlcmFpcyBkZSBWaWFnZW0=', 'base64'), 'UTF8'),
  'termos-uso',
  convert_from(decode('TWFpbyBkZSAyMDI2', 'base64'), 'UTF8'),
  '',
  true, 2
) on conflict (slug) do update set titulo = excluded.titulo, atualizacao = excluded.atualizacao, updated_at = now();