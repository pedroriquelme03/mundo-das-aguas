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
