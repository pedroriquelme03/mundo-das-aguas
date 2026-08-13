// Home 3 — animações de entrada + scroll com Motion (motion.dev),
// a biblioteca vanilla da mesma equipe do Framer Motion.
// Degrada com segurança: se o Motion não carregar ou o usuário preferir
// menos movimento, tudo permanece visível (nada fica oculto).

const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js-anim');
if (reduce) document.documentElement.classList.add('anim-reduced');

if (!reduce) {
  (async () => {
    let animate, inView, scroll, stagger;
    try {
      ({ animate, inView, scroll, stagger } = await import('https://esm.sh/motion@11.15.0'));
    } catch (err) {
      console.warn('[home3-motion] Motion não carregou; conteúdo permanece visível.', err);
      return;
    }

    const EASE = [0.22, 0.61, 0.36, 1];

    const hide = (els) => els.forEach((el) => { el.style.opacity = '0'; el.style.willChange = 'transform, opacity'; });
    const $ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

    /* ---------- Entrada do HERO (imediata, escalonada) ---------- */
    const heroBits = [...$('.h3-hero__copy > *'), ...$('.h3-search')];
    if (heroBits.length) {
      hide(heroBits);
      animate(heroBits, { opacity: [0, 1], y: [26, 0] },
        { duration: 0.7, delay: stagger(0.12), ease: EASE });
    }

    /* ---------- Reveal de elemento único ao entrar na viewport ---------- */
    function revealSingle(sel, { x = 0, y = 28 } = {}, amount = 0.25) {
      $(sel).forEach((el) => {
        el.style.opacity = '0';
        inView(el, () => {
          animate(el, { opacity: [0, 1], x: x ? [x, 0] : undefined, y: y ? [y, 0] : undefined },
            { duration: 0.65, ease: EASE });
        }, { amount });
      });
    }

    /* ---------- Reveal de grupo (filhos escalonados) ---------- */
    function revealGroup(containerSel, childSel, { y = 24, each = 0.08 } = {}, amount = 0.2) {
      $(containerSel).forEach((container) => {
        const kids = $(childSel, container);
        if (!kids.length) return;
        hide(kids);
        inView(container, () => {
          animate(kids, { opacity: [0, 1], y: [y, 0] },
            { duration: 0.6, delay: stagger(each), ease: EASE });
        }, { amount });
      });
    }

    /* Faixa de selos */
    revealGroup('.h3-strip__grid', '.h3-strip__item', { y: 18, each: 0.07 });

    /* Cabeçalhos de seção */
    revealSingle('.h3-sec__head', { y: 24 });

    /* Carrosséis (fade + slide do bloco todo — os cards são geridos pelo slider) */
    revealSingle('#excursoesComprasSlider', { y: 34 }, 0.15);
    revealSingle('#pacotesTuristicosSlider', { y: 34 }, 0.15);

    /* Tiles de destinos (stagger em grade) */
    revealGroup('.h3-tiles', '.h3-tile', { y: 26, each: 0.06 });

    /* "Encontre um destino" — localizador (cabeçalho, painel e mapa) */
    $('.h3-locator').forEach((loc) => {
      const head = loc.querySelector('.h3-locator__head');
      const panel = loc.querySelector('.h3-locator__panel');
      const map = loc.querySelector('.h3-locator__map');
      [head, panel, map].forEach((el) => { if (el) el.style.opacity = '0'; });
      inView(loc, () => {
        if (head) animate(head, { opacity: [0, 1], y: [18, 0] }, { duration: 0.5, ease: EASE });
        if (panel) animate(panel, { opacity: [0, 1], x: [-36, 0] }, { duration: 0.7, delay: 0.08, ease: EASE });
        if (map) animate(map, { opacity: [0, 1], x: [36, 0] }, { duration: 0.7, delay: 0.12, ease: EASE });
      }, { amount: 0.2 });
    });

    /* Blocos "quem viaja" e "organizadores" — imagem e texto de lados opostos */
    $('.h3-split').forEach((split) => {
      const media = split.querySelector('.h3-split__media');
      const content = split.querySelector('.h3-split__content');
      const reversed = split.classList.contains('h3-split--reverse');
      if (content) { content.style.opacity = '0'; }
      if (media) { media.style.opacity = '0'; }
      inView(split, () => {
        if (content) animate(content, { opacity: [0, 1], x: [reversed ? 40 : -40, 0] }, { duration: 0.7, ease: EASE });
        if (media) animate(media, { opacity: [0, 1], x: [reversed ? -40 : 40, 0] }, { duration: 0.7, delay: 0.08, ease: EASE });
      }, { amount: 0.25 });
    });

    /* Fretamento / organizadores (banner) — mídia entra da esquerda, painel em stagger */
    $('.h3-banner-fret').forEach((banner) => {
      const media = banner.querySelector('.h3-banner-fret__media');
      const panelKids = [
        ...$('.h3-banner-fret__panel > h2, .h3-banner-fret__panel > p', banner),
        ...$('.h3-banner-fret__list li', banner),
        ...$('.h3-banner-fret__panel > .btn, .h3-banner-fret__panel > a', banner)
      ];
      if (media) media.style.opacity = '0';
      hide(panelKids);
      inView(banner, () => {
        if (media) animate(media, { opacity: [0, 1], x: [-44, 0] }, { duration: 0.75, ease: EASE });
        if (panelKids.length) animate(panelKids, { opacity: [0, 1], y: [22, 0] },
          { duration: 0.55, delay: stagger(0.08, { start: 0.1 }), ease: EASE });
      }, { amount: 0.25 });
    });

    /* Frota em destaque */
    revealSingle('.h3-frota__media', { x: -40, y: 0 }, 0.25);
    revealSingle('.h3-frota__content', { x: 40, y: 0 }, 0.25);
    revealGroup('.h3-frota__list', 'li', { y: 14, each: 0.06 });

    /* Mapa Brasil e Mercosul (se existir) */
    revealSingle('.h3-map__copy', { x: -32, y: 0 }, 0.2);
    revealSingle('.h3-map__stage', { x: 32, y: 0 }, 0.2);

    /* Notícias (conteúdo dinâmico — anima os cards presentes ao entrar em vista) */
    (function () {
      const grid = document.getElementById('h3News');
      if (!grid) return;
      inView(grid, () => {
        const cards = $('.h3-news-card', grid);
        if (!cards.length) return;
        hide(cards);
        animate(cards, { opacity: [0, 1], y: [24, 0] }, { duration: 0.6, delay: stagger(0.09), ease: EASE });
      }, { amount: 0.15 });
    })();

    /* CTA final */
    revealGroup('.h3-cta .container', 'h2, p, .cta-final__btns', { y: 22, each: 0.09 });

    /* ---------- Interações com o scroll ---------- */
    // Parallax suave na imagem de fundo do hero
    const heroBg = document.querySelector('.h3-hero__bg img');
    const hero = document.querySelector('.h3-hero');
    if (heroBg && hero) {
      heroBg.style.willChange = 'transform';
      scroll((p) => { heroBg.style.transform = `translateY(${p * 70}px) scale(1.08)`; },
        { target: hero, offset: ['start start', 'end start'] });
    }

    /* ---------- Menu mobile (hambúrguer): entrada com Motion ---------- */
    const burger = document.getElementById('burgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (burger && mobileNav) {
      burger.addEventListener('click', () => {
        // main.js alterna a classe .open; anima quando o menu abre
        requestAnimationFrame(() => {
          if (!mobileNav.classList.contains('open')) return;
          animate(mobileNav, { opacity: [0, 1] }, { duration: 0.25, ease: EASE });
          const items = mobileNav.querySelectorAll('.mobile-nav__link, .mobile-nav__wa');
          animate(items, { opacity: [0, 1], x: [-16, 0] },
            { duration: 0.4, delay: stagger(0.05, { start: 0.05 }), ease: EASE });
        });
      });
    }
  })();
}
