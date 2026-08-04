import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  'index.html',
  'pages/frota.html',
  'pages/excursao.html',
  'pages/servicos.html',
  'pages/contato.html',
  'pages/blog.html',
  'pages/blog-artigo.html',
  'pages/quem-somos.html',
  'pages/reservas.html',
  'pages/venda-veiculos.html',
  'pages/links.html'
];

const cfg = `    window.MDA_SUPABASE = {
      url: 'https://yzfvqsftphsoylzpfrug.supabase.co',
      anonKey: 'sb_publishable_Lz0LkyFfYkaIwJg4QsEtEg_JLIQYrMf',
      bucket: 'excursoes'
    };`;

for (const f of files) {
  let html = readFileSync(f, 'utf8');
  if (html.includes('site-contact.js')) {
    console.log('skip', f);
  } else {
    const isRoot = f === 'index.html';
    const script = isRoot
      ? '<script type="module" src="js/site-contact.js"></script>'
      : '<script type="module" src="../js/site-contact.js"></script>';

    if (html.includes('MDA_SUPABASE')) {
      html = html.replace(
        /(window\.MDA_SUPABASE = \{[\s\S]*?\};\s*<\/script>)/,
        `$1\n  ${script}`
      );
    } else if (/src="\.\.\/js\/main\.js"/.test(html)) {
      html = html.replace(
        /(<script[^>]*src="\.\.\/js\/main\.js"[^>]*><\/script>)/,
        `<script>\n${cfg}\n  </script>\n  ${script}\n  $1`
      );
    } else if (/src="js\/main\.js"/.test(html)) {
      html = html.replace(
        /(<script[^>]*src="js\/main\.js"[^>]*><\/script>)/,
        `<script>\n${cfg}\n  </script>\n  ${script}\n  $1`
      );
    } else {
      html = html.replace(
        '</body>',
        `  <script>\n${cfg}\n  </script>\n  ${script}\n</body>`
      );
    }
  }

  html = html
    .replace(
      /<div class="footer__contact">\s*<h4>Contato<\/h4>/,
      '<div class="footer__contact" data-mda-block="phones">\n          <h4>Contato</h4>'
    )
    .replace(
      /<div class="footer__contact">\s*<h4>Endereço<\/h4>/,
      '<div class="footer__contact" data-mda-block="address">\n          <h4>Endereço</h4>'
    );

  writeFileSync(f, html);
  console.log('ok', f, html.includes('site-contact.js'));
}
