/* ==========================================================================
   Animações do site — scroll-reveal, stagger, count-up e parallax do hero.
   Vanilla JS (IntersectionObserver + MutationObserver). Respeita
   prefers-reduced-motion e degrada com segurança sem JS (nada fica oculto).
   ========================================================================== */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Marca que o JS de animação está ativo (o CSS só esconde .reveal com esta classe).
  root.classList.add('js-anim');
  if (reduce) { root.classList.add('anim-reduced'); return; }

  /* ---------- Scroll reveal ---------- */
  // Seletores estáticos que ganham reveal automaticamente.
  var REVEAL_SELECTORS = [
    '.section-title', '.section-subtitle',
    '.selo', '.destaque-chip', '.mercosul__flag', '.indicador',
    '.frota-home__gallery figure',
    '.destino-card', '.page-links__card', '.proof__item', '.segment__card',
    '.service-card', '.blog-card', '.fleet-card', '.testimonial-card',
    '.historia__content', '.historia__aside', '.encomendas__content', '.encomendas__visual',
    '.selos__grid', '.mercosul__note', '.cta-final h2', '.cta-final p'
  ].join(',');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  function prepare(el) {
    if (el.dataset.revealReady) return;
    el.dataset.revealReady = '1';
    el.classList.add('reveal');
    // Stagger: atraso conforme a posição entre os irmãos que também revelam.
    var parent = el.parentElement;
    if (parent) {
      var sibs = Array.prototype.filter.call(parent.children, function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      var idx = sibs.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx, 8) * 65 + 'ms';
    }
    io.observe(el);
  }

  function scan(ctx) {
    (ctx || document).querySelectorAll(REVEAL_SELECTORS).forEach(prepare);
  }

  scan(document);

  // Conteúdo dinâmico (cards vindos do Supabase) — observa novos nós.
  var mo = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      m.addedNodes && m.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches && node.matches(REVEAL_SELECTORS)) prepare(node);
        if (node.querySelectorAll) scan(node);
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Fallback confiável (independe do IO pintar): revela o que está no viewport.
  function revealInView() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add('is-in');
        io.unobserve(el);
      }
    });
  }
  var rafPending = false;
  window.addEventListener('scroll', function () {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () { revealInView(); rafPending = false; });
  }, { passive: true });
  window.addEventListener('load', revealInView);
  revealInView();

  /* ---------- Count-up nos indicadores ---------- */
  function animateCount(el) {
    var raw = el.textContent.trim();
    // Captura: prefixo (+, ~) | número (com . de milhar) | sufixo ( mil, anos…)
    var match = raw.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!match) return; // sem número (ex.: 🌎) — mantém como está
    var prefix = match[1], suffix = match[3];
    var target = parseInt(match[2].replace(/\./g, ''), 10);
    if (isNaN(target) || target === 0) return;
    var dur = 1100, start = null;
    function fmt(n) { return n.toLocaleString('pt-BR'); }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.indicador__num, .stat__number').forEach(function (el) {
    countIO.observe(el);
  });

  /* ---------- Parallax suave do hero ---------- */
  var heroImg = document.getElementById('heroBgImg');
  if (heroImg) {
    heroImg.style.willChange = 'transform';
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight) {
          heroImg.style.transform = 'translate3d(0,' + (y * 0.15) + 'px,0) scale(1.06)';
        }
        ticking = false;
      });
    }, { passive: true });
  }
})();
