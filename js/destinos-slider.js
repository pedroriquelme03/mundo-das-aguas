// Carrossel de cards de destino — 3 visíveis no desktop, 1 no mobile
export function initDestinosSlider(root) {
  if (!root || root.dataset.sliderReady === '1') return;

  const viewport = root.querySelector('.destinos-slider__viewport');
  const track = root.querySelector('.destinos-slider__track');
  const prevBtn = root.querySelector('.destinos-slider__arrow--prev');
  const nextBtn = root.querySelector('.destinos-slider__arrow--next');
  const dotsContainer = root.querySelector('.destinos-slider__dots');
  if (!viewport || !track) return;

  const cards = () => Array.from(track.querySelectorAll('.destino-card'));
  if (cards().length === 0) return;

 root.dataset.sliderReady = '1';
 root.classList.add('destinos-slider--ready');

  const gapPx = 24;
  let index = 0;
  let autoPlay = null;

  function slidesPerView() {
    const w = window.innerWidth;
    if (w <= 700) return 1;
    if (w <= 1024) return 2;
    return 3;
 }

  function maxIndex() {
    return Math.max(0, cards().length - slidesPerView());
 }

  function viewportWidth() {
    return viewport.clientWidth;
 }

  function updateWidths() {
    const spv = slidesPerView();
    const w = viewportWidth();
    const cardW = (w - (spv - 1) * gapPx) / spv;
 track.style.setProperty('--destino-card-w', `${Math.max(0, cardW)}px`);
 track.style.setProperty('--destino-gap', `${gapPx}px`);
 }

  function stepPx() {
    const spv = slidesPerView();
    const w = viewportWidth();
    const cardW = (w - (spv - 1) * gapPx) / spv;
    return cardW + gapPx;
 }

  function apply() {
 index = Math.min(index, maxIndex());
 track.style.transform = `translateX(-${index * stepPx()}px)`;
    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= maxIndex();
    if (dotsContainer) {
 dotsContainer.querySelectorAll('.destinos-slider__dot').forEach((dot, i) => {
 dot.classList.toggle('active', i === index);
 });
 }
    const hideNav = cards().length <= slidesPerView();
 root.classList.toggle('destinos-slider--single', hideNav);
 }

  function buildDots() {
    if (!dotsContainer) return;
 dotsContainer.innerHTML = '';
    const total = maxIndex() + 1;
    if (total <= 1) return;
    for (let i = 0; i < total; i++) {
      const btn = document.createElement('button');
 btn.type = 'button';
 btn.className = 'destinos-slider__dot' + (i === index ? ' active' : '');
 btn.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
 btn.addEventListener('click', () => {
 index = i;
 apply();
 resetAuto();
 });
 dotsContainer.appendChild(btn);
 }
 }

  function go(dir) {
 index = Math.max(0, Math.min(maxIndex(), index + dir));
 apply();
 }

  function resetAuto() {
 clearInterval(autoPlay);
    if (cards().length <= slidesPerView()) return;
 autoPlay = setInterval(() => {
      if (index >= maxIndex()) index = 0;
 else index += 1;
 apply();
 }, 5500);
 }

  if (prevBtn) prevBtn.addEventListener('click', () => { go(-1); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { go(1); resetAuto(); });

  let resizeTimer;
 window.addEventListener('resize', () => {
 clearTimeout(resizeTimer);
 resizeTimer = setTimeout(() => {
 updateWidths();
 buildDots();
 apply();
 }, 120);
 });

 root.addEventListener('mouseenter', () => clearInterval(autoPlay));
 root.addEventListener('mouseleave', resetAuto);

  // swipe
  let startX = 0;
  let dragging = false;
 viewport.addEventListener('touchstart', (e) => {
 startX = e.touches[0].clientX;
 dragging = true;
 }, { passive: true });
 viewport.addEventListener('touchend', (e) => {
    if (!dragging) return;
 dragging = false;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) {
 go(dx < 0 ? 1 : -1);
 resetAuto();
 }
 }, { passive: true });

 updateWidths();
 buildDots();
 apply();
 resetAuto();
}

export function renderDestinosSlider(trackEl, cardsHtml) {
  if (!trackEl) return;
  const root = trackEl.closest('.destinos-slider') || trackEl;
 trackEl.innerHTML = cardsHtml;
  // permite reinicializar após novo fetch
  if (root.classList && root.classList.contains('destinos-slider')) {
 delete root.dataset.sliderReady;
 initDestinosSlider(root);
 }
}
