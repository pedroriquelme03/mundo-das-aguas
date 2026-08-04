insert into public.paginas_legais (tipo, titulo, slug, atualizacao, conteudo, ativo, ordem) values (
  'privacidade',
  convert_from(decode('UG9sw610aWNhIGRlIFByaXZhY2lkYWRlIGUgQ29va2llcw==', 'base64'), 'UTF8'),
  'politica-privacidade',
  convert_from(decode('TWFpbyBkZSAyMDI2', 'base64'), 'UTF8'),
  '',
  true, 1
) on conflict (slug) do nothing;