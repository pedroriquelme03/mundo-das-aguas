document.addEventListener('DOMContentLoaded', function () {

  // Header scroll effect
  var header = document.getElementById('header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile menu
  var burger = document.getElementById('burgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  burger.addEventListener('click', function () {
    burger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });

  var mobileLinks = document.querySelectorAll('.mobile-nav__link');
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      burger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Hero search — categorias e destinos
  (function () {
    var heroData = {
      compras: {
        label: 'Compras',
        destinos: ['Paraguai', 'Brás', 'Goiânia', '25 de Março']
      },
      religioso: {
        label: 'Religioso',
        destinos: ['Aparecida', 'Canção Nova', 'Trindade', 'Retiros']
      },
      pescarias: {
        label: 'Pescarias',
        destinos: ['Argentina', 'Pantanal', 'Rios', 'Pousadas']
      },
      lazer: {
        label: 'Família e Lazer',
        destinos: ['Praias', 'Gramado', 'Foz do Iguaçu', 'Parques']
      },
      corporativo: {
        label: 'Corporativo',
        destinos: ['Convenções', 'Feiras', 'Equipes', 'Eventos']
      },
      educacional: {
        label: 'Educacional',
        destinos: ['Visitas técnicas', 'Universidades', 'Escolas']
      }
    };
    var tabs = document.querySelectorAll('.hero-search__tab');
    var input = document.getElementById('heroSearchInput');
    var datalist = document.getElementById('heroDestinosList');
    var form = document.getElementById('heroSearchForm');
    var activeCategory = 'compras';
    if (!tabs.length || !input || !form) return;

    function setCategory(cat) {
      activeCategory = cat;
      var data = heroData[cat];
      if (!data) return;
      tabs.forEach(function (tab) {
        var isActive = tab.dataset.category === cat;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      input.placeholder = 'Ex.: ' + data.destinos[0];
      if (datalist) {
        datalist.innerHTML = '';
        data.destinos.forEach(function (dest) {
          var opt = document.createElement('option');
          opt.value = dest;
          datalist.appendChild(opt);
        });
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        setCategory(tab.dataset.category);
        input.focus();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = heroData[activeCategory];
      var destino = input.value.trim();
      var msg = 'Olá! Gostaria de informações sobre excursões de ' + data.label.toLowerCase();
      if (destino) msg += ' para ' + destino;
      msg += '.';
      window.open('https://wa.me/5545999677835?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });

    setCategory('compras');
  })();

  // Flip cards — toque em dispositivos sem hover
  if (!window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.flip-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        var flipped = card.classList.contains('is-flipped');
        document.querySelectorAll('.flip-card.is-flipped').forEach(function (other) {
          if (other !== card) other.classList.remove('is-flipped');
        });
        card.classList.toggle('is-flipped', !flipped);
      });
    });
  }

  // Tabs
  var tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq__question').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.parentElement;
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq__item').forEach(function (i) { i.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Active nav on scroll
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', function () {
    var scrollPos = window.scrollY + 100;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos && sec.offsetTop + sec.offsetHeight > scrollPos) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        var target = document.querySelector('.nav-link[href="#' + sec.id + '"]');
        if (target) target.classList.add('active');
      }
    });
  });

  // Slider — Depoimentos / avaliações
  (function () {
    var track = document.getElementById('testimonialsTrack');
    var viewport = track && track.parentElement;
    var prevBtn = document.getElementById('testimonialsPrev');
    var nextBtn = document.getElementById('testimonialsNext');
    var dotsContainer = document.getElementById('testimonialsDots');
    var slider = document.getElementById('testimonialsSlider');
    if (!track || !viewport) return;

    var cards = track.querySelectorAll('.testimonial-card');
    var total = cards.length;
    var index = 0;
    var gap = 24;
    var autoTimer = null;

    function slidesPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }

    function maxIndex() {
      return Math.max(0, total - slidesPerView());
    }

    function slideStepPx() {
      var card = cards[0];
      if (!card) return viewport.offsetWidth;
      return card.offsetWidth + gap;
    }

    function goTo(i) {
      index = Math.max(0, Math.min(i, maxIndex()));
      track.style.transform = 'translateX(-' + (index * slideStepPx()) + 'px)';
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.testimonials-slider__dot').forEach(function (dot, di) {
          dot.classList.toggle('active', di === index);
          dot.setAttribute('aria-selected', di === index ? 'true' : 'false');
        });
      }
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (var d = 0; d <= maxIndex(); d++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonials-slider__dot' + (d === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Grupo de avaliações ' + (d + 1));
        dot.setAttribute('aria-selected', d === 0 ? 'true' : 'false');
        (function (di) {
          dot.addEventListener('click', function () { goTo(di); resetAuto(); });
        })(d);
        dotsContainer.appendChild(dot);
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); resetAuto(); });

    function resetAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(function () {
        goTo(index >= maxIndex() ? 0 : index + 1);
      }, 6000);
    }

    if (slider) {
      slider.addEventListener('mouseenter', function () {
        if (autoTimer) clearInterval(autoTimer);
      });
      slider.addEventListener('mouseleave', resetAuto);
    }

    window.addEventListener('resize', function () {
      if (dotsContainer) {
        var oldIndex = index;
        dotsContainer.innerHTML = '';
        for (var d2 = 0; d2 <= maxIndex(); d2++) {
          var dot2 = document.createElement('button');
          dot2.type = 'button';
          dot2.className = 'testimonials-slider__dot';
          dot2.setAttribute('role', 'tab');
          dot2.setAttribute('aria-label', 'Grupo de avaliações ' + (d2 + 1));
          (function (di) {
            dot2.addEventListener('click', function () { goTo(di); resetAuto(); });
          })(d2);
          dotsContainer.appendChild(dot2);
        }
        goTo(Math.min(oldIndex, maxIndex()));
      } else {
        goTo(Math.min(index, maxIndex()));
      }
    });

    goTo(0);
    resetAuto();
  })();

  // Carrossel — Para Organizadores (1 foto por vez, tamanho fixo)
  (function () {
    var track = document.getElementById('organizersTrack');
    var viewport = track && track.parentElement;
    var prevBtn = document.getElementById('organizersPrev');
    var nextBtn = document.getElementById('organizersNext');
    var dotsContainer = document.getElementById('organizersDots');
    if (!track || !viewport) return;

    var slides = track.querySelectorAll('.organizers__slide');
    var total = slides.length;
    var index = 0;
    var autoTimer = null;

    function goTo(i) {
      index = (i + total) % total;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.organizers__carousel-dot').forEach(function (dot, di) {
          dot.classList.toggle('active', di === index);
          dot.setAttribute('aria-selected', di === index ? 'true' : 'false');
        });
      }
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    if (dotsContainer) {
      for (var d = 0; d < total; d++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'organizers__carousel-dot' + (d === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Foto ' + (d + 1));
        dot.setAttribute('aria-selected', d === 0 ? 'true' : 'false');
        (function (di) {
          dot.addEventListener('click', function () { goTo(di); resetAuto(); });
        })(d);
        dotsContainer.appendChild(dot);
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); resetAuto(); });

    function resetAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(next, 5000);
    }

    var carousel = document.getElementById('organizersCarousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', function () {
        if (autoTimer) clearInterval(autoTimer);
      });
      carousel.addEventListener('mouseleave', resetAuto);
    }

    window.addEventListener('resize', function () { goTo(index); });
    goTo(0);
    resetAuto();
  })();

  // Fleet slider: mobile 1 card; desktop (≥1025px) 3 cards visíveis + setas/pontos + loop
  (function () {
    var track = document.getElementById('fleetTrack');
    var viewport = track && track.parentElement;
    var prevBtn = document.getElementById('fleetPrev');
    var nextBtn = document.getElementById('fleetNext');
    var dotsContainer = document.getElementById('fleetDots');
    var slider = document.getElementById('fleetSlider');
    if (!track || !viewport || !slider) return;

    var fleetBreakpoint = 1024;
    var gapPx = 24;
    var physical = 0;
    var autoPlay = null;
    var originals = track.querySelectorAll('.fleet-card:not([data-fleet-clone])');
    var logicalTotal = originals.length;

    function slidesPerView() {
      return window.innerWidth > fleetBreakpoint ? 3 : 1;
    }

    function removeClones() {
      track.querySelectorAll('.fleet-card[data-fleet-clone]').forEach(function (n) {
        n.remove();
      });
    }

    function syncClones() {
      removeClones();
      if (window.innerWidth > fleetBreakpoint && logicalTotal === 3) {
        originals.forEach(function (node) {
          var c = node.cloneNode(true);
          c.setAttribute('data-fleet-clone', '1');
          track.appendChild(c);
        });
      }
    }

    function cardCount() {
      return track.querySelectorAll('.fleet-card').length;
    }

    function maxPhysical() {
      return Math.max(0, cardCount() - slidesPerView());
    }

    function cloneMode() {
      return slidesPerView() === 3 && logicalTotal === 3 && cardCount() > logicalTotal;
    }

    function setTransition(on) {
      track.style.transition = on
        ? 'transform .5s cubic-bezier(.4, 0, .2, 1)'
        : 'none';
    }

    function viewportContentWidth() {
      var cs = window.getComputedStyle(viewport);
      var pl = parseFloat(cs.paddingLeft) || 0;
      var pr = parseFloat(cs.paddingRight) || 0;
      return Math.max(0, viewport.clientWidth - pl - pr);
    }

    function updateCardWidths() {
      var spv = slidesPerView();
      var w = viewportContentWidth();
      if (spv === 3) {
        var cardW = (w - (spv - 1) * gapPx) / spv;
        viewport.style.setProperty('--fleet-card-w', Math.max(0, cardW) + 'px');
      } else {
        viewport.style.removeProperty('--fleet-card-w');
      }
    }

    function slideStepPx() {
      var spv = slidesPerView();
      var w = viewportContentWidth();
      if (spv === 1) return w;
      var cardW = (w - (spv - 1) * gapPx) / spv;
      return cardW + gapPx;
    }

    function applyTransform() {
      var step = slideStepPx();
      track.style.transform = 'translateX(-' + (physical * step) + 'px)';
    }

    function dotCount() {
      var spv = slidesPerView();
      var maxP = maxPhysical();
      if (spv === 3 && cloneMode()) return logicalTotal;
      return maxP + 1;
    }

    function activeDotIndex() {
      if (slidesPerView() === 3 && cloneMode()) return physical % logicalTotal;
      return physical;
    }

    function rebuildDots() {
      dotsContainer.innerHTML = '';
      var n = dotCount();
      for (var i = 0; i < n; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'fleet-slider__dot' + (i === activeDotIndex() ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.dataset.dotIndex = i;
        dot.addEventListener('click', function () {
          goToDot(parseInt(this.dataset.dotIndex, 10));
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateDotsActive() {
      var dots = dotsContainer.querySelectorAll('.fleet-slider__dot');
      var a = activeDotIndex();
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === a);
      });
    }

    function goToDot(dotIndex) {
      if (slidesPerView() === 3 && cloneMode()) {
        physical = Math.min(dotIndex, logicalTotal - 1);
      } else {
        physical = Math.min(dotIndex, maxPhysical());
      }
      setTransition(true);
      applyTransform();
      updateDotsActive();
    }

    function nextSlide() {
      var spv = slidesPerView();
      var maxP = maxPhysical();

      if (spv === 1) {
        physical = physical >= maxP ? 0 : physical + 1;
        setTransition(true);
        applyTransform();
        updateDotsActive();
        return;
      }

      if (cloneMode() && physical === maxP) {
        setTransition(false);
        physical = 0;
        applyTransform();
        updateDotsActive();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            physical = 1;
            setTransition(true);
            applyTransform();
            updateDotsActive();
          });
        });
        return;
      }

      physical = physical >= maxP ? 0 : physical + 1;
      setTransition(true);
      applyTransform();
      updateDotsActive();
    }

    function prevSlide() {
      var spv = slidesPerView();
      var maxP = maxPhysical();

      if (spv === 1) {
        physical = physical <= 0 ? maxP : physical - 1;
        setTransition(true);
        applyTransform();
        updateDotsActive();
        return;
      }

      if (cloneMode() && physical <= 0) {
        setTransition(false);
        physical = maxP;
        applyTransform();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            physical = maxP - 1;
            setTransition(true);
            applyTransform();
            updateDotsActive();
          });
        });
        return;
      }

      physical = physical <= 0 ? maxP : physical - 1;
      setTransition(true);
      applyTransform();
      updateDotsActive();
    }

    function clearAutoPlay() {
      if (autoPlay) {
        clearInterval(autoPlay);
        autoPlay = null;
      }
    }

    function startAutoPlay() {
      clearAutoPlay();
      autoPlay = setInterval(nextSlide, 6000);
    }

    function refreshLayout() {
      updateCardWidths();
      syncClones();
      var maxP = maxPhysical();
      if (physical > maxP) physical = maxP;
      rebuildDots();
      setTransition(false);
      applyTransform();
      requestAnimationFrame(function () {
        setTransition(true);
      });
    }

    var startX = 0;
    var isDragging = false;

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    track.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      if (!isDragging) return;
      isDragging = false;
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
    });

    slider.addEventListener('mouseenter', clearAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    window.addEventListener('resize', function () {
      refreshLayout();
    });

    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });

    refreshLayout();
    startAutoPlay();
  })();

  // Scroll animations
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.segment__card, .proof__item, .service-card, .testimonial-card, .blog-card, .contact__card, .values__card').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

});

// Modal functions
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(function (m) {
      m.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});
