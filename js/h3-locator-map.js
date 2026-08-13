/**
 * Localizador de destinos (home3) — painel + mapa com pins (Leaflet/OSM).
 */
(function () {
  const DESTINOS = [
    {
      id: 'BR',
      name: 'Brasil',
      city: 'Foz do Iguaçu',
      lat: -25.5163,
      lng: -54.5855,
      services: ['Fretamento', 'Excursões de compras', 'Pacotes turísticos', 'Romarias', 'Pescarias', 'Encomendas']
    },
    {
      id: 'AR',
      name: 'Argentina',
      city: 'Buenos Aires',
      lat: -34.6037,
      lng: -58.3816,
      services: ['Pacotes turísticos', 'Pescarias', 'Turismo internacional', 'Excursões em grupo']
    },
    {
      id: 'CL',
      name: 'Chile',
      city: 'Santiago',
      lat: -33.4489,
      lng: -70.6693,
      services: ['Pacotes turísticos', 'Turismo internacional', 'Roteiros pelo Mercosul']
    },
    {
      id: 'PE',
      name: 'Peru',
      city: 'Lima',
      lat: -12.0464,
      lng: -77.0428,
      services: ['Pacotes turísticos', 'Turismo internacional', 'Roteiros personalizados']
    },
    {
      id: 'UY',
      name: 'Uruguai',
      city: 'Montevidéu',
      lat: -34.9011,
      lng: -56.1645,
      services: ['Pacotes turísticos', 'Turismo internacional', 'Excursões em grupo']
    },
    {
      id: 'BO',
      name: 'Bolívia',
      city: 'La Paz',
      lat: -16.4897,
      lng: -68.1193,
      services: ['Pacotes turísticos', 'Turismo internacional', 'Excursões em grupo']
    },
    {
      id: 'CO',
      name: 'Colômbia',
      city: 'Bogotá',
      lat: 4.711,
      lng: -74.0721,
      services: ['Pacotes turísticos', 'Turismo internacional', 'Fretamento para grupos']
    }
  ];

  const wrap = document.getElementById('h3Locator');
  const mapEl = document.getElementById('h3LocatorMap');
  const listEl = document.getElementById('h3LocatorList');
  const searchEl = document.getElementById('h3LocatorSearch');
  if (!wrap || !mapEl || !listEl || typeof L === 'undefined') return;

  const pinIcon = L.divIcon({
    className: 'h3-locator__pin',
    html: '<span class="h3-locator__pin-dot"></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30]
  });

  const map = L.map(mapEl, {
    scrollWheelZoom: false,
    zoomControl: false
  }).setView([-20.5, -60], 3.2);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 18
  }).addTo(map);

  const markers = new Map();
  const bounds = L.latLngBounds([]);

  DESTINOS.forEach((d) => {
    const marker = L.marker([d.lat, d.lng], { icon: pinIcon, title: d.name })
      .bindPopup(
        `<strong>${d.name}</strong><br><span>${d.city}</span><ul>${d.services
          .map((s) => `<li>${s}</li>`)
          .join('')}</ul>`
      )
      .addTo(map);

    marker.on('click', () => selectDestino(d.id, false));
    markers.set(d.id, marker);
    bounds.extend([d.lat, d.lng]);
  });

  if (bounds.isValid()) map.fitBounds(bounds.pad(0.18));

  function renderList(filter = '') {
    const q = filter.trim().toLowerCase();
    const items = DESTINOS.filter((d) => {
      if (!q) return true;
      const hay = `${d.name} ${d.city} ${d.services.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    if (!items.length) {
      listEl.innerHTML = '<li class="h3-locator__empty">Ainda não viajamos para esse destino...</li>';
      return;
    }

    listEl.innerHTML = items
      .map(
        (d) => `
      <li>
        <button type="button" class="h3-locator__item" data-id="${d.id}">
          <span class="h3-locator__item-name">${d.name}</span>
          <span class="h3-locator__item-city">${d.city}</span>
        </button>
      </li>`
      )
      .join('');
  }

  function setActiveButton(id) {
    listEl.querySelectorAll('.h3-locator__item').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.id === id);
    });
  }

  function selectDestino(id, fly = true) {
    const d = DESTINOS.find((x) => x.id === id);
    const marker = markers.get(id);
    if (!d || !marker) return;
    setActiveButton(id);
    if (fly) {
      map.flyTo([d.lat, d.lng], 5, { duration: 0.7 });
      marker.openPopup();
    }
  }

  listEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.h3-locator__item');
    if (!btn) return;
    selectDestino(btn.dataset.id, true);
  });

  searchEl.addEventListener('input', () => {
    renderList(searchEl.value);
  });

  renderList();

  // Leaflet precisa recalcular tamanho após layout
  requestAnimationFrame(() => map.invalidateSize());
  window.addEventListener('load', () => map.invalidateSize());
})();
